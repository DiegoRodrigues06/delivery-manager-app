import { Routes } from '@angular/router';
import { App } from './app/app';
import { SalesComponent } from './components/sales/sales';

export const routes: Routes = [
  { path: '',       component: App },
  { path: 'vendas', component: SalesComponent },
];