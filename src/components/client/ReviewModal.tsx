import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Appointment } from '../../types';
import { getTodayString } from '../../data/initialData';
import { 
  Star, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ThumbsUp, 
  Scissors, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface ReviewModalProps {
  appointment?: Appointment;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ 
  appointment, 
  onClose,
  onSuccess 
}) => {
  const { addReview, currentUser, settings, services } = useBarbershop();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [clientName, setClientName] = useState<string>(
    currentUser?.name || appointment?.clientName || ''
  );
  const [clientPhone, setClientPhone] = useState<string>(
    currentUser?.phone || appointment?.clientPhone || ''
  );
  const [serviceId, setServiceId] = useState<string>(
    appointment?.serviceId || (services[0]?.id || '')
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Atendimento VIP',
    'Pontualidade 10'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    'Degradê Impecável',
    'Pontualidade 10',
    'Atendimento VIP',
    'Barba Alinhada',
    'Ambiente Top',
    'Café Quentinho',
    'Mão Leve',
    'Corte na Régua',
    'Recomendo Muito'
  ];

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return 'Péssimo';
      case 2:
        return 'Precisa melhorar';
      case 3:
        return 'Bom';
      case 4:
        return 'Muito Bom';
      case 5:
        return 'Excelente / Impecável! ⭐';
      default:
        return '';
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const selectedServiceObj = services.find((s) => s.id === serviceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    addReview({
      appointmentId: appointment?.id,
      clientName: clientName.trim() || appointment?.clientName || 'Cliente Estúdio VIP',
      clientPhone: clientPhone.trim() || appointment?.clientPhone,
      serviceId: serviceId || appointment?.serviceId,
      serviceName: appointment?.serviceName || selectedServiceObj?.name || 'Corte & Barba',
      rating,
      comment: comment.trim(),
      tags: selectedTags,
      date: appointment?.date || getTodayString(),
      barberName: settings.barberName || 'Mariano'
    });

    setIsSubmitting(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const activeScore = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avaliação de Atendimento Concluído</span>
            </div>
            <h3 className="text-xl font-bold font-brand text-zinc-100">
              Como foi sua experiência com o {settings.barberName || 'Mariano'}?
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sua avaliação ajuda a manter o padrão VIP e fica visível no perfil do barbeiro.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Appointment Context Summary or Service Selector */}
        {appointment ? (
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">{appointment.serviceName}</span>
                <span className="text-[11px] text-zinc-400">{appointment.date} às {appointment.time}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Concluído
            </span>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Qual serviço você realizou com o Mariano?
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} - R$ {svc.price.toFixed(2).replace('.', ',')}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Star Rating Section */}
          <div className="text-center p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Nota Geral do Serviço
            </label>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeScore;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    title={`${star} estrelas`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-xs font-bold text-amber-400 min-h-[1.25rem]">
              {getRatingLabel(activeScore)}
            </div>
          </div>

          {/* Quick Compliment Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              O que você mais gostou? (Opcional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Seu Comentário ou Elogio:</span>
              <span className="text-[10px] text-zinc-500 font-normal">Mínimo 5 caracteres</span>
            </label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Mariano é pontual, fez um degradê perfeito e o ambiente é muito agradável. Recomendo em Coxim!"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Client Name Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Nome de Exibição
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="Seu nome"
            />
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Avaliação autenticada e vinculada ao seu agendamento no Estúdio VIP.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/10 disabled:opacity-50"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Enviar Avaliação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
