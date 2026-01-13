
import React from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'primary' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Excluir',
    cancelText = 'Cancelar',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle className="text-red-500" size={32} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={32} />;
            case 'info': return <AlertCircle className="text-blue-500" size={32} />;
            case 'primary': return <CheckCircle2 className="text-zinc-900" size={32} />;
            case 'success': return <CheckCircle2 className="text-emerald-500" size={32} />;
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200';
            case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200';
            case 'info': return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200';
            case 'primary': return 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-200';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${type === 'danger' ? 'bg-red-50' :
                        type === 'warning' ? 'bg-amber-50' :
                            type === 'primary' ? 'bg-zinc-100' :
                                type === 'success' ? 'bg-emerald-50' :
                                    'bg-blue-50'
                        }`}>
                        {getIcon()}
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-8">{description}</p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 px-4 py-3 font-bold rounded-xl shadow-lg transition-all ${getConfirmButtonStyle()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
