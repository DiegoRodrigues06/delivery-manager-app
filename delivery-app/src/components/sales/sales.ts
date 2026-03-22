import {
  Component, OnInit, OnDestroy,
  ViewEncapsulation, AfterViewInit,
  ElementRef, ViewChild, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrdersService } from '../../core/services/order.service';
import { Order } from '../../app/models/order.model';

declare const Chart: any;

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SalesComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('barCanvas')  barCanvas!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart: any;
  private donutChart: any;
  private chartsReady = false;
  private ordersLoaded = false;

  orders = signal<Order[]>([]);

  constructor(
    private ordersService: OrdersService,
    private router: Router,
  ) {}

  // ── Métricas ──────────────────────────────────────────────────────
  metrics = computed(() => {
    const all = this.orders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = all.filter(o => new Date(o.created_at) >= today);
    const revenue     = todayOrders.reduce((s, o) => s + o.total, 0);
    const avgTicket   = todayOrders.length ? revenue / todayOrders.length : 0;
    const done        = all.filter(o => o.status === 'done').length;
    const avgTime     = done ? Math.round((35 + Math.random() * 10)) : 0; // placeholder até ter timestamps reais

    return {
      salesCount:  todayOrders.length,
      revenue,
      avgTicket,
      avgTime,
      salesDelta:  '+12%',
      revDelta:    '+8%',
      ticketDelta: '+3%',
      timeDelta:   '-5%',
    };
  });

  // ── Vendas por dia da semana (últimos 7 dias) ─────────────────────
  weekData = computed(() => {
    const all    = this.orders();
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const counts = new Array(7).fill(0);
    const now    = new Date();

    all.forEach(o => {
      const d    = new Date(o.created_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 7) counts[d.getDay()]++;
    });

    // Reordena começando pelo dia de hoje - 6
    const today = now.getDay();
    const orderedLabels: string[] = [];
    const orderedCounts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const idx = (today - i + 7) % 7;
      orderedLabels.push(labels[idx]);
      orderedCounts.push(counts[idx]);
    }

    return { labels: orderedLabels, data: orderedCounts };
  });

  // ── Categorias (inferidas dos nomes dos itens) ────────────────────
  categoryData = computed(() => {
    const all = this.orders();
    const map: Record<string, number> = {
      Pizzas: 0, Hambúrgueres: 0, Bebidas: 0, Sobremesas: 0, Outros: 0,
    };

    const rules: [RegExp, string][] = [
      [/pizza|calzone/i,             'Pizzas'],
      [/hamburguer|burger|smash/i,   'Hambúrgueres'],
      [/refri|suco|agua|bebida|cerveja|coca/i, 'Bebidas'],
      [/sorvete|pudim|doce|bolo|brownie/i,     'Sobremesas'],
    ];

    all.forEach(o => {
      o.rawItems?.forEach(item => {
        const matched = rules.find(([re]) => re.test(item.name));
        if (matched) map[matched[1]]++;
        else         map['Outros']++;
      });
    });

    const entries = Object.entries(map).filter(([, v]) => v > 0);
    const total   = entries.reduce((s, [, v]) => s + v, 0) || 1;

    return {
      labels: entries.map(([k])    => k),
      data:   entries.map(([, v])  => Math.round((v / total) * 100)),
      colors: ['#B5735A', '#F5A623', '#2E8BF0', '#2BB56A', '#8C8073'],
    };
  });

  // ── Lifecycle ─────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    const orders = await this.ordersService.list();
    this.orders.set(orders);
    this.ordersLoaded = true;
    if (this.chartsReady) this.renderCharts();
    setTimeout(() => (window as any).lucide?.createIcons(), 100);
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    setTimeout(() => (window as any).lucide?.createIcons(), 0);
    if (this.ordersLoaded) this.renderCharts();
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.donutChart?.destroy();
  }

  // ── Renderizar gráficos ───────────────────────────────────────────
  private renderCharts(): void {
    this.renderBar();
    this.renderDonut();
  }

  private renderBar(): void {
    const { labels, data } = this.weekData();
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#B5735A',
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: '#2B2623',
          titleColor: '#FAF5F0',
          bodyColor: '#FAF5F0',
          padding: 10,
          cornerRadius: 8,
        }},
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8C8073', font: { family: 'Inter', size: 12 } } },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)', lineWidth: 1 },
            ticks: { color: '#8C8073', font: { family: 'Inter', size: 12 }, stepSize: 9 },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private renderDonut(): void {
    const { labels, data, colors } = this.categoryData();
    this.donutChart = new Chart(this.donutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2B2623',
            titleColor: '#FAF5F0',
            bodyColor: '#FAF5F0',
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%` },
          },
        },
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  // Formata número como moeda BR
  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}