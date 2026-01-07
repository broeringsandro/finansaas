
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              name: email.split('@')[0]
            }
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Conta criada! Verifique seu e-mail ou faça login.' });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ocorreu um erro na autenticação.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-zinc-200 border border-zinc-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <span className="text-white font-bold text-3xl italic">F</span>
          </div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
            {isSignUp ? 'Criar nova conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="mt-2 text-zinc-500">
            {isSignUp ? 'Preencha os dados para começar' : 'Entre com suas credenciais para acessar'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            {message.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
            {message.text}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-zinc-200 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isSignUp ? 'Registrar Agora' : 'Entrar no Sistema'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-sm font-bold text-zinc-900 hover:underline"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Comece gratuitamente'}
          </button>
        </div>
      </div>
    </div>
  );
};
