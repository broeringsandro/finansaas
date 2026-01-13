import { supabase, checkAuthError } from '../lib/supabase';
import { Transaction, Account, Card, Category, Client, Goal, User, AppSettings, Bill, Recurrence } from '../types';

export const db = {
  // Helpers
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // App Logic (Settings are stored per user)
  async getSettings(): Promise<AppSettings> {
    const user = await this.getUser();
    if (!user) return this.getDefaultSettings();

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) await checkAuthError(error);

    if (error || !data) return this.getDefaultSettings();
    return {
      appName: data.app_name,
      appLogoUrl: data.app_logo_url,
      currency: data.currency,
      fiscalMonthStart: data.fiscal_month_start,
      primaryColor: data.primary_color
    };
  },

  getDefaultSettings(): AppSettings {
    return {
      appName: 'FinanSaaS',
      currency: 'BRL',
      fiscalMonthStart: 1,
      primaryColor: '#18181b'
    };
  },

  async saveSettings(settings: AppSettings) {
    const user = await this.getUser();
    if (!user) return;

    await supabase.from('settings').upsert({
      user_id: user.id,
      app_name: settings.appName,
      app_logo_url: settings.appLogoUrl,
      currency: settings.currency,
      fiscal_month_start: settings.fiscalMonthStart,
      primary_color: settings.primaryColor
    });
  },

  // Collections
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: false });
    if (error) await checkAuthError(error);
    return (data || []).map(a => ({
      ...a,
      userId: a.user_id,
      initialBalance: a.initial_balance,
      imageUrl: a.image_url
    }));
  },

  async getCards(): Promise<Card[]> {
    const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (error) await checkAuthError(error);
    return (data || []).map(c => ({
      ...c,
      userId: c.user_id,
      imageUrl: c.image_url,
      closingDay: c.closing_day,
      dueDay: c.due_day
    }));
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) await checkAuthError(error);
    return (data || []).map(c => ({
      ...c,
      userId: c.user_id
    }));
  },

  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) await checkAuthError(error);
    return (data || []).map(c => ({
      ...c,
      userId: c.user_id,
      imageUrl: c.image_url
    }));
  },

  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) await checkAuthError(error);
    return (data || []).map(t => ({
      ...t,
      userId: t.user_id,
      accountId: t.account_id,
      cardId: t.card_id,
      categoryId: t.category_id,
      clientId: t.client_id,
      isInstallment: t.is_installment,
      installmentId: t.installment_id,
      currentInstallment: t.current_installment,
      totalInstallments: t.total_installments
    }));
  },

  async getBills(): Promise<Bill[]> {
    const { data, error } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
    if (error) await checkAuthError(error);
    return (data || []).map(b => ({
      ...b,
      userId: b.user_id,
      dueDate: b.due_date,
      accountId: b.account_id,
      cardId: b.card_id,
      categoryId: b.category_id,
      clientId: b.client_id,
      transactionId: b.transaction_id
    }));
  },

  async getGoals(): Promise<Goal[]> {
    const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
    if (error) await checkAuthError(error);
    return (data || []).map(g => ({
      ...g,
      userId: g.user_id,
      revenueTarget: g.revenue_target
    }));
  },

  async getRecurrences(): Promise<Recurrence[]> {
    const { data, error } = await supabase.from('recurrences').select('*').order('created_at', { ascending: false });
    if (error) await checkAuthError(error);
    return (data || []).map(r => ({
      ...r,
      userId: r.user_id,
      clientId: r.client_id,
      accountId: r.account_id,
      categoryId: r.category_id,
      startDate: r.start_date,
      createdAt: r.created_at
    }));
  },

  // Save Operations
  // Save Operations
  async saveAccount(account: Account) {
    const user = await this.getUser();
    if (!user) {
      console.error("User not found in saveAccount");
      return;
    }

    const { error } = await supabase.from('accounts').upsert({
      id: account.id,
      user_id: user.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      initial_balance: account.initialBalance,
      color: account.color,
      icon: account.icon,
      image_url: account.imageUrl,
      created_at: account.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving account:", error);
    }
  },

  async updateAccountBalance(accountId: string) {
    if (!accountId) return;

    // Get all paid transactions for this account
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('account_id', accountId)
      .eq('status', 'pago');

    if (txError) {
      await checkAuthError(txError);
      console.error("Error fetching transactions for balance update:", txError);
      throw txError;
    }

    // Get initial balance
    const { data: account, error: accError } = await supabase
      .from('accounts')
      .select('initial_balance')
      .eq('id', accountId)
      .single();

    if (accError) {
      await checkAuthError(accError);
      console.error("Error fetching account for balance update:", accError);
      throw accError;
    }

    const totalIncome = (txs || [])
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = (txs || [])
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + t.amount, 0);

    const newBalance = (account.initial_balance || 0) + totalIncome - totalExpense;

    console.log(`Updating balance for ${accountId}: Initial=${account.initial_balance} + Inc=${totalIncome} - Exp=${totalExpense} = ${newBalance}`);

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (updateError) {
      await checkAuthError(updateError);
      console.error("Error updating account balance:", updateError);
      throw updateError;
    }
  },

  async saveTransaction(tx: Transaction) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    // Get old transaction to handle account changes
    const { data: oldTx } = await supabase
      .from('transactions')
      .select('account_id')
      .eq('id', tx.id)
      .single();

    const { error } = await supabase.from('transactions').upsert({
      id: tx.id,
      user_id: user.id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      date: tx.date,
      account_id: tx.accountId || null,
      card_id: tx.cardId || null,
      category_id: tx.categoryId || null,
      client_id: tx.clientId || null,
      created_at: tx.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving transaction:", error);
      throw error;
    }

    // Update balance for the new account
    if (tx.accountId) {
      await this.updateAccountBalance(tx.accountId);
    }
    // If account changed, update the old account's balance too
    if (oldTx && oldTx.account_id && oldTx.account_id !== tx.accountId) {
      await this.updateAccountBalance(oldTx.account_id);
    }

    // Dispatch global event for reactivity
    window.dispatchEvent(new CustomEvent('transaction_updated'));
  },

  async saveBill(bill: Bill) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase.from('bills').upsert({
      id: bill.id,
      user_id: user.id,
      type: bill.type,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate,
      status: bill.status,
      account_id: bill.accountId || null,
      card_id: bill.cardId || null,
      category_id: bill.categoryId || null,
      client_id: bill.clientId || null,
      notes: bill.notes || null,
      transaction_id: bill.transactionId || null,
      created_at: bill.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving bill:", error);
      throw error;
    }
  },

  async deleteBill(id: string) {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting bill:", error);
      throw error;
    }
  },

  async markBillAsPaid(bill: Bill) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const txId = crypto.randomUUID();
    const status = bill.type === 'receber' ? 'recebido' : 'pago';
    const txType = bill.type === 'receber' ? 'receita' : 'despesa';

    // 1. Create Transaction
    const tx: Transaction = {
      id: txId,
      userId: user.id,
      description: bill.description,
      amount: bill.amount,
      type: txType,
      status: 'pago',
      date: new Date().toISOString(),
      accountId: bill.accountId,
      cardId: bill.cardId,
      categoryId: bill.categoryId,
      clientId: bill.clientId,
      createdAt: new Date().toISOString()
    };

    await this.saveTransaction(tx);

    // 2. Update Bill
    const { error: billError } = await supabase
      .from('bills')
      .update({
        status: status,
        transaction_id: txId
      })
      .eq('id', bill.id);

    if (billError) {
      await checkAuthError(billError);
      console.error("Error updating bill after payment:", billError);
      throw billError;
    }

    // Dispatch global event for reactivity
    window.dispatchEvent(new CustomEvent('transaction_updated'));
  },

  async deleteAccount(id: string) {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting account:", error);
      throw error;
    }
  },

  async deleteTransaction(id: string) {
    // Get account_id before deleting
    const { data: tx } = await supabase
      .from('transactions')
      .select('account_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      await checkAuthError(error);
      console.error("Error deleting transaction:", error);
      throw error;
    }

    if (tx && tx.account_id) {
      await this.updateAccountBalance(tx.account_id);
    }

    // Dispatch global event for reactivity
    window.dispatchEvent(new CustomEvent('transaction_updated'));
  },

  async saveClient(client: Client) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      user_id: user.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      image_url: client.imageUrl,
      created_at: client.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving client:", error);
      throw error;
    }
  },

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting client:", error);
      throw error;
    }
  },

  async saveCategory(category: Category) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase.from('categories').upsert({
      id: category.id,
      user_id: user.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving category:", error);
      throw error;
    }
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  async saveGoal(goal: Goal) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase.from('goals').upsert({
      id: goal.id,
      user_id: user.id,
      month: goal.month,
      year: goal.year,
      revenue_target: goal.revenueTarget,
      created_at: goal.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving goal:", error);
      throw error;
    }
  },

  async deleteGoal(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting goal:", error);
      throw error;
    }
  },

  async saveCard(card: Card) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase.from('cards').upsert({
      id: card.id,
      user_id: user.id,
      name: card.name,
      limit: card.limit,
      closing_day: card.closingDay,
      due_day: card.dueDay,
      color: card.color,
      image_url: card.imageUrl,
      created_at: card.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving card:", error);
      throw error;
    }
  },

  async deleteCard(id: string) {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting card:", error);
      throw error;
    }
  },

  async saveRecurrence(recurrence: Recurrence) {
    const user = await this.getUser();
    if (!user) throw new Error("User not found");

    const { error } = await supabase.from('recurrences').upsert({
      id: recurrence.id,
      user_id: user.id,
      type: recurrence.type,
      description: recurrence.description,
      amount: recurrence.amount,
      client_id: recurrence.clientId || null,
      account_id: recurrence.accountId || null,
      category_id: recurrence.categoryId || null,
      start_date: recurrence.startDate,
      frequency: recurrence.frequency,
      status: recurrence.status,
      created_at: recurrence.createdAt
    });

    if (error) {
      await checkAuthError(error);
      console.error("Error saving recurrence:", error);
      throw error;
    }
  },

  async deleteRecurrence(id: string) {
    const { error } = await supabase.from('recurrences').delete().eq('id', id);
    if (error) {
      await checkAuthError(error);
      console.error("Error deleting recurrence:", error);
      throw error;
    }
  },

  // Compatibility shims or legacy
  getCurrentUser: () => {
    // This is now handled by Supabase session in App.tsx
    const data = localStorage.getItem('finansaas_current_user');
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    localStorage.setItem('finansaas_current_user', JSON.stringify(user));
  }
};
