import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { ReviewModal } from './ReviewModal';
import { 
  Star, 
  Crown, 
  Award, 
  Clock, 
  MapPin, 
  Phone, 
  Coffee, 
  Scissors, 
  Calendar, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const BarberProfileView: React.FC = () => {
  const { 
    settings, 
    reviews, 
    getBarberRatingStats, 
    setClientActiveTab 
  } = useBarbershop();

  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const stats = getBarberRatingStats();

  // Filter only visible reviews for public profile
  const visibleReviews = reviews.filter((r) => !r.hidden);

  const filteredReviews = visibleReviews.filter((r) => {
    if (starFilter === 'all') return true;
    return Math.round(r.rating) === starFilter;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Barber Hero Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Barber Avatar & Badge */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-1 shadow-2xl shadow-amber-500/20">
              <div className="w-full h-full rounded-[22px] bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden border border-zinc-800">
                {/* Stylized Barber Icon / Representation */}
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scissors className="w-8 h-8" />
                </div>
                <span className="text-[10px] uppercase font-black text-amber-400 mt-1 tracking-wider">
                  Estúdio VIP
                </span>
              </div>
            </div>

            {/* Master Barber Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-zinc-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
              <Crown className="w-3 h-3 fill-zinc-950" />
              Barbeiro Master
            </div>
          </div>

          {/* Barber Bio & Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-3.5 h-3.5" />
                Fundador &amp; Responsável Técnico
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Coxim - MS
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-brand text-zinc-100">
              {settings.barberName || 'Mariano'}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Aqui no Estúdio VIP você encontra um ambiente tranquilo e acolhedor para cuidar do seu visual com calma. Especialista em cortes masculinos clássicos e modernos (degradê, social, militar) e barba bem alinhada, com atendimento no horário certo e aquele café quentinho esperando por você aqui em Coxim.
            </p>

            {/* Quick stats tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs text-zinc-400 max-w-full">
              <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tolerância de 10 min</span>
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Café &amp; Água Cortesia</span>
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{settings.phone}</span>
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <button
                onClick={() => setClientActiveTab('booking')}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Horário com Mariano</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Avaliar Atendimento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Score & Breakdown Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h3 className="text-lg font-bold font-brand text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Avaliações dos Clientes
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Notas e depoimentos de clientes reais que concluíram agendamento com o barbeiro Mariano.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 self-start sm:self-auto">
            <div className="text-center">
              <span className="text-3xl font-black font-brand text-amber-400 block leading-none">
                {stats.average}
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mt-1">
                de 5.0
              </span>
            </div>

            <div className="border-l border-zinc-800 pl-4 text-left">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(stats.average)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-400 block mt-1 font-medium">
                {stats.count} {stats.count === 1 ? 'avaliação verificada' : 'avaliações verificadas'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const percent = stats.count > 0 ? Math.round((count / stats.count) * 100) : 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 text-zinc-300 font-semibold">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-[11px] text-zinc-500 font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Highlights & Satisfaction */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
                Índice de Satisfação
              </span>
              <p className="text-sm font-semibold text-zinc-200">
                {stats.count > 0 && stats.average >= 4.5
                  ? '98% dos clientes recomendam o atendimento de Mariano!'
                  : 'Compromisso com padrão VIP em todos os cortes.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Avaliações coletadas com clientes atendidos.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
              >
                + Deixar Avaliação
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto scrollbar-none">
          <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Filtrar:</span>
          <button
            onClick={() => setStarFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              starFilter === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas ({visibleReviews.length})
          </button>
          {[5, 4, 3].map((star) => {
            const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
            if (count === 0 && starFilter !== star) return null;
            return (
              <button
                key={star}
                onClick={() => setStarFilter(star)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
                  starFilter === star
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{star} Estrelas</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
              Nenhuma avaliação encontrada para este filtro.
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3 transition-all hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
                      {rev.clientName.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-zinc-200 text-xs">{rev.clientName}</strong>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verificado
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block">
                        Serviço: {rev.serviceName} • {rev.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed pl-1 sm:pl-10">
                  "{rev.comment}"
                </p>

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1 sm:pl-10 pt-1">
                    {rev.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-900 border border-zinc-800 text-amber-400/90"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Owner Reply Box (Resposta oficial do Barbeiro Mariano) */}
                {rev.ownerReply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 ml-2 sm:ml-10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Resposta de Mariano (Barbeiro Master):</span>
                      </div>
                      {rev.ownerRepliedAt && (
                        <span className="text-[10px] text-zinc-500">{rev.ownerRepliedAt}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                      "{rev.ownerReply}"
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <ReviewModal
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}
    </div>
  );
};
