// ── Tipos da API ──────────────────────────────────────────────────

// Inclui todos os status reais da API
export type ApiStatus =
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELED';

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'done';

export interface ApiItem {
  name: string;
  quantity: number;
  price: number;
  total_price?: number;
  code?: number;
  observations?: string;
  discount?: number;
  condiments?: any[];
}

export interface ApiCustomer {
  name: string;
  temporary_phone?: string; // campo real da API
  phone?: string;
}

export interface ApiDeliveryAddress {
  street_name?: string;    // campo real da API
  street_number?: string;  // campo real da API
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  reference?: string;
  country?: string;
  coordinates?: { latitude: number; longitude: number; id?: number };
}

export interface ApiOrderPayload {
  store_id: string;
  order_id: string;
  order: {
    order_id: string;
    store: { id: string; name: string };
    last_status_name: ApiStatus;
    statuses: { name: ApiStatus; created_at: number; order_id: string; origin: string }[];
    customer: ApiCustomer;
    delivery_address: ApiDeliveryAddress;
    items: ApiItem[];
    payments: any[];
    total_price: number;
    created_at: number; // timestamp em ms
  };
}

// ── Modelo interno do frontend ─────────────────────────────────────

export interface Order {
  __backendId?: string;
  customer_name: string;
  phone?: string;
  address: string;
  items: string;
  rawItems: ApiItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

// ── Mapas de status ───────────────────────────────────────────────

// Mapeia todos os status da API para os 4 internos do frontend
export const API_TO_STATUS: Record<ApiStatus, OrderStatus> = {
  RECEIVED:   'pending',
  CONFIRMED:  'preparing',
  DISPATCHED: 'delivering',
  DELIVERED:  'done',
  CANCELED:   'done',
};

export const STATUS_TO_API: Record<OrderStatus, ApiStatus> = {
  pending:    'RECEIVED',
  preparing:  'CONFIRMED',
  delivering: 'DISPATCHED',
  done:       'DELIVERED',
};

export interface StatusInfo {
  label: string;
  modifier: string;
  color: string;
}

export const STATUS_MAP: Record<OrderStatus, StatusInfo> = {
  pending:    { label: 'Pendente',   modifier: 'pending',    color: '#F5A623' },
  preparing:  { label: 'Preparando', modifier: 'preparing',  color: '#2E8BF0' },
  delivering: { label: 'Em Entrega', modifier: 'delivering', color: '#B5735A' },
  done:       { label: 'Entregue',   modifier: 'done',       color: '#2BB56A' },
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:    'preparing',
  preparing:  'delivering',
  delivering: 'done',
  done:       null,
};

export const DEFAULT_CONFIG = {
  store_name:             'Meu Delivery',
  welcome_text:           'Gerencie seus pedidos',
  background_color:       '#F5EDE6',
  surface_color:          '#FAF5F0',
  text_color:             '#2B2623',
  primary_action_color:   '#B5735A',
  secondary_action_color: '#2E8BF0',
  font_family:            'Inter',
  font_size:              14,
};

// ── Helpers de conversão ──────────────────────────────────────────

export function apiToOrder(payload: ApiOrderPayload): Order {
  const o = payload.order;

  const address = [
    o.delivery_address?.street_name,
    o.delivery_address?.street_number,
    o.delivery_address?.neighborhood,
    o.delivery_address?.city,
  ].filter(Boolean).join(', ');

  const items = o.items
    .map(i => `${i.quantity}x ${i.name}  R$ ${(i.total_price ?? i.price * i.quantity).toFixed(2)}`)
    .join('\n');

  return {
    __backendId:   payload.order_id,
    customer_name: o.customer?.name ?? 'Cliente',
    phone:         o.customer?.temporary_phone ?? o.customer?.phone,
    address,
    items,
    rawItems:      o.items,
    total:         o.total_price,
    status:        API_TO_STATUS[o.last_status_name] ?? 'pending',
    created_at:    new Date(o.created_at).toISOString(),
  };
}