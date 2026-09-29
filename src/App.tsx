/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveTab, Funcionario, Ferias, FeriasStatus } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { DashboardView } from './components/dashboard/DashboardView';
import { FuncionariosView } from './components/funcionarios/FuncionariosView';
import { SolicitacoesView } from './components/ferias/SolicitacoesView';
import { CalendarioView } from './components/calendario/CalendarioView';
import { HistoricoView } from './components/historico/HistoricoView';
import { ToastContainer, ToastMessage, ToastType } from './components/common/Toast';
import {
  fetchFuncionarios,
  fetchSolicitacoesFerias,
  saveFuncionario,
  removeFuncionario,
  saveSolicitacaoFerias,
  updateStatusFerias,
  removeSolicitacaoFerias,
} from './services/dataService';
import { X, FileCheck2, Printer, Check, XCircle } from 'lucide-react';

function MainApp() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // Application Data state
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Preselection trigger when creating vacation from employee profile
  const [preselectedFuncionarioId, setPreselectedFuncionarioId] = useState<string | null>(null);

  // Quick Global View / Modal for vacation item
  const [viewingFerias, setViewingFerias] = useState<Ferias | null>(null);
  const [rejectingFerias, setRejectingFerias] = useState<Ferias | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = 'toast-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, type, title, description }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load all employees and vacations
  const reloadData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [funcs, vacs] = await Promise.all([
        fetchFuncionarios(),
        fetchSolicitacoesFerias(),
      ]);
      setFuncionarios(funcs);
      setFerias(vacs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      addToast('error', 'Erro ao carregar dados', 'Verifique a conexão com o banco de dados.');
    } finally {
      setIsDataLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user) {
      reloadData();
    }
  }, [user, reloadData]);

  // Operations: Funcionarios
  const handleSaveFuncionario = async (data: Partial<Funcionario>) => {
    try {
      const saved = await saveFuncionario(data);
      // Immediately reflect in state so it never disappears from UI
      setFuncionarios((prev) => {
        const index = prev.findIndex((f) => f.id === saved.id || f.cpf === saved.cpf);
        if (index !== -1) {
          const next = [...prev];
          next[index] = saved;
          return next;
        }
        return [saved, ...prev];
      });

      addToast(
        'success',
        data.id ? 'Funcionário Atualizado' : 'Funcionário Cadastrado',
        `${saved.nome_completo} foi salvo com sucesso!`
      );
      await reloadData();
    } catch {
      addToast('error', 'Falha ao salvar', 'Não foi possível salvar os dados do funcionário.');
    }
  };

  const handleDeleteFuncionario = async (id: string) => {
    try {
      await removeFuncionario(id);
      setFuncionarios((prev) => prev.filter((f) => f.id !== id));
      setFerias((prev) => prev.filter((f) => f.funcionario_id !== id));
      addToast('info', 'Funcionário Excluído', 'O cadastro e histórico foram removidos.');
      await reloadData();
    } catch {
      addToast('error', 'Erro ao excluir', 'Não foi possível excluir o funcionário.');
    }
  };

  // Operations: Férias
  const handleSaveFerias = async (data: Partial<Ferias>) => {
    try {
      const saved = await saveSolicitacaoFerias(data);
      setFerias((prev) => {
        const index = prev.findIndex((f) => f.id === saved.id);
        if (index !== -1) {
          const next = [...prev];
          next[index] = saved;
          return next;
        }
        return [saved, ...prev];
      });

      addToast(
        'success',
        data.id ? 'Solicitação Atualizada' : 'Férias Registradas',
        'O período de férias foi processado com sucesso.'
      );
      await reloadData();
    } catch {
      addToast('error', 'Erro ao registrar férias', 'Tente novamente mais tarde.');
    }
  };

  const handleUpdateStatus = async (id: string, status: FeriasStatus, motivo?: string) => {
    try {
      await updateStatusFerias(id, status, motivo);
      if (status === 'Aprovada') {
        addToast('success', 'Férias Aprovadas!', 'A solicitação foi aprovada com sucesso.');
      } else if (status === 'Recusada') {
        addToast('info', 'Solicitação Recusada', 'O motivo foi registrado no histórico.');
      } else {
        addToast('success', 'Status Atualizado', `Novo status: ${status}`);
      }
      await reloadData();
    } catch {
      addToast('error', 'Erro ao alterar status', 'Não foi possível atualizar o status da solicitação.');
    }
  };

  const handleDeleteFerias = async (id: string) => {
    try {
      await removeSolicitacaoFerias(id);
      addToast('info', 'Solicitação Removida', 'O registro foi excluído com sucesso.');
      await reloadData();
    } catch {
      addToast('error', 'Erro ao excluir solicitação');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingFerias || !rejectionReasonInput.trim()) return;
    await handleUpdateStatus(rejectingFerias.id, 'Recusada', rejectionReasonInput.trim());
    setRejectingFerias(null);
    setRejectionReasonInput('');
  };

  // If Auth is initializing
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Carregando Sistema de Solicitação de Férias...
        </p>
      </div>
    );
  }

  // Not authenticated: Show Login or Register View
  if (!user) {
    return (
      <>
        {authScreen === 'login' ? (
          <LoginView onSwitchToRegister={() => setAuthScreen('register')} />
        ) : (
          <RegisterView onSwitchToLogin={() => setAuthScreen('login')} />
        )}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // Count pending vacation requests
  const pendingCount = ferias.filter((f) => f.status === 'Pendente').length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Corporate Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewSolicitacao={() => setActiveTab('solicitacoes')}
          onNewFuncionario={() => setActiveTab('funcionarios')}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isDataLoading && (
            <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                <span>Sincronizando dados com o banco de dados...</span>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              funcionarios={funcionarios}
              ferias={ferias}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNovaSolicitacao={() => setActiveTab('solicitacoes')}
              onOpenNovoFuncionario={() => setActiveTab('funcionarios')}
              onApproveFerias={(item) => handleUpdateStatus(item.id, 'Aprovada')}
              onRejectFerias={(item) => {
                setRejectingFerias(item);
                setRejectionReasonInput('');
              }}
              onViewFerias={(item) => setViewingFerias(item)}
            />
          )}

          {activeTab === 'funcionarios' && (
            <FuncionariosView
              funcionarios={funcionarios}
              ferias={ferias}
              onSaveFuncionario={handleSaveFuncionario}
              onDeleteFuncionario={handleDeleteFuncionario}
              onOpenNovaSolicitacaoForFuncionario={(funcId) => {
                setPreselectedFuncionarioId(funcId);
                setActiveTab('solicitacoes');
              }}
            />
          )}

          {activeTab === 'solicitacoes' && (
            <SolicitacoesView
              ferias={ferias}
              funcionarios={funcionarios}
              preselectedFuncionarioId={preselectedFuncionarioId}
              onClearPreselectedFuncionarioId={() => setPreselectedFuncionarioId(null)}
              onSaveFerias={handleSaveFerias}
              onUpdateStatus={handleUpdateStatus}
              onDeleteFerias={handleDeleteFerias}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarioView
              ferias={ferias}
              onViewFerias={(item) => setViewingFerias(item)}
            />
          )}

          {activeTab === 'historico' && (
            <HistoricoView
              ferias={ferias}
              funcionarios={funcionarios}
              onViewFerias={(item) => setViewingFerias(item)}
            />
          )}
        </main>
      </div>

      {/* GLOBAL MODAL: Visualizar Detalhes da Solicitação de Férias */}
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
                    {viewingFerias.funcionario?.nome_completo || 'Colaborador'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Matrícula:</span>
                  <span className="font-mono text-slate-800">
                    {viewingFerias.funcionario?.matricula || '-'}
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
                  <span className="text-[11px] text-blue-700 block font-semibold">
                    Início das Férias
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingFerias.data_inicio}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">
                    Término das Férias
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{viewingFerias.data_fim}</span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">
                    Total de Dias
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingFerias.quantidade_dias} dias corridos
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-blue-700 block font-semibold">
                    Retorno Efetivo
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingFerias.data_retorno}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-semibold">Status no RH:</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                  {viewingFerias.status}
                </span>
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
                    Motivo da Recusa
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
                <span>Imprimir</span>
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

      {/* GLOBAL MODAL: Recusar com Motivo */}
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
              Informe a justificativa do RH para a recusa de férias de{' '}
              <strong>{rejectingFerias.funcionario?.nome_completo}</strong>:
            </p>

            <div className="mt-4">
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Ex: Conflito com fechamento contábil trimestral ou escala de cobertura da área..."
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
                disabled={!rejectionReasonInput.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
