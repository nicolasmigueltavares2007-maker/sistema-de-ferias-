import React, { useState, useMemo } from 'react';
import { Funcionario, Ferias, FuncionarioStatus } from '../../types';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react';

interface FuncionariosViewProps {
  funcionarios: Funcionario[];
  ferias: Ferias[];
  onSaveFuncionario: (funcionario: Partial<Funcionario>) => Promise<void>;
  onDeleteFuncionario: (id: string) => Promise<void>;
  onOpenNovaSolicitacaoForFuncionario: (funcionarioId: string) => void;
}

export const FuncionariosView: React.FC<FuncionariosViewProps> = ({
  funcionarios,
  ferias,
  onSaveFuncionario,
  onDeleteFuncionario,
  onOpenNovaSolicitacaoForFuncionario,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('todos');
  const [selectedCargo, setSelectedCargo] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Partial<Funcionario> | null>(null);
  const [viewingFuncionario, setViewingFuncionario] = useState<Funcionario | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Funcionario | null>(null);

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formDepartamento, setFormDepartamento] = useState('Tecnologia');
  const [formDataAdmissao, setFormDataAdmissao] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formStatus, setFormStatus] = useState<FuncionarioStatus>('Ativo');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract distinct departments and cargos for filter dropdowns
  const departamentos = useMemo(() => {
    const set = new Set<string>();
    funcionarios.forEach((f) => {
      if (f.departamento) set.add(f.departamento);
    });
    return Array.from(set).sort();
  }, [funcionarios]);

  const cargos = useMemo(() => {
    const set = new Set<string>();
    funcionarios.forEach((f) => {
      if (f.cargo) set.add(f.cargo);
    });
    return Array.from(set).sort();
  }, [funcionarios]);

  // Mask CPF: 000.000.000-00
  const formatCPF = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Mask Phone: (00) 00000-0000
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const openCreateModal = () => {
    setEditingFuncionario(null);
    setFormNome('');
    setFormCpf('');
    setFormEmail('');
    setFormTelefone('');
    setFormCargo('');
    setFormDepartamento(departamentos[0] || 'Tecnologia');
    setFormDataAdmissao(new Date().toISOString().split('T')[0]);
    setFormMatricula(`MAT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormStatus('Ativo');
    setFormObservacoes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (f: Funcionario) => {
    setEditingFuncionario(f);
    setFormNome(f.nome_completo);
    setFormCpf(f.cpf);
    setFormEmail(f.email);
    setFormTelefone(f.telefone);
    setFormCargo(f.cargo);
    setFormDepartamento(f.departamento);
    setFormDataAdmissao(f.data_admissao);
    setFormMatricula(f.matricula);
    setFormStatus(f.status);
    setFormObservacoes(f.observacoes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNome.trim() || !formCpf.trim() || !formEmail.trim() || !formCargo.trim() || !formDepartamento.trim() || !formDataAdmissao || !formMatricula.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // CPF format check
    const cpfDigits = formCpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setFormError('CPF inválido. O CPF deve conter 11 dígitos.');
      return;
    }

    // Duplicity check for CPF & Matrícula
    const duplicateCpf = funcionarios.find(
      (f) => f.cpf.replace(/\D/g, '') === cpfDigits && f.id !== editingFuncionario?.id
    );
    if (duplicateCpf) {
      setFormError(`Já existe um funcionário cadastrado com este CPF (${duplicateCpf.nome_completo}).`);
      return;
    }

    const duplicateMat = funcionarios.find(
      (f) => f.matricula.trim().toUpperCase() === formMatricula.trim().toUpperCase() && f.id !== editingFuncionario?.id
    );
    if (duplicateMat) {
      setFormError(`Já existe um funcionário com esta matrícula (${duplicateMat.nome_completo}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveFuncionario({
        id: editingFuncionario?.id,
        nome_completo: formNome.trim(),
        cpf: formCpf.trim(),
        email: formEmail.trim(),
        telefone: formTelefone.trim(),
        cargo: formCargo.trim(),
        departamento: formDepartamento.trim(),
        data_admissao: formDataAdmissao,
        matricula: formMatricula.trim().toUpperCase(),
        status: formStatus,
        observacoes: formObservacoes.trim(),
      });
      // Clear filters so the new employee is immediately visible in the table
      setSearchTerm('');
      setSelectedDepartamento('todos');
      setSelectedCargo('todos');
      setSelectedStatus('todos');
      setIsModalOpen(false);
    } catch {
      setFormError('Ocorreu um erro ao salvar o funcionário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsSubmitting(true);
    try {
      await onDeleteFuncionario(deleteCandidate.id);
      setDeleteCandidate(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered employees
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter((f) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch =
        f.nome_completo.toLowerCase().includes(search) ||
        f.matricula.toLowerCase().includes(search) ||
        f.cpf.includes(search) ||
        f.email.toLowerCase().includes(search) ||
        f.cargo.toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Filter Dept
      if (selectedDepartamento !== 'todos' && f.departamento !== selectedDepartamento) {
        return false;
      }

      // Filter Cargo
      if (selectedCargo !== 'todos' && f.cargo !== selectedCargo) {
        return false;
      }

      // Filter Status
      if (selectedStatus !== 'todos' && f.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [funcionarios, searchTerm, selectedDepartamento, selectedCargo, selectedStatus]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: FuncionarioStatus) => {
    switch (status) {
      case 'Ativo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ativo
          </span>
        );
      case 'Em Férias':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Em Férias
          </span>
        );
      case 'Afastado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Afastado
          </span>
        );
      case 'Inativo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Inativo
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Quadro de Funcionários</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre, consulte e gerencie o histórico de colaboradores da organização
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Funcionário</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="md:col-span-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF ou matrícula..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Departamento */}
          <div>
            <select
              value={selectedDepartamento}
              onChange={(e) => setSelectedDepartamento(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos os Departamentos</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Cargo */}
          <div>
            <select
              value={selectedCargo}
              onChange={(e) => setSelectedCargo(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="todos">Todos os Cargos</option>
              {cargos.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              <option value="Ativo">Ativo</option>
              <option value="Em Férias">Em Férias</option>
              <option value="Afastado">Afastado</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong>{filteredFuncionarios.length}</strong> de {funcionarios.length} funcionários
          </span>
          {(searchTerm || selectedDepartamento !== 'todos' || selectedCargo !== 'todos' || selectedStatus !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartamento('todos');
                setSelectedCargo('todos');
                setSelectedStatus('todos');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Employees Table (Required by Prompt) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredFuncionarios.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Nenhum funcionário encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Verifique os filtros de pesquisa ou realize um novo cadastro.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Nome</th>
                  <th className="py-3.5 px-4">Matrícula</th>
                  <th className="py-3.5 px-4">Cargo</th>
                  <th className="py-3.5 px-4">Departamento</th>
                  <th className="py-3.5 px-4">Data Admissão</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFuncionarios.map((func) => (
                  <tr key={func.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-slate-200">
                          {func.nome_completo.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{func.nome_completo}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{func.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {func.matricula}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{func.cargo}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {func.departamento}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(func.data_admissao)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(func.status)}</td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingFuncionario(func)}
                          title="Visualizar Ficha e Histórico"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(func)}
                          title="Editar Funcionário"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(func)}
                          title="Excluir Funcionário"
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

      {/* MODAL: Criar / Editar Funcionário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome completo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Beatriz Lima Ramos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF (Cadastro de Pessoas Físicas) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={formCpf}
                    onChange={(e) => setFormCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Matrícula */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matrícula Funcional *
                  </label>
                  <input
                    type="text"
                    required
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    placeholder="Ex: MAT-1025"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="beatriz.ramos@empresa.com.br"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(formatPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Ex: Analista de Recursos Humanos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento *
                  </label>
                  <select
                    required
                    value={formDepartamento}
                    onChange={(e) => setFormDepartamento(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operações">Operações</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Jurídico">Jurídico</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>

                {/* Data de Admissão */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Admissão *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataAdmissao}
                    onChange={(e) => setFormDataAdmissao(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status do Funcionário *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as FuncionarioStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Férias">Em Férias</option>
                    <option value="Afastado">Afastado</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                {/* Observações */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Internas do RH
                  </label>
                  <textarea
                    rows={3}
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                    placeholder="Anotações sobre saldo de férias, acordos coletivos, histórico de período aquisitivo..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingFuncionario ? 'Salvar Alterações' : 'Cadastrar Funcionário'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualizar Funcionário & Histórico de Férias */}
      {viewingFuncionario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in duration-200">
            {/* Header with avatar */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white font-bold text-base flex items-center justify-center border border-white/20">
                  {viewingFuncionario.nome_completo.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {viewingFuncionario.nome_completo}
                  </h3>
                  <p className="text-xs text-blue-200">
                    {viewingFuncionario.cargo} • {viewingFuncionario.departamento}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingFuncionario(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Employee Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Matrícula</span>
                  <span className="font-mono font-bold text-slate-800">{viewingFuncionario.matricula}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">CPF</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingFuncionario.cpf}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Status</span>
                  <div className="mt-0.5">{getStatusBadge(viewingFuncionario.status)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Data de Admissão</span>
                  <span className="font-semibold text-slate-800">{formatDate(viewingFuncionario.data_admissao)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">E-mail</span>
                  <span className="font-semibold text-slate-800 truncate block">{viewingFuncionario.email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Telefone</span>
                  <span className="font-semibold text-slate-800">{viewingFuncionario.telefone || 'Não informado'}</span>
                </div>
                {viewingFuncionario.observacoes && (
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/70">
                    <span className="text-[11px] text-slate-400 block font-medium">Observações do RH</span>
                    <p className="text-slate-700 italic mt-0.5">{viewingFuncionario.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Vacation Records for this employee */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Histórico de Férias do Colaborador</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingFuncionario.id;
                      setViewingFuncionario(null);
                      onOpenNovaSolicitacaoForFuncionario(id);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Férias</span>
                  </button>
                </div>

                {(() => {
                  const empFerias = ferias.filter((f) => f.funcionario_id === viewingFuncionario.id);
                  if (empFerias.length === 0) {
                    return (
                      <div className="p-5 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                        Nenhum registro de férias para este colaborador ainda.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {empFerias.map((v) => (
                        <div
                          key={v.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {formatDate(v.data_inicio)} até {formatDate(v.data_fim)}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {v.quantidade_dias} dias • Retorno em {formatDate(v.data_retorno)}
                            </span>
                            {v.motivo_recusa && (
                              <p className="text-[11px] text-rose-600 mt-1">
                                Motivo da recusa: {v.motivo_recusa}
                              </p>
                            )}
                          </div>
                          <div>
                            {v.status === 'Pendente' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Pendente
                              </span>
                            )}
                            {v.status === 'Aprovada' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Aprovada
                              </span>
                            )}
                            {v.status === 'Em andamento' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                Em andamento
                              </span>
                            )}
                            {v.status === 'Recusada' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Recusada
                              </span>
                            )}
                            {v.status === 'Concluída' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Concluída
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewingFuncionario(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Exclusão (Required by prompt) */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirmar Exclusão de Funcionário</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Você tem certeza de que deseja excluir o cadastro de{' '}
              <strong>{deleteCandidate.nome_completo}</strong> (Matrícula: {deleteCandidate.matricula})?
            </p>
            <p className="text-[11px] text-rose-600 mt-2 font-medium bg-rose-50 p-2 rounded-lg border border-rose-150">
              Atenção: Todas as solicitações de férias associadas a este colaborador também serão excluídas do sistema.
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
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Excluindo...' : 'Sim, Excluir Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
