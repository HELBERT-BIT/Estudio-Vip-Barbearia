import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Appointment, PaymentMethod, PaymentStatus } from '../../types';
import { getTodayString } from '../../data/initialData';
import { 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MessageCircle, 
  CreditCard, 
  Timer, 
  Search, 
  Filter, 
  DollarSign,
  ChevronDown
} from 'lucide-react';

export const AdminSchedule: React.FC = () => {
  const { 
    appointments, 
    services,
    checkInAppointment, 
    completeAppointment, 
    cancelAppointment, 
    simulateDelayAndCancel,
    registerPayment,
    settings,
    setAdminActiveTab
  } = useBarbershop();

  const [dateFilter, setDateFilter] = useState<string>('all'); // 'today' | 'upcoming' | 'all'
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cancel modal state
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('Cancelamento solicitado pelo cliente');

  // Payment register modal state
  const [paymentModalApt, setPaymentModalApt] = useState<Appointment | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethod>('pix');
  const [selectedPayStatus, setSelectedPayStatus] = useState<PaymentStatus>('pago');

  const todayStr = getTodayString();

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    // Date filter
    if (dateFilter === 'today' && apt.date !== todayStr) return false;
    if (dateFilter === 'upcoming' && apt.date < todayStr) return false;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !['agendado', 'confirmado_presenca', 'em_atendimento'].includes(apt.status)) {
        return false;
      }
      if (statusFilter === 'concluido' && apt.status !== 'concluido') return false;
      if (statusFilter === 'cancelado' && !apt.status.startsWith('cancelado')) return false;
      if (statusFilter === 'pendente_pagamento' && (apt.paymentStatus !== 'pendente' || apt.status.startsWith('cancelado'))) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = apt.clientName.toLowerCase().includes(q);
      const matchPhone = apt.clientPhone.includes(q);
      const matchService = apt.serviceName.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchService) return false;
    }

    return true;
  });

  const handleConfirmCancellation = () => {
    if (!cancelModalApt) return;
    cancelAppointment(cancelModalApt.id, cancellationReason, true);
    setCancelModalApt(null);
  };

  const handleSavePayment = () => {
    if (!paymentModalApt) return;
    registerPayment(paymentModalApt.id, selectedPayMethod, selectedPayStatus);
    setPaymentModalApt(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-brand text-zinc-100">
              Agenda &amp; Atendimentos
            </h2>
            <p className="text-xs text-zinc-400">
              Controle de presença, tolerância de 10 minutos, cancelamento e faturamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminActiveTab('schedule')}
              className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Disponibilizar ou tirar horários específicos da agenda"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Gerenciar Horários (Tirar / Disponibilizar)</span>
            </button>
            <span className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-amber-400 font-bold text-xs font-mono">
              {filteredAppointments.length} agendamentos
            </span>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas as Datas</option>
            <option value="today">Apenas Hoje ({todayStr})</option>
            <option value="upcoming">Hoje e Próximos Dias</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos (Agendados / Check-in)</option>
            <option value="pendente_pagamento">Pagamentos Pendentes</option>
            <option value="concluido">Concluídos</option>
            <option value="cancelado">Cancelados (Cliente ou Atraso)</option>
          </select>
        </div>
      </div>

      {/* Appointment Cards List */}
      {filteredAppointments.length === 0 ? (
        <div className="p-10 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
          Nenhum agendamento encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((apt) => {
            const isToday = apt.date === todayStr;
            const isCancelled = apt.status.startsWith('cancelado');
            const cleanPhone = apt.clientPhone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(
              apt.clientName
            )},%20aqui%20%C3%A9%20da%20${encodeURIComponent(
              settings.name
            )}%20sobre%20seu%20hor%C3%A1rio%20das%20${apt.time}!`;

            return (
              <div
                key={apt.id}
                className={`bg-zinc-900 border rounded-2xl p-5 transition-all space-y-4 ${
                  apt.status === 'cancelado_atraso'
                    ? 'border-rose-900/40 bg-zinc-950/70 opacity-80'
                    : isCancelled
                    ? 'border-zinc-800 bg-zinc-950/50 opacity-70'
                    : isToday
                    ? 'border-amber-500/40 shadow-lg shadow-black/40'
                    : 'border-zinc-800'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 text-amber-400 font-brand flex flex-col items-center justify-center border border-zinc-700">
                      <span className="text-[10px] text-zinc-400 uppercase font-sans">
                        {apt.time}
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {apt.date.split('-').slice(1).reverse().join('/')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-100 text-base">{apt.clientName}</h4>
                        {isToday && (
                          <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
                            Hoje
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1 font-mono text-zinc-300">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {apt.clientPhone}
                        </span>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                          title="Iniciar conversa no WhatsApp do cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        {apt.clientEmail && (
                          <span className="text-zinc-500 hidden sm:inline">{apt.clientEmail}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {apt.status === 'agendado' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Agendado
                      </span>
                    )}
                    {apt.status === 'confirmado_presenca' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Presença Confirmada ({apt.checkedInAt})
                      </span>
                    )}
                    {apt.status === 'concluido' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                      </span>
                    )}
                    {apt.status === 'cancelado_atraso' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" /> Tolerância Excedida
                      </span>
                    )}
                    {apt.status === 'cancelado_cliente' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Cancelado pelo Cliente
                      </span>
                    )}
                    {apt.status === 'cancelado_barbearia' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Cancelado pela Barbearia
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-start gap-2.5">
                    {(() => {
                      const svc = services.find((s) => s.id === apt.serviceId);
                      return svc?.imageUrl ? (
                        <img
                          src={svc.imageUrl}
                          alt={apt.serviceName}
                          className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0 mt-0.5"
                        />
                      ) : null;
                    })()}
                    <div>
                      <span className="text-zinc-500 block text-[11px] uppercase tracking-wider">Serviço:</span>
                      <strong className="text-zinc-200">{apt.serviceName}</strong>
                      <span className="block text-zinc-500 text-[11px] mt-0.5">
                        Duração: {apt.serviceDuration} min
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block">Financeiro:</span>
                    <strong className="text-amber-400 font-brand">
                      R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                    </strong>
                    <span className="block text-[11px] mt-0.5">
                      Tipo: {apt.paymentType === 'sinal_50' ? (
                        <span className="text-amber-400 font-bold">
                          Sinal 50% Pix (R$ {(apt.depositAmount || apt.servicePrice * 0.5).toFixed(2).replace('.', ',')}) • Resta R$ {(apt.remainingAmount || apt.servicePrice * 0.5).toFixed(2).replace('.', ',')}
                        </span>
                      ) : apt.paymentType === 'antecipado' ? (
                        '100% Antecipado (Pix)'
                      ) : (
                        `Presencial (${apt.paymentMethod === 'pix' ? 'Pix' : apt.paymentMethod === 'cartao_credito' ? 'Crédito' : apt.paymentMethod === 'cartao_debito' ? 'Débito' : 'Dinheiro'})`
                      )} •{' '}
                      <strong className={apt.paymentStatus === 'pago' ? 'text-emerald-400' : apt.paymentStatus === 'sinal_pago' ? 'text-amber-400' : 'text-rose-400'}>
                        {apt.paymentStatus === 'pago' ? '✓ Quitado' : apt.paymentStatus === 'sinal_pago' ? 'Sinal Pago' : 'Pendente'}
                      </strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 block">Controle de Tolerância:</span>
                    <span className="text-zinc-300">
                      Horário: <strong>{apt.time}</strong> • Limite tolerância: <strong className="text-amber-400">{apt.toleranceExpiryTime}</strong>
                    </span>
                    <span className="block text-[10px] text-zinc-500 mt-0.5">
                      (Tolerância máxima de 10 min)
                    </span>
                  </div>
                </div>

                {/* Notes or cancellation reason */}
                {apt.notes && !isCancelled && (
                  <p className="text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                    <strong className="text-zinc-300">Observação do Cliente:</strong> {apt.notes}
                  </p>
                )}

                {isCancelled && apt.cancellationReason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <strong>Motivo do Cancelamento:</strong> {apt.cancellationReason}
                    {apt.cancelledAt && (
                      <span className="block text-[11px] text-rose-400/80 mt-0.5">
                        Cancelado às {apt.cancelledAt} • Horário imediatamente liberado na agenda.
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons (only if not cancelled and not concluded) */}
                {!isCancelled && apt.status !== 'concluido' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                      {/* Check-in */}
                      {apt.status === 'agendado' && (
                        <button
                          onClick={() => checkInAppointment(apt.id)}
                          className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Chegada (Check-in)</span>
                        </button>
                      )}

                      {/* Complete */}
                      <button
                        onClick={() => completeAppointment(apt.id)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Atendimento</span>
                      </button>

                      {/* Register Payment */}
                      <button
                        onClick={() => setPaymentModalApt(apt)}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Registrar Pagamento</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Simulate Delay Cancel (strictly implements requirement #4) */}
                      <button
                        onClick={() => simulateDelayAndCancel(apt.id)}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800/80 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 font-medium text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
                        title="Simula que se passaram mais de 10 minutos de tolerância sem o cliente chegar, cancelando e liberando o horário imediatamente"
                      >
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Simular Atraso &gt; 10 min</span>
                      </button>

                      {/* Manual Cancel */}
                      <button
                        onClick={() => setCancelModalApt(apt)}
                        className="py-1.5 px-3 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100 font-brand text-base">Cancelar Agendamento</h4>
                <p className="text-xs text-zinc-400">O horário das {cancelModalApt.time} será liberado na agenda.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Motivo do Cancelamento:
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalApt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Registration Modal */}
      {paymentModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100 font-brand text-base">Registrar Pagamento</h4>
                <p className="text-xs text-zinc-400">Cliente: {paymentModalApt.clientName} (R$ {paymentModalApt.servicePrice.toFixed(2)})</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Método de Pagamento:
                </label>
                <select
                  value={selectedPayMethod}
                  onChange={(e) => setSelectedPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="pix">Pix</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Status do Pagamento:
                </label>
                <select
                  value={selectedPayStatus}
                  onChange={(e) => setSelectedPayStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="pago">Pago / Recebido</option>
                  <option value="pendente">Pendente no Caixa</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalApt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Salvar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
