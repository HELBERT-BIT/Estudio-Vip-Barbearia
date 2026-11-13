import React from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { formatNotificationRemaining } from '../../lib/supabase';
import { 
  Megaphone, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Info, 
  Radio, 
  RefreshCw,
  Timer
} from 'lucide-react';

export const AnnouncementsFeed: React.FC = () => {
  const { announcements, activeSupabaseNotifications, refreshSupabaseNotifications, setClientActiveTab, settings } = useBarbershop();
  const activeAnnouncements = announcements.filter((a) => a.active);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Hoje';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Hoje';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} min`;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Hoje';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Aviso':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'Horário':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Aviso':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Horário':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-brand text-zinc-100">
              Mural de Avisos &amp; Novidades
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Informações oficiais da equipe {settings.name}: avisos em tempo real, horários de expediente e regras de tolerância.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshSupabaseNotifications()}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Atualizar avisos agora"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setClientActiveTab('booking')}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            Agendar Horário
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: Avisos em Tempo Real transmitidos pelo Barbeiro (Supabase Realtime) dentro da validade */}
      {activeSupabaseNotifications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Avisos Transmitidos Ao Vivo pelo Barbeiro ({activeSupabaseNotifications.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">Supabase Realtime</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeSupabaseNotifications.map((sn) => (
              <div
                key={sn.id}
                className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 shadow-lg space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{sn.type || 'Aviso Ao Vivo'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      Mariano (Proprietário)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-amber-300/90 border border-zinc-800">
                      <Timer className="w-3 h-3 text-amber-400" />
                      <span>{formatNotificationRemaining(sn)}</span>
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {formatTimestamp(sn.created_at)}
                  </span>
                </div>

                <h4 className="text-base font-bold text-zinc-100 font-brand">
                  {sn.title}
                </h4>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed break-words">
                  {sn.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: Comunicados Fixos da Barbearia */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Regras &amp; Informações de Funcionamento
        </h3>

        {activeAnnouncements.length === 0 && activeSupabaseNotifications.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
            Nenhum comunicado publicado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {activeAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ann.important
                    ? 'bg-zinc-900/90 border-amber-500/40 shadow-xl shadow-amber-500/5'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${getBadgeColor(
                        ann.badge
                      )}`}
                    >
                      {getBadgeIcon(ann.badge)}
                      {ann.badge}
                    </span>
                    {ann.important && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                        Importante
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {ann.date}
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-100 font-brand mb-1">
                  {ann.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
