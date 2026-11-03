import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { usePushNotification } from '../../hooks/usePushNotification';
import {
  BellRing,
  X,
  Send,
  Clock,
  Sparkles,
  CalendarCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Smartphone
} from 'lucide-react';

interface AdminPushDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAppointmentId?: string;
}

export const AdminPushDispatcherModal: React.FC<AdminPushDispatcherModalProps> = ({
  isOpen,
  onClose,
  preSelectedAppointmentId,
}) => {
  const { appointments, showToast } = useBarbershop();
  const { sendNotification, playChime, isGranted } = usePushNotification();

  const [template, setTemplate] = useState<'alteracao_horario' | 'lembrete' | 'vaga_liberada' | 'personalizado'>('alteracao_horario');
  const [targetType, setTargetType] = useState<'all' | 'specific'>(
    preSelectedAppointmentId ? 'specific' : 'all'
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    preSelectedAppointmentId || (appointments[0]?.id || '')
  );

  const [title, setTitle] = useState('Aviso de Alteração de Horário - Estúdio VIP');
  const [body, setBody] = useState(
    'Olá! Houve um ajuste na grade de horários hoje. Por favor verifique seu agendamento no aplicativo ou confirme pelo WhatsApp.'
  );
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTemplateChange = (tpl: 'alteracao_horario' | 'lembrete' | 'vaga_liberada' | 'personalizado') => {
    setTemplate(tpl);
    if (tpl === 'alteracao_horario') {
      setTitle('Aviso de Alteração de Horário - Estúdio VIP');
      setBody(
        'Olá! Houve um ajuste na grade de horários hoje. Por favor verifique seu agendamento no aplicativo ou confirme pelo WhatsApp.'
      );
    } else if (tpl === 'lembrete') {
      setTitle('Lembrete Estúdio VIP: Seu corte está chegando!');
      setBody(
        'Seu horário de atendimento está próximo! Lembramos da tolerância máxima de 10 minutos para garantir o melhor atendimento.'
      );
    } else if (tpl === 'vaga_liberada') {
      setTitle('Vaga Extra Liberada Hoje no Estúdio VIP!');
      setBody(
        'Acabamos de disponibilizar um horário de encaixe na barbearia. Acesse o aplicativo e garanta seu horário!'
      );
    }
  };

  const selectedApt = appointments.find((a) => a.id === selectedAppointmentId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    try {
      const clientName = targetType === 'specific' && selectedApt ? selectedApt.clientName : undefined;
      const finalBody = clientName ? `Olá ${clientName.split(' ')[0]}! ${body}` : body;

      const res = await sendNotification({
        title: title.trim(),
        body: finalBody.trim(),
        type: template,
        clientName,
        appointmentId: targetType === 'specific' ? selectedAppointmentId : undefined,
        url: targetType === 'specific' ? '/#my-appointments' : '/',
      });

      playChime();
      setSentSuccess(true);
      showToast(
        targetType === 'specific' && clientName
          ? `Notificação push enviada para ${clientName}!`
          : 'Notificação push disparada para todos os clientes!',
        'success',
        'Notificação Enviada'
      );

      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1400);
    } catch {
      showToast('Erro ao disparar notificação.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 font-brand">
              Disparar Notificação aos Clientes
            </h3>
            <p className="text-xs text-zinc-400">
              Envie alertas de alteração de horário ou lembretes direto para o celular dos clientes.
            </p>
          </div>
        </div>

        {/* Quick Template Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Modelos Rápidos de Mensagem:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleTemplateChange('alteracao_horario')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                template === 'alteracao_horario'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="block font-semibold">Alteração de Horário</span>
                <span className="text-[10px] text-zinc-500">Aviso de ajuste na grade</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTemplateChange('lembrete')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                template === 'lembrete'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <CalendarCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <span className="block font-semibold">Lembrete &amp; Tolerância</span>
                <span className="text-[10px] text-zinc-500">Regra de 10 min de tolerância</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTemplateChange('vaga_liberada')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                template === 'vaga_liberada'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
              <div>
                <span className="block font-semibold">Encaixe Liberado</span>
                <span className="text-[10px] text-zinc-500">Vaga extra de corte</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTemplateChange('personalizado')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                template === 'personalizado'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Send className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
              <div>
                <span className="block font-semibold">Mensagem Livre</span>
                <span className="text-[10px] text-zinc-500">Escreva seu aviso</span>
              </div>
            </button>
          </div>
        </div>

        {/* Target Recipient Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Destinatário do Alerta:
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTargetType('all')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                targetType === 'all'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Todos os Clientes</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('specific')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                targetType === 'specific'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Cliente Específico</span>
            </button>
          </div>

          {targetType === 'specific' && (
            <div className="pt-1">
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-500"
              >
                {appointments.length === 0 ? (
                  <option value="">Nenhum agendamento cadastrado</option>
                ) : (
                  appointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.time} - {apt.clientName} ({apt.serviceName}) • {apt.date}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Título da Notificação
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-500"
              placeholder="Digite o título do alerta"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Texto da Mensagem
            </label>
            <textarea
              required
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Digite o texto detalhado da mensagem"
            />
          </div>

          {/* Smartphone Notification Preview */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-amber-400" />
              <span>Prévia no celular do cliente:</span>
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-start gap-2.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ✂️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-100 truncate">{title}</p>
                  <span className="text-[10px] text-zinc-500">Agora</span>
                </div>
                <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5">
                  {targetType === 'specific' && selectedApt ? `Olá ${selectedApt.clientName.split(' ')[0]}! ` : ''}
                  {body}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSending || sentSuccess}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              sentSuccess
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20 active:scale-95'
            }`}
          >
            {sentSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Notificação Enviada com Sucesso!</span>
              </>
            ) : isSending ? (
              <span>Disparando alerta...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Disparar Notificação Push Agora</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
