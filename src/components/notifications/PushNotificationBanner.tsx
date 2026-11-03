import React, { useState } from 'react';
import { usePushNotification } from '../../hooks/usePushNotification';
import { Bell, BellRing, CheckCircle2, Volume2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface PushNotificationBannerProps {
  className?: string;
  variant?: 'banner' | 'button' | 'compact' | 'card';
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  className = '',
  variant = 'banner',
}) => {
  const {
    isSupported,
    permission,
    isGranted,
    isDenied,
    requestPermission,
    sendNotification,
    playChime,
  } = usePushNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAlert = async () => {
    playChime();
    setTestSent(true);
    await sendNotification({
      title: 'Estúdio VIP Barbearia ✂️',
      body: 'Som e notificação do barbeiro Mariano funcionando perfeitamente no seu aparelho!',
      type: 'aviso_geral',
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  // ---------------------------------------------------------------------------
  // 1. VARIANTE BUTTON / COMPACT (Para cabeçalho, Navbar e barras rápidas)
  // ---------------------------------------------------------------------------
  if (variant === 'button' || variant === 'compact') {
    if (isGranted) {
      return (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs shadow-sm ${className}`}
        >
          <BellRing className="w-3.5 h-3.5 shrink-0 text-emerald-400 animate-pulse" />
          <span className="font-bold text-[11px] whitespace-nowrap hidden sm:inline">
            Avisos Ativos
          </span>
          <button
            type="button"
            onClick={handleTestAlert}
            className="ml-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/25 hover:bg-emerald-500/40 text-[10px] text-amber-300 font-bold hover:text-white cursor-pointer transition-all"
            title="Disparar som e notificação de teste no seu celular"
          >
            {testSent ? '✓ Tocou' : 'Testar'}
          </button>
        </div>
      );
    }

    // Quando ainda não ativado (Default ou bloqueado)
    return (
      <button
        type="button"
        onClick={handleEnable}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-amber-300 font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${className}`}
        title="Receber avisos de alteração de horário e lembretes do barbeiro no seu celular"
      >
        <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
        <span className="hidden xs:inline">
          {isLoading ? 'Ativando...' : 'Avisos do Barbeiro'}
        </span>
        <span className="xs:hidden">
          {isLoading ? '...' : 'Avisos'}
        </span>
      </button>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. VARIANTE BANNER PRINCIPAL (Exibido na tela inicial do cliente)
  // ---------------------------------------------------------------------------
  if (isGranted) {
    return (
      <div
        className={`p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 text-xs sm:text-sm">
                Avisos do Barbeiro Ativados no seu Celular
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ativo
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Você será avisado se o barbeiro adiantar ou alterar horários e receberá lembretes com 10 min de antecedência.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestAlert}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-zinc-700 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm shrink-0"
          title="Disparar som e notificação de teste"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{testSent ? '✓ Alerta Enviado!' : 'Testar Som & Notificação'}</span>
        </button>
      </div>
    );
  }

  if (isDenied) {
    return (
      <div className={`p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-400 ${className}`}>
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <strong className="text-zinc-200 block">Notificações desativadas no navegador</strong>
          <span className="text-[11px] text-zinc-400">
            Para receber avisos de alteração de horário, autorize as notificações nas configurações do seu navegador.
          </span>
        </div>
      </div>
    );
  }

  // Padrão (Default) - Card destacado convidativo para ativar
  return (
    <div
      className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-amber-500/5 ${className}`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0 shadow-md shadow-amber-500/20">
          <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-amber-400">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
              Notificações em Tempo Real
            </span>
            <span className="text-[11px] text-zinc-400">• Tolerância de 10 min</span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-zinc-100 mt-1">
            Receber Avisos &amp; Lembretes do Barbeiro no Celular
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Seja avisado caso o barbeiro precise adiantar/alterar horários e receba lembretes antes do corte.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleEnable}
        disabled={isLoading}
        className="self-stretch md:self-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <BellRing className="w-4 h-4 text-zinc-950" />
        <span>{isLoading ? 'Ativando...' : 'Ativar Avisos do Barbeiro'}</span>
      </button>
    </div>
  );
};
