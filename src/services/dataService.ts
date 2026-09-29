import { Funcionario, Ferias, FeriasStatus } from '../types';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_FUNCIONARIOS = 'rh_ferias_funcionarios_v1';
const STORAGE_FERIAS = 'rh_ferias_solicitacoes_v1';

// Initial realistic corporate Brazilian sample data
const INITIAL_FUNCIONARIOS: Funcionario[] = [
  {
    id: 'f101-mariana-castro',
    nome_completo: 'Mariana Castro Silveira',
    cpf: '123.456.789-01',
    email: 'mariana.silveira@empresa.com.br',
    telefone: '(11) 98765-4321',
    cargo: 'Desenvolvedora Sênior',
    departamento: 'Tecnologia',
    data_admissao: '2022-03-15',
    matricula: 'MAT-1001',
    status: 'Ativo',
    observacoes: 'Líder da equipe de front-end. Período aquisitivo completo.',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'f102-lucas-ribeiro',
    nome_completo: 'Lucas Ribeiro Santos',
    cpf: '234.567.890-12',
    email: 'lucas.santos@empresa.com.br',
    telefone: '(11) 97654-3210',
    cargo: 'Analista Financeiro Pleno',
    departamento: 'Financeiro',
    data_admissao: '2021-08-10',
    matricula: 'MAT-1002',
    status: 'Ativo',
    observacoes: 'Responsável pelo fechamento contábil e orçamentos.',
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: 'f103-camila-albuquerque',
    nome_completo: 'Camila Albuquerque Maia',
    cpf: '345.678.901-23',
    email: 'camila.albuquerque@empresa.com.br',
    telefone: '(21) 96543-2109',
    cargo: 'Especialista em RH',
    departamento: 'Recursos Humanos',
    data_admissao: '2020-01-20',
    matricula: 'MAT-1003',
    status: 'Ativo',
    observacoes: 'Coordenação de benefícios, clima e admissão.',
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 200 * 86400000).toISOString(),
  },
  {
    id: 'f104-rodrigo-morales',
    nome_completo: 'Rodrigo Morales Neto',
    cpf: '456.789.012-34',
    email: 'rodrigo.morales@empresa.com.br',
    telefone: '(31) 95432-1098',
    cargo: 'Designer UX/UI',
    departamento: 'Marketing',
    data_admissao: '2023-05-02',
    matricula: 'MAT-1004',
    status: 'Em Férias',
    observacoes: 'Em gozo de férias regulamentares autorizadas pelo RH.',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'f105-fernanda-vasconcelos',
    nome_completo: 'Fernanda Vasconcelos Lima',
    cpf: '567.890.123-45',
    email: 'fernanda.vasconcelos@empresa.com.br',
    telefone: '(41) 94321-0987',
    cargo: 'Coordenadora de Operações',
    departamento: 'Operações',
    data_admissao: '2019-11-04',
    matricula: 'MAT-1005',
    status: 'Ativo',
    observacoes: 'Gestão de processos de logística e contratos operacionais.',
    created_at: new Date(Date.now() - 300 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 300 * 86400000).toISOString(),
  },
  {
    id: 'f106-andre-costa',
    nome_completo: 'André Costa Barreto',
    cpf: '678.901.234-56',
    email: 'andre.costa@empresa.com.br',
    telefone: '(11) 93210-9876',
    cargo: 'Engenheiro de Dados',
    departamento: 'Tecnologia',
    data_admissao: '2022-09-12',
    matricula: 'MAT-1006',
    status: 'Ativo',
    observacoes: 'Infraestrutura de dados e pipelines de relatórios.',
    created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 150 * 86400000).toISOString(),
  },
];

// Dynamically generate dates relative to current date for realistic experience
const getRelativeDateStr = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const INITIAL_FERIAS: Ferias[] = [
  {
    id: 'fer-01',
    funcionario_id: 'f104-rodrigo-morales',
    data_inicio: getRelativeDateStr(-5),
    data_fim: getRelativeDateStr(10),
    quantidade_dias: 16,
    data_retorno: getRelativeDateStr(11),
    status: 'Em andamento',
    observacoes: 'Férias regulares do período aquisitivo 2024/2025.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fer-02',
    funcionario_id: 'f101-mariana-castro',
    data_inicio: getRelativeDateStr(15),
    data_fim: getRelativeDateStr(29),
    quantidade_dias: 15,
    data_retorno: getRelativeDateStr(30),
    status: 'Pendente',
    observacoes: 'Primeira fração de 15 dias. Cobertura alinhada com time de desenvolvimento.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'fer-03',
    funcionario_id: 'f102-lucas-ribeiro',
    data_inicio: getRelativeDateStr(25),
    data_fim: getRelativeDateStr(39),
    quantidade_dias: 15,
    data_retorno: getRelativeDateStr(40),
    status: 'Aprovada',
    observacoes: 'Aprovado pelo gestor imediato. Balanço trimestral já antecipado.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'fer-04',
    funcionario_id: 'f105-fernanda-vasconcelos',
    data_inicio: getRelativeDateStr(-40),
    data_fim: getRelativeDateStr(-21),
    quantidade_dias: 20,
    data_retorno: getRelativeDateStr(-20),
    status: 'Concluída',
    observacoes: 'Férias cumpridas integralmente.',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'fer-05',
    funcionario_id: 'f106-andre-costa',
    data_inicio: getRelativeDateStr(35),
    data_fim: getRelativeDateStr(44),
    quantidade_dias: 10,
    data_retorno: getRelativeDateStr(45),
    status: 'Pendente',
    observacoes: 'Abono pecuniário e recesso de 10 dias.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fer-06',
    funcionario_id: 'f103-camila-albuquerque',
    data_inicio: getRelativeDateStr(-60),
    data_fim: getRelativeDateStr(-51),
    quantidade_dias: 10,
    data_retorno: getRelativeDateStr(-50),
    status: 'Recusada',
    observacoes: 'Solicitação em período de auditoria interna.',
    motivo_recusa: 'Período coincide com auditoria de conformidade anual do setor de RH. Reagendar para o próximo mês.',
    created_at: new Date(Date.now() - 70 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 65 * 86400000).toISOString(),
  },
];

// Helper to generate a valid UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to calculate days between dates inclusive
export function calculateVacationDays(dataInicio: string, dataFim: string): number {
  if (!dataInicio || !dataFim) return 0;
  const start = new Date(dataInicio + 'T00:00:00');
  const end = new Date(dataFim + 'T00:00:00');
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Helper to calculate return date (the next day after end date, skipping weekends)
export function calculateReturnDate(dataFim: string): string {
  if (!dataFim) return '';
  const end = new Date(dataFim + 'T00:00:00');
  const ret = new Date(end);
  ret.setDate(ret.getDate() + 1);

  // If Sunday (0), return Monday (+1)
  if (ret.getDay() === 0) {
    ret.setDate(ret.getDate() + 1);
  }
  // If Saturday (6), return Monday (+2)
  else if (ret.getDay() === 6) {
    ret.setDate(ret.getDate() + 2);
  }

  return ret.toISOString().split('T')[0];
}

// Local storage management helpers
function getLocalFuncionarios(): Funcionario[] {
  if (typeof window === 'undefined') return INITIAL_FUNCIONARIOS;
  const data = localStorage.getItem(STORAGE_FUNCIONARIOS);
  if (!data) {
    localStorage.setItem(STORAGE_FUNCIONARIOS, JSON.stringify(INITIAL_FUNCIONARIOS));
    return INITIAL_FUNCIONARIOS;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FUNCIONARIOS;
  } catch {
    return INITIAL_FUNCIONARIOS;
  }
}

function saveLocalFuncionarios(funcionarios: Funcionario[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_FUNCIONARIOS, JSON.stringify(funcionarios));
  }
}

function getLocalFerias(): Ferias[] {
  if (typeof window === 'undefined') return INITIAL_FERIAS;
  const data = localStorage.getItem(STORAGE_FERIAS);
  if (!data) {
    localStorage.setItem(STORAGE_FERIAS, JSON.stringify(INITIAL_FERIAS));
    return INITIAL_FERIAS;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FERIAS;
  } catch {
    return INITIAL_FERIAS;
  }
}

function saveLocalFerias(ferias: Ferias[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_FERIAS, JSON.stringify(ferias));
  }
}

export function resetDemoData(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_FUNCIONARIOS, JSON.stringify(INITIAL_FUNCIONARIOS));
    localStorage.setItem(STORAGE_FERIAS, JSON.stringify(INITIAL_FERIAS));
  }
}

// -------------------------------------------------------------
// Database API: Seamlessly integrates Supabase with LocalStorage
// ensuring that created data is ALWAYS saved and NEVER disappears!
// -------------------------------------------------------------

export async function fetchFuncionarios(): Promise<Funcionario[]> {
  const localList = getLocalFuncionarios();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome_completo', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        // Merge Supabase employees with any newly created local employees
        const mergedMap = new Map<string, Funcionario>();

        // Add Supabase items
        for (const item of (data as Funcionario[])) {
          mergedMap.set(item.id, item);
        }

        // Add local items not yet in Supabase (or matching CPF)
        for (const localItem of localList) {
          const existsByCpf = Array.from(mergedMap.values()).some(
            (m) => m.cpf.replace(/\D/g, '') === localItem.cpf.replace(/\D/g, '')
          );
          if (!mergedMap.has(localItem.id) && !existsByCpf) {
            mergedMap.set(localItem.id, localItem);
          }
        }

        const mergedList = Array.from(mergedMap.values());
        saveLocalFuncionarios(mergedList);
        return mergedList;
      }
    } catch (err) {
      console.warn('Supabase network error, mantendo base local:', err);
    }
  }

  return localList;
}

export async function saveFuncionario(funcionario: Partial<Funcionario>): Promise<Funcionario> {
  const now = new Date().toISOString();
  const list = getLocalFuncionarios();

  // 1. Determine or generate a valid UUID
  const id = funcionario.id || generateUUID();

  let targetFuncionario: Funcionario;

  if (funcionario.id) {
    const index = list.findIndex((f) => f.id === funcionario.id);
    if (index !== -1) {
      targetFuncionario = {
        ...list[index],
        ...funcionario,
        updated_at: now,
      } as Funcionario;
      list[index] = targetFuncionario;
    } else {
      targetFuncionario = {
        id,
        nome_completo: funcionario.nome_completo || '',
        cpf: funcionario.cpf || '',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        cargo: funcionario.cargo || '',
        departamento: funcionario.departamento || 'Geral',
        data_admissao: funcionario.data_admissao || new Date().toISOString().split('T')[0],
        matricula: funcionario.matricula || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
        status: funcionario.status || 'Ativo',
        observacoes: funcionario.observacoes || '',
        created_at: now,
        updated_at: now,
      };
      list.unshift(targetFuncionario);
    }
  } else {
    targetFuncionario = {
      id,
      nome_completo: funcionario.nome_completo || '',
      cpf: funcionario.cpf || '',
      email: funcionario.email || '',
      telefone: funcionario.telefone || '',
      cargo: funcionario.cargo || '',
      departamento: funcionario.departamento || 'Geral',
      data_admissao: funcionario.data_admissao || new Date().toISOString().split('T')[0],
      matricula: funcionario.matricula || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: funcionario.status || 'Ativo',
      observacoes: funcionario.observacoes || '',
      created_at: now,
      updated_at: now,
    };
    list.unshift(targetFuncionario);
  }

  // 2. CRUCIAL: ALWAYS persist to local storage immediately so it NEVER vanishes!
  saveLocalFuncionarios(list);

  // 3. Attempt sync to Supabase if client is active
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload: Record<string, unknown> = {
        nome_completo: targetFuncionario.nome_completo,
        cpf: targetFuncionario.cpf,
        email: targetFuncionario.email,
        telefone: targetFuncionario.telefone,
        cargo: targetFuncionario.cargo,
        departamento: targetFuncionario.departamento,
        data_admissao: targetFuncionario.data_admissao,
        matricula: targetFuncionario.matricula,
        status: targetFuncionario.status,
        observacoes: targetFuncionario.observacoes,
        updated_at: now,
      };

      // Only include id if it's a valid standard UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetFuncionario.id);
      if (isUuid) {
        payload.id = targetFuncionario.id;
      }

      const { data, error } = await supabase
        .from('funcionarios')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        const updatedList = getLocalFuncionarios();
        const idx = updatedList.findIndex((f) => f.id === targetFuncionario.id || f.cpf === targetFuncionario.cpf);
        if (idx !== -1) {
          updatedList[idx] = data as Funcionario;
          saveLocalFuncionarios(updatedList);
        }
        return data as Funcionario;
      } else if (error) {
        console.warn('Aviso: Supabase não conseguiu gravar (mantido em armazenamento local seguro):', error.message);
      }
    } catch (err) {
      console.warn('Erro na comunicação com Supabase (mantido em armazenamento local):', err);
    }
  }

  return targetFuncionario;
}

export async function removeFuncionario(id: string): Promise<boolean> {
  // Always remove locally first
  const list = getLocalFuncionarios();
  const filtered = list.filter((f) => f.id !== id);
  saveLocalFuncionarios(filtered);

  // Cascade delete vacations for this employee locally
  const ferias = getLocalFerias();
  saveLocalFerias(ferias.filter((v) => v.funcionario_id !== id));

  // Sync delete to Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('funcionarios').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }

  return true;
}

export async function fetchSolicitacoesFerias(): Promise<Ferias[]> {
  const localFerias = getLocalFerias();
  const supabase = getSupabaseClient();

  let mergedFerias = localFerias;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ferias')
        .select(`
          *,
          funcionario:funcionarios (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const feriasMap = new Map<string, Ferias>();

        for (const item of (data as Ferias[])) {
          feriasMap.set(item.id, item);
        }

        for (const localItem of localFerias) {
          if (!feriasMap.has(localItem.id)) {
            feriasMap.set(localItem.id, localItem);
          }
        }

        mergedFerias = Array.from(feriasMap.values());
        saveLocalFerias(mergedFerias);
      }
    } catch (err) {
      console.warn('Supabase error ao buscar férias:', err);
    }
  }

  const funcionarios = await fetchFuncionarios();
  const funcMap = new Map<string, Funcionario>();
  funcionarios.forEach((f) => funcMap.set(f.id, f));

  const enriched = mergedFerias.map((item) => ({
    ...item,
    funcionario: item.funcionario || funcMap.get(item.funcionario_id),
  }));

  return enriched.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
}

export async function checkVacationOverlap(
  funcionarioId: string,
  dataInicio: string,
  dataFim: string,
  excludeFeriasId?: string
): Promise<{ hasOverlap: boolean; conflictingRequest?: Ferias }> {
  const allFerias = await fetchSolicitacoesFerias();
  const targetStart = new Date(dataInicio + 'T00:00:00').getTime();
  const targetEnd = new Date(dataFim + 'T00:00:00').getTime();

  for (const f of allFerias) {
    if (f.funcionario_id === funcionarioId && f.id !== excludeFeriasId && f.status !== 'Recusada') {
      const fStart = new Date(f.data_inicio + 'T00:00:00').getTime();
      const fEnd = new Date(f.data_fim + 'T00:00:00').getTime();

      // Check overlap: (StartA <= EndB) and (EndA >= StartB)
      if (targetStart <= fEnd && targetEnd >= fStart) {
        return { hasOverlap: true, conflictingRequest: f };
      }
    }
  }

  return { hasOverlap: false };
}

export async function saveSolicitacaoFerias(feriasData: Partial<Ferias>): Promise<Ferias> {
  const now = new Date().toISOString();
  const dias = feriasData.quantidade_dias || calculateVacationDays(feriasData.data_inicio || '', feriasData.data_fim || '');
  const retorno = feriasData.data_retorno || calculateReturnDate(feriasData.data_fim || '');
  const id = feriasData.id || generateUUID();

  const list = getLocalFerias();
  let targetFerias: Ferias;

  if (feriasData.id) {
    const index = list.findIndex((f) => f.id === feriasData.id);
    if (index !== -1) {
      targetFerias = {
        ...list[index],
        ...feriasData,
        quantidade_dias: dias,
        data_retorno: retorno,
        updated_at: now,
      } as Ferias;
      list[index] = targetFerias;
    } else {
      targetFerias = {
        id,
        funcionario_id: feriasData.funcionario_id || '',
        data_inicio: feriasData.data_inicio || '',
        data_fim: feriasData.data_fim || '',
        quantidade_dias: dias,
        data_retorno: retorno,
        status: feriasData.status || 'Pendente',
        observacoes: feriasData.observacoes || '',
        motivo_recusa: feriasData.motivo_recusa,
        created_at: now,
        updated_at: now,
      };
      list.unshift(targetFerias);
    }
  } else {
    targetFerias = {
      id,
      funcionario_id: feriasData.funcionario_id || '',
      data_inicio: feriasData.data_inicio || '',
      data_fim: feriasData.data_fim || '',
      quantidade_dias: dias,
      data_retorno: retorno,
      status: feriasData.status || 'Pendente',
      observacoes: feriasData.observacoes || '',
      motivo_recusa: feriasData.motivo_recusa,
      created_at: now,
      updated_at: now,
    };
    list.unshift(targetFerias);
  }

  // Always save locally immediately
  saveLocalFerias(list);

  // Sync to Supabase if client is active
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload: Record<string, unknown> = {
        funcionario_id: targetFerias.funcionario_id,
        data_inicio: targetFerias.data_inicio,
        data_fim: targetFerias.data_fim,
        quantidade_dias: dias,
        data_retorno: retorno,
        status: targetFerias.status,
        observacoes: targetFerias.observacoes,
        motivo_recusa: targetFerias.motivo_recusa,
        updated_at: now,
      };

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetFerias.id);
      if (isUuid) {
        payload.id = targetFerias.id;
      }

      const { data, error } = await supabase
        .from('ferias')
        .upsert(payload)
        .select(`*, funcionario:funcionarios (*)`)
        .single();

      if (!error && data) {
        return data as Ferias;
      }
    } catch (err) {
      console.warn('Supabase save ferias fallback to local:', err);
    }
  }

  const funcs = getLocalFuncionarios();
  targetFerias.funcionario = funcs.find((f) => f.id === targetFerias.funcionario_id);
  return targetFerias;
}

export async function updateStatusFerias(
  id: string,
  newStatus: FeriasStatus,
  motivoRecusa?: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const list = getLocalFerias();
  const index = list.findIndex((f) => f.id === id);

  if (index !== -1) {
    list[index].status = newStatus;
    list[index].updated_at = now;
    if (motivoRecusa !== undefined) {
      list[index].motivo_recusa = motivoRecusa;
    }
    saveLocalFerias(list);

    // Update employee status according to vacation state
    const today = new Date().toISOString().split('T')[0];
    const vacation = list[index];
    const funcionarios = getLocalFuncionarios();
    const funcIndex = funcionarios.findIndex((f) => f.id === vacation.funcionario_id);

    if (funcIndex !== -1) {
      if (
        newStatus === 'Em andamento' ||
        (newStatus === 'Aprovada' && vacation.data_inicio <= today && vacation.data_fim >= today)
      ) {
        funcionarios[funcIndex].status = 'Em Férias';
      } else if (newStatus === 'Concluída' || newStatus === 'Recusada') {
        funcionarios[funcIndex].status = 'Ativo';
      }
      saveLocalFuncionarios(funcionarios);
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
      };
      if (motivoRecusa !== undefined) {
        updatePayload.motivo_recusa = motivoRecusa;
      }
      await supabase.from('ferias').update(updatePayload).eq('id', id);
    } catch (err) {
      console.warn('Supabase status update error:', err);
    }
  }

  return true;
}

export async function removeSolicitacaoFerias(id: string): Promise<boolean> {
  const list = getLocalFerias();
  saveLocalFerias(list.filter((f) => f.id !== id));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('ferias').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete ferias error:', err);
    }
  }

  return true;
}

export async function getDashboardStats(): Promise<{
  totalFuncionarios: number;
  solicitacoesPendentes: number;
  feriasAprovadas: number;
  feriasEmAndamento: number;
}> {
  const funcionarios = await fetchFuncionarios();
  const ferias = await fetchSolicitacoesFerias();

  const today = new Date().toISOString().split('T')[0];

  let pendentes = 0;
  let aprovadas = 0;
  let emAndamento = 0;

  for (const item of ferias) {
    const isOngoing =
      item.status === 'Em andamento' ||
      (item.status === 'Aprovada' && item.data_inicio <= today && item.data_fim >= today);

    if (item.status === 'Pendente') {
      pendentes++;
    } else if (isOngoing) {
      emAndamento++;
    } else if (item.status === 'Aprovada') {
      aprovadas++;
    }
  }

  return {
    totalFuncionarios: funcionarios.length,
    solicitacoesPendentes: pendentes,
    feriasAprovadas: aprovadas,
    feriasEmAndamento: emAndamento,
  };
}
