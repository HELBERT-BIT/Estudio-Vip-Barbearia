import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { WorkingDayConfig } from '../../types';
import { AdminSlotManager } from './AdminSlotManager';
import { Clock, Calendar, Save, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal } from 'lucide-react';

export const AdminHoursConfig: React.FC = () => {
  const { settings, updateWorkingDay, updateSettings, showToast } = useBarbershop();

  const [activeSubTab, setActiveSubTab] = useState<'slots' | 'weekly'>('slots');
  const [slotDuration, setSlotDuration] = useState<number>(settings.slotDurationMinutes || 30);
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(settings.toleranceMinutes || 10);
  const [arrivalGuideline, setArrivalGuideline] = useState<string>(settings.arrivalGuideline || 'Chegue entre 5 e 10 minutos antes do atendimento.');

  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      slotDurationMinutes: Number(slotDuration),
      toleranceMinutes: Number(toleranceMinutes),
      arrivalGuideline,
    });
    showToast('Regras de agendamento e tolerância salvas com sucesso!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-zinc-800 gap-2 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('slots')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'slots'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Disponibilizar / Tirar Horários (Visual)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('weekly')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'weekly'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Horários Semanais &amp; Tolerância (08:30 às 19:00)</span>
        </button>
      </div>

      {activeSubTab === 'slots' && (
        <AdminSlotManager />
      )}

      {activeSubTab === 'weekly' && (
        <>
          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold font-brand text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Configuração de Horários Semanais &amp; Expediente
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Defina os horários de início e término padrão para cada dia da semana (08:30 às 19:00) e tolerância de atraso.
            </p>
          </div>

      {/* General Scheduling Rules Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
          Regras de Agendamento &amp; Tolerância de Atraso
        </h3>

        <form onSubmit={handleSaveGeneralConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Duração Padrão dos Slots (min)
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value={30}>30 minutos (Recomendado)</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos (1 hora)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Tolerância Máxima de Atraso (min)
            </label>
            <input
              type="number"
              min="5"
              max="30"
              value={toleranceMinutes}
              onChange={(e) => setToleranceMinutes(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Padrão da barbearia: 10 minutos
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Aviso de Antecedência aos Clientes
            </label>
            <input
              type="text"
              value={arrivalGuideline}
              onChange={(e) => setArrivalGuideline(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Aviso Especial de Dias Fechados (Domingos e Segundas)
            </label>
            <input
              type="text"
              value={settings.scheduleNotice || 'Domingo fechada e algumas segundas do mês também, será avisado no app com antecedência.'}
              onChange={(e) => updateSettings({ scheduleNotice: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Este comunicado é exibido no rodapé e nas regras do agendamento para os clientes.
            </span>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/10"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Regras de Horários</span>
            </button>
          </div>
        </form>
      </div>

      {/* Working Days Config Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Dias da Semana &amp; Horários de Abertura / Fechamento
          </h3>
          <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            ⏰ Todos os dias iniciam às 08:30 e encerram no máximo às 19:00 (ajustável pelo proprietário)
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Domingo é fechado automaticamente por norma da casa, mas o limite máximo padrão é até às 19:00. Se você alterar para mais cedo ou mais tarde em qualquer dia, a agenda atualizará na hora para os clientes.
        </p>

        <div className="space-y-3">
          {settings.workingDays.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`p-4 rounded-2xl border transition-all ${
                day.active
                  ? 'bg-zinc-900 border-zinc-800'
                  : 'bg-zinc-950/60 border-zinc-800/40 opacity-50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Day Switcher */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <input
                    type="checkbox"
                    id={`day-${day.dayOfWeek}`}
                    checked={day.active}
                    onChange={(e) => {
                      const isNowActive = e.target.checked;
                      const updates: Partial<WorkingDayConfig> = { active: isNowActive };
                      if (isNowActive && (!day.closeTime || day.closeTime <= '13:00')) {
                        updates.closeTime = '19:00';
                        updates.openTime = day.openTime || '08:30';
                        updates.hasLunchBreak = true;
                        updates.lunchStart = '12:00';
                        updates.lunchEnd = '14:00';
                      }
                      updateWorkingDay(day.dayOfWeek, updates);
                    }}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-${day.dayOfWeek}`}
                    className="font-bold text-zinc-100 text-sm cursor-pointer select-none"
                  >
                    {day.dayName}
                    {day.dayOfWeek === 0 && (
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        Norma da casa (Fechado)
                      </span>
                    )}
                  </label>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      day.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {day.active ? 'Aberto' : 'Fechado'}
                  </span>
                </div>

                {/* Hours Controls - Available for all days so owner can customize schedule */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      Abertura
                    </span>
                    <input
                      type="time"
                      value={day.openTime || '08:30'}
                      onChange={(e) =>
                        updateWorkingDay(day.dayOfWeek, { openTime: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      Fechamento {day.dayOfWeek === 0 ? '(Máx padrão: 19:00)' : ''}
                    </span>
                    <input
                      type="time"
                      value={day.closeTime || '19:00'}
                      onChange={(e) =>
                        updateWorkingDay(day.dayOfWeek, { closeTime: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      Início Almoço
                    </span>
                    <input
                      type="time"
                      value={day.lunchStart || '12:00'}
                      onChange={(e) =>
                        updateWorkingDay(day.dayOfWeek, {
                          lunchStart: e.target.value,
                          hasLunchBreak: true,
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      Fim Almoço
                    </span>
                    <input
                      type="time"
                      value={day.lunchEnd || '14:00'}
                      onChange={(e) =>
                        updateWorkingDay(day.dayOfWeek, {
                          lunchEnd: e.target.value,
                          hasLunchBreak: true,
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )}
</div>
  );
};
