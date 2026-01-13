
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Category } from '../types';
import { Plus, Tag, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '', type: 'ambos', color: '#3b82f6', icon: '📁'
  });

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const load = async () => setCategories(await db.getCategories());
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (cat?: Category) => {
    if (cat) { setEditingCat(cat); setFormData(cat); }
    else { setEditingCat(null); setFormData({ name: '', type: 'ambos', color: '#3b82f6', icon: '📁', userId: '1' }); }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    await db.saveCategory({ ...formData, id: editingCat?.id || crypto.randomUUID() } as Category);
    setIsModalOpen(false);
    showToast('Categoria salva!');
    await load();
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    if (confirmModal.id) {
      await db.deleteCategory(confirmModal.id);
      showToast('Categoria excluída!');
      await load();
    }
    setConfirmModal({ isOpen: false, id: null });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Categorias</h2>
          <p className="text-zinc-500">Organize suas movimentações para melhores relatórios.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
          <Plus size={20} /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-zinc-50" style={{ backgroundColor: cat.color + '10' }}>
                {cat.icon}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900">{cat.name}</h4>
                <p className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-widest">{cat.type}</p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(cat)} className="p-2 text-zinc-400 hover:text-zinc-900"><Edit2 size={16} /></button>
              <button onClick={() => confirmDelete(cat.id)} className="p-2 text-zinc-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? "Editar" : "Nova Categoria"} onSubmit={handleSave}>
        <div className="space-y-4">
          <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl" /></div>
          <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tipo</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl"><option value="ambos">Ambos</option><option value="receita">Receita</option><option value="despesa">Despesa</option></select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cor</label><input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full h-12 p-1 bg-zinc-50 border border-zinc-100 rounded-xl" /></div>
            <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Ícone</label><input placeholder="Emoji ou ícone" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl" /></div>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria? Isso pode afetar transações existentes."
        confirmText="Sim, excluir"
        type="danger"
      />
    </div>
  );
};
