export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'done';

export interface Order {
  __backendId?: string;
  customer_name: string;
  address: string;
  phone?: string;
  items: string;
  total: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

export interface StatusInfo {
  label: string;
  modifier: string; // classe BEM: order-card__badge--pending, etc.
  color: string;
}

export const STATUS_MAP: Record<OrderStatus, StatusInfo> = {
  pending:    { label: 'Pendente',   modifier: 'pending',    color: '#F2D48B' },
  preparing:  { label: 'Preparando', modifier: 'preparing',  color: '#A8C8E8' },
  delivering: { label: 'Em Entrega', modifier: 'delivering', color: '#E8A0A0' },
  done:       { label: 'Entregue',   modifier: 'done',       color: '#2D2D2D' },
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:    'preparing',
  preparing:  'delivering',
  delivering: 'done',
  done:       null,
};

export const DEFAULT_CONFIG = {
  store_name:            'Meu Delivery',
  welcome_text:          'Gerencie seus pedidos',
  background_color:      '#FFF8F0',
  surface_color:         '#FFFFFF',
  text_color:            '#2D2D2D',
  primary_action_color:  '#2D2D2D',
  secondary_action_color:'#A8C8E8',
  font_family:           'DM Sans',
  font_size:             14,
};