import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { getTodayString } from '../../data/initialData';
import { 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  PlusCircle, 
  Timer, 
  CalendarCheck, 
  ShieldAlert, 
  ChevronRight, 
  Power, 
  RotateCcw,
  BarChart3,
  CreditCard,
  QrCode,
  Banknote,
  Phone,
  MessageSquare,
  Check,
  Star,
  Sparkles
} from 'lucide-react';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';

export const AdminDashboard: React.FC = () => {
  const { 
    appointments, 
    services,
    setAdminActiveTab, 
    simulateIncomingBooking, 
    simulateDelayAndCancel,
    checkInAppointment,
    completeAppointment,
    isOpenNow,
    setManualBarbershopStatus,
    getAvailableSlots,
    settings,
    reviews,
    getBarberRatingStats
  } = useBarbershop();

  const ratingStats = getBarberRatingStats();
  const statusInfo = isOpenNow();
  const todayStr = getTodayString();
  const todayAppointments = appointments.filter((apt) => apt.date === todayStr);
  const todaySlots = getAvailableSlots(todayStr);
  const todayAvailableSlotsCount = todaySlots.filter((s) => s.isAvailable).length;
  const todayBlockedSlotsCount = todaySlots.filter((s) => s.isBlockedByOwner).length;

  // Financial calculations
  const todayRevenue = todayAppointments
    .filter((apt) => apt.paymentStatus === 'pago')
    .reduce((sum, apt) => sum + apt.servicePrice, 0);

  const pendingRevenue = todayAppointments
    .filter((apt) => apt.paymentStatus === 'pendente' && apt.status !== 'cancelado_atraso' && !apt.status.startsWith('cancelado'))
    .reduce((sum, apt) => sum + apt.servicePrice, 0);

  const [todayViewTab, setTodayViewTab] = useState<'pending' | 'completed' | 'all'>('pending');

  const completedToday = todayAppointments.filter((apt) => apt.status === 'concluido').length;
  const scheduledToday = todayAppointments.filter((apt) => ['agendado', 'confirmado_presenca', 'em_atendimento'].includes(apt.status)).length;
  const cancelledTodayCount = todayAppointments.filter((apt) => apt.status.startsWith('cancelado')).length;
  const delayedCancelledCount = appointments.filter((apt) => apt.status === 'cancelado_atraso').length;
  const todayProgressPercent = todayAppointments.length > 0 ? Math.round((completedToday / todayAppointments.length) * 100) : 0;

  const pendingTodayList = todayAppointments
    .filter((apt) => ['agendado', 'confirmado_presenca', 'em_atendimento'].includes(apt.status))
    .sort((a, b) => a.time.localeCompare(b.time));

  const completedTodayList = todayAppointments
    .filter((apt) => apt.status === 'concluido')
    .sort((a, b) => b.time.localeCompare(a.time));

  const allTodayList = [...todayAppointments].sort((a, b) => a.time.localeCompare(b.time));

  // Active upcoming for quick action
  const nextUp = todayAppointments.find((apt) => apt.status === 'agendado');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Master Status Control Switch */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Painel do Proprietário • {settings.name}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-brand text-zinc-100 mt-1">
            Visão Geral &amp; Controle da Barbearia
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {settings.address} - Coxim MS • Tolerância de 10 minutos ativa.
          </p>
        </div>

        {/* Master Open / Closed Toggle (Requested by user) */}
        <div className="flex flex-wrap items-center gap-3 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              Controle de Funcionamento
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  statusInfo.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
              <strong
                className={`text-xs uppercase font-bold ${
                  statusInfo.isOpen ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {statusInfo.isOpen ? 'Barbearia Aberta' : 'Barbearia Fechada'}
              </strong>
            </div>
            {new Date().getDay() === 0 && settings.manualOverrideStatus !== 'open' && (
              <span className="text-[10px] text-amber-400/90 block mt-0.5 font-medium">
                Domingo fechado automaticamente por norma da casa.
              </span>
            )}
            {settings.manualOverrideStatus === 'open' && (
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
                ✓ Aberta hoje pelo barbeiro • Horários liberados para agendamento
              </span>
            )}
            {settings.manualOverrideStatus === 'closed' && (
              <span className="text-[10px] text-rose-400 block mt-0.5 font-semibold">
                ✕ Bloqueada manualmente pelo proprietário
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setManualBarbershopStatus('open')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusInfo.isOpen && settings.manualOverrideStatus === 'open'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-emerald-500/50'
              }`}
              title="Ativar barbearia como aberta agora e liberar horários de agendamento"
            >
              <Power className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ativar (Aberta)</span>
            </button>

            <button
              onClick={() => setManualBarbershopStatus('closed')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !statusInfo.isOpen && settings.manualOverrideStatus === 'closed'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-400/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-rose-500/50'
              }`}
              title="Desativar barbearia (fechar hoje)"
            >
              <Power className="w-3.5 h-3.5 text-rose-400" />
              <span>Desativar (Fechada)</span>
            </button>

            {settings.manualOverrideStatus && settings.manualOverrideStatus !== 'auto' && (
              <button
                onClick={() => setManualBarbershopStatus('auto')}
                className="py-2 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 flex items-center gap-1 text-xs"
                title="Voltar ao modo automático (domingo fechado por norma da casa, seg-sáb normal)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Automático</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Faturamento Pago Hoje */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-brand text-zinc-100">
              R$ {todayRevenue.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-emerald-400 block mt-1">
              + R$ {pendingRevenue.toFixed(2).replace('.', ',')} previsto no balcão
            </span>
          </div>
        </div>

        {/* Metric 2: Agendamentos Hoje Detalhados */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Agendados Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-brand text-amber-400">
                {todayAppointments.length} clientes
              </span>
              <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                {todayProgressPercent}% concluído
              </span>
            </div>

            {/* Visual progress bar of today's schedule */}
            <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-zinc-800">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>

            {/* Explicit breakdown badges */}
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {completedToday} atendidos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {scheduledToday} a atender
              </span>
              {cancelledTodayCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {cancelledTodayCount} cancelados
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Concluídos */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Atendimentos Feitos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-brand text-zinc-100">
              {completedToday}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">
              Finalizados com sucesso hoje
            </span>
          </div>
        </div>

        {/* Metric 4: Cancelados por Tolerância (10 min) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Atraso &gt; 10 min</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-brand text-rose-400">
              {delayedCancelledCount}
            </span>
            <span className="text-[11px] text-rose-400/80 block mt-1">
              Cancelados e horários liberados
            </span>
          </div>
        </div>
      </div>

      {/* Quick Slot Management Banner for Today */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-100">
                Horários de Hoje (08:30 às 19:00)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                {todaySlots.length} slots gerados
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              <strong className="text-emerald-400 font-semibold">{todayAvailableSlotsCount} livres</strong> para agendar •{' '}
              <strong className="text-rose-400 font-semibold">{todayBlockedSlotsCount} tirados</strong> pelo barbeiro •{' '}
              Expediente até às <strong>19:00</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAdminActiveTab('schedule')}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Disponibilizar / Tirar Horários</span>
        </button>
      </div>

      {/* Focus Box: Next Appointment Attention */}
      {nextUp ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-zinc-950 uppercase">
                Próximo da Fila
              </span>
              <span className="text-sm font-bold text-zinc-200">{nextUp.clientName}</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 font-mono">{nextUp.clientPhone}</span>
            </div>

            <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Horário: {nextUp.time} (Tolerância até {nextUp.toleranceExpiryTime})
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              {(() => {
                const svc = services.find((s) => s.id === nextUp.serviceId);
                return svc?.imageUrl ? (
                  <img
                    src={svc.imageUrl}
                    alt={nextUp.serviceName}
                    className="w-7 h-7 rounded-md object-cover border border-zinc-800 shrink-0"
                  />
                ) : null;
              })()}
              <span>
                Serviço: <strong>{nextUp.serviceName}</strong> (R$ {nextUp.servicePrice.toFixed(2).replace('.', ',')}) • Pagamento:{' '}
                <strong className={nextUp.paymentStatus === 'pago' ? 'text-emerald-400' : 'text-amber-400'}>
                  {nextUp.paymentStatus === 'pago' ? 'Pago (Pix)' : 'Pendente no balcão'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => checkInAppointment(nextUp.id)}
                className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                Confirmar Chegada
              </button>
              <button
                onClick={() => completeAppointment(nextUp.id)}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Concluir Atendimento
              </button>
              <button
                onClick={() => simulateDelayAndCancel(nextUp.id)}
                className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 font-medium text-xs border border-zinc-700 transition-colors"
                title="Simula 10 minutos de atraso sem chegada e cancela automaticamente liberando o horário"
              >
                Simular Atraso 10m
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quadro Detalhado dos Atendimentos de Hoje: Especificação de Atendidos & A Atender */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="text-lg font-bold font-brand text-zinc-100 flex items-center gap-2">
                <span>Quadro Operacional de Hoje:</span>
                <span className="text-emerald-400 font-bold">{completedToday} Atendidos</span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400 font-bold">{scheduledToday} A Atender</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Controle detalhado de cada cliente do dia, horários de tolerância e a forma de pagamento adiantada para o caixa:
            </p>
          </div>

          {/* View Tab Selectors */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 self-start md:self-auto">
            <button
              onClick={() => setTodayViewTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                todayViewTab === 'pending'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>A Atender ({scheduledToday})</span>
            </button>

            <button
              onClick={() => setTodayViewTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                todayViewTab === 'completed'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Já Atendidos ({completedToday})</span>
            </button>

            <button
              onClick={() => setTodayViewTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                todayViewTab === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Todos de Hoje ({todayAppointments.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Clientes A Atender Hoje */}
        {todayViewTab === 'pending' && (
          <div className="space-y-3">
            {pendingTodayList.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/60 border border-zinc-800 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-zinc-200">Fila do dia concluída!</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Todos os clientes agendados para hoje já foram atendidos com sucesso.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {pendingTodayList.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Time and Client info */}
                    <div className="flex items-start gap-3.5">
                      <div className="text-center px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                        <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">
                          Horário
                        </span>
                        <strong className="text-base font-bold font-brand text-amber-300 block">
                          {apt.time}
                        </strong>
                        <span className="text-[9px] text-zinc-400 block mt-0.5 font-mono">
                          Até {apt.toleranceExpiryTime}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-zinc-100">{apt.clientName}</strong>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              apt.status === 'confirmado_presenca'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-zinc-800 text-amber-400'
                            }`}
                          >
                            {apt.status === 'confirmado_presenca' ? '🏃 Presente no Balcão' : '⏳ Aguardando Horário'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-zinc-400 flex-wrap">
                          {(() => {
                            const svc = services.find((s) => s.id === apt.serviceId);
                            return svc?.imageUrl ? (
                              <img
                                src={svc.imageUrl}
                                alt={apt.serviceName}
                                className="w-6 h-6 rounded-md object-cover border border-zinc-800 shrink-0"
                              />
                            ) : null;
                          })()}
                          <span className="text-zinc-200 font-semibold">{apt.serviceName}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-amber-400 font-brand font-bold">
                            R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <a
                            href={`https://wa.me/55${apt.clientPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            {apt.clientPhone}
                          </a>
                        </div>

                        {/* Pre-specified Payment Box by Client */}
                        <div className="pt-1.5 flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[11px] text-zinc-500">Forma no Balcão:</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200">
                            {apt.paymentMethod === 'pix' ? (
                              <>
                                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                                <span>📱 Pix via QR Code</span>
                              </>
                            ) : apt.paymentMethod === 'cartao_credito' ? (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                                <span>💳 Cartão de Crédito</span>
                              </>
                            ) : apt.paymentMethod === 'cartao_debito' ? (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                                <span>💳 Cartão de Débito</span>
                              </>
                            ) : (
                              <>
                                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                                <span>💵 Dinheiro em Espécie</span>
                              </>
                            )}
                          </span>

                          {/* Extra troco info if present */}
                          {apt.notes && apt.notes.includes('troco') && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                              {apt.notes.includes('50')
                                ? '💰 Separar Troco p/ R$ 50'
                                : apt.notes.includes('100')
                                ? '💰 Separar Troco p/ R$ 100'
                                : '💰 Troco Solicitado'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick actions for Mariano */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {apt.status === 'agendado' && (
                        <button
                          onClick={() => checkInAppointment(apt.id)}
                          className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                          title="Confirmar que o cliente chegou à barbearia"
                        >
                          Confirmar Chegada
                        </button>
                      )}

                      <button
                        onClick={() => completeAppointment(apt.id)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                        title="Finalizar atendimento e liquidar serviço"
                      >
                        Concluir
                      </button>

                      <button
                        onClick={() => simulateDelayAndCancel(apt.id)}
                        className="py-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 font-medium text-xs border border-zinc-800 transition-colors"
                        title="Simular 10 min de tolerância esgotada e liberar horário"
                      >
                        Atraso 10m
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Clientes Já Atendidos Hoje */}
        {todayViewTab === 'completed' && (
          <div className="space-y-3">
            {completedTodayList.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/60 border border-zinc-800 rounded-2xl">
                <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-300">Nenhum atendimento finalizado ainda hoje</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Assim que você concluir os clientes na cadeira, o histórico do dia será registrado aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {completedTodayList.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-zinc-100 font-bold text-sm">{apt.clientName}</strong>
                          <span className="text-[10px] text-zinc-500 font-mono">({apt.time})</span>
                        </div>
                        <span className="text-zinc-400 flex items-center gap-2">
                          {(() => {
                            const svc = services.find((s) => s.id === apt.serviceId);
                            return svc?.imageUrl ? (
                              <img
                                src={svc.imageUrl}
                                alt={apt.serviceName}
                                className="w-5 h-5 rounded object-cover border border-zinc-800 shrink-0"
                              />
                            ) : null;
                          })()}
                          <span>{apt.serviceName} • {apt.clientPhone}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <strong className="text-emerald-400 font-brand text-sm block">
                          R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                        </strong>
                        <span className="text-[10px] text-zinc-500 capitalize">
                          {apt.paymentMethod.replace('_', ' ')} • Pago
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        ✓ Atendido
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Todos os Clientes de Hoje */}
        {todayViewTab === 'all' && (
          <div className="space-y-2">
            {allTodayList.map((apt) => (
              <div
                key={apt.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 w-12 text-center">
                    {apt.time}
                  </span>
                  <div>
                    <strong className="text-zinc-200 block">{apt.clientName}</strong>
                    <span className="text-[10px] text-zinc-500">
                      {apt.serviceName} • {apt.clientPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      apt.status === 'concluido'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : apt.status.startsWith('cancelado')
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {apt.status === 'concluido'
                      ? '✓ Concluído'
                      : apt.status === 'cancelado_atraso'
                      ? '❌ Cancelado (Atraso)'
                      : '⏳ A Atender'}
                  </span>
                  <span className="font-brand font-bold text-zinc-200 text-xs">
                    R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recharts Analytics Suite */}
      <AdminAnalyticsCharts
        appointments={appointments}
        services={services}
        barbershopName={settings.name}
        barberName={settings.barberName}
        phone={settings.phone}
        city={settings.city}
        address={settings.address}
      />

      {/* Barber Rating & Customer Reviews Showcase */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 font-brand text-base">
                Reputação &amp; Avaliações de {settings.barberName || 'Mariano'}
              </h3>
              <p className="text-xs text-zinc-400">
                Feedback pós-atendimento recebido diretamente dos clientes atendidos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
            <span className="text-2xl font-black font-brand text-amber-400">
              {ratingStats.average}
            </span>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(ratingStats.average)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">
                {ratingStats.count} avaliações verificadas
              </span>
            </div>
          </div>
        </div>

        {/* Recent Reviews Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reviews.slice(0, 4).map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">{rev.clientName}</span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="font-bold">{rev.rating}.0</span>
                </div>
              </div>
              <p className="text-zinc-300 italic">"{rev.comment}"</p>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                <span>{rev.serviceName}</span>
                <span>{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Jump Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setAdminActiveTab('appointments')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
              Agenda Completa
            </h4>
            <p className="text-xs text-zinc-500 mt-1">Gerencie todos os horários e contatos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => setAdminActiveTab('schedule')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
              Horários &amp; Expediente
            </h4>
            <p className="text-xs text-zinc-500 mt-1">08:30-12:00 e 14:00-19:00</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => setAdminActiveTab('cancellations')}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
              Histórico de Cancelamentos
            </h4>
            <p className="text-xs text-zinc-500 mt-1">Veja motivos e horários liberados</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};
