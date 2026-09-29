import React, { useState, useMemo, useEffect } from 'react';
import { Funcionario, Ferias, FeriasStatus } from '../../types';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Check,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  Printer,
  X,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { calculateVacationDays, calculateReturnDate, checkVacationOverlap } from '../../services/dataService';

interface SolicitacoesViewProps {
  ferias: Ferias[];
  funcionarios: Funcionario[];
  preselectedFuncionarioId?: string | null;
  onClearPreselectedFuncionarioId?: () => void;
  onSaveFerias: (feriasData: Partial<Ferias>) => Promise<void>;
  onUpdateStatus: (id: string, status: FeriasStatus, motivoRecusa?: string) => Promise<void>;
  onDeleteFerias: (id: string) => Promise<void>;
}

export const SolicitacoesView: React.FC<SolicitacoesViewProps> = ({
  ferias,
  funcionarios,
  preselectedFuncionarioId,
  onClearPreselectedFuncionarioId,
  onSaveFerias,
  onUpdateStatus,
  onDeleteFerias,
}) => {
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('todos');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFerias, setEditingFerias] = useState<Partial<Ferias> | null>(null);
  const [viewingFerias, setViewingFerias] = useState<Ferias | null>(null);
  const [rejectingFerias, setRejectingFerias] = useState<Ferias | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Ferias | null>(null);

  // Form Fields
  const [formFuncionarioId, setFormFuncionarioId] = useState('');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formMotivoRecusa, setFormMotivoRecusa] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [formError, setFormError] = useState('');
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If preselected employee passed from another view
  useEffect(() => {
    if (preselectedFuncionarioId) {
      openCreateModal(preselectedFuncionarioId);
      if (onClearPreselectedFuncionarioId) {
        onClearPreselectedFuncionarioId();
      }
    }
  }, [preselectedFuncionarioId]);

  // Auto-calculated days & return date
  const calculatedDays = useMemo(() => {
    return calculateVacationDays(formDataInicio, formDataFim);
  }, [formDataInicio, formDataFim]);

  const calculatedReturnDate = useMemo(() => {
    return calculateReturnDate(formDataFim);
  }, [formDataFim]);

  // Overlap check on date change
  useEffect(() => {
    async function checkOverlap() {
      if (formFuncionarioId && formDataInicio && formDataFim && calculatedDays > 0) {
        const result = await checkVacationOverlap(
          formFuncionarioId,
          formDataInicio,
          formDataFim,
          editingFerias?.id
        );
        if (result.hasOverlap && result.conflictingRequest) {
          const req = result.conflictingRequest;
          setOverlapWarning(
            `Atenção: Este funcionário já possui férias registradas (${req.data_inicio} a ${req.data_fim}, Status: ${req.status}) que coincidem com este período.`
          );
        } else {
          setOverlapWarning(null);
        }
      } else {
        setOverlapWarning(null);
      }
    }
    checkOverlap();
  }, [formFuncionarioId, formDataInicio, formDataFim, editingFerias?.id, calculatedDays]);

  const openCreateModal = (defaultFuncId?: string) => {
    setEditingFerias(null);
    setFormFuncionarioId(defaultFuncId || (funcionarios[0]?.id || ''));

    // Default start date in 15 days
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() + 15);
    const startStr = defaultStart.toISOString().split('T')[0];

    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultEnd.getDate() + 14); // 15 days of vacation
    const endStr = defaultEnd.toISOString().split('T')[0];

    setFormDataInicio(startStr);
    setFormDataFim(endStr);
    setFormObservacoes('');
    setFormError('');
    setOverlapWarning(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: Ferias) => {
    setEditingFerias(item);
    setFormFuncionarioId(item.funcionario_id);
    setFormDataInicio(item.data_inicio);
    setFormDataFim(item.data_fim);
    setFormObservacoes(item.observacoes || '');
    setFormMotivoRecusa(item.motivo_recusa || '');
    setFormError('');
    setOverlapWarning(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formFuncionarioId) {
      setFormError('Selecione o funcionário.');
      return;
    }

    if (!formDataInicio || !formDataFim) {
      setFormError('Preencha as datas de início e término das férias.');
      return;
    }

    if (new Date(formDataFim) < new Date(formDataInicio)) {
      setFormError('A data de término não pode ser anterior à data de início.');
      return;
    }

    if (calculatedDays <= 0) {
      setFormError('A quantidade de dias de férias deve ser maior que zero.');
      return;
    }

    // Check collision again
    const collisionCheck = await checkVacationOverlap(
      formFuncionarioId,
      formDataInicio,
      formDataFim,
      editingFerias?.id
    );

    if (collisionCheck.hasOverlap) {
      const confirmOverride = window.confirm(
        'Este colaborador já possui férias cadastradas que colidem com este período. Deseja prosseguir mesmo assim?'
      );
      if (!confirmOverride) return;
    }

    setIsSubmitting(true);
    try {
      await onSaveFerias({
        id: editingFerias?.id,
        funcionario_id: formFuncionarioId,
        data_inicio: formDataInicio,
        data_fim: formDataFim,
        quantidade_dias: calculatedDays,
        data_retorno: calculatedReturnDate,
        status: editingFerias?.status || 'Pendente',
        observacoes: formObservacoes.trim(),
        motivo_recusa: formMotivoRecusa || undefined,
      });
      setSearchTerm('');
      setSelectedStatus('todos');
      setSelectedDepartment('todos');
      setIsFormModalOpen(false);
    } catch {
      setFormError('Erro ao gravar a solicitação de férias. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingFerias) return;
    if (!rejectionReasonInput.trim()) {
      alert('Por favor, informe a justificativa/motivo da recusa da solicitação.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateStatus(rejectingFerias.id, 'Recusada', rejectionReasonInput.trim());
      setRejectingFerias(null);
      setRejectionReasonInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (item: Ferias) => {
    await onUpdateStatus(item.id, 'Aprovada');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsSubmitting(true);
    try {
      await onDeleteFerias(deleteCandidate.id);
      setDeleteCandidate(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered requests
  const filteredFerias = useMemo(() => {
    return ferias.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        item.funcionario?.nome_completo.toLowerCase().includes(search) ||
        item.funcionario?.matricula.toLowerCase().includes(search) ||
        item.observacoes?.toLowerCase().includes(search);

      if (!matchSearch) return false;

      if (selectedStatus !== 'todos' && item.status !== selectedStatus) {
        return false;
      }

      if (selectedDepartment !== 'todos' && item.funcionario?.departamento !== selectedDepartment) {
        return false;
      }

      return true;
    });
  }, [ferias, searchTerm, selectedStatus, selectedDepartment]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: FeriasStatus) => {
    switch (status) {
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendente
          </span>
        );
      case 'Aprovada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Aprovada
          </span>
        );
      case 'Recusada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Recusada
          </span>
        );
      case 'Em andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Em andamento
          </span>
        );
      case 'Concluída':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Concluída
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span>Solicitações de Férias</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lance pedidos de férias, analise conformidade e delibere aprovações ou recusas do RH
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Solicitação</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por funcionário, matrícula..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
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

          {/* Filter Departamento */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos os Departamentos</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Marketing">Marketing</option>
              <option value="Operações">Operações</option>
              <option value="Comercial">Comercial</option>
              <option value="Jurídico">Jurídico</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong>{filteredFerias.length}</strong> de {ferias.length} solicitações
          </span>
          {(searchTerm || selectedStatus !== 'todos' || selectedDepartment !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('todos');
                setSelectedDepartment('todos');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Solicitacoes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredFerias.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma solicitação encontrada</p>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre um novo período de férias ou altere os filtros acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Funcionário</th>
                  <th className="py-3.5 px-4">Período de Férias</th>
                  <th className="py-3.5 px-4">Duração</th>
                  <th className="py-3.5 px-4">Data Retorno</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFerias.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {item.funcionario?.nome_completo
                            ? item.funcionario.nome_completo.substring(0, 2).toUpperCase()
                            : 'RH'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.funcionario?.nome_completo || 'Colaborador não identificado'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.funcionario?.cargo} • {item.funcionario?.departamento} ({item.funcionario?.matricula})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {formatDate(item.data_inicio)} até {formatDate(item.data_fim)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Solicitado em {formatDate(item.created_at?.split('T')[0] || '')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {item.quantidade_dias} dias
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatDate(item.data_retorno)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        {getStatusBadge(item.status)}
                        {item.motivo_recusa && (
                          <span
                            title={item.motivo_recusa}
                            className="block text-[10px] text-rose-600 mt-1 truncate max-w-xs italic"
                          >
                            Motivo: {item.motivo_recusa}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'Pendente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(item)}
                              title="Aprovar Férias"
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingFerias(item);
                                setRejectionReasonInput('');
                              }}
                              title="Recusar Férias com Justificativa"
                              className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Recusar</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingFerias(item)}
                          title="Visualizar Comprovante"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Editar Férias"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(item)}
                          title="Excluir Registro"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* MODAL: Criar / Editar Solicitação de Férias */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingFerias ? 'Editar Solicitação de Férias' : 'Registrar Solicitação de Férias'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {overlapWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{overlapWarning}</span>
                </div>
              )}

              {/* Funcionário Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Funcionário *
                </label>
                <select
                  required
                  value={formFuncionarioId}
                  onChange={(e) => setFormFuncionarioId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="">Selecione o colaborador...</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome_completo} — {f.cargo} ({f.departamento} | {f.matricula})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Início das Férias *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataInicio}
                    onChange={(e) => setFormDataInicio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataFim}
                    onChange={(e) => setFormDataFim(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Auto Calculations Card (Required by prompt) */}
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-blue-700 font-semibold block uppercase">
                    Quantidade de Dias (Cálculo Automático)
                  </span>
                  <span className="text-xl font-extrabold text-blue-900">
                    {calculatedDays > 0 ? `${calculatedDays} dias corridos` : '0 dias'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 font-semibold block uppercase">
                    Data de Retorno ao Trabalho
                  </span>
                  <span className="text-xl font-extrabold text-blue-900">
                    {calculatedReturnDate ? formatDate(calculatedReturnDate) : '-'}
                  </span>
                </div>
              </div>

              {/* Status Selector (when editing) */}
              {editingFerias && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Solicitação
                  </label>
                  <select
                    value={editingFerias.status}
                    onChange={(e) =>
                      setEditingFerias({ ...editingFerias, status: e.target.value as FeriasStatus })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovada">Aprovada</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Recusada">Recusada</option>
                  </select>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Justificativa
                </label>
                <textarea
                  rows={3}
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Ex: Fracionamento aprovado em acordo individual de trabalho..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Recusar Solicitação (com Informação do Motivo da Recusa) */}
      {rejectingFerias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Recusar Solicitação de Férias
            </h3>
            <p className="text-xs text-slate-600 mt-2 text-center">
              Você está recusando as férias de{' '}
              <strong>{rejectingFerias.funcionario?.nome_completo}</strong> (
              {formatDate(rejectingFerias.data_inicio)} a {formatDate(rejectingFerias.data_fim)}).
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Motivo da Recusa * (Obrigatório)
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Informe a justificativa do RH para o cancelamento/recusa deste período (ex: conflito com escala de plantão, período de auditoria interna)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingFerias(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !rejectionReasonInput.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Visualizar Ficha / Recibo da Solicitação */}
      {viewingFerias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Comprovante de Solicitação de Férias
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingFerias(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Colaborador:</span>
                  <span className="font-bold text-slate-900">
                    {viewingFerias.funcionario?.nome_completo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Matrícula:</span>
                  <span className="font-mono text-slate-800">
                    {viewingFerias.funcionario?.matricula}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Departamento / Cargo:</span>
                  <span className="text-slate-800">
                    {viewingFerias.funcionario?.departamento} • {viewingFerias.funcionario?.cargo}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">Início das Férias</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDate(viewingFerias.data_inicio)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">Término das Férias</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDate(viewingFerias.data_fim)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">Total de Dias</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingFerias.quantidade_dias} dias corridos
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">Retorno Efetivo</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDate(viewingFerias.data_retorno)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-semibold">Status no RH:</span>
                <div>{getStatusBadge(viewingFerias.status)}</div>
              </div>

              {viewingFerias.observacoes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-400 block font-semibold">Observações</span>
                  <p className="text-slate-700 mt-0.5">{viewingFerias.observacoes}</p>
                </div>
              )}

              {viewingFerias.motivo_recusa && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-700 block font-semibold">
                    Motivo do Cancelamento / Recusa
                  </span>
                  <p className="text-rose-900 mt-0.5 font-medium">{viewingFerias.motivo_recusa}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprovante</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingFerias(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Excluir Registro de Férias */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Solicitação de Férias</h3>
            <p className="text-xs text-slate-600 mt-2">
              Deseja realmente remover o registro de férias de{' '}
              <strong>{deleteCandidate.funcionario?.nome_completo}</strong> ({deleteCandidate.quantidade_dias} dias)?
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Excluindo...' : 'Excluir Solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
