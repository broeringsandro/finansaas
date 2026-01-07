
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SidebarItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
    >
        <span className="shrink-0">{icon}</span>
        <span className="font-medium">{label}</span>
        {active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
    </Link>
);
