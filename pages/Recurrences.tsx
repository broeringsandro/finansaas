import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Recurrence, Client, Account, Category } from '../types';
import {
    Repeat,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Plus,
    MoreHorizontal,
    Trash2,
    PauseCircle,
    PlayCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';

export const Recurrences: React.FC = () => {
    const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Recurrence | null>(null);
    const [formData, setFormData] = useState<Partial<Recurrence>>({
        type: 'receita',
        status: 'ativa',
        frequency: 'mensal',
        startDate: new Date().toISOString().split('T')[0]
    });

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const loadData = async () => {
        const [recs, cls, accs, cats] = await Promise.all([
            db.getRecurrences(),
            db.getClients(),
            db.getAccounts(),
            db.getCategories()
        ]);
        setRecurrences(recs);
        setClients(cls);
        setAccounts(accs);
        setCategories(cats);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.amount || !formData.startDate || !formData.type) return;
        if (formData.type === 'receita' && !formData.clientId) {
            alert("Selecione um cliente para Receita Recorrente.");
            return;
        }

        const newItem: Recurrence = {
            id: editingItem ? editingItem.id : crypto.randomUUID(),
            userId: '', // handled by db
            type: formData.type as 'receita' | 'despesa',
            description: formData.description,
            amount: Number(formData.amount),
            clientId: formData.clientId || undefined,
            accountId: formData.accountId || undefined,
            categoryId: formData.categoryId || undefined,
            startDate: formData.startDate,
            frequency: 'mensal',
            status: (formData.status as 'ativa' | 'pausada') || 'ativa',
            createdAt: editingItem ? editingItem.createdAt : new Date().toISOString()
        };

        await db.saveRecurrence(newItem);
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            type: 'receita',
            status: 'ativa',
            frequency: 'mensal',
            startDate: new Date().toISOString().split('T')[0]
        });
        loadData();
    };

    const handleDelete = async () => {
        if (confirmDeleteId) {
            await db.deleteRecurrence(confirmDeleteId);
            setConfirmDeleteId(null);
            loadData();
        }
    };

    const handleEdit = (item: Recurrence) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const toggleStatus = async (item: Recurrence) => {
        const newStatus = item.status === 'ativa' ? 'pausada' : 'ativa';
        await db.saveRecurrence({ ...item, status: newStatus });
        loadData();
    };

    // Calculations
    const activeRecurrences = recurrences.filter(r => r.status === 'ativa');

    const mrr = activeRecurrences
        .filter(r => r.type === 'receita')
        .reduce((acc, r) => acc + r.amount, 0);

    const fixedExpenses = activeRecurrences
        .filter(r => r.type === 'despesa')
        .reduce((acc, r) => acc + r.amount, 0);

    const recurringBalance = mrr - fixedExpenses;


    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Recorrências</h2>
                    <p className="text-zinc-500 text-sm">Gestão de receitas e despesas fixas.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setFormData({
                            type: 'receita',
                            status: 'ativa',
                            frequency: 'mensal',
                            startDate: new Date().toISOString().split('T')[0]
                        });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                >
                    <Plus size={20} />
                    Nova Recorrência
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MRR */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">MRR (Receita Recorrente)</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <Repeat size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-emerald-600">
                            {formatCurrency(mrr)}
                        </h3>
                    </div>
                </div>

                {/* Fixed Expenses */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Despesas Fixas</span>
                        <div className="p-2 rounded-xl bg-red-50 text-red-600">
                            <ArrowDownLeft size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-red-600">
                            {formatCurrency(fixedExpenses)}
                        </h3>
                    </div>
                </div>

                {/* Recurring Balance */}
                <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between h-32 ${recurringBalance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${recurringBalance >= 0 ? 'text-emerald-600/60' : 'text-red-600/60'}`}>Saldo Recorrente Previsto</span>
                    </div>
                    <div>
                        <h3 className={`text-3xl font-black tracking-tight ${recurringBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {formatCurrency(recurringBalance)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Income List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                        <ArrowUpRight className="text-emerald-500" size={20} />
                        Receitas Recorrentes
                    </h3>
                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                        {recurrences.filter(r => r.type === 'receita').length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 text-sm">Nenhuma receita recorrente.</div>
                        ) : (
                            <div>
                                {recurrences.filter(r => r.type === 'receita').map(item => {
                                    const client = clients.find(c => c.id === item.clientId);
                                    return (
                                        <div key={item.id} className="p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'ativa' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                                                    {item.status === 'ativa' ? <Repeat size={18} /> : <PauseCircle size={18} />}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-sm ${item.status === 'ativa' ? 'text-zinc-900' : 'text-zinc-400'}`}>{item.description}</h4>
                                                    {client && <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold">{client.name}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold ${item.status === 'ativa' ? 'text-emerald-600' : 'text-zinc-400'}`}>{formatCurrency(item.amount)}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleStatus(item)} title={item.status === 'ativa' ? 'Pausar' : 'Ativar'} className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg">
                                                        {item.status === 'ativa' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                                                    </button>
                                                    <button onClick={() => handleEdit(item)} title="Editar" className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(item.id)} title="Excluir" className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Expense List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                        <ArrowDownLeft className="text-red-500" size={20} />
                        Despesas Recorrentes
                    </h3>
                    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                        {recurrences.filter(r => r.type === 'despesa').length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 text-sm">Nenhuma despesa recorrente.</div>
                        ) : (
                            <div>
                                {recurrences.filter(r => r.type === 'despesa').map(item => (
                                    <div key={item.id} className="p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'ativa' ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-400'}`}>
                                                {item.status === 'ativa' ? <Repeat size={18} /> : <PauseCircle size={18} />}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm ${item.status === 'ativa' ? 'text-zinc-900' : 'text-zinc-400'}`}>{item.description}</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-bold ${item.status === 'ativa' ? 'text-red-600' : 'text-zinc-400'}`}>{formatCurrency(item.amount)}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => toggleStatus(item)} title={item.status === 'ativa' ? 'Pausar' : 'Ativar'} className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg">
                                                    {item.status === 'ativa' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                                                </button>
                                                <button onClick={() => handleEdit(item)} title="Editar" className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(item.id)} title="Excluir" className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-zinc-900 mb-6">
                            {editingItem ? 'Editar Recorrência' : 'Nova Recorrência'}
                        </h3>

                        <form onSubmit={handleSave} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'receita' })}
                                    className={`p-3 rounded-xl font-bold text-sm border transiton-all ${formData.type === 'receita' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
                                >
                                    Receita
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'despesa' })}
                                    className={`p-3 rounded-xl font-bold text-sm border transiton-all ${formData.type === 'despesa' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
                                >
                                    Despesa
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 font-medium"
                                    placeholder="Ex: Contrato Mensal, Aluguel..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Valor</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount || ''}
                                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 font-medium"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Início</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate || ''}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 font-medium"
                                    />
                                </div>
                            </div>

                            {formData.type === 'receita' && (
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cliente (Obrigatório)</label>
                                    <select
                                        required
                                        value={formData.clientId || ''}
                                        onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 font-medium"
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Conta Padrão</label>
                                    <select
                                        value={formData.accountId || ''}
                                        onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 font-medium"
                                    >
                                        <option value="">Selecione...</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Categoria</label>
                                    <select
                                        value={formData.categoryId || ''}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 font-medium"
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 p-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 p-3 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                                >
                                    Salvar
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                title="Excluir Recorrência"
                message="Tem certeza que deseja excluir esta recorrência? Isso não afetará lançamentos passados."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
            />

        </div>
    );
};
