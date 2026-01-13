
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Account, Card } from '../types';
import { Plus, CreditCard, Wallet, Trash2, Camera, ChevronRight, CheckCircle, Edit2 } from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { Toast } from '../components/Toast';
import { formatCurrency } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

export const AccountsCards: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isAccModal, setIsAccModal] = useState(false);
  const [isCardModal, setIsCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'account' | 'card' | null;
    id: string | null;
  }>({ isOpen: false, type: null, id: null });

  const [accForm, setAccForm] = useState<Partial<Account>>({ name: '', type: 'corrente', initialBalance: 0, color: '#3b82f6', icon: '💰' });
  const [cardForm, setCardForm] = useState<Partial<Card>>({ name: '', limit: 0, closingDay: 1, dueDay: 10, color: '#18181b' });

  const loadData = async () => {
    const [accs, crds] = await Promise.all([
      db.getAccounts(),
      db.getCards()
    ]);
    setAccounts(accs);
    setCards(crds);
  };
  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isAccount: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isAccount) setAccForm({ ...accForm, imageUrl: base64, icon: undefined });
        else setCardForm({ ...cardForm, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAccount = async () => {
    const acc = {
      ...accForm, // Using accForm as per existing code
      id: accForm.id || crypto.randomUUID(),
      balance: accForm.balance || accForm.initialBalance || 0,
      createdAt: accForm.createdAt || new Date().toISOString()
    } as Account;
    await db.saveAccount(acc);
    setIsAccModal(false);
    showToast('Conta salva com sucesso!');
    await loadData();
  };

  const handleSaveCard = async () => {
    const card = {
      ...cardForm,
      id: editingCard?.id || crypto.randomUUID(),
      createdAt: editingCard?.createdAt || new Date().toISOString()
    } as Card;
    await db.saveCard(card);
    setIsCardModal(false);
    setEditingCard(null);
    showToast(editingCard ? 'Cartão atualizado!' : 'Cartão adicionado!');
    await loadData();
  };

  const confirmDeleteAccount = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({ isOpen: true, type: 'account', id });
  };

  const confirmDeleteCard = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({ isOpen: true, type: 'card', id });
  };

  const executeDelete = async () => {
    if (confirmModal.type === 'account' && confirmModal.id) {
      await db.deleteAccount(confirmModal.id);
      showToast('Conta excluída!');
      await loadData();
    } else if (confirmModal.type === 'card' && confirmModal.id) {
      await db.deleteCard(confirmModal.id);
      showToast('Cartão excluído com sucesso!');
      await loadData();
    }
    setConfirmModal({ isOpen: false, type: null, id: null });
  };

  const handleEditCard = (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    setEditingCard(card);
    setCardForm(card);
    setIsCardModal(true);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}

      <section>
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-3xl font-black text-zinc-900 tracking-tight">Cofres & Contas</h2><p className="text-zinc-500 font-medium">Gestão de saldos e ativos.</p></div>
          <button onClick={() => { setAccForm({ name: '', type: 'corrente', initialBalance: 0, color: '#3b82f6', icon: '💰' }); setIsAccModal(true); }} className="bg-zinc-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-zinc-200 flex items-center gap-2 hover:bg-zinc-800 transition-all">
            <Plus size={20} /> Nova Conta
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} onClick={() => navigate(`/contas/${acc.id}`)} className="bg-white p-7 rounded-[40px] border border-zinc-100 shadow-sm hover:border-zinc-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                {acc.imageUrl ? (
                  <img src={acc.imageUrl} className="w-14 h-14 rounded-2xl object-cover shadow-md" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl" style={{ backgroundColor: acc.color }}>
                    {acc.icon || '🏦'}
                  </div>
                )}
                <button onClick={() => navigate(`/contas/${acc.id}`)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 rounded-xl mr-2"><Edit2 size={20} /></button>
                <button onClick={(e) => confirmDeleteAccount(acc.id, e)} className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-50 rounded-xl"><Trash2 size={20} /></button>
              </div>
              <div>
                <h4 className="font-black text-xl text-zinc-900 leading-tight">{acc.name}</h4>
                <p className="text-[10px] uppercase font-black text-zinc-300 tracking-widest mt-1">{acc.type}</p>
                <p className="text-3xl font-black text-zinc-900 mt-4 tracking-tighter">{formatCurrency(acc.balance)}</p>
              </div>
            </div>
          ))}
        </div>
      </section >

      <section>
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-3xl font-black text-zinc-900 tracking-tight">Cartões de Crédito</h2><p className="text-zinc-500 font-medium">Gestão de crédito e faturas.</p></div>
          <button onClick={() => { setEditingCard(null); setCardForm({ name: '', limit: 0, closingDay: 1, dueDay: 10, color: '#18181b' }); setIsCardModal(true); }} className="bg-zinc-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-zinc-200 flex items-center gap-2 hover:bg-zinc-800 transition-all">
            <Plus size={20} /> Novo Cartão
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map(card => (
            <div key={card.id} className="p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden group min-h-[240px] flex flex-col justify-between" style={{ backgroundColor: card.color }}>
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" alt="" />
                  ) : (
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><CreditCard size={28} /></div>
                  )}
                  <span className="font-black text-xl tracking-tight">{card.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => handleEditCard(e, card)} className="p-2 text-white/30 hover:text-white transition-colors bg-white/5 rounded-xl"><Edit2 size={18} /></button>
                  <button onClick={(e) => confirmDeleteCard(card.id, e)} className="p-2 text-white/30 hover:text-white transition-colors bg-white/5 rounded-xl"><Trash2 size={20} /></button>
                </div>
              </div>
              <div className="z-10 mt-10">
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Limite Disponível</p>
                <p className="text-3xl font-black tracking-tighter">{formatCurrency(card.limit)}</p>
              </div>
              <div className="mt-8 pt-5 border-t border-white/10 flex justify-between text-[11px] font-black uppercase tracking-widest text-white/70 z-10">
                <span>Fecha dia {card.closingDay}</span>
                <span>Vence dia {card.dueDay}</span>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </div>
          ))}
        </div>
      </section>

      <FormModal isOpen={isAccModal} onClose={() => setIsAccModal(false)} title="Nova Conta" onSubmit={handleSaveAccount}>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-3xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden group">
              {accForm.imageUrl ? <img src={accForm.imageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl" style={{ color: accForm.color }}>{accForm.icon}</span>}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, true)} /></label>
            </div>
            <div className="flex-1"><label className="label">Nome da Conta</label><input required className="input" value={accForm.name} onChange={e => setAccForm({ ...accForm, name: e.target.value })} placeholder="Ex: Banco Inter" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tipo</label><select className="input" value={accForm.type} onChange={e => setAccForm({ ...accForm, type: e.target.value as any })}><option value="corrente">Corrente</option><option value="investimento">Investimento</option><option value="dinheiro">Dinheiro</option></select></div>
            <div><label className="label">Saldo Inicial</label><input type="number" step="0.01" className="input" value={accForm.initialBalance} onChange={e => setAccForm({ ...accForm, initialBalance: parseFloat(e.target.value) })} /></div>
          </div>
          <div><label className="label">Cor Tema</label><input type="color" className="w-full h-12 p-1 bg-white border border-zinc-100 rounded-xl" value={accForm.color} onChange={e => setAccForm({ ...accForm, color: e.target.value })} /></div>
        </div>
      </FormModal>

      <FormModal isOpen={isCardModal} onClose={() => { setIsCardModal(false); setEditingCard(null); }} title={editingCard ? "Editar Cartão" : "Novo Cartão"} onSubmit={handleSaveCard}>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center relative overflow-hidden group" style={{ backgroundColor: cardForm.color }}>
              {cardForm.imageUrl ? <img src={cardForm.imageUrl} className="w-full h-full object-cover opacity-50" /> : <CreditCard size={28} className="text-white/40" />}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 bg-black/60 text-white transition-opacity"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, false)} /></label>
            </div>
            <div className="flex-1"><label className="label">Nome do Cartão</label><input required className="input" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} placeholder="Ex: Black Corporate" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1"><label className="label">Limite</label><input type="number" className="input" value={cardForm.limit} onChange={e => setCardForm({ ...cardForm, limit: parseFloat(e.target.value) })} /></div>
            <div><label className="label">Fecha dia</label><input type="number" className="input" value={cardForm.closingDay} onChange={e => setCardForm({ ...cardForm, closingDay: parseInt(e.target.value) })} /></div>
            <div><label className="label">Vence dia</label><input type="number" className="input" value={cardForm.dueDay} onChange={e => setCardForm({ ...cardForm, dueDay: parseInt(e.target.value) })} /></div>
          </div>
          <div><label className="label">Cor do Cartão</label><input type="color" value={cardForm.color} onChange={e => setCardForm({ ...cardForm, color: e.target.value })} className="w-full h-12 p-1 bg-white border border-zinc-100 rounded-xl" /></div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, id: null })}
        onConfirm={executeDelete}
        title={confirmModal.type === 'account' ? "Excluir Conta" : "Excluir Cartão"}
        description={confirmModal.type === 'account'
          ? "Deseja realmente excluir esta conta? O histórico local será mantido, mas ela não aparecerá mais nas listagens principais."
          : "Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."}
        confirmText="Sim, excluir"
        type="danger"
      />
    </div >
  );
};
