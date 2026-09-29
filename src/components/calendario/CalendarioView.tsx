import React, { useState, useMemo } from 'react';
import { Ferias } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  CalendarRange,
  Users,
  Eye,
  List,
  Grid3X3,
  Columns3,
  Building2,
} from 'lucide-react';

interface CalendarioViewProps {
  ferias: Ferias[];
  onViewFerias: (ferias: Ferias) => void;
}

type CalendarMode = 'mes' | 'semana' | 'lista';

export const CalendarioView: React.FC<CalendarioViewProps> = ({ ferias, onViewFerias }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarMode>('mes');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('todos');

  // Month information
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Filter ferias by department if selected
  const filteredFerias = useMemo(() => {
    return ferias.filter((f) => {
      if (f.status === 'Recusada') return false;
      if (selectedDeptFilter !== 'todos' && f.funcionario?.departamento !== selectedDeptFilter) {
        return false;
      }
      return true;
    });
  }, [ferias, selectedDeptFilter]);

  // Extract departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    ferias.forEach((f) => {
      if (f.funcionario?.departamento) set.add(f.funcionario.departamento);
    });
    return Array.from(set).sort();
  }, [ferias]);

  // Build calendar matrix for 'mes' mode
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Check if a vacation spans across a date
  const getVacationsForDate = (dateStr: string) => {
    return filteredFerias.filter((f) => {
      return dateStr >= f.data_inicio && dateStr <= f.data_fim;
    });
  };

  const getStatusColor = (status: Ferias['status']) => {
    switch (status) {
      case 'Pendente':
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
      case 'Aprovada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
      case 'Em andamento':
        return 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200 font-semibold';
      case 'Concluída':
        return 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span>Calendário de Férias</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualização estratégica de ausências e períodos de descanso da equipe
          </p>
        </div>

        {/* View mode toggle (Mês / Semana / Lista) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('mes')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Mês</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar: Navigation, Month Label, Dept Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-bold text-slate-800 min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToday}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Legend / Status badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Pendente
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Aprovada
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Em andamento
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Concluída
          </span>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="ml-auto text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
          >
            <option value="todos">Todos Departamentos</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW MODE: MÊS */}
      {viewMode === 'mes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-semibold text-slate-600 py-2.5">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className={idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-700'}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((dayObj, index) => {
              const isToday = dayObj.dateStr === todayStr;
              const vacationsToday = getVacationsForDate(dayObj.dateStr);

              return (
                <div
                  key={index}
                  className={`min-h-[105px] p-1.5 sm:p-2 flex flex-col transition-colors ${
                    !dayObj.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-300'
                      : isToday
                      ? 'bg-blue-50/30'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : dayObj.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayObj.dayNumber}
                    </span>
                    {vacationsToday.length > 0 && dayObj.isCurrentMonth && (
                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                        {vacationsToday.length} ausente{vacationsToday.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Vacation items */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {vacationsToday.map((vac) => (
                      <button
                        key={vac.id}
                        type="button"
                        onClick={() => onViewFerias(vac)}
                        className={`w-full text-left p-1 rounded-md border text-[10px] truncate block transition-transform hover:scale-[1.02] cursor-pointer ${getStatusColor(
                          vac.status
                        )}`}
                        title={`${vac.funcionario?.nome_completo} (${vac.status}): ${formatDate(
                          vac.data_inicio
                        )} a ${formatDate(vac.data_fim)}`}
                      >
                        <span className="font-semibold block truncate">
                          {vac.funcionario?.nome_completo || 'Colaborador'}
                        </span>
                        <span className="opacity-80 text-[9px] block truncate">
                          {vac.funcionario?.departamento}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE: SEMANA */}
      {viewMode === 'semana' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            Escala da Semana ({formatDate(todayStr)} em diante)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateStr = d.toISOString().split('T')[0];
              const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
              const vacations = getVacationsForDate(dateStr);

              return (
                <div
                  key={offset}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
                >
                  <div className="text-center pb-2 border-b border-slate-200">
                    <span className="text-xs uppercase font-bold text-slate-500 block">
                      {dayName}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{formatDate(dateStr)}</span>
                  </div>

                  {vacations.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">Nenhuma ausência</p>
                  ) : (
                    <div className="space-y-1.5">
                      {vacations.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => onViewFerias(v)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer ${getStatusColor(
                            v.status
                          )}`}
                        >
                          <p className="font-bold truncate">{v.funcionario?.nome_completo}</p>
                          <p className="text-[10px] opacity-80">{v.funcionario?.cargo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE: LISTA */}
      {viewMode === 'lista' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Cronograma de Férias (Ordem Cronológica)
            </h3>
            <span className="text-xs text-slate-500">
              {filteredFerias.length} período(s) mapeado(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {filteredFerias.map((f) => (
              <div
                key={f.id}
                onClick={() => onViewFerias(f)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {f.funcionario?.nome_completo.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{f.funcionario?.nome_completo}</h4>
                    <p className="text-[11px] text-slate-500">
                      {f.funcionario?.cargo} • {f.funcionario?.departamento} ({f.funcionario?.matricula})
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <span className="font-semibold text-slate-800">
                    {formatDate(f.data_inicio)} até {formatDate(f.data_fim)}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {f.quantidade_dias} dias • Retorna em {formatDate(f.data_retorno)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor(
                      f.status
                    )}`}
                  >
                    {f.status}
                  </span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
