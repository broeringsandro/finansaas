
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Account, Transaction, Category } from '../types';
import {
  ArrowLeft,
  Trash2,
  Edit2,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { Toast } from '../components/Toast';
import { formatCurrency, formatDate } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';

export const AccountDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [editFormData, setEditFormData] = useState<Partial<Account>>({});
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txFormData, setTxFormData] = useState<Partial<Transaction>>({
    type: 'despesa',
    status: 'pago',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'account' | 'transaction' | null;
    id: string | null;
  }>({ isOpen: false, type: null, id: null });

  const loadData = async () => {
    const allAccs = await db.getAccounts();
    const acc = allAccs.find(a => a.id === id);
    if (!acc) return navigate('/');
    setAccount(acc);
    setEditFormData(acc);

    const [txs, cats] = await Promise.all([
      db.getTransactions(),
      db.getCategories()
    ]);
    setTransactions(txs.filter(t => t.accountId === id));
    setCategories(cats);
  };

  useEffect(() => { loadData(); }, [id]);

  const showToastMsg = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdate = async () => {
    await db.saveAccount(editFormData as Account);
    setIsEditModalOpen(false);
    showToastMsg('success', 'Conta atualizada com sucesso!');
    await loadData();
  };

  const confirmDeleteAccount = () => {
    setConfirmModal({ isOpen: true, type: 'account', id: id! });
  };

  const confirmDeleteTx = (txId: string) => {
    setConfirmModal({ isOpen: true, type: 'transaction', id: txId });
  };

  const executeDelete = async () => {
    if (confirmModal.type === 'account' && confirmModal.id) {
      await db.deleteAccount(confirmModal.id);
      showToastMsg('success', 'Conta excluída com sucesso.');
      setTimeout(() => navigate('/contas'), 1500);
    } else if (confirmModal.type === 'transaction' && confirmModal.id) {
      await db.deleteTransaction(confirmModal.id);
      showToastMsg('success', 'Transação excluída!');
      await loadData();
    }
    setConfirmModal({ isOpen: false, type: null, id: null });
  };

  const handleOpenTxModal = (tx?: Transaction) => {
    if (tx) {
      setEditingTx(tx);
      setTxFormData(tx);
    } else {
      setEditingTx(null);
      setTxFormData({
        type: 'despesa',
        status: 'pago',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        accountId: id,
        userId: '1'
      });
    }
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async () => {
    const tx = {
      ...txFormData,
      id: editingTx?.id || crypto.randomUUID(),
      accountId: id,
      createdAt: editingTx?.createdAt || new Date().toISOString(),
    } as Transaction;

    await db.saveTransaction(tx);
    setIsTxModalOpen(false);
    showToastMsg('success', 'Transação salva!');
    await loadData();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, imageUrl: reader.result as string, icon: undefined });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!account) return null;

  const filteredTx = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} type={toast.type} />
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/contas')} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{account.name}</h2>
          <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">{account.type}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditModalOpen(true)} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all"><Edit2 size={22} /></button>
          <button onClick={confirmDeleteAccount} className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={22} /></button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-xl shadow-zinc-100/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          {account.imageUrl ? (
            <img src={account.imageUrl} className="w-20 h-20 rounded-3xl object-cover shadow-lg" alt="" />
          ) : (
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg text-white" style={{ backgroundColor: account.color }}>
              {account.icon || '🏦'}
            </div>
          )}
          <div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Saldo Líquido</span>
            <h3 className="text-5xl font-black text-zinc-900 tracking-tighter">
              {formatCurrency(account.balance)}
            </h3>
          </div>
        </div>
        <button
          onClick={() => handleOpenTxModal()}
          className="px-8 py-5 bg-zinc-900 text-white font-black rounded-3xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center gap-2"
        >
          <Plus size={24} /> Novo Lançamento
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <h4 className="font-black text-zinc-900 text-xl">Extrato Bancário</h4>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar extrato..."
              className="w-full pl-12 pr-5 py-3 bg-white border border-zinc-100 rounded-2xl text-sm font-bold shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <tbody className="divide-y divide-zinc-50">
              {filteredTx.length === 0 ? (
                <tr><td className="px-6 py-20 text-center text-zinc-400 font-bold italic">Nenhum registro encontrado nesta conta.</td></tr>
              ) : (
                filteredTx.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${tx.type === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {(tx.type === 'receita') ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                          </div>
                          <div>
                            <p className="font-black text-zinc-900 text-base">{tx.description}</p>
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{cat?.name || 'Geral'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-500 font-bold">
                        {formatDate(tx.date)}
                      </td>
                      <td className={`px-6 py-5 text-right font-black text-lg ${tx.type === 'receita' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                        {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenTxModal(tx)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => confirmDeleteTx(tx.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Conta" onSubmit={handleUpdate}>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden group">
              {editFormData.imageUrl ? (
                <img src={editFormData.imageUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-3xl" style={{ color: editFormData.color }}>{editFormData.icon}</span>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="flex-1">
              <label className="label">Nome da Conta</label>
              <input required className="input" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tipo</label><select className="input" value={editFormData.type} onChange={e => setEditFormData({ ...editFormData, type: e.target.value as any })}><option value="corrente">Corrente</option><option value="investimento">Investimento</option><option value="dinheiro">Dinheiro</option></select></div>
            <div><label className="label">Cor Tema</label><input type="color" className="w-full h-12 p-1 bg-white border border-zinc-100 rounded-xl" value={editFormData.color} onChange={e => setEditFormData({ ...editFormData, color: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Seletor de Ícone</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['💰', '🏦', '💸', '💳', '🏧', '🛡️', '🌍', '🏠'].map(ico => (
                <button key={ico} type="button" onClick={() => setEditFormData({ ...editFormData, icon: ico, imageUrl: undefined })} className={`w-12 h-12 rounded-xl border-2 transition-all ${editFormData.icon === ico ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-50 bg-white'}`}>{ico}</button>
              ))}
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={editingTx ? "Editar Transação" : "Nova Transação"}
        onSubmit={handleSaveTx}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <input required type="text" value={txFormData.description} onChange={e => setTxFormData({ ...txFormData, description: e.target.value })} className="input" placeholder="Ex: Pagamento mensal" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={txFormData.type} onChange={e => setTxFormData({ ...txFormData, type: e.target.value as any })} className="input">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select value={txFormData.status} onChange={e => setTxFormData({ ...txFormData, status: e.target.value as any })} className="input">
              <option value="pago">Pago / Recebido</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input required type="number" step="0.01" value={txFormData.amount} onChange={e => setTxFormData({ ...txFormData, amount: parseFloat(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="label">Data</label>
            <input required type="date" value={txFormData.date?.split('T')[0]} onChange={e => setTxFormData({ ...txFormData, date: e.target.value })} className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Categoria</label>
            <select value={txFormData.categoryId || ''} onChange={e => setTxFormData({ ...txFormData, categoryId: e.target.value })} className="input">
              <option value="">Nenhuma</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, id: null })}
        onConfirm={executeDelete}
        title={confirmModal.type === 'account' ? "Excluir Conta" : "Excluir Transação"}
        description={confirmModal.type === 'account'
          ? "Deseja realmente excluir esta conta? O histórico local será mantido, mas ela não aparecerá mais nas listagens principais."
          : "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."}
        confirmText="Sim, excluir"
        type="danger"
      />
    </div>
  );
};
