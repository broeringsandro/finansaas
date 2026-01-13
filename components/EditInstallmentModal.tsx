import React from 'react';
import { Transaction } from '../types';
import { AlertCircle, X } from 'lucide-react';

interface EditInstallmentModalProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onEditSingle: () => void;
    onEditFuture: () => void;
}

export const EditInstallmentModal: React.FC<EditInstallmentModalProps> = ({
    isOpen,
    transaction,
    onClose,
    onEditSingle,
    onEditFuture
}) => {
    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <AlertCircle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900">Editar Parcela</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-sm text-amber-900 font-medium">
                            Esta transação faz parte de um parcelamento{' '}
                            <span className="font-bold">
                                ({transaction.currentInstallment}/{transaction.totalInstallments})
                            </span>
                        </p>
                    </div>

                    <p className="text-sm text-zinc-600">
                        Escolha o escopo da edição:
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onEditSingle}
                            className="w-full p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl text-left transition-all group"
                        >
                            <p className="font-bold text-zinc-900 group-hover:text-zinc-900">
                                Editar apenas esta parcela
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Altera somente a parcela {transaction.currentInstallment} de {transaction.totalInstallments}
                            </p>
                        </button>

                        <button
                            onClick={onEditFuture}
                            className="w-full p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl text-left transition-all group"
                        >
                            <p className="font-bold text-zinc-900 group-hover:text-zinc-900">
                                Editar esta e todas as futuras
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                Altera da parcela {transaction.currentInstallment} até {transaction.totalInstallments} (
                                {transaction.totalInstallments! - transaction.currentInstallment! + 1} parcelas)
                            </p>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
