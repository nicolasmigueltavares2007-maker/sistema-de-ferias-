export const SUPABASE_SQL_SCRIPT = `-- ================================================================
-- SISTEMA DE SOLICITAÇÃO DE FÉRIAS (RH)
-- Script de Configuração do Banco de Dados Supabase (PostgreSQL)
-- Copie e execute este script no "SQL Editor" do seu painel Supabase
-- ================================================================

-- 1. Habilitar extensão UUID caso não esteja ativa
create extension if not exists "uuid-ossp";

-- 2. Tabela de Perfis de Usuários do RH (profiles)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null unique,
  role text not null default 'rh_admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Funcionários (funcionarios)
create table if not exists public.funcionarios (
  id uuid default gen_random_uuid() primary key,
  nome_completo text not null,
  cpf text not null unique,
  email text not null,
  telefone text not null,
  cargo text not null,
  departamento text not null,
  data_admissao date not null,
  matricula text not null unique,
  status text not null default 'Ativo' check (status in ('Ativo', 'Em Férias', 'Afastado', 'Inativo')),
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Solicitações de Férias (ferias)
create table if not exists public.ferias (
  id uuid default gen_random_uuid() primary key,
  funcionario_id uuid references public.funcionarios(id) on delete cascade not null,
  data_inicio date not null,
  data_fim date not null,
  quantidade_dias integer not null check (quantidade_dias > 0),
  data_retorno date not null,
  status text not null default 'Pendente' check (status in ('Pendente', 'Aprovada', 'Recusada', 'Em andamento', 'Concluída')),
  observacoes text,
  motivo_recusa text,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Índices para performance
create index if not exists idx_funcionarios_departamento on public.funcionarios(departamento);
create index if not exists idx_funcionarios_status on public.funcionarios(status);
create index if not exists idx_ferias_funcionario on public.ferias(funcionario_id);
create index if not exists idx_ferias_status on public.ferias(status);
create index if not exists idx_ferias_datas on public.ferias(data_inicio, data_fim);

-- 6. Habilitar Segurança por Linha (RLS - Row Level Security)
alter table public.profiles enable row level security;
alter table public.funcionarios enable row level security;
alter table public.ferias enable row level security;

-- Políticas de RLS para Profiles
drop policy if exists "Perfis são visíveis por usuários autenticados" on public.profiles;
create policy "Perfis são visíveis por usuários autenticados"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Permitir inserção de perfil no cadastro" on public.profiles;
create policy "Permitir inserção de perfil no cadastro"
  on public.profiles for insert
  to authenticated
  with check (true);

-- Políticas de RLS para Funcionários (acesso irrestrito para equipe de RH autenticada)
drop policy if exists "Equipe de RH pode visualizar funcionários" on public.funcionarios;
create policy "Equipe de RH pode visualizar funcionários"
  on public.funcionarios for select
  to authenticated
  using (true);

drop policy if exists "Equipe de RH pode cadastrar funcionários" on public.funcionarios;
create policy "Equipe de RH pode cadastrar funcionários"
  on public.funcionarios for insert
  to authenticated
  with check (true);

drop policy if exists "Equipe de RH pode atualizar funcionários" on public.funcionarios;
create policy "Equipe de RH pode atualizar funcionários"
  on public.funcionarios for update
  to authenticated
  using (true);

drop policy if exists "Equipe de RH pode excluir funcionários" on public.funcionarios;
create policy "Equipe de RH pode excluir funcionários"
  on public.funcionarios for delete
  to authenticated
  using (true);

-- Políticas de RLS para Férias (acesso irrestrito para equipe de RH autenticada)
drop policy if exists "Equipe de RH pode visualizar solicitações de férias" on public.ferias;
create policy "Equipe de RH pode visualizar solicitações de férias"
  on public.ferias for select
  to authenticated
  using (true);

drop policy if exists "Equipe de RH pode criar solicitações de férias" on public.ferias;
create policy "Equipe de RH pode criar solicitações de férias"
  on public.ferias for insert
  to authenticated
  with check (true);

drop policy if exists "Equipe de RH pode atualizar solicitações de férias" on public.ferias;
create policy "Equipe de RH pode atualizar solicitações de férias"
  on public.ferias for update
  to authenticated
  using (true);

drop policy if exists "Equipe de RH pode excluir solicitações de férias" on public.ferias;
create policy "Equipe de RH pode excluir solicitações de férias"
  on public.ferias for delete
  to authenticated
  using (true);

-- 7. Trigger automático para criar Perfil ao cadastrar novo usuário na auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    'rh_admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Dados iniciais de demonstração (Opcional - execute se quiser popular a base)
-- Inserir funcionários de teste
insert into public.funcionarios (nome_completo, cpf, email, telefone, cargo, departamento, data_admissao, matricula, status, observacoes)
values
  ('Mariana Castro Silveira', '123.456.789-01', 'mariana.silveira@empresa.com.br', '(11) 98765-4321', 'Desenvolvedora Sênior', 'Tecnologia', '2022-03-15', 'MAT-1001', 'Ativo', 'Excelente desempenho técnico'),
  ('Lucas Ribeiro Santos', '234.567.890-12', 'lucas.santos@empresa.com.br', '(11) 97654-3210', 'Analista Financeiro Pleno', 'Financeiro', '2021-08-10', 'MAT-1002', 'Ativo', 'Período aquisitivo completo'),
  ('Camila Albuquerque', '345.678.901-23', 'camila.albuquerque@empresa.com.br', '(21) 96543-2109', 'Gerente de Recursos Humanos', 'Recursos Humanos', '2020-01-20', 'MAT-1003', 'Ativo', 'Responsável pela gestão da equipe'),
  ('Rodrigo Morales Neto', '456.789.012-34', 'rodrigo.morales@empresa.com.br', '(31) 95432-1098', 'Designer UX/UI', 'Marketing', '2023-05-02', 'MAT-1004', 'Em Férias', 'Aproveitamento de saldo de 2024'),
  ('Fernanda Vasconcelos', '567.890.123-45', 'fernanda.vasconcelos@empresa.com.br', '(41) 94321-0987', 'Coordenadora de Operações', 'Operações', '2019-11-04', 'MAT-1005', 'Ativo', 'Elegível para férias')
on conflict (cpf) do nothing;
`;
