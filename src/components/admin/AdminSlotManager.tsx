import React, { useState, useMemo } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { getTodayString, getOffsetDateString } from '../../data/initialData';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  RotateCcw, 
  Sun, 
  Sunset, 
  Coffee, 
  User, 
  Phone,
  Power,
  ChevronRight,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';

export const AdminSlotManager: React.FC = () => {
  const { 
    settings, 
    getAvailableSlots, 
    toggleSlotBlocked, 
    blockMultipleSlots, 
    unblockMultipleSlots,
    blockAllSlotsForDate,
    unblockAllSlotsForDate, 
    togglePastSlotUnlocked,
    toggleLunchSlotUnlocked,
    addCustomSlot,
    removeCustomSlot,
    setSlotIntervalMinutes,
    setManualBarbershopStatus,
    updateWorkingDay,
    setAdminActiveTab,
    showToast 
  } = useBarbershop();

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [newCustomTime, setNewCustomTime] = useState<string>('');

  // Quick dates for carousel (next 7 days)
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const dStr = getOffsetDateString(i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayOfWeek = dt.getDay();
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      list.push({
        dateStr: dStr,
        dayNumber: d,
        monthName: dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        weekday: weekdays[dayOfWeek],
        isToday: i === 0,
        dayOfWeek,
      });
    }
    return list;
  }, []);

  // Parse selected date info
  const selectedDateInfo = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    const dayConfig = settings.workingDays.find((wd) => wd.dayOfWeek === dayOfWeek);
    const isToday = selectedDate === todayStr;
    const isSunday = dayOfWeek === 0;

    let isOpen = !!(dayConfig && dayConfig.active);
    if (isToday) {
      if (settings.manualOverrideStatus === 'open') isOpen = true;
      else if (settings.manualOverrideStatus === 'closed') isOpen = false;
    }

    const fullFormatted = dt.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      dayOfWeek,
      dayConfig,
      isOpen,
      isToday,
      isSunday,
      fullFormatted,
    };
  }, [selectedDate, settings.workingDays, settings.manualOverrideStatus, todayStr]);

  // Slots generated for this date (from 08:30 to 19:00)
  const slots = useMemo(() => {
    return getAvailableSlots(selectedDate);
  }, [selectedDate, getAvailableSlots, settings.manualOverrideStatus, settings.blockedSlotsByDate, settings.customUnlockedSlotsByDate, settings.workingDays]);

  // Metrics
  const totalSlotsCount = slots.length;
  const availableCount = slots.filter((s) => s.isAvailable).length;
  const blockedCount = slots.filter((s) => s.isBlockedByOwner).length;
  const lunchCount = slots.filter((s) => s.isLunchBreak).length;
  const bookedCount = slots.filter((s) => !s.isAvailable && s.appointment).length;

  // Batch actions
  const morningTimes = useMemo(() => {
    return ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  }, []);

  const afternoonTimes = useMemo(() => {
    return [
      '14:00', '14:30', '15:00', '15:30', '16:00', 
      '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
    ];
  }, []);

  const handleBlockMorning = () => {
    blockMultipleSlots(selectedDate, morningTimes);
  };

  const handleUnblockMorning = () => {
    unblockMultipleSlots(selectedDate, morningTimes);
  };

  const handleBlockAfternoon = () => {
    blockMultipleSlots(selectedDate, afternoonTimes);
  };

  const handleUnblockAfternoon = () => {
    unblockMultipleSlots(selectedDate, afternoonTimes);
  };

  const handleBlockAll = () => {
    blockAllSlotsForDate(selectedDate);
  };

  const handleUnblockAll = () => {
    unblockAllSlotsForDate(selectedDate);
  };

  const handleToggleLunchSlots = () => {
    const lunchTimes = ['12:00', '12:30', '13:00', '13:30'];
    const currentlyUnlocked = settings.customUnlockedSlotsByDate?.[selectedDate] || [];
    const hasAnyUnlocked = lunchTimes.some((t) => currentlyUnlocked.includes(t));

    lunchTimes.forEach((t) => {
      if (hasAnyUnlocked && currentlyUnlocked.includes(t)) {
        toggleLunchSlotUnlocked(selectedDate, t);
      } else if (!hasAnyUnlocked && !currentlyUnlocked.includes(t)) {
        toggleLunchSlotUnlocked(selectedDate, t);
      }
    });
  };

  const handleAddNewCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTime.trim()) {
      showToast('Digite um horário válido (ex: 17:10).', 'error');
      return;
    }
    addCustomSlot(selectedDate, newCustomTime.trim());
    setNewCustomTime('');
  };

  const handleEnableDay = () => {
    if (selectedDateInfo.isToday) {
      setManualBarbershopStatus('open');
    } else {
      updateWorkingDay(selectedDateInfo.dayOfWeek, { active: true });
      showToast(`Expediente ativado com sucesso para este dia da semana!`, 'success');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
      {/* Title & Explanation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Painel de Controle do Barbeiro • Mariano
            </span>
          </div>
          <h3 className="text-xl font-bold font-brand text-zinc-100 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Gerenciador de Horários (Disponibilizar / Tirar da Agenda)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Clique em qualquer horário para <strong>Tirar da agenda</strong> ou <strong>Disponibilizar</strong> para os clientes. Os horários vão até às <strong>19:00</strong>.
          </p>
        </div>

        {/* Quick Date Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-medium">Data específica:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Date Carousel Chips */}
      <div>
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          1. Selecione o dia para gerenciar:
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {quickDates.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setSelectedDate(d.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[74px] p-2.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 scale-105'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`}>
                  {d.weekday}
                </span>
                <span className="text-base font-bold font-brand my-0.5">
                  {d.dayNumber}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-bold' : 'text-zinc-500'}`}>
                  {d.isToday ? 'Hoje' : d.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Status Banner */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedDateInfo.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-xs uppercase font-bold text-zinc-300">
              {selectedDateInfo.fullFormatted}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {selectedDateInfo.isOpen ? (
              <span className="text-emerald-400 font-medium">
                ✓ Expediente aberto neste dia (08:30 às 19:00 • Almoço 12:00 às 14:00)
              </span>
            ) : (
              <span className="text-rose-400 font-medium">
                ✕ Dia fechado ({selectedDateInfo.isSunday ? 'Norma da casa: Fechada aos domingos' : 'Descanso'})
              </span>
            )}
          </p>
        </div>

        {!selectedDateInfo.isOpen && (
          <button
            type="button"
            onClick={handleEnableDay}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10 shrink-0"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Ativar Expediente Para Esta Data</span>
          </button>
        )}
      </div>

      {/* Metrics Counters */}
      {selectedDateInfo.isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Slots</span>
            <span className="text-lg font-bold font-brand text-zinc-100">{totalSlotsCount}</span>
            <span className="text-[9px] text-zinc-500 block">08:30 às 19:00</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Disponíveis</span>
            <span className="text-lg font-bold font-brand text-emerald-400">{availableCount}</span>
            <span className="text-[9px] text-emerald-500/80 block">Livres p/ agendar</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Tirados pelo Dono</span>
            <span className="text-lg font-bold font-brand text-rose-400">{blockedCount}</span>
            <span className="text-[9px] text-rose-500/80 block">Indisponíveis</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Agendados</span>
            <span className="text-lg font-bold font-brand text-amber-400">{bookedCount}</span>
            <span className="text-[9px] text-amber-500/80 block">Com clientes</span>
          </div>

          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 block">Almoço</span>
            <span className="text-lg font-bold font-brand text-orange-400">{lunchCount}</span>
            <span className="text-[9px] text-orange-500/80 block">12:00 às 14:00</span>
          </div>
        </div>
      )}

      {/* ⚡ CONTROLE TOTAL & LIBERDADE DE HORÁRIOS */}
      {selectedDateInfo.isOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <h4 className="text-sm font-bold text-amber-300 font-brand flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Liberdade Total de Horários &amp; Duração (Mariano)</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha o intervalo dos slots (ex: 15 min, 30 min) ou crie horários avulsos específicos (ex: 17:10, 17:20).
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Flexibilidade Máxima
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 1. Escolha Rápida do Intervalo dos Slots */}
            <div className="lg:col-span-6 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  Intervalo dos Horários Automáticos:
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {settings.slotIntervalMinutes || settings.slotDurationMinutes || 30} min
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[15, 20, 30, 45, 60].map((interval) => {
                  const currentInterval = settings.slotIntervalMinutes || settings.slotDurationMinutes || 30;
                  const isCurrent = currentInterval === interval;
                  return (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setSlotIntervalMinutes(interval)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                          : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                      }`}
                    >
                      {interval}m
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-500">
                Gera horários automáticos no intervalo escolhido (ex: <strong>15 min</strong> gera 08:30, 08:45, 09:00...).
              </p>
            </div>

            {/* 2. Adicionar Horário Avulso Personalizado (Ex: 17:10, 17:20) */}
            <div className="lg:col-span-6 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Adicionar Horário Personalizado nesta Data:
              </span>
              <form onSubmit={handleAddNewCustomSlot} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: 17:10 ou 17:20"
                  value={newCustomTime}
                  onChange={(e) => setNewCustomTime(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Adicionar</span>
                </button>
              </form>
              <p className="text-[10px] text-zinc-500">
                Digite qualquer horário extra (ex: <strong>17:10</strong>, <strong>17:20</strong>) para abrir na agenda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Bulk Buttons */}
      {selectedDateInfo.isOpen && (
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Ações Rápidas em Lote (Bidirecional):
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">
              Bloquear e Liberar com 1 Clique
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Manhã */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                Manhã (08:30 às 11:30)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUnblockMorning}
                  className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Disponibiliza todos os horários da manhã"
                >
                  <Check className="w-3.5 h-3.5" /> Liberar
                </button>
                <button
                  type="button"
                  onClick={handleBlockMorning}
                  className="py-1.5 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Tira todos os horários da manhã da agenda"
                >
                  <XCircle className="w-3.5 h-3.5" /> Bloquear
                </button>
              </div>
            </div>

            {/* Tarde */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sunset className="w-4 h-4 text-amber-400" />
                Tarde (14:00 às 19:00)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUnblockAfternoon}
                  className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Disponibiliza todos os horários da tarde"
                >
                  <Check className="w-3.5 h-3.5" /> Liberar
                </button>
                <button
                  type="button"
                  onClick={handleBlockAfternoon}
                  className="py-1.5 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Tira todos os horários da tarde da agenda"
                >
                  <XCircle className="w-3.5 h-3.5" /> Bloquear
                </button>
              </div>
            </div>

            {/* Dia Inteiro & Almoço */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Dia Inteiro &amp; Almoço
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUnblockAll}
                  className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Restaura e libera todos os horários do dia"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Liberar Tudo
                </button>
                <button
                  type="button"
                  onClick={handleBlockAll}
                  className="py-1.5 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Tira todos os horários deste dia"
                >
                  <XCircle className="w-3.5 h-3.5" /> Bloquear Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slots Grid */}
      {selectedDateInfo.isOpen ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              2. Horários do Dia (08:30 até 19:00) — Toque no card para alternar:
            </label>
            <span className="text-[11px] text-zinc-500 font-medium">
              Horário de encerramento: <strong>19:00</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              // 1. Booked appointment
              if (!slot.isAvailable && slot.appointment) {
                const apt = slot.appointment;
                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/40 relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-amber-400">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                          Agendado
                        </span>
                      </div>
                      <div className="mt-2 text-left">
                        <p className="text-xs font-bold text-zinc-200 truncate">
                          {apt.clientName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {apt.serviceName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminActiveTab('appointments')}
                      className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline text-left"
                    >
                      Ver na agenda →
                    </button>
                  </div>
                );
              }

              // 2. Lunch break
              if (slot.isLunchBreak) {
                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-zinc-950 border border-orange-500/20 relative flex flex-col justify-between group hover:border-orange-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-orange-400/90">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400 uppercase">
                          Almoço
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Pausa de almoço padrão da barbearia
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleLunchSlotUnlocked(selectedDate, slot.time)}
                      className="mt-3 w-full py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-bold border border-orange-500/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Liberar Almoço</span>
                    </button>
                  </div>
                );
              }

              // 3. Past Slot (Bloqueio automático ou liberado para encaixe)
              if (slot.isPast) {
                if (slot.isUnlockedForEncaixe) {
                  return (
                    <div
                      key={slot.time}
                      className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 relative flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold font-mono text-emerald-400">
                            {slot.time}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                            Encaixe
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-300/90 mt-2 font-medium">
                          Horário passado liberado para encaixe
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePastSlotUnlocked(selectedDate, slot.time)}
                        className="mt-3 w-full py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 text-[11px] font-bold border border-zinc-700 hover:border-rose-500/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Fechar Encaixe</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative flex flex-col justify-between transition-all opacity-60 hover:opacity-100"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-zinc-500 line-through">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-400 uppercase">
                          Passado
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-medium">
                        Bloqueado auto (Horário expirou)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePastSlotUnlocked(selectedDate, slot.time)}
                      className="mt-3 w-full py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      title="Permite que o barbeiro reabra este horário para um cliente de encaixe imediato"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Liberar p/ Encaixe</span>
                    </button>
                  </div>
                );
              }

              // 4. Blocked / Removed by Owner
              if (slot.isBlockedByOwner) {
                return (
                  <div
                    key={slot.time}
                    className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/40 relative flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-rose-400 line-through">
                          {slot.time}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                          {slot.isCustomExtra ? '⭐ Tirado' : 'Tirado'}
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-400/80 mt-2 font-medium">
                        Indisponível p/ clientes
                      </p>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <button
                        type="button"
                        onClick={() => toggleSlotBlocked(selectedDate, slot.time)}
                        className="w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Disponibilizar</span>
                      </button>

                      {slot.isCustomExtra && (
                        <button
                          type="button"
                          onClick={() => removeCustomSlot(selectedDate, slot.time)}
                          className="w-full py-1 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 text-[10px] font-semibold border border-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Excluir este horário"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // 5. Available Slot (Livre)
              return (
                <div
                  key={slot.time}
                  className={`p-3 rounded-2xl bg-zinc-950 border relative flex flex-col justify-between group transition-all shadow-sm ${
                    slot.isCustomExtra 
                      ? 'border-amber-500/50 shadow-amber-500/10 hover:border-amber-400' 
                      : 'border-emerald-500/30 hover:border-emerald-500 shadow-emerald-500/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-zinc-100 group-hover:text-amber-400 transition-colors">
                        {slot.time}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        slot.isCustomExtra 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {slot.isCustomExtra ? '⭐ Personalizado' : 'Disponível'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                      {slot.isCustomExtra ? 'Horário extra criado pelo barbeiro' : 'Livre para clientes agendarem'}
                    </p>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => toggleSlotBlocked(selectedDate, slot.time)}
                      className="w-full py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 text-[11px] font-bold border border-zinc-800 hover:border-rose-500/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Tirar da Agenda</span>
                    </button>

                    {slot.isCustomExtra && (
                      <button
                        type="button"
                        onClick={() => removeCustomSlot(selectedDate, slot.time)}
                        className="w-full py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold border border-rose-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Excluir este horário personalizado"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir Horário</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400 space-y-3">
          <p className="font-semibold text-zinc-200">
            {selectedDateInfo.isSunday
              ? 'Domingo está fechado por norma da casa.'
              : 'Barbearia desativada nesta data.'}
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Para disponibilizar e tirar horários nesta data, ative o expediente usando o botão acima.
          </p>
          <button
            type="button"
            onClick={handleEnableDay}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
          >
            <Power className="w-4 h-4" />
            <span>Ativar Atendimento Nesta Data</span>
          </button>
        </div>
      )}

      {/* Owner Tip Footer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white block">Como funciona o controle de horários:</strong>
          <p className="text-zinc-300 leading-relaxed text-[11px]">
            • Quando você clica em <strong>"Tirar da Agenda"</strong>, aquele horário específico é marcado imediatamente como indisponível e nenhum cliente poderá agendá-lo.
            <br />
            • Para voltar a atender naquele horário, basta clicar em <strong>"Disponibilizar"</strong>.
            <br />
            • Os horários encerram rigorosamente no horário máximo configurado (padrão até às <strong>19:00</strong>).
          </p>
        </div>
      </div>
    </div>
  );
};
