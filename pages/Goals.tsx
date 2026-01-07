
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Goal, Transaction } from '../types';
import { Target, History, Trash2, CheckCircle } from 'lucide-react';
import { Toast } from '../components/Toast';
import { formatCurrency } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTarget, setNewTarget] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const load = async () => {
    const [g, t] = await Promise.all([db.getGoals(), db.getTransactions()]);
    setGoals(g);
    setTransactions(t);
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Find the most recent goal for the current month
  const currentGoal = goals
    .filter(g => g.month === currentMonth && g.year === currentYear)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const realized = transactions
    .filter(t => t.type === 'receita' && t.status === 'pago' && new Date(t.date).getMonth() + 1 === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const saveGoal = async () => {
    if (!newTarget) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      userId: '1',
      month: currentMonth,
      year: currentYear,
      revenueTarget: parseFloat(newTarget),
      createdAt: new Date().toISOString()
    };
    await db.saveGoal(goal);
    showToast('Meta definida com sucesso!');
    await load();
    setNewTarget('');
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    if (confirmModal.id) {
      await db.deleteGoal(confirmModal.id);
      showToast('Meta removida com sucesso!');
      await load();
    }
    setConfirmModal({ isOpen: false, id: null });
  };

  const progress = currentGoal ? Math.min((realized / currentGoal.revenueTarget) * 100, 100) : 0;

  const svgSize = 200;
  const center = svgSize / 2;
  const radius = 85;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20 px-2">
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}

      <div className="text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Target size={40} />
        </div>
        <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Evolução Financeira</h2>
        <p className="text-zinc-500 font-medium mt-2">Compare sua performance mês a mês.</p>
      </div>

      <div className="bg-white p-10 rounded-[50px] border border-zinc-100 shadow-2xl shadow-zinc-100 flex flex-col lg:flex-row items-center gap-16">
        <div className="relative flex items-center justify-center shrink-0 p-4" style={{ width: svgSize, height: svgSize }}>
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="transform -rotate-90 overflow-visible">
            <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-50" />
            <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="text-blue-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-zinc-900 tracking-tighter">{Math.round(progress)}%</span>
            <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mt-1">Batida</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-8">
          <div>
            <h3 className="text-3xl font-black text-zinc-900 capitalize leading-tight">Mês Atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mt-1">Progresso em tempo real.</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-100 shadow-sm">
              <span className="text-[10px] uppercase font-black text-zinc-400 block mb-2 tracking-widest">Realizado</span>
              <span className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(realized)}</span>
            </div>
            <div className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-100 shadow-sm">
              <span className="text-[10px] uppercase font-black text-zinc-400 block mb-2 tracking-widest">Alvo</span>
              <span className="text-3xl font-black text-zinc-900 tracking-tighter">{currentGoal ? formatCurrency(currentGoal.revenueTarget) : '---'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <input value={newTarget} onChange={e => setNewTarget(e.target.value)} type="number" placeholder="Nova meta para este mês..." className="flex-1 px-6 py-5 bg-zinc-50 border border-zinc-100 rounded-[24px] font-black text-lg focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
            <button onClick={saveGoal} className="px-10 py-5 bg-zinc-900 text-white rounded-[24px] font-black text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">Definir</button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <History size={24} className="text-zinc-400" />
          <h4 className="font-black text-zinc-900 uppercase text-xs tracking-widest">Histórico Acumulado</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(g => (
            <div key={g.id} className="bg-white p-6 rounded-[32px] border border-zinc-100 flex items-center justify-between group hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center font-black text-zinc-400 text-sm">
                  {g.month}/{g.year.toString().slice(-2)}
                </div>
                <span className="font-black text-zinc-900 uppercase text-base tracking-tight">{new Date(g.year, g.month - 1).toLocaleDateString('pt-BR', { month: 'long' })}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col text-right">
                  <span className="font-black text-zinc-400 text-sm">{formatCurrency(g.revenueTarget)}</span>
                  <span className="text-[8px] text-zinc-300 font-bold uppercase">{new Date(g.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <button onClick={() => confirmDelete(g.id)} className="p-3 text-zinc-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-zinc-50 rounded-xl">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Remover Meta"
        description="Deseja remover esta meta do histórico? Esta ação não pode ser desfeita."
        confirmText="Sim, remover"
        type="warning"
      />
    </div>
  );
};
