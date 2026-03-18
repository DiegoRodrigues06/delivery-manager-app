import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Order,
  OrderStatus,
  STATUS_MAP,
  NEXT_STATUS,
  DEFAULT_CONFIG,
} from './models/order.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit {

  // ── Estado ──────────────────────────────────────────────────────
  allOrders: Order[] = [];
  activeTab: OrderStatus | 'all' = 'all';
  editingOrder: Order | null = null;
  isModalOpen = false;

  // Expõe os mapas pro template
  readonly STATUS_MAP = STATUS_MAP;
  readonly NEXT_STATUS = NEXT_STATUS;

  // Form fields (two-way binding no template)
  form = {
    customer_name: '',
    address: '',
    phone: '',
    items: '',
    total: 0,
    status: 'pending' as OrderStatus,
    notes: '',
  };

  isSubmitting = false;

  // ── Computed ─────────────────────────────────────────────────────
  get filteredOrders(): Order[] {
    if (this.activeTab === 'all') return this.allOrders;
    return this.allOrders.filter(o => o.status === this.activeTab);
  }

  get stats() {
    return {
      pending:    this.allOrders.filter(o => o.status === 'pending').length,
      preparing:  this.allOrders.filter(o => o.status === 'preparing').length,
      delivering: this.allOrders.filter(o => o.status === 'delivering').length,
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    // Inicializa lucide após a view estar pronta
    setTimeout(() => (window as any).lucide?.createIcons(), 0);

    // Inicializa o Data SDK, se disponível
    const dataSdk = (window as any).dataSdk;
    if (dataSdk) {
      dataSdk.init({
        onDataChanged: (data: Order[]) => {
          this.allOrders = data.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setTimeout(() => (window as any).lucide?.createIcons(), 0);
        },
      }).then((result: any) => {
        if (!result?.isOk) this.showToast('Erro ao conectar com o banco de dados', 'error');
      });
    }

    // Inicializa o Element SDK, se disponível
    const elementSdk = (window as any).elementSdk;
    if (elementSdk) {
      elementSdk.init({
        defaultConfig: DEFAULT_CONFIG,
        onConfigChange: (config: typeof DEFAULT_CONFIG) => this.applyConfig(config),
      });
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────────
  setTab(tab: OrderStatus | 'all'): void {
    this.activeTab = tab;
  }

  // ── Modal ────────────────────────────────────────────────────────
  openNewModal(): void {
    this.editingOrder = null;
    this.form = { customer_name: '', address: '', phone: '', items: '', total: 0, status: 'pending', notes: '' };
    this.isModalOpen = true;
  }

  openEditModal(order: Order): void {
    this.editingOrder = order;
    this.form = {
      customer_name: order.customer_name,
      address:       order.address,
      phone:         order.phone ?? '',
      items:         order.items,
      total:         order.total,
      status:        order.status,
      notes:         order.notes ?? '',
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingOrder = null;
  }

  // ── CRUD ─────────────────────────────────────────────────────────
  async saveOrder(): Promise<void> {
    this.isSubmitting = true;
    const dataSdk = (window as any).dataSdk;

    const payload = {
      ...this.form,
      phone:      this.form.phone,
      created_at: this.editingOrder?.created_at ?? new Date().toISOString(),
    };

    let result: any;
    if (this.editingOrder) {
      result = await dataSdk?.update({ ...this.editingOrder, ...payload });
    } else {
      if (this.allOrders.length >= 999) {
        this.showToast('Limite de 999 pedidos atingido!', 'error');
        this.isSubmitting = false;
        return;
      }
      result = await dataSdk?.create(payload);
    }

    this.isSubmitting = false;

    if (result?.isOk) {
      this.showToast(this.editingOrder ? 'Pedido atualizado!' : 'Pedido criado!');
      this.closeModal();
    } else {
      this.showToast('Erro ao salvar pedido', 'error');
    }
  }

  confirmDelete(order: Order): void {
    this.showConfirm(`Excluir pedido de <strong>${order.customer_name}</strong>?`, async () => {
      const result = await (window as any).dataSdk?.delete(order);
      if (result?.isOk) this.showToast('Pedido excluído');
      else this.showToast('Erro ao excluir', 'error');
    });
  }

  async advanceStatus(order: Order): Promise<void> {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const result = await (window as any).dataSdk?.update({ ...order, status: next });
    if (result?.isOk) this.showToast(`Status → ${STATUS_MAP[next].label}`);
    else this.showToast('Erro ao atualizar status', 'error');
  }

  // ── Helpers ──────────────────────────────────────────────────────
  getOrderId(order: Order): string {
    const id = order.__backendId ?? '';
    return 'PED-' + id.toString().padStart(3, '0');
  }

  getTimeAgo(isoStr: string): string {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  }

  // Parseia "1x Pizza R$45,00\n1x Refri R$12,00" em array de {name, price}
  parseItems(raw: string): { name: string; price: string }[] {
    if (!raw) return [];
    return raw.split('\n').filter(l => l.trim()).map(line => {
      const match = line.match(/^(.+?)\s+R?\$?\s*([\d.,]+)\s*$/);
      if (match) return { name: match[1].trim(), price: match[2] };
      return { name: line.trim(), price: '' };
    });
  }

  getOrderNumber(order: Order, index: number): string {
    return (order as any).order_number ?? `PED-${String(index + 1).padStart(3, '0')}`;
  }

  trackByOrder(_: number, order: Order): string {
    return order.__backendId ?? '';
  }

  // ── Toast ─────────────────────────────────────────────────────────
  private toastContainer(): HTMLElement {
    return document.getElementById('toast-container')!;
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const c = this.toastContainer();
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s';
      setTimeout(() => t.remove(), 300);
    }, 2500);
  }

  // ── Confirm ───────────────────────────────────────────────────────
  showConfirm(message: string, onYes: () => void): void {
    const c = document.getElementById('confirm-container')!;
    c.innerHTML = `
      <div class="confirm-overlay" id="confirm-overlay">
        <div class="confirm-box">
          <p style="font-size:.875rem;font-weight:500;margin-bottom:20px">${message}</p>
          <div style="display:flex;gap:8px">
            <button id="confirm-no"  class="confirm-box__btn confirm-box__btn--cancel">Cancelar</button>
            <button id="confirm-yes" class="confirm-box__btn confirm-box__btn--confirm">Confirmar</button>
          </div>
        </div>
      </div>`;
    document.getElementById('confirm-no')!.onclick  = () => (c.innerHTML = '');
    document.getElementById('confirm-overlay')!.onclick = (e) => {
      if (e.target === e.currentTarget) c.innerHTML = '';
    };
    document.getElementById('confirm-yes')!.onclick = () => { c.innerHTML = ''; onYes(); };
  }

  // ── Config SDK ────────────────────────────────────────────────────
  private applyConfig(config: typeof DEFAULT_CONFIG): void {
    const c = { ...DEFAULT_CONFIG, ...config };
    document.body.style.backgroundColor = c.background_color;
    document.body.style.color = c.text_color;
    document.body.style.fontFamily = `${c.font_family}, 'DM Sans', sans-serif`;
  }
}