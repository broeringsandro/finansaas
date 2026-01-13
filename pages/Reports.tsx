
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Transaction, Category, Client } from '../types';
import { PieChart, TrendingUp, Users, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [period, setPeriod] = useState<'mensal' | 'trimestral' | 'anual'>('mensal');

  useEffect(() => {
    const load = async () => {
      const [t, cat, cl] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
        db.getClients()
      ]);
      setTransactions(t);
      setCategories(cat);
      setClients(cl);
    };
    load();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    if (period === 'mensal') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else if (period === 'trimestral') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const txQuarter = Math.floor(d.getMonth() / 3);
      return currentQuarter === txQuarter && d.getFullYear() === now.getFullYear();
    } else {
      return d.getFullYear() === now.getFullYear();
    }
  });

  const income = filteredTransactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);

  const expensesByCat = categories
    .map(cat => {
      const total = filteredTransactions
        .filter(t => t.categoryId === cat.id && t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, total };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxExpense = Math.max(...expensesByCat.map(c => c.total), 1);

  const topClients = clients
    .map(cl => {
      const total = filteredTransactions
        .filter(t => t.clientId === cl.id && t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...cl, total };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const generateInsight = async () => {
    if (!process.env.API_KEY) return;
    setIsLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Como um consultor financeiro analítico, gere insights curtos em português para estes dados (${period}):
      - Receita Total: R$ ${income}
      - Despesa Total: R$ ${expense}
      - Saldo: R$ ${income - expense}
      - Categorias com mais despesas: ${expensesByCat.slice(0, 3).map(c => `${c.name} (${formatCurrency(c.total)})`).join(', ')}
      Forneça 3 bullets curtos com sugestões práticas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiInsight(response.text ?? "Análise concluída.");
    } catch (err) {
      setAiInsight("Ocorreu um erro ao gerar insight.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Relatórios Financeiros</h2>
          <p className="text-zinc-500 text-sm">Visão geral do desempenho do seu negócio.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-zinc-100 shadow-sm">
          <button
            onClick={() => setPeriod('mensal')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${period === 'mensal' ? 'text-zinc-900 bg-zinc-50' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod('trimestral')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${period === 'trimestral' ? 'text-zinc-900 bg-zinc-50' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Trimestral
          </button>
          <button
            onClick={() => setPeriod('anual')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${period === 'anual' ? 'text-zinc-900 bg-zinc-50' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-[40px] shadow-xl relative overflow-hidden text-white">
        <Sparkles className="absolute top-6 right-6 text-amber-400 opacity-20" size={60} />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-1">
            <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
              <Sparkles size={24} className="text-amber-400" />
              Insight AI
            </h3>
            <p className="text-zinc-400 text-sm font-medium">Analise seus padrões de gastos e ganhos automaticamente no período <strong>{period}</strong>.</p>

            {aiInsight ? (
              <div className="mt-6 space-y-3 animate-in slide-in-from-left duration-500">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl whitespace-pre-line text-zinc-200 text-sm leading-relaxed">
                  {aiInsight}
                </div>
                <button
                  onClick={() => navigate('/movimentacoes')}
                  className="flex items-center gap-2 text-amber-400 text-sm font-bold hover:gap-3 transition-all"
                >
                  Ver movimentações detalhadas <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={generateInsight}
                disabled={isLoadingAi}
                className="mt-6 px-6 py-3 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-50"
              >
                {isLoadingAi ? 'Analisando dados...' : 'Gerar Análise Completa'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-zinc-900 text-white rounded-2xl"><PieChart size={20} /></div>
            <h3 className="font-black text-xl text-zinc-900">Despesas por Categoria</h3>
          </div>
          <div className="space-y-6">
            {expensesByCat.map(cat => (
              <div key={cat.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-zinc-700 flex items-center gap-2 text-sm">{cat.icon} {cat.name}</span>
                  <span className="font-black text-zinc-900 text-sm">{formatCurrency(cat.total)}</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(cat.total / maxExpense) * 100}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-zinc-900 text-white rounded-2xl"><Users size={20} /></div>
            <h3 className="font-black text-xl text-zinc-900">Maiores Faturamentos</h3>
          </div>
          <div className="space-y-4">
            {topClients.length === 0 ? <p className="text-center text-zinc-400 py-10 font-medium italic">Sem faturamento por cliente.</p> : topClients.map((cl, idx) => (
              <div key={cl.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-3xl hover:bg-zinc-100 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-zinc-300 group-hover:text-zinc-500 transition-colors shadow-sm">#{idx + 1}</div>
                  <span className="font-bold text-zinc-800">{cl.name}</span>
                </div>
                <span className="font-black text-emerald-600">{formatCurrency(cl.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
