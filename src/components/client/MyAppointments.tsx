import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Appointment } from '../../types';
import { 
  Clock, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Sparkles, 
  Timer,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Star
} from 'lucide-react';
import { ReviewModal } from './ReviewModal';

export const MyAppointments: React.FC = () => {
  const { 
    appointments, 
    services,
    currentUser, 
    cancelAppointment, 
    simulateDelayAndCancel,
    setClientActiveTab,
    settings,
    reviews 
  } = useBarbershop();

  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Imprevisto pessoal');
  const [reviewModalApt, setReviewModalApt] = useState<Appointment | null>(null);

  // Filter appointments for the client:
  // If currentUser is set, match phone/name or show recent appointments
  const clientAppointments = appointments.filter((apt) => {
    if (!currentUser) return true; // show all for demo if not logged in
    return apt.clientPhone === currentUser.phone || apt.clientName === currentUser.name;
  });

  const activeAppointments = clientAppointments.filter((apt) =>
    ['agendado', 'confirmado_presenca', 'em_atendimento'].includes(apt.status)
  );

  const pastOrCancelledAppointments = clientAppointments.filter((apt) =>
    ['concluido', 'cancelado_cliente', 'cancelado_atraso', 'cancelado_barbearia'].includes(apt.status)
  );

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'agendado':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Agendado
          </span>
        );
      case 'confirmado_presenca':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> No Local (Check-in)
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Em Atendimento
          </span>
        );
      case 'concluido':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case 'cancelado_atraso':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <Timer className="w-3 h-3" /> Cancelado por Atraso
          </span>
        );
      case 'cancelado_cliente':
      case 'cancelado_barbearia':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        );
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalApt) return;
    cancelAppointment(cancelModalApt.id, cancelReason);
    setCancelModalApt(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header & Guidelines */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-brand text-zinc-100">
              Meus Agendamentos
            </h2>
            {currentUser && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-amber-400 font-mono">
                {currentUser.name}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Consulte seus horários marcados, status de comparecimento e pagamentos.
          </p>
        </div>

        <button
          onClick={() => setClientActiveTab('booking')}
          className="self-start md:self-auto py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/10"
        >
          <span>Agendar Novo Horário</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Arrival & Delay Rules Reminder Box */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Instruções de Comparecimento &amp; Tolerância</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-normal">
                Regra Oficial
              </span>
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              • Orientamos chegar entre <strong className="text-amber-400">5 e 10 minutos antes</strong> do horário marcado para recepção e preparação.
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              • Tolerância máxima de <strong className="text-amber-400">10 minutos</strong>. Se você não confirmar presença dentro de 10 minutos após o horário agendado, nosso sistema realiza o <strong className="text-rose-400">cancelamento automático</strong> para liberar a vaga a outro cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Active Appointments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Próximos Agendamentos ({activeAppointments.length})
          </h3>
        </div>

        {activeAppointments.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
            <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-base font-bold text-zinc-300">Nenhum agendamento ativo no momento</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Garanta seu horário na cadeira com nossos barbeiros especialistas.
            </p>
            <button
              onClick={() => setClientActiveTab('booking')}
              className="mt-2 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-block transition-colors"
            >
              Escolher Serviço &amp; Agendar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeAppointments.map((apt) => {
              const [y, m, d] = apt.date.split('-').map(Number);
              const dateObj = new Date(y, m - 1, d);
              const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={apt.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-all hover:border-zinc-700 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex flex-col items-center justify-center font-bold shrink-0">
                        <span className="text-[10px] text-zinc-400 uppercase font-sans">
                          {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-lg leading-tight font-brand">{d}</span>
                      </div>

                      {(() => {
                        const svc = services.find((s) => s.id === apt.serviceId);
                        return (
                          <div className="flex items-center gap-3">
                            {svc?.imageUrl && (
                              <img
                                src={svc.imageUrl}
                                alt={apt.serviceName}
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                              />
                            )}
                            <div>
                              <h4 className="font-bold text-zinc-100 text-base">{apt.serviceName}</h4>
                              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="capitalize">{formattedDate}</span>
                                <span>•</span>
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <strong className="text-amber-400">{apt.time}</strong>
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500 block">Pagamento:</span>
                      <strong className="text-zinc-200">
                        {apt.paymentType === 'sinal_50' ? (
                          'Garantia 50% Pix'
                        ) : apt.paymentType === 'antecipado' ? (
                          'Pix 100% Antecipado'
                        ) : (
                          `Presencial (${
                            apt.paymentMethod === 'pix'
                              ? 'Pix'
                              : apt.paymentMethod === 'cartao_credito'
                              ? 'Cartão Crédito'
                              : apt.paymentMethod === 'cartao_debito'
                              ? 'Cartão Débito'
                              : 'Dinheiro'
                          })`
                        )}
                      </strong>
                      <span className="block text-[11px] text-emerald-400 mt-0.5">
                        {apt.paymentType === 'sinal_50' ? (
                          <>
                            <span>✓ Sinal R$ {(apt.depositAmount || apt.servicePrice * 0.5).toFixed(2).replace('.', ',')} pago</span>
                            <span className="block text-[10px] text-amber-400/90 font-medium">
                              Restante R$ {(apt.remainingAmount || apt.servicePrice * 0.5).toFixed(2).replace('.', ',')} no balcão
                            </span>
                          </>
                        ) : apt.paymentStatus === 'pago' ? (
                          '✓ 100% Quitado'
                        ) : (
                          '⏳ Acerto no balcão'
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Tolerância Máxima:</span>
                      <strong className="text-amber-400">Até {apt.toleranceExpiryTime}</strong>
                      <span className="block text-[10px] text-zinc-400">
                        Chegar entre{' '}
                        {(() => {
                          const [h, m] = apt.time.split(':').map(Number);
                          const dt = new Date();
                          dt.setHours(h, m - 10, 0, 0);
                          return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                        })()}{' '}
                        e {apt.time}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Valor:</span>
                      <strong className="text-amber-400 font-brand text-sm">
                        R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                      </strong>
                      <span className="block text-[10px] text-zinc-500">
                        Duração: {apt.serviceDuration} min
                      </span>
                    </div>
                  </div>

                  {/* Actions & Simulation Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Cancellation button for client */}
                    <button
                      type="button"
                      onClick={() => setCancelModalApt(apt)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancelar Agendamento</span>
                    </button>

                    {/* Interactive demonstration helper: simulate delay exceeding 10 min */}
                    <button
                      type="button"
                      onClick={() => simulateDelayAndCancel(apt.id)}
                      className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Testa a regra de negócio #4: simula que passaram mais de 10 minutos do horário sem o cliente comparecer, acionando o cancelamento automático e liberando o horário na agenda!"
                    >
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simular Atraso &gt; 10 min (Testar Tolerância)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History and Cancelled Appointments */}
      {pastOrCancelledAppointments.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <span>Histórico e Cancelamentos ({pastOrCancelledAppointments.length})</span>
          </h3>

          <div className="space-y-3">
            {pastOrCancelledAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 text-xs space-y-2 opacity-90"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const svc = services.find((s) => s.id === apt.serviceId);
                      return svc?.imageUrl ? (
                        <img
                          src={svc.imageUrl}
                          alt={apt.serviceName}
                          className="w-7 h-7 rounded-md object-cover border border-zinc-800 shrink-0"
                        />
                      ) : null;
                    })()}
                    <span className="font-semibold text-zinc-200">{apt.serviceName}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{apt.date} às {apt.time}</span>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>

                {/* Show review section for completed appointments */}
                {apt.status === 'concluido' && (() => {
                  const existingReview = reviews.find((r) => r.appointmentId === apt.id);
                  if (existingReview) {
                    return (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>Sua Avaliação: {existingReview.rating} de 5 Estrelas</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReviewModalApt(apt)}
                            className="text-[11px] text-zinc-400 hover:text-amber-300 underline font-medium"
                          >
                            Editar nota
                          </button>
                        </div>
                        <p className="text-zinc-300 italic pl-5">"{existingReview.comment}"</p>
                        {existingReview.tags && existingReview.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-5 pt-0.5">
                            {existingReview.tags.map((tag) => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400/90 font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-zinc-200">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                        <div>
                          <strong className="block text-amber-300 text-xs">Atendimento Concluído!</strong>
                          <span className="text-[11px] text-zinc-400">Como foi seu atendimento com o Mariano? Deixe sua nota para o perfil do barbeiro.</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReviewModalApt(apt)}
                        className="py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/15"
                      >
                        <Star className="w-3.5 h-3.5 fill-zinc-950" />
                        <span>Avaliar Atendimento</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Show cancellation reason if cancelled */}
                {apt.cancellationReason && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold">Motivo do Cancelamento:</span>{' '}
                      {apt.cancellationReason}
                      {apt.cancelledAt && (
                        <span className="text-[10px] text-rose-400/80 block mt-0.5">
                          Registrado às {apt.cancelledAt} • Horário liberado na agenda
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100 font-brand text-base">Cancelar Agendamento?</h4>
                <p className="text-xs text-zinc-400">Esta ação liberará seu horário para outros clientes.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p><strong>Serviço:</strong> {cancelModalApt.serviceName}</p>
              <p><strong>Data e Horário:</strong> {cancelModalApt.date} às {cancelModalApt.time}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Motivo do Cancelamento:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Imprevisto pessoal ou de trabalho">Imprevisto pessoal ou de trabalho</option>
                <option value="Necessidade de reagendamento para outro dia">Necessidade de reagendamento para outro dia</option>
                <option value="Desistência do atendimento">Desistência do atendimento</option>
                <option value="Outro motivo">Outro motivo</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalApt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Manter Agendamento
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal for completed appointments */}
      {reviewModalApt && (
        <ReviewModal
          appointment={reviewModalApt}
          onClose={() => setReviewModalApt(null)}
        />
      )}
    </div>
  );
};
