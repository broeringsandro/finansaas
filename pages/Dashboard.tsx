import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Transaction, Account, Bill, Client, Category, Recurrence, Goal } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Repeat,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../lib/utils';
import { Toast } from '../components/Toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [period, setPeriod] = useState<'month' | '30days'>('month');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadDashboardData = async () => {
    const [txs, accs, bls, cls, cats, recs, gls] = await Promise.all([
      db.getTransactions(),
      db.getAccounts(),
      db.getBills(),
      db.getClients(),
      db.getCategories(),
      db.getRecurrences(),
      db.getGoals()
    ]);
    setTransactions(txs);
    setAccounts(accs);
    setBills(bls);
    setClients(cls);
    setCategories(cats);
    setRecurrences(recs);
    setGoals(gls);
  };

  useEffect(() => {
    loadDashboardData();

    const handleTransactionUpdate = () => {
      console.log("Transaction updated event received. Reloading dashboard...");
      loadDashboardData();
    };

    window.addEventListener('transaction_updated', handleTransactionUpdate);
    return () => {
      window.removeEventListener('transaction_updated', handleTransactionUpdate);
    };
  }, []);

  const handleMarkAsPaid = async (bill: Bill) => {
    try {
      await db.markBillAsPaid(bill);
      await loadDashboardData(); // Reload to update all KPIs
      showToast('Conta marcada como paga e saldo atualizado!');
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      showToast('Erro ao pagar conta. Tente novamente.');
    }
  };

  // --- Filtering Logic ---
  const filterByPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    if (period === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return date >= thirtyDaysAgo && date <= now;
    }
  };

  // --- Top KPIs Calculation ---

  // 1. Saldo Atual (Total of all accounts)
  const currentBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // 2. Despesas Pagas (Period)
  const paidExpensesPeriod = transactions
    .filter(t => t.type === 'despesa' && t.status === 'pago' && filterByPeriod(t.date))
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. Recebido (Period)
  const receivedIncomePeriod = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago' && filterByPeriod(t.date))
    .reduce((acc, t) => acc + t.amount, 0);

  // 4. Meta do Mês (Goal)
  const currentMonthIdx = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  // Find goal for current month/year
  const currentGoal = goals.find(g => g.month === currentMonthIdx && g.year === currentYear);
  const monthlyGoal = currentGoal ? currentGoal.revenueTarget : 0;

  // Logic for new UI
  // Logic for new UI
  const percentage = monthlyGoal > 0 ? (receivedIncomePeriod / monthlyGoal) * 100 : 0;
  const progressCapped = Math.min(percentage, 100);


  // --- Middle Blocks: Receivable / Payable ---

  // Receivable
  const receivables = bills
    .filter(b => b.type === 'receber' && (b.status === 'pendente' || b.status === 'atrasado'))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Closest due date first

  const totalReceivablePeriod = bills
    .filter(b => b.type === 'receber' && (b.status === 'pendente' || b.status === 'atrasado') && filterByPeriod(b.dueDate))
    .reduce((acc, b) => acc + b.amount, 0);


  // Payable
  const payables = bills
    .filter(b => b.type === 'pagar' && (b.status === 'pendente' || b.status === 'atrasado'));

  const totalPayablePeriod = bills
    .filter(b => b.type === 'pagar' && (b.status === 'pendente' || b.status === 'atrasado') && filterByPeriod(b.dueDate))
    .reduce((acc, b) => acc + b.amount, 0);

  // Helper to group payables
  const getDaysUntilDue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const payablesGrouped = {
    overdue: payables.filter(b => getDaysUntilDue(b.dueDate) < 0),
    next7: payables.filter(b => {
      const days = getDaysUntilDue(b.dueDate);
      return days >= 0 && days <= 7;
    }),
    next30: payables.filter(b => {
      const days = getDaysUntilDue(b.dueDate);
      return days > 7 && days <= 30;
    })
  };


  // --- Bottom Strategic KPIs ---

  // 1. Clients
  const totalClients = clients.length;

  // 2. Receipt Rate (Taxa de Recebimento)
  // Formula: (Total Received in Period) / (Total Received in Period + Total Pending/Overdue Due in Period)
  const totalReceivedPeriod = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago' && filterByPeriod(t.date))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDueInPeriod = bills
    .filter(b => b.type === 'receber' && (b.status === 'pendente' || b.status === 'atrasado') && filterByPeriod(b.dueDate))
    .reduce((acc, b) => acc + b.amount, 0);

  const totalExpectedPeriod = totalReceivedPeriod + totalDueInPeriod;
  const receiptRate = totalExpectedPeriod > 0 ? (totalReceivedPeriod / totalExpectedPeriod) * 100 : 0;


  // 3. MRR (Recorrências) & 4. Recurring Balance
  // Now using dedicated Recurrence module data
  const activeRecurrences = recurrences.filter(r => r.status === 'ativa');

  const mrr = activeRecurrences
    .filter(r => r.type === 'receita')
    .reduce((acc, r) => acc + r.amount, 0);

  const recurringExpenses = activeRecurrences
    .filter(r => r.type === 'despesa')
    .reduce((acc, r) => acc + r.amount, 0);

  const recurringBalance = mrr - recurringExpenses;


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Visão Executiva</h2>
          <p className="text-zinc-500 text-sm">Acompanhe seus indicadores chave.</p>
        </div>
        <div className="flex bg-white rounded-xl p-1 border border-zinc-100 shadow-sm">
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${period === 'month' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${period === '30days' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Últimos 30 dias
          </button>
        </div>
      </div>

      {/* 1) Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Atual */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Saldo Atual</span>
            <div className={`p-2 rounded-xl ${currentBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <h3 className={`text-2xl font-black tracking-tight ${currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(currentBalance)}
            </h3>
          </div>
        </div>

        {/* Despesas Pagas */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Despesas Pagas</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-red-600">
              {formatCurrency(paidExpensesPeriod)}
            </h3>
          </div>
        </div>

        {/* Recebido */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recebido</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-emerald-600">
              {formatCurrency(receivedIncomePeriod)}
            </h3>
          </div>
        </div>

        {/* Meta do Mês */}
        <div className="bg-black p-5 px-6 rounded-3xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-lg transition-shadow border border-white/5">
          <div className="flex justify-between items-start mt-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] z-10">Meta do Mês</span>
            <div className="p-2 rounded-xl bg-zinc-800/80 text-zinc-200 shadow-inner">
              <Target size={18} />
            </div>
          </div>

          <div className="flex flex-col mb-1.5">
            {monthlyGoal > 0 ? (
              <>
                <h3 className="text-4xl font-black tracking-tight text-white leading-none mb-3.5">
                  {Math.round(percentage)}%
                </h3>

                <div className="w-full bg-zinc-800/90 h-[6px] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-100 transition-all duration-700 ease-out"
                    style={{ width: `${progressCapped}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 opacity-30">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Sem meta</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2) Strategic Indicators (Former Bottom Strategic KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Clientes */}
        <div className="bg-zinc-900 md:col-span-1 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32 text-white">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Base de Clientes</span>
            <Users size={18} className="text-zinc-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight flex items-end gap-2">
              {totalClients}
              <span className="text-sm font-medium text-zinc-500 mb-1">ativos</span>
            </h3>
          </div>
        </div>

        {/* Taxa de Recebimento */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Taxa de Recebimento</span>
            <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-bold">{Math.round(receiptRate)}%</span>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full mt-auto mb-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${receiptRate}%` }}></div>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Do total faturado no período</p>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recorrências (MRR)</span>
            <Repeat size={18} className="text-zinc-300" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-zinc-900">
              {formatCurrency(mrr)}
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold mt-1">Receita Mensal Estimada</p>
          </div>
        </div>

        {/* Saldo Recorrente */}
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between h-32 ${recurringBalance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${recurringBalance >= 0 ? 'text-emerald-600/60' : 'text-red-600/60'}`}>Saldo Recorrente</span>
          </div>
          <div>
            <h3 className={`text-2xl font-black tracking-tight ${recurringBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(recurringBalance)}
            </h3>
            <p className={`text-[10px] font-bold mt-1 ${recurringBalance >= 0 ? 'text-emerald-600/60' : 'text-red-600/60'}`}>Receita Recorrente - Despesa Fixa</p>
          </div>
        </div>

      </div>

      {/* 3) Accounts Receivable & Payable (Former Middle Blocks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Contas a Receber */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col h-[500px]">
          <div className="p-6 border-b border-zinc-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                <ArrowUpRight className="text-emerald-500" size={20} />
                Contas a Receber
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Próximos recebimentos</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-widest">Total no Período</span>
              <span className="text-xl font-black text-emerald-600">{formatCurrency(totalReceivablePeriod)}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {receivables.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                <Wallet size={48} className="mb-4" />
                <p className="font-bold">Nada a receber</p>
              </div>
            ) : (
              receivables.map(bill => {
                const client = clients.find(c => c.id === bill.clientId);
                const isLate = bill.status === 'atrasado';
                return (
                  <div key={bill.id} className="group p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLate ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 text-sm">{bill.description}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client && <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-bold">{client.name}</span>}
                          <span className={`text-[10px] font-bold ${isLate ? 'text-red-500 uppercase' : 'text-zinc-400'}`}>
                            {isLate ? 'Vencido: ' : 'Vence: '} {formatDate(bill.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-600">{formatCurrency(bill.amount)}</span>
                      <button
                        onClick={() => handleMarkAsPaid(bill)}
                        title="Marcar como Recebido"
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-zinc-50">
            <button onClick={() => navigate('/contas-pendentes')} className="w-full py-3 text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors">
              Ver todas as contas
            </button>
          </div>
        </div>

        {/* Contas a Pagar */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col h-[500px]">
          <div className="p-6 border-b border-zinc-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                <ArrowDownLeft className="text-red-500" size={20} />
                Contas a Pagar
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Compromissos financeiros</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-widest">Total no Período</span>
              <span className="text-xl font-black text-red-600">{formatCurrency(totalPayablePeriod)}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Vencido */}
            {payablesGrouped.overdue.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-widest mb-3 px-2">
                  <AlertCircle size={14} /> Vencido
                </h4>
                <div className="space-y-2">
                  {payablesGrouped.overdue.map(bill => (
                    <div key={bill.id} className="group p-3 rounded-2xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-red-500 font-bold text-xs w-12 text-center leading-tight">
                          {new Date(bill.dueDate).getDate()}<br />
                          <span className="text-[10px] opacity-75">{new Date(bill.dueDate).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{bill.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">{formatCurrency(bill.amount)}</span>
                        <button onClick={() => handleMarkAsPaid(bill)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next 7 Days */}
            {payablesGrouped.next7.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest mb-3 px-2 mt-2">
                  Próximos 7 dias
                </h4>
                <div className="space-y-2">
                  {payablesGrouped.next7.map(bill => (
                    <div key={bill.id} className="group p-3 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-300 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-zinc-500 font-bold text-xs w-12 text-center leading-tight">
                          {new Date(bill.dueDate).getDate()}<br />
                          <span className="text-[10px] opacity-75">{new Date(bill.dueDate).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{bill.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-900">{formatCurrency(bill.amount)}</span>
                        <button onClick={() => handleMarkAsPaid(bill)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8 to 30 Days */}
            {payablesGrouped.next30.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 px-2 mt-2">
                  8 a 30 dias
                </h4>
                <div className="space-y-2">
                  {payablesGrouped.next30.map(bill => (
                    <div key={bill.id} className="group p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between opacity-80 hover:opacity-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="text-zinc-400 font-bold text-xs w-12 text-center leading-tight">
                          {new Date(bill.dueDate).getDate()}<br />
                          <span className="text-[10px] opacity-75">{new Date(bill.dueDate).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{bill.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-900">{formatCurrency(bill.amount)}</span>
                        <button onClick={() => handleMarkAsPaid(bill)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payables.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                <CheckCircle2 size={48} className="mb-4" />
                <p className="font-bold">Tudo pago!</p>
              </div>
            )}

          </div>
          <div className="p-4 border-t border-zinc-50">
            <button onClick={() => navigate('/contas-pendentes')} className="w-full py-3 text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors">
              Ver todas as contas
            </button>
          </div>
        </div>

      </div>


    </div>
  );
};
