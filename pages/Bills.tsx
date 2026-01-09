
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Bill, Category, Account, Client, Card } from '../types';
import {
    Plus, Search, Filter, Calendar, Clock, CheckCircle2,
    MoreVertical, Tag, CreditCard, Trash2, Edit2, CheckCircle,
    ArrowUpCircle, ArrowDownCircle, AlertCircle, FileText
} from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { Toast } from '../components/Toast';
import { formatCurrency, formatDate } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatCard } from '../components/StatCard';

export const Bills: React.FC = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'receber' | 'pagar'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'atrasado' | 'pago' | 'recebido'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Bill>>({
        type: 'pagar',
        status: 'pendente',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        description: '',
        notes: ''
    });

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; bill: Bill | null; action: 'delete' | 'pay' }>({ isOpen: false, bill: null, action: 'delete' });

    const loadData = async () => {
        const [bls, cats, accs, cls, crds] = await Promise.all([
            db.getBills(),
            db.getCategories(),
            db.getAccounts(),
            db.getClients(),
            db.getCards()
        ]);

        // Auto-update status to "atrasado" if pending and date past
        const updatedBills = bls.map(b => {
            if (b.status === 'pendente' && new Date(b.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
                return { ...b, status: 'atrasado' as const };
            }
            return b;
        });

        setBills(updatedBills);
        setCategories(cats);
        setAccounts(accs);
        setClients(cls);
        setCards(crds);
    };

    useEffect(() => { loadData(); }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleOpenModal = (bill?: Bill) => {
        if (bill) {
            setEditingBill(bill);
            setFormData(bill);
        } else {
            setEditingBill(null);
            setFormData({
                type: 'pagar',
                status: 'pendente',
                amount: 0,
                dueDate: new Date().toISOString().split('T')[0],
                description: '',
                notes: '',
                userId: '1'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const bill = {
            ...formData,
            id: editingBill?.id || crypto.randomUUID(),
            createdAt: editingBill?.createdAt || new Date().toISOString(),
        } as Bill;

        await db.saveBill(bill);
        setIsModalOpen(false);
        showToast('success', 'Conta salva com sucesso!');
        await loadData();
    };

    const handlePay = (bill: Bill) => {
        setConfirmModal({ isOpen: true, bill, action: 'pay' });
    };

    const executePay = async () => {
        if (confirmModal.bill) {
            await db.markBillAsPaid(confirmModal.bill);
            showToast('success', confirmModal.bill.type === 'receber' ? 'Recebido com sucesso!' : 'Pago com sucesso!');
            await loadData();
        }
        setConfirmModal({ isOpen: false, bill: null, action: 'delete' });
    };

    const confirmDelete = (bill: Bill) => {
        setConfirmModal({ isOpen: true, bill, action: 'delete' });
    };

    const executeDelete = async () => {
        if (confirmModal.bill) {
            await db.deleteBill(confirmModal.bill.id);
            showToast('success', 'Conta excluída!');
            await loadData();
        }
        setConfirmModal({ isOpen: false, bill: null, action: 'delete' });
    };

    const filteredBills = bills.filter(b => {
        const matchesSearch = b.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || b.type === filterType;
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const stats = {
        receber: filteredBills.filter(b => b.type === 'receber' && (b.status === 'pendente' || b.status === 'atrasado')).reduce((acc, b) => acc + b.amount, 0),
        pagar: filteredBills.filter(b => b.type === 'pagar' && (b.status === 'pendente' || b.status === 'atrasado')).reduce((acc, b) => acc + b.amount, 0),
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">A Receber / A Pagar</h2>
                    <p className="text-zinc-500">Controle seus lançamentos futuros e vencimentos.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                >
                    <Plus size={20} />
                    Nova Conta
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ArrowUpCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">A Receber (Mês)</span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900">{formatCurrency(stats.receber)}</h3>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <ArrowDownCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">A Pagar (Mês)</span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900">{formatCurrency(stats.pagar)}</h3>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm ${stats.receber - stats.pagar >= 0 ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-red-600 border-red-600 text-white'}`}>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-white/10 text-white rounded-xl">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Saldo Previsto (Mês)</span>
                    </div>
                    <h3 className="text-2xl font-black">{formatCurrency(stats.receber - stats.pagar)}</h3>
                </div>
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
                    <option value="all">Tipos: Todos</option>
                    <option value="receber">A Receber</option>
                    <option value="pagar">A Pagar</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full md:w-auto px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-600 font-bold appearance-none cursor-pointer"
                >
                    <option value="all">Status: Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="pago">Pago</option>
                    <option value="recebido">Recebido</option>
                </select>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Vencimento</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredBills.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-zinc-400 font-medium">Nenhum lançamento encontrado.</td></tr>
                            ) : (
                                filteredBills.map(bill => {
                                    const client = clients.find(c => c.id === bill.clientId);
                                    const isLate = bill.status === 'atrasado';
                                    const isCompleted = bill.status === 'pago' || bill.status === 'recebido';

                                    return (
                                        <tr key={bill.id} className="hover:bg-zinc-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${bill.type === 'receber' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {bill.type === 'receber' ? <Plus size={18} /> : <Clock size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900">{bill.description}</p>
                                                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                                            {bill.type === 'receber' ? 'A Receber' : 'A Pagar'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-zinc-600 font-bold">
                                                    {client?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${isLate ? 'text-red-600' : 'text-zinc-600'}`}>
                                                        {formatDate(bill.dueDate)}
                                                    </span>
                                                    {isLate && <span className="text-[10px] text-red-500 font-black uppercase">Vencido</span>}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${bill.type === 'receber' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                                                {formatCurrency(bill.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${bill.status === 'recebido' || bill.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                                                        bill.status === 'atrasado' ? 'bg-red-100 text-red-700' :
                                                            'bg-zinc-100 text-zinc-700'
                                                    }`}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!isCompleted && (
                                                        <button
                                                            onClick={() => handlePay(bill)}
                                                            title={bill.type === 'receber' ? "Receber" : "Pagar"}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleOpenModal(bill)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(bill)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
                title={editingBill ? "Editar Conta" : "Nova Conta"}
                onSubmit={handleSave}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Descrição</label>
                        <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-zinc-900" placeholder="Ex: Mensalidade Cliente X" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tipo</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <option value="receber">A Receber</option>
                            <option value="pagar">A Pagar</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Status</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="recebido">Recebido</option>
                            <option value="atrasado">Atrasado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Valor (R$)</label>
                        <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Vencimento</label>
                        <input required type="date" value={formData.dueDate?.split('T')[0]} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl" />
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
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Cliente (Opcional)</label>
                        <select value={formData.clientId || ''} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <option value="">Nenhum</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Observações</label>
                        <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl h-24 focus:ring-2 focus:ring-zinc-900" placeholder="Informações adicionais..." />
                    </div>
                </div>
            </FormModal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, bill: null })}
                onConfirm={confirmModal.action === 'pay' ? executePay : executeDelete}
                title={confirmModal.action === 'pay' ? (confirmModal.bill?.type === 'receber' ? "Confirmar Recebimento" : "Confirmar Pagamento") : "Excluir Conta"}
                description={confirmModal.action === 'pay'
                    ? `Ao confirmar, uma movimentação será gerada automaticamente na conta selecionada.`
                    : "Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."}
                confirmText={confirmModal.action === 'pay' ? "Confirmar" : "Sim, excluir"}
                type={confirmModal.action === 'pay' ? "primary" : "danger"}
            />
        </div>
    );
};
