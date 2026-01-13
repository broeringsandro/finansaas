
export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pago' | 'pendente';
export type AccountType = 'corrente' | 'investimento' | 'dinheiro';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  color: string;
  icon?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Card {
  id: string;
  userId: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType | 'ambos';
  color: string;
  icon: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  date: string;
  description: string;
  accountId?: string;
  cardId?: string;
  categoryId?: string;
  clientId?: string;
  createdAt: string;
  // Installment fields
  isInstallment?: boolean;
  installmentId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
}

export interface Bill {
  id: string;
  userId: string;
  type: 'receber' | 'pagar';
  description: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'recebido' | 'atrasado';
  accountId?: string;
  cardId?: string;
  categoryId?: string;
  clientId?: string;
  notes?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  month: number;
  year: number;
  revenueTarget: number;
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  appLogoUrl?: string;
  currency: string;
  fiscalMonthStart: number;
  primaryColor?: string;
}

export interface Recurrence {
  id: string;
  userId: string;
  type: 'receita' | 'despesa';
  description: string;
  amount: number;
  clientId?: string;
  accountId?: string;
  categoryId?: string;
  startDate: string;
  frequency: 'mensal';
  status: 'ativa' | 'pausada';
  createdAt: string;
}
