import React from 'react';
import { Funcionario, Ferias, ActiveTab } from '../../types';
import {
  Users,
  Clock,
  CheckCircle2,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Calendar,
  AlertCircle,
  Plus,
  Eye,
  Check,
  XCircle,
} from 'lucide-react';

interface DashboardViewProps {
  funcionarios: Funcionario[];
  ferias: Ferias[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNovaSolicitacao: () => void;
  onOpenNovoFuncionario: () => void;
  onApproveFerias: (ferias: Ferias) => void;
  onRejectFerias: (ferias: Ferias) => void;
  onViewFerias: (ferias: Ferias) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  funcionarios,
  ferias,
  onNavigateTab,
  onOpenNovaSolicitacao,
  onOpenNovoFuncionario,
  onApproveFerias,
  onRejectFerias,
  onViewFerias,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Calculate metrics
  const totalFuncionarios = funcionarios.length;
  const pendentes = ferias.filter((f) => f.status === 'Pendente').length;
  const aprovadas = ferias.filter((f) => f.status === 'Aprovada').length;
  const emAndamento = ferias.filter(
    (f) =>
      f.status === 'Em andamento' ||
      (f.status === 'Aprovada' && f.data_inicio <= today && f.data_fim >= today)
  ).length;

  // Recent requests (up to 6)
  const recentes = [...ferias].slice(0, 6);

  // Employees currently on leave
  const funcionariosEmFerias = ferias.filter(
    (f) =>
      f.status === 'Em andamento' ||
      (f.status === 'Aprovada' && f.data_inicio <= today && f.data_fim >= today)
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: Ferias['status']) => {
    switch (status) {
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendente
          </span>
        );
      case 'Aprovada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aprovada
          </span>
        );
      case 'Recusada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Recusada
          </span>
        );
      case 'Em andamento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Em andamento
          </span>
        );
      case 'Concluída':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Concluída
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-sky-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-3 backdrop-blur-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Painel Central de Controle de Férias</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestão Estratégica de Férias do RH
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Monitore períodos aquisitivos, aprove solicitações em conformidade com a CLT e acompanhe o calendário corporativo em tempo real.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenNovaSolicitacao}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Solicitação de Férias</span>
            </button>
            <button
              type="button"
              onClick={onOpenNovoFuncionario}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Cadastrar Funcionário</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards (Required by Prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funcionários */}
        <div
          onClick={() => onNavigateTab('funcionarios')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Funcionários
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{totalFuncionarios}</span>
            <span className="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Ver todos <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Colaboradores ativos na empresa</p>
        </div>

        {/* Solicitações Pendentes */}
        <div
          onClick={() => onNavigateTab('solicitacoes')}
          className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-white to-amber-50/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Solicitações Pendentes
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-700">{pendentes}</span>
            <span className="text-xs text-amber-700 font-semibold group-hover:underline flex items-center gap-0.5">
              Avaliar <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-600/80">Requerem deliberação do RH</p>
        </div>

        {/* Férias Aprovadas */}
        <div
          onClick={() => onNavigateTab('solicitacoes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Férias Aprovadas
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{aprovadas}</span>
            <span className="text-xs text-emerald-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Programadas <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Prontas para gozo no período</p>
        </div>

        {/* Férias em Andamento */}
        <div
          onClick={() => onNavigateTab('calendario')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Férias em Andamento
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarRange className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{emAndamento}</span>
            <span className="text-xs text-sky-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Calendário <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Colaboradores ausentes hoje</p>
        </div>
      </div>

      {/* Main Grid: Solicitações Recentes & Colaboradores Ausentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solicitações Recentes (Left 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Solicitações Recentes</h3>
              <p className="text-xs text-slate-500">
                Últimos pedidos registrados no sistema aguardando ou processados
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('solicitacoes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Nenhuma solicitação de férias cadastrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Funcionário</th>
                    <th className="py-3 px-4">Data Solicitação</th>
                    <th className="py-3 px-4">Período de Férias</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {item.funcionario?.nome_completo
                              ? item.funcionario.nome_completo.substring(0, 2).toUpperCase()
                              : 'FN'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.funcionario?.nome_completo || 'Funcionário não identificado'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.funcionario?.departamento || 'Geral'} • {item.funcionario?.matricula || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(item.created_at?.split('T')[0] || '')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {formatDate(item.data_inicio)} até {formatDate(item.data_fim)}
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {item.quantidade_dias} dias • Retorno em {formatDate(item.data_retorno)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'Pendente' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveFerias(item)}
                                title="Aprovar Férias"
                                className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onRejectFerias(item)}
                                title="Recusar Férias"
                                className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewFerias(item)}
                            title="Ver Detalhes"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Colaboradores em Férias no Momento (Right Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-sky-600" />
                <span>Em Férias Hoje</span>
              </h3>
              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-xs font-bold rounded-full">
                {funcionariosEmFerias.length}
              </span>
            </div>

            {funcionariosEmFerias.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium">Nenhum funcionário em férias hoje.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Todos os colaboradores estão ativos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funcionariosEmFerias.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {f.funcionario?.nome_completo || 'Colaborador'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {f.funcionario?.cargo || 'Cargo'} • {f.funcionario?.departamento}
                      </p>
                      <p className="text-[10px] text-sky-700 font-semibold mt-1">
                        Retorna em: {formatDate(f.data_retorno)}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                      {f.quantidade_dias}d
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('calendario')}
              className="mt-4 w-full py-2 px-3 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ver Calendário Completo</span>
            </button>
          </div>

          {/* Quick Guidance Card */}
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>Normas de Férias CLT</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>• O início das férias não pode ocorrer nos 2 dias anteriores a feriado ou RSR.</li>
              <li>• É permitido o fracionamento em até 3 períodos com prévia concordância.</li>
              <li>• Um dos períodos não pode ser inferior a 14 dias corridos.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
