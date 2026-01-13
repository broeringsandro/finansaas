
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Tags,
  PieChart,
  Target,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Calendar,
  Repeat
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../services/db';
import { supabase } from '../lib/supabase';

import { SidebarItem } from './SidebarItem';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [settings, setSettings] = useState(db.getDefaultSettings());

  useEffect(() => {
    db.getSettings().then(setSettings);
  }, []);

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/recorrencias', label: 'Recorrências', icon: <Repeat size={20} /> },
    { to: '/movimentacoes', label: 'Movimentações', icon: <ArrowLeftRight size={20} /> },
    { to: '/contas-pendentes', label: 'A Receber / Pagar', icon: <Calendar size={20} /> },
    { to: '/contas', label: 'Contas & Cartões', icon: <CreditCard size={20} /> },
    { to: '/categorias', label: 'Categorias', icon: <Tags size={20} /> },
    { to: '/relatorios', label: 'Relatórios', icon: <PieChart size={20} /> },
    { to: '/metas', label: 'Metas', icon: <Target size={20} /> },
    { to: '/clientes', label: 'Clientes', icon: <Users size={20} /> },
    { to: '/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50 relative">

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          {settings.appLogoUrl ? (
            <img src={settings.appLogoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
          )}
          <span className="font-bold text-zinc-900">{settings.appName}</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            {settings.appLogoUrl ? (
              <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl italic">F</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-zinc-900 tracking-tight text-lg leading-tight">{settings.appName}</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Sistema Ativo</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.to}
                {...item}
                active={location.pathname === item.to}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="pt-6 border-t border-zinc-100">
            <button
              className="flex items-center gap-3 px-4 py-3 w-full text-zinc-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span className="font-medium">Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:h-screen lg:overflow-y-auto pt-20 lg:pt-8 px-4 lg:px-10 pb-12">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>

  );
};
