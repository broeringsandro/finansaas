
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Client, Transaction } from '../types';
import { Plus, User, Mail, Phone, MoreVertical, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { Toast } from '../components/Toast';
import { formatCurrency } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({ name: '', email: '', phone: '', notes: '' });
  const [toast, setToast] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    clientId: string | null;
  }>({ isOpen: false, clientId: null });

  const load = async () => {
    const [c, t] = await Promise.all([db.getClients(), db.getTransactions()]);
    setClients(c);
    setTransactions(t);
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (cl?: Client) => {
    if (cl) { setEditingClient(cl); setFormData(cl); }
    else { setEditingClient(null); setFormData({ name: '', email: '', phone: '', notes: '', userId: '1' }); }
    setIsModalOpen(true);
  };

  const saveClient = async () => {
    await db.saveClient({
      ...formData,
      id: editingClient?.id || crypto.randomUUID(),
      userId: '1',
      createdAt: editingClient?.createdAt || new Date().toISOString()
    } as Client);
    setIsModalOpen(false);
    showToast('Cliente salvo!');
    await load();
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({ isOpen: true, clientId: id });
  };

  const executeDelete = async () => {
    if (confirmModal.clientId) {
      await db.deleteClient(confirmModal.clientId);
      showToast('Cliente excluído!');
      await load();
    }
    setConfirmModal({ isOpen: false, clientId: null });
  };

  const getClientTotal = (id: string) => transactions.filter(t => t.clientId === id && t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-zinc-900">Meus Clientes</h2><p className="text-zinc-500 text-sm">Controle o faturamento por projeto.</p></div>
        <button onClick={() => handleOpenModal()} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-zinc-200 transition-all hover:bg-zinc-800">
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nome do Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contato</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Faturado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {clients.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 font-medium italic">Nenhum cliente cadastrado.</td></tr> : clients.map(cl => (
                <tr key={cl.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cl.imageUrl ? (
                        <img src={cl.imageUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-black text-sm">{cl.name.charAt(0)}</div>
                      )}
                      <span className="font-bold text-zinc-900">{cl.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5"><Mail size={12} className="text-zinc-300" /> {cl.email || '-'}</span>
                      <span className="flex items-center gap-1.5"><Phone size={12} className="text-zinc-300" /> {cl.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600">
                    {formatCurrency(getClientTotal(cl.id))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(cl)} className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => confirmDelete(cl.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Cliente" : "Novo Cliente"} onSubmit={saveClient}>
        <div className="space-y-4">
          <div><label className="label">Nome do Cliente</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="Ex: Acme Corp" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">E-mail</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input" placeholder="contato@empresa.com" /></div>
            <div><label className="label">Telefone</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input" placeholder="(00) 00000-0000" /></div>
          </div>
          <div><label className="label">Observações</label><textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="input min-h-[100px]" placeholder="Prazos de pagamento, contatos extras..." /></div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, clientId: null })}
        onConfirm={executeDelete}
        title="Excluir Cliente"
        description="Deseja realmente excluir este cliente? Transações vinculadas serão desvinculadas, mas não apagadas."
        confirmText="Sim, excluir"
        type="danger"
      />
    </div>
  );
};
