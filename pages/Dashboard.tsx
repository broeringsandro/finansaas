
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Transaction, Account, Goal, Card, Category } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Target,
  CreditCard
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { formatCurrency } from '../lib/utils';


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isGoalMenuOpen, setIsGoalMenuOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      const [txs, accs, crds, goals, cats] = await Promise.all([
        db.getTransactions(),
        db.getAccounts(),
        db.getCards(),
        db.getGoals(),
        db.getCategories()
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setCards(crds);
      setCategories(cats);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      setGoal(goals.find(g => g.month === currentMonth && g.year === currentYear) || null);
    };
    loadDashboardData();
  }, []);

  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === (new Date().getMonth() + 1) && d.getFullYear() === new Date().getFullYear();
  });

  const totalIncome = currentMonthTx
    .filter(t => t.type === 'receita' && t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = currentMonthTx
    .filter(t => t.type === 'despesa' && t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const goalProgress = goal ? Math.min((totalIncome / goal.revenueTarget) * 100, 100) : 0;

  const svgSize = 160;
  const center = svgSize / 2;
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (goalProgress / 100) * circumference;

  const getAiInsight = async () => {
    // Check both potential env locations for API Key
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

    // Calculate top spending categories (hoisted for use in try and catch)
    const categorySpending: Record<string, number> = {};
    currentMonthTx
      .filter(t => t.type === 'despesa')
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
        categorySpending[catName] = (categorySpending[catName] || 0) + t.amount;
      });

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => `- ${name}: ${formatCurrency(amount)}`)
      .join('\n');

    if (!apiKey) {
      console.error("API Key missing");
      // Fallback message for missing key
      setAiInsight(`⚠️ Chave de API não configurada.\n\nMas olhando seus números:\nVocê tem R$ ${formatCurrency(totalBalance)} em conta.\nSua meta é ${formatCurrency(goal?.revenueTarget || 0)}.\n\nDica: Revise seus gastos com ${topCategories.split('\n')[0]?.replace('- ', '').split(':')[0] || 'Cartão'}.`);
      return;
    }

    setIsLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Atue como um Consultor Financeiro Pessoal de alto nível para freelancers. Analise os dados abaixo:

PERFIL FINANCEIRO ATUAL (MÊS CORRENTE):
- Receita Total: R$ ${totalIncome}
- Despesa Total: R$ ${totalExpense}
- Saldo Líquido do Mês: R$ ${totalIncome - totalExpense}
- Saldo Acumulado em Contas: R$ ${totalBalance}
- Meta de Faturamento: R$ ${goal?.revenueTarget || 0} (${Math.round(goalProgress)}% atingido)
- Maiores Gastos por Categoria:
${topCategories}

OBJETIVO: Forneça um relatório estratégico curto e direto (máximo 4 parágrafos curtos) com a seguinte estrutura:

1. 📊 **Diagnóstico**: Uma frase sobre a saúde financeira atual.
2. 💡 **Oportunidade**: Onde eu poderia economizar ou onde devo focar para bater a meta.
3. 🚀 **Ação Recomendada**: Uma ação prática para fazer hoje (ex: investir o saldo, cobrar cliente, cortar x).

Seja direto, profissional mas encorajador. Use emojis para destacar pontos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });
      setAiInsight(response.text() ?? null);
    } catch (err) {
      console.error("Gemini API Error:", err);
      // Fallback for API errors
      setAiInsight(`⚠️ Serviço indisponível momentaneamente.\n\nMas olhando seus números:\nVocê tem R$ ${formatCurrency(totalBalance)} em conta.\nSua meta é ${formatCurrency(goal?.revenueTarget || 0)}.\n\nDica: Revise seus gastos com ${topCategories.split('\n')[0]?.replace('- ', '').split(':')[0] || 'Cartão'}.`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Bom dia, {db.getCurrentUser()?.name.split(' ')[0]}!</h2>
          <p className="text-zinc-500 text-sm">Resumo financeiro atualizado.</p>
        </div>
        <button
          onClick={getAiInsight}
          disabled={isLoadingAi}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200 disabled:opacity-50"
        >
          {isLoadingAi ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles size={18} className="text-amber-400" />
          )}
          <span>{aiInsight ? 'Atualizar Insight' : 'Insight AI'}</span>
        </button>
      </div>

      {aiInsight && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-[32px] shadow-2xl shadow-zinc-200 animate-in slide-in-from-top-4 duration-500 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Sparkles className="text-amber-300" size={24} />
            </div>
            <div className="space-y-4 flex-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Análise Financeira Inteligente
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-1 rounded-full uppercase tracking-wider font-extrabold">BETA</span>
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-line">
                {aiInsight}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Receitas Pagas" value={totalIncome} icon={<TrendingUp size={24} />} color="#10b981" trend="+12%" onClick={() => navigate('/movimentacoes')} />
        <StatCard title="Despesas Pagas" value={totalExpense} icon={<TrendingDown size={24} />} color="#ef4444" onClick={() => navigate('/movimentacoes')} />
        <StatCard title="Saldo Atual" value={totalBalance} icon={<Wallet size={24} />} color="#3b82f6" onClick={() => navigate('/contas')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goal Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Target className="text-blue-600" size={20} />
              </div>
              Meta de Faturamento
            </h3>
            <div className="relative">
              <button
                onClick={() => setIsGoalMenuOpen(!isGoalMenuOpen)}
                className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>
              {isGoalMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-100 rounded-xl shadow-xl z-50 p-2 animate-in zoom-in-95 duration-150">
                  <button onClick={() => navigate('/metas')} className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">Editar Meta</button>
                  <button onClick={() => navigate('/metas')} className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-lg">Ver Histórico</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 py-4">
            <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
              <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="transform -rotate-90">
                <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-zinc-50" />
                <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="text-blue-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-zinc-900 tracking-tight">{Math.round(goalProgress)}%</span>
              </div>
            </div>
            <p className="text-zinc-500 font-bold mt-6 text-xs uppercase tracking-widest">Atingido este mês</p>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-50 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Realizado</span>
              <span className="font-bold text-zinc-900">{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Meta</span>
              <span className="font-bold text-zinc-400">{formatCurrency(goal?.revenueTarget || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Accounts & Cards Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-zinc-900 text-lg">Contas & Cartões</h3>
            <button onClick={() => navigate('/contas')} className="text-blue-600 text-sm font-bold hover:underline">Ver tudo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => navigate(`/contas/${acc.id}`)}
                className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex justify-between items-start">
                  {acc.imageUrl ? (
                    <img src={acc.imageUrl} alt={acc.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-2xl" style={{ backgroundColor: acc.color }}>
                      {acc.icon || '💰'}
                    </div>
                  )}
                  <ChevronRight size={20} className="text-zinc-200 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-lg leading-tight">{acc.name}</h4>
                  <p className="text-[10px] uppercase text-zinc-400 font-extrabold tracking-widest mt-1">{acc.type}</p>
                  <p className="text-2xl font-black text-zinc-900 mt-3 tracking-tight">
                    {formatCurrency(acc.balance)}
                  </p>
                </div>
              </div>
            ))}
            {cards.map(card => (
              <div
                key={card.id}
                onClick={() => navigate('/contas')}
                className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex justify-between items-start">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-2xl" style={{ backgroundColor: card.color }}>
                      <CreditCard size={24} />
                    </div>
                  )}
                  <ChevronRight size={20} className="text-zinc-200 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-lg leading-tight">{card.name}</h4>
                  <p className="text-[10px] uppercase text-zinc-400 font-extrabold tracking-widest mt-1">Cartão de Crédito</p>
                  <p className="text-2xl font-black text-zinc-900 mt-3 tracking-tight">
                    {formatCurrency(card.limit)}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold mt-1">Limite Disponível</p>
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/contas')} className="border-2 border-dashed border-zinc-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-zinc-400 hover:bg-zinc-50 transition-all group min-h-[180px]">
              <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-100 group-hover:text-zinc-400 transition-colors">
                <ArrowUpRight size={24} />
              </div>
              <span className="text-sm font-bold text-zinc-400 group-hover:text-zinc-500">Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
