import React, { useState, useEffect } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { 
  Megaphone, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  X, 
  ChevronRight, 
  Radio, 
  BellRing,
  Info
} from 'lucide-react';
import { SupabaseNotification } from '../../lib/supabase';

export const RealtimeNotificationsBanner: React.FC = () => {
  const { supabaseNotifications, setClientActiveTab } = useBarbershop();
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('estudiovip_dismissed_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Most recent notification that hasn't been dismissed in this session
  const activeNotifs = supabaseNotifications.filter(
    (n) => !dismissedIds.includes(String(n.id))
  );

  const latestNotif = activeNotifs.length > 0 ? activeNotifs[0] : null;

  const handleDismiss = (id: string | number) => {
    const updated = [...dismissedIds, String(id)];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('estudiovip_dismissed_notifs', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Agora';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Hoje';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return 'Há instantes';
      if (diffMin < 60) return `Há ${diffMin} min`;
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Hoje';
    }
  };

  const getNoticeTheme = (type?: string) => {
    switch (type) {
      case 'urgente':
      case 'atraso':
        return {
          border: 'border-rose-500/50',
          bg: 'bg-rose-950/40',
          gradient: 'from-rose-500/20 via-zinc-900/90 to-zinc-950',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
          label: 'Aviso Urgente',
        };
      case 'horario':
      case 'tolerancia':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-950/40',
          gradient: 'from-amber-500/20 via-zinc-900/90 to-zinc-950',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          icon: <Clock className="w-4 h-4 text-amber-400 shrink-0" />,
          label: 'Horário & Tolerância',
        };
      case 'promocao':
        return {
          border: 'border-emerald-500/50',
          bg: 'bg-emerald-950/40',
          gradient: 'from-emerald-500/20 via-zinc-900/90 to-zinc-950',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          icon: <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />,
          label: 'Novidade & Promoção',
        };
      default:
        return {
          border: 'border-amber-500/40',
          bg: 'bg-zinc-900/90',
          gradient: 'from-amber-500/15 via-zinc-900/90 to-zinc-950',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
          dot: 'bg-amber-400',
          icon: <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />,
          label: 'Comunicado Oficial',
        };
    }
  };

  if (!latestNotif) return null;

  const theme = getNoticeTheme(latestNotif.type);

  return (
    <div className="w-full max-w-full animate-in fade-in slide-in-from-top-3 duration-300">
      <div 
        className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-r ${theme.gradient} p-3.5 sm:p-4.5 shadow-xl shadow-black/40 backdrop-blur-md`}
      >
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Ícone com pulso */}
            <div className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
              {theme.icon}
            </div>

            <div className="min-w-0 space-y-1">
              {/* Header do Aviso com Status Realtime */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${theme.badgeBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`} />
                  <span>{theme.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900/80 text-zinc-400 border border-zinc-800 font-mono">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span>Ao Vivo • Supabase</span>
                </span>

                <span className="text-[11px] text-zinc-400 ml-auto sm:ml-0">
                  {formatTimestamp(latestNotif.created_at)}
                </span>
              </div>

              {/* Título */}
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-brand leading-snug break-words pt-0.5">
                {latestNotif.title}
              </h3>

              {/* Mensagem completa */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed break-words pt-0.5">
                {latestNotif.message}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
            <button
              onClick={() => setClientActiveTab('announcements')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Abrir o mural completo de avisos"
            >
              <span>Mural de Avisos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDismiss(latestNotif.id)}
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
              title="Fechar este aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicador de múltiplos avisos */}
        {activeNotifs.length > 1 && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>+{activeNotifs.length - 1} outro(s) comunicado(s) ativo(s) no mural.</span>
            <button
              onClick={() => setClientActiveTab('announcements')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Ver todos no Mural &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
