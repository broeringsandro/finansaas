
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './services/db';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Categories } from './pages/Categories';
import { AccountsCards } from './pages/AccountsCards';
import { AccountDetail } from './pages/AccountDetail';
import { Clients } from './pages/Clients';
import { Goals } from './pages/Goals';
import { Reports } from './pages/Reports';
import { Recurrences } from './pages/Recurrences';
import { Bills } from './pages/Bills';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { supabase, checkAuthError } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        checkAuthError(error);
      }
      setSession(session);
      if (session?.user) {
        db.setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          createdAt: session.user.created_at
        });
      }
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        db.setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          createdAt: session.user.created_at
        });
      } else {
        db.setCurrentUser(null);
      }
      setLoading(false);
    });


    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recorrencias" element={<Recurrences />} />
          <Route path="/movimentacoes" element={<Transactions />} />
          <Route path="/contas-pendentes" element={<Bills />} />
          <Route path="/contas" element={<AccountsCards />} />
          <Route path="/contas/:id" element={<AccountDetail />} />
          <Route path="/categorias" element={<Categories />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/metas" element={<Goals />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
