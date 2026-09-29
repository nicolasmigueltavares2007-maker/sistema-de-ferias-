import React, { useState, useMemo } from 'react';
import { Ferias, Funcionario } from '../../types';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  FileSpreadsheet,
  CheckCircle,
  Building2,
  Clock,
  Printer,
} from 'lucide-react';

interface HistoricoViewProps {
  ferias: Ferias[];
  funcionarios: Funcionario[];
  onViewFerias: (ferias: Ferias) => void;
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({
  ferias,
  funcionarios,
  onViewFerias,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string>('todos');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('todos');
  const [selectedAno, setSelectedAno] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Extract years present in data
  const anosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    ferias.forEach((f) => {
      if (f.data_inicio) {
        set.add(f.data_inicio.split('-')[0]);
      }
    });
    // Add current year if not present
    set.add(new Date().getFullYear().toString());
    return Array.from(set).sort().reverse();
  }, [ferias]);

  // Extract departments
  const departamentos = useMemo(() => {
    const set = new Set<string>();
    funcionarios.forEach((f) => {
      if (f.departamento) set.add(f.departamento);
    });
    return Array.from(set).sort();
  }, [funcionarios]);

  // Filtered
  const filteredHistorico = useMemo(() => {
    return ferias.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        item.funcionario?.nome_completo.toLowerCase().includes(search) ||
        item.funcionario?.matricula.toLowerCase().includes(search) ||
        item.observacoes?.toLowerCase().includes(search);

      if (!matchSearch) return false;

      if (selectedFuncionarioId !== 'todos' && item.funcionario_id !== selectedFuncionarioId) {
        return false;
      }

      if (selectedDepartamento !== 'todos' && item.funcionario?.departamento !== selectedDepartamento) {
        return false;
      }

      if (selectedAno !== 'todos' && !item.data_inicio.startsWith(selectedAno)) {
        return false;
      }

      if (selectedStatus !== 'todos' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [ferias, searchTerm, selectedFuncionarioId, selectedDepartamento, selectedAno, selectedStatus]);

  // Historical summary metrics
  const totalDiasConcedidos = useMemo(() => {
    return filteredHistorico
      .filter((f) => f.status === 'Aprovada' || f.status === 'Concluída' || f.status === 'Em andamento')
      .reduce((acc, curr) => acc + curr.quantidade_dias, 0);
  }, [filteredHistorico]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Export filtered records to CSV for HR spreadsheet integration
  const exportToCSV = () => {
    const headers = [
      'Matrícula',
      'Funcionário',
      'Departamento',
      'Cargo',
      'Data Início',
      'Data Fim',
      'Dias',
      'Data Retorno',
      'Status',
      'Data Solicitação',
      'Observações',
      'Motivo Recusa',
    ];

    const rows = filteredHistorico.map((item) => [
      item.funcionario?.matricula || '',
      `"${item.funcionario?.nome_completo || ''}"`,
      `"${item.funcionario?.departamento || ''}"`,
      `"${item.funcionario?.cargo || ''}"`,
      item.data_inicio,
      item.data_fim,
      item.quantidade_dias,
      item.data_retorno,
      item.status,
      item.created_at?.split('T')[0] || '',
      `"${item.observacoes || ''}"`,
      `"${item.motivo_recusa || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_historico_ferias_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>Histórico de Férias & Auditoria</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consulta consolidada de todos os períodos de férias gozados e solicitados na organização
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Relatório (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Registros Filtrados
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {filteredHistorico.length}
          </span>
          <span className="text-xs text-slate-500">solicitações de férias localizadas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Dias de Férias Concedidos
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {totalDiasConcedidos} dias
          </span>
          <span className="text-xs text-slate-500">férias aprovadas e usufruídas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Taxa de Aprovação RH
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {filteredHistorico.length > 0
              ? `${Math.round(
                  (filteredHistorico.filter(
                    (f) => f.status === 'Aprovada' || f.status === 'Concluída' || f.status === 'Em andamento'
                  ).length /
                    filteredHistorico.length) *
                    100
                )}%`
              : '0%'}
          </span>
          <span className="text-xs text-slate-500">índice de deferimento das solicitações</span>
        </div>
      </div>

      {/* Filter and Search Bar (Required by prompt) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Filter Funcionário */}
          <div>
            <select
              value={selectedFuncionarioId}
              onChange={(e) => setSelectedFuncionarioId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos Funcionários</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Departamento */}
          <div>
            <select
              value={selectedDepartamento}
              onChange={(e) => setSelectedDepartamento(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos Departamentos</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Ano */}
          <div>
            <select
              value={selectedAno}
              onChange={(e) => setSelectedAno(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos os Anos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  Ano {ano}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Aprovada">Aprovada</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluída">Concluída</option>
              <option value="Recusada">Recusada</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Exibindo <strong>{filteredHistorico.length}</strong> ocorrência(s)
          </span>
          {(searchTerm ||
            selectedFuncionarioId !== 'todos' ||
            selectedDepartamento !== 'todos' ||
            selectedAno !== 'todos' ||
            selectedStatus !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedFuncionarioId('todos');
                setSelectedDepartamento('todos');
                setSelectedAno('todos');
                setSelectedStatus('todos');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
            >
              Redefinir filtros
            </button>
          )}
        </div>
      </div>

      {/* Histórico Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredHistorico.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Nenhum histórico correspondente</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de ano ou departamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Funcionário</th>
                  <th className="py-3.5 px-4">Período de Gozo</th>
                  <th className="py-3.5 px-4">Qtd. Dias</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Data da Solicitação</th>
                  <th className="py-3.5 px-4">Observações</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHistorico.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {item.funcionario?.nome_completo.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.funcionario?.nome_completo}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.funcionario?.departamento} ({item.funcionario?.matricula})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {formatDate(item.data_inicio)} até {formatDate(item.data_fim)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        {item.quantidade_dias} dias
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'Pendente' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pendente
                        </span>
                      )}
                      {item.status === 'Aprovada' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aprovada
                        </span>
                      )}
                      {item.status === 'Em andamento' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          Em andamento
                        </span>
                      )}
                      {item.status === 'Concluída' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Concluída
                        </span>
                      )}
                      {item.status === 'Recusada' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Recusada
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(item.created_at?.split('T')[0] || '')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {item.motivo_recusa ? (
                        <span className="text-rose-600 font-medium">Recusa: {item.motivo_recusa}</span>
                      ) : (
                        item.observacoes || '-'
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewFerias(item)}
                        title="Ver Comprovante"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
