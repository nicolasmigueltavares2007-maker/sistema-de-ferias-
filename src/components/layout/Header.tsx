import React from 'react';
import { Menu, Plus, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onNewSolicitacao: () => void;
  onNewFuncionario: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onNewSolicitacao,
  onNewFuncionario,
}) => {
  const { user } = useAuth();

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Visão Geral & Indicadores';
      case 'funcionarios':
        return 'Gestão de Funcionários';
      case 'solicitacoes':
        return 'Solicitações de Férias';
      case 'calendario':
        return 'Calendário e Escalas de Férias';
      case 'historico':
        return 'Histórico e Relatórios';
      default:
        return 'Painel RH';
    }
  };

  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const formattedDate = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Titles */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {getTabTitle(activeTab)}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-150">
                RH Corporativo
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Quick Action: New Employee */}
          <button
            type="button"
            onClick={onNewFuncionario}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Funcionário</span>
          </button>

          {/* Quick Action: New Vacation Request */}
          <button
            type="button"
            onClick={onNewSolicitacao}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Solicitar Férias</span>
          </button>
        </div>
      </div>
    </header>
  );
};
