import React from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { ShieldAlert, Timer, User, Calendar, Clock, CheckCircle2, RotateCcw } from 'lucide-react';

export const AdminCancellationsLog: React.FC = () => {
  const { appointments } = useBarbershop();

  const cancelledAppointments = appointments.filter((apt) =>
    apt.status.startsWith('cancelado')
  );

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h2 className="text-xl font-bold font-brand text-zinc-100">
            Histórico &amp; Auditoria de Cancelamentos
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Registro completo de cancelamentos automáticos por tolerância de 10 minutos e cancelamentos manuais com liberação imediata de vaga.
        </p>
      </div>

      {cancelledAppointments.length === 0 ? (
        <div className="p-10 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
          Nenhum cancelamento registrado no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {cancelledAppointments.map((apt) => {
            const isDelayExceeded = apt.status === 'cancelado_atraso';

            return (
              <div
                key={apt.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDelayExceeded
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isDelayExceeded ? (
                        <Timer className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm">{apt.clientName}</h4>
                      <p className="text-xs text-zinc-400 font-mono">{apt.clientPhone}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      isDelayExceeded
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isDelayExceeded ? '⚠️ Tolerância de 10 min Excedida' : 'Cancelamento Manual'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block">Serviço:</span>
                    <strong className="text-zinc-300">{apt.serviceName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Horário Previsto:</span>
                    <strong className="text-zinc-300">
                      {apt.date} às {apt.time}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Status da Vaga:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Liberada na Agenda
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  <span className="font-bold">Motivo Registrado:</span>{' '}
                  {apt.cancellationReason || 'Cancelamento sem justificativa.'}
                  {apt.cancelledAt && (
                    <span className="text-[10px] text-rose-400/80 block mt-0.5">
                      Hora do cancelamento: {apt.cancelledAt}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
