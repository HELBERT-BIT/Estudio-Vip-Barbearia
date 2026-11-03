import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BarberReview } from '../../types';
import { 
  Star, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageSquare, 
  CheckCircle2, 
  Crown, 
  Send, 
  X, 
  Sparkles,
  AlertTriangle,
  Filter
} from 'lucide-react';

export const AdminReviewsManager: React.FC = () => {
  const { 
    reviews, 
    deleteReview, 
    toggleHideReview, 
    replyToReview, 
    getBarberRatingStats, 
    settings 
  } = useBarbershop();

  const [activeFilter, setActiveFilter] = useState<'all' | 'visible' | 'hidden' | 'unreplied'>('all');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  // Replying state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  // Delete modal confirmation
  const [deletingReview, setDeletingReview] = useState<BarberReview | null>(null);

  const stats = getBarberRatingStats();

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'visible' && r.hidden) return false;
    if (activeFilter === 'hidden' && !r.hidden) return false;
    if (activeFilter === 'unreplied' && r.ownerReply) return false;
    if (starFilter !== 'all' && Math.round(r.rating) !== starFilter) return false;
    return true;
  });

  const handleStartReply = (rev: BarberReview) => {
    setReplyingReviewId(rev.id);
    setReplyText(rev.ownerReply || '');
  };

  const handleSaveReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    replyToReview(reviewId, replyText.trim());
    setReplyingReviewId(null);
    setReplyText('');
  };

  const handleConfirmDelete = () => {
    if (!deletingReview) return;
    deleteReview(deletingReview.id);
    setDeletingReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Gestão e Moderação • Mariano
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-brand text-zinc-100 mt-1 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Avaliações e Depoimentos de Clientes
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Visualize, responda como Barbeiro Master, oculte depoimentos inadequados ou exclua avaliações.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 self-start md:self-auto">
            <div className="text-center">
              <span className="text-3xl font-black font-brand text-amber-400 block leading-none">
                {stats.average}
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mt-1">
                de 5.0
              </span>
            </div>

            <div className="border-l border-zinc-800 pl-4">
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
                {stats.count} públicas ({reviews.length} total)
              </span>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              Todas ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('visible')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'visible'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              Visíveis ({reviews.filter((r) => !r.hidden).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('hidden')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'hidden'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              Ocultadas ({reviews.filter((r) => r.hidden).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unreplied')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'unreplied'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              Aguardando Resposta ({reviews.filter((r) => !r.ownerReply).length})
            </button>
          </div>

          {/* Star Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Estrelas:
            </span>
            <select
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todas as notas</option>
              <option value="5">5 Estrelas</option>
              <option value="4">4 Estrelas</option>
              <option value="3">3 Estrelas</option>
              <option value="2">2 Estrelas</option>
              <option value="1">1 Estrela</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Star className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 text-base">
                {reviews.length === 0 ? 'Sem Avaliações de Teste (Sistema Zerado)' : 'Nenhuma avaliação encontrada'}
              </h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                {reviews.length === 0
                  ? 'Os dados de teste foram limpos. As avaliações reais dos seus clientes aparecerão aqui assim que realizarem o primeiro corte!'
                  : 'Tente alterar o filtro de estrelas ou exibir avaliações ocultas.'}
              </p>
            </div>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                rev.hidden
                  ? 'bg-zinc-950/60 border-rose-500/30 opacity-75'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Review Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm uppercase">
                    {rev.clientName.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-zinc-100 text-sm">{rev.clientName}</strong>
                      {rev.hidden && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Oculta do Público
                        </span>
                      )}
                      {rev.ownerReply && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Respondida
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 block mt-0.5">
                      Serviço: <strong className="text-zinc-300">{rev.serviceName || 'Corte & Barba'}</strong> • Data: {rev.date}
                      {rev.clientPhone && ` • Tel: ${rev.clientPhone}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold font-mono text-amber-400 ml-1.5">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 italic">
                "{rev.comment}"
              </p>

              {/* Tags */}
              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-950 border border-zinc-800 text-amber-400/90"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Official Owner Reply Display */}
              {rev.ownerReply && replyingReviewId !== rev.id && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Sua Resposta (Mariano):</span>
                      {rev.ownerRepliedAt && (
                        <span className="text-[10px] text-zinc-500 font-normal">• {rev.ownerRepliedAt}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartReply(rev)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                    >
                      Editar resposta
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    "{rev.ownerReply}"
                  </p>
                </div>
              )}

              {/* Inline Reply Input Box */}
              {replyingReviewId === rev.id && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      Responder como Barbeiro Mariano:
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyingReviewId(null)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta para o cliente (ex: Obrigado pela preferência e confiança, meu amigo! Te esperamos na próxima!)."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingReviewId(null)}
                      className="py-1.5 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!replyText.trim()}
                      onClick={() => handleSaveReply(rev.id)}
                      className="py-1.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Resposta</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toolbar for Moderation */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {replyingReviewId !== rev.id && (
                    <button
                      type="button"
                      onClick={() => handleStartReply(rev)}
                      className="py-1.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{rev.ownerReply ? 'Editar Resposta' : 'Responder ao Cliente'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleHideReview(rev.id)}
                    className={`py-1.5 px-3 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      rev.hidden
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {rev.hidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Tornar Visível</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar do Público</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDeletingReview(rev)}
                  className="py-1.5 px-3 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100 font-brand text-base">Excluir Avaliação?</h4>
                <p className="text-xs text-zinc-400">Esta ação é permanente e não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p><strong>Cliente:</strong> {deletingReview.clientName}</p>
              <p><strong>Nota:</strong> {deletingReview.rating} Estrelas</p>
              <p className="italic text-zinc-400 line-clamp-2">"{deletingReview.comment}"</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
