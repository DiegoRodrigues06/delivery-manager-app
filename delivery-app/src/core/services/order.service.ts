import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiOrderPayload, apiToOrder, Order, STATUS_TO_API } from '../../app/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  async list(): Promise<Order[]> {
    const res = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl}/pedidos`)
    );
    // console.log('primeiro pedido:', JSON.stringify(res[0], null, 2));
    const list = Array.isArray(res) ? res : (res.data ?? []);
    return list.map(apiToOrder);
  }

  async getById(orderId: string): Promise<Order> {
    const res = await firstValueFrom(
      this.http.get<ApiOrderPayload>(`${this.baseUrl}/pedidos/${orderId}`)
    );
    return apiToOrder(res);
  }

  async create(payload: Partial<ApiOrderPayload['order']>): Promise<Order> {
    const res = await firstValueFrom(
      this.http.post<ApiOrderPayload>(`${this.baseUrl}/pedidos`, payload)
    );
    return apiToOrder(res);
  }

  async updateStatus(orderId: string, status: Order['status']): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${this.baseUrl}/pedidos/${orderId}/status`, {
        status: STATUS_TO_API[status]
      })
    );
  }

  async delete(orderId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.baseUrl}/pedidos/${orderId}`)
    );
  }
}