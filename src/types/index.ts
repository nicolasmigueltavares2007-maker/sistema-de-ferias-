export type UserRole = 'rh_admin' | 'rh_analyst' | 'colaborador';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export type FuncionarioStatus = 'Ativo' | 'Em Férias' | 'Afastado' | 'Inativo';

export interface Funcionario {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  data_admissao: string;
  matricula: string;
  status: FuncionarioStatus;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export type FeriasStatus = 'Pendente' | 'Aprovada' | 'Recusada' | 'Em andamento' | 'Concluída';

export interface Ferias {
  id: string;
  funcionario_id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  quantidade_dias: number;
  data_retorno: string; // YYYY-MM-DD
  status: FeriasStatus;
  observacoes?: string;
  motivo_recusa?: string;
  criado_por?: string;
  created_at?: string;
  updated_at?: string;
  funcionario?: Funcionario;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}

export type ActiveTab = 'dashboard' | 'funcionarios' | 'solicitacoes' | 'calendario' | 'historico';
