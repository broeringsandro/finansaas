
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Transaction, Category, Account, Client, Card } from '../types';
import {
  Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle,
  MoreVertical, Tag, CreditCard, Trash2, Edit2, CheckCircle
} from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { Toast } from '../components/Toast';
import { formatCurrency, formatDate } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';


export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'despesa',
    status: 'pago',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Installment State


  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; tx: Transaction | null }>({ isOpen: false, tx: null });

  // Edit Installment Modal State


  const loadData = async () => {
    const [txs, cats, accs, cls, crds] = await Promise.all([
      db.getTransactions(),
      db.getCategories(),
      db.getAccounts(),
      db.getClients(),
      db.getCards()
    ]);
    setTransactions(txs);
    setCategories(cats);
    setAccounts(accs);
    setClients(cls);
    setCards(crds);
  };

  useEffect(() => { loadData(); }, []);

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (tx?: Transaction) => {
    if (tx) {
      setEditingTx(tx);
      setFormData(tx);
      setIsModalOpen(true);
    } else {
      setEditingTx(null);
      setFormData({
        type: 'despesa',
        status: 'pago',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        userId: '1'
      });
      setIsModalOpen(true);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const tx = {
        ...formData,
        id: editingTx?.id || crypto.randomUUID(),
        createdAt: editingTx?.createdAt || new Date().toISOString(),
      } as Transaction;

      await db.saveTransaction(tx);
      setIsModalOpen(false);
      showToast('Transação salva!');
      await loadData();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      const msg = error.message || error.error_description || '';
      if (msg.match(/Invalid Refresh Token|JWT expired/i)) {
        showToast('Sessão expirada. Faça login novamente.');
      } else {
        showToast('Erro ao salvar transação. Tente novamente.');
      }
    }
  };

  const confirmDelete = (tx: Transaction) => {
    setConfirmModal({ isOpen: true, tx });
  };

  const executeDelete = async () => {
    if (confirmModal.tx) {
      await db.deleteTransaction(confirmModal.tx.id);
      showToast('Transação excluída!');
      await loadData();
    }
    setConfirmModal({ isOpen: false, tx: null });
  };

  const filteredTx = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal === undefined || bVal === undefined) return 0;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Movimentações</h2>
          <p className="text-zinc-500">Gerencie todas as entradas e saídas do seu caixa.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
        >
          <Plus size={20} />
          Nova Transação
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="w-full md:w-auto px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-600 font-bold appearance-none cursor-pointer"
        >
          <option value="all">Todos os Tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th
                  className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600 transition-colors"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">Transação {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Origem</th>
                <th
                  className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">Data {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th
                  className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right cursor-pointer hover:text-zinc-600 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">Valor {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th
                  className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredTx.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-zinc-400 font-medium">Nenhuma movimentação para exibir.</td></tr>
              ) : (
                filteredTx.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const acc = accounts.find(a => a.id === tx.accountId) || cards.find(c => c.id === tx.cardId);
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${tx.type === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {tx.type === 'receita' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">
                              {tx.description}
                              {tx.isInstallment && (
                                <span className="ml-2 text-xs text-zinc-500 font-normal">
                                  ({tx.currentInstallment}/{tx.totalInstallments})
                                </span>
                              )}
                            </p>
                            <span className="text-xs text-zinc-400 font-bold flex items-center gap-1">
                              {cat?.icon || '📦'} {cat?.name || 'Geral'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-600 font-bold flex items-center gap-1.5">
                          <CreditCard size={14} className="text-zinc-300" />
                          {acc?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 font-medium">
                        {formatDate(tx.date)}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.type === 'receita' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${tx.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(tx)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => confirmDelete(tx)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTx ? "Editar Transação" : "Nova Transação"}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Descrição</label>
            <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-zinc-900" placeholder="Ex: Projeto Website" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tipo</label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
              <option value="pago">Pago / Recebido</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Valor (R$)</label>
            <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Data</label>
            <input required type="date" value={formData.date?.split('T')[0]} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
          </div>



          <div className="col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Conta ou Cartão</label>
            <select value={formData.accountId || formData.cardId || ''} onChange={e => {
              const val = e.target.value;
              const isCard = cards.some(c => c.id === val);
              setFormData({ ...formData, accountId: isCard ? undefined : val, cardId: isCard ? val : undefined });
            }} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
              <option value="">Selecione...</option>
              <optgroup label="Contas">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </optgroup>
              <optgroup label="Cartões">
                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Categoria</label>
            <select value={formData.categoryId || ''} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
              <option value="">Nenhuma</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Cliente (Opcional)</label>
            <select value={formData.clientId || ''} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
              <option value="">Nenhum</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, tx: null })}
        onConfirm={executeDelete}
        title="Excluir Transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        type="danger"
      />
    </div>
  );
};
