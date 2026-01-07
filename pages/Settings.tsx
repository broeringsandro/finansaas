
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { AppSettings } from '../types';
import { Camera, Save, RefreshCw, Palette, Globe, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(db.getDefaultSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    db.getSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await db.saveSettings(settings);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/');
        // window.location.reload(); // Removed reload as we should manage state better, but keeping for now if user needs global apply
      }, 1500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, appLogoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {showToast && (
        <Toast message="Configurações salvas com sucesso!" onClose={() => setShowToast(false)} />
      )}

      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Personalização White-Label</h2>
        <p className="text-zinc-500 font-medium mt-1">Configure o nome e a identidade visual do seu sistema.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-xl shadow-zinc-100/50 space-y-10">
          {/* Branding Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Palette className="text-zinc-400" size={24} />
              <h3 className="text-xl font-black text-zinc-900">Identidade do App</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="space-y-4">
                <label className="label">Logo do Sistema</label>
                <div className="relative w-32 h-32 rounded-3xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden group">
                  {settings.appLogoUrl ? (
                    <img src={settings.appLogoUrl} className="w-full h-full object-contain p-2" alt="App Logo" />
                  ) : (
                    <span className="text-4xl font-black text-zinc-200">LOGO</span>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                    <Camera size={24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">Alterar</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              <div className="flex-1 space-y-6 w-full">
                <div>
                  <label className="label">Nome do App</label>
                  <input
                    required
                    value={settings.appName}
                    onChange={e => setSettings({ ...settings, appName: e.target.value })}
                    className="input"
                    placeholder="Ex: Minha Empresa"
                  />
                </div>
                <div>
                  <label className="label">Cor Primária</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-14 h-14 p-1 bg-white border border-zinc-100 rounded-2xl cursor-pointer"
                    />
                    <span className="font-mono text-zinc-400 font-bold uppercase">{settings.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-zinc-50" />

          {/* Preferences Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="text-zinc-400" size={24} />
              <h3 className="text-xl font-black text-zinc-900">Preferências do Sistema</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Moeda Principal</label>
                <select
                  value={settings.currency}
                  onChange={e => setSettings({ ...settings, currency: e.target.value })}
                  className="input"
                >
                  <option value="BRL">Real Brasileiro (R$)</option>
                  <option value="USD">Dólar Americano ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="label">Dia de Início Fiscal</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.fiscalMonthStart}
                  onChange={e => setSettings({ ...settings, fiscalMonthStart: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
          </section>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-5 bg-zinc-900 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-zinc-200 hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          {isSaving ? 'Salvando Alterações...' : 'Salvar Tudo'}
        </button>
      </form>
    </div>
  );
};
