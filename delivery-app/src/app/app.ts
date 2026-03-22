import { Component, OnInit, ViewEncapsulation, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Order,
  OrderStatus,
  STATUS_MAP,
  NEXT_STATUS,
} from './models/order.model';
import { OrdersService } from '../core/services/order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None,
})
export class App implements OnInit {

  constructor(private ordersService: OrdersService) {}

  // ── Estado ──────────────────────────────────────────────────────
  allOrders = signal<Order[]>([]);
  activeTab = signal<OrderStatus | 'all'>('all');
  editingOrder: Order | null = null;
  isModalOpen = false;
  isLoading = false;

  readonly STATUS_MAP = STATUS_MAP;
  readonly NEXT_STATUS = NEXT_STATUS;

  filteredOrders = computed(() => {
    const tab = this.activeTab();
    if (tab === 'all') return this.allOrders();
    return this.allOrders().filter(o => o.status === tab);
  });

  stats = computed(() => ({
    pending:    this.allOrders().filter(o => o.status === 'pending').length,
    preparing:  this.allOrders().filter(o => o.status === 'preparing').length,
    delivering: this.allOrders().filter(o => o.status === 'delivering').length,
  }));

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

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadOrders();
    setTimeout(() => (window as any).lucide?.createIcons(), 0);
  }

  // ── Carregar pedidos ──────────────────────────────────────────────
  async loadOrders(): Promise<void> {
    this.isLoading = true;
    try {
      const orders = await this.ordersService.list();
      this.allOrders.set(orders);
      setTimeout(() => (window as any).lucide?.createIcons(), 50);
    } catch (e) {
      console.error('erro no loadOrders:', e);
      this.showToast('Erro ao carregar pedidos', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────────
  setTab(tab: OrderStatus | 'all'): void {
    this.activeTab.set(tab);
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
    try {
      if (this.editingOrder) {
        await this.ordersService.updateStatus(
          this.editingOrder.__backendId!,
          this.form.status
        );
      } else {
        await this.ordersService.create({
          customer:         { name: this.form.customer_name, phone: this.form.phone },
          delivery_address: { street_name: this.form.address },
          items:            [{ name: this.form.items, price: this.form.total, quantity: 1 }],
          payments:         [],
        });
      }
      this.showToast(this.editingOrder ? 'Pedido atualizado!' : 'Pedido criado!');
      this.closeModal();
      await this.loadOrders();
    } catch {
      this.showToast('Erro ao salvar pedido', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  confirmDelete(order: Order): void {
    this.showConfirm(`Excluir pedido de <strong>${order.customer_name}</strong>?`, async () => {
      try {
        await this.ordersService.delete(order.__backendId!);
        this.showToast('Pedido excluído');
        await this.loadOrders();
      } catch {
        this.showToast('Erro ao excluir', 'error');
      }
    });
  }

  async advanceStatus(order: Order): Promise<void> {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await this.ordersService.updateStatus(order.__backendId!, next);
      this.showToast(`Status → ${STATUS_MAP[next].label}`);
      await this.loadOrders();
    } catch {
      this.showToast('Erro ao atualizar status', 'error');
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  getNextStatus(order: Order): OrderStatus | null {
    return NEXT_STATUS[order.status] ?? null;
  }

  getOrderId(order: Order): string {
    const id = order.__backendId ?? '';
    return 'PED-' + id.toString().slice(-4).toUpperCase();
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

  parseItems(raw: string): { name: string; price: string }[] {
    if (!raw) return [];
    return raw.split('\n').filter(l => l.trim()).map(line => {
      const match = line.match(/^(.+?)\s+R?\$?\s*([\d.,]+)\s*$/);
      if (match) return { name: match[1].trim(), price: 'R$ ' + match[2] };
      return { name: line.trim(), price: '' };
    });
  }

  trackByOrder(_: number, order: Order): string {
    return order.__backendId ?? '';
  }

  // ── Toast ─────────────────────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const c = document.getElementById('toast-container')!;
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
    document.getElementById('confirm-no')!.onclick = () => (c.innerHTML = '');
    document.getElementById('confirm-overlay')!.onclick = (e) => {
      if (e.target === e.currentTarget) c.innerHTML = '';
    };
    document.getElementById('confirm-yes')!.onclick = () => { c.innerHTML = ''; onYes(); };
  }
}