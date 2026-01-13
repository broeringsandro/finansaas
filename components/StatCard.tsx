
import React from 'react';
import { formatCurrency } from '../lib/utils';

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex flex-col justify-between hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:border-zinc-300' : ''}`}
    >
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl bg-zinc-50 text-zinc-900 shadow-sm`} style={{ backgroundColor: color + '15', color: color }}>
                {icon}
            </div>
            {trend && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    {trend}
                </span>
            )}
        </div>
        <div className="mt-4">
            <p className="text-zinc-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                {formatCurrency(value)}
            </h3>
        </div>
    </div>
);
