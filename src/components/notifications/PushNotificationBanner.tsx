import React, { useState } from 'react';
import { usePushNotification } from '../../hooks/usePushNotification';
import { Bell, BellRing, CheckCircle2, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface PushNotificationBannerProps {
  className?: string;
  variant?: 'banner' | 'card' | 'compact';
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
      body: 'Teste de som e alerta recebido com sucesso no seu dispositivo!',
      type: 'aviso_geral',
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  // If already granted, show minimal status with option to test
  if (isGranted) {
    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold text-[11px]">Alertas Ativos</span>
          <button
            onClick={handleTestAlert}
            className="ml-1 text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            title="Testar notificação de teste"
          >
            {testSent ? 'Enviado!' : 'Testar'}
          </button>
        </div>
      );
    }

    return (
      <div className={`p-3 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs shadow-md ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-100 flex items-center gap-1.5">
              <span>Alertas Ativados no seu Celular</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              Você receberá avisos do barbeiro, confirmações e lembretes de 10 min de tolerância.
            </p>
          </div>
        </div>

        <button
          onClick={handleTestAlert}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 border border-zinc-700 transition-colors cursor-pointer"
          title="Disparar som e notificação de teste"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{testSent ? 'Notificado!' : 'Testar Alerta'}</span>
        </button>
      </div>
    );
  }

  // If denied by browser settings
  if (isDenied) {
    if (variant === 'compact') return null;
    return (
      <div className={`p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-400 ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-400/80 shrink-0" />
        <span>
          Para receber avisos de horário, permita as notificações nas configurações do seu navegador.
        </span>
      </div>
    );
  }

  // Permission is default (Prompt user to enable)
  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Lembretes &amp; Avisos
            </span>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">• Tolerância 10 min</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-zinc-100 mt-0.5">
            Ativar Notificações no seu Celular
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Receba lembretes antes do corte e avisos se o barbeiro precisar adiantar ou alterar horários.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleEnable}
        disabled={isLoading}
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <BellRing className="w-3.5 h-3.5 text-zinc-950" />
        <span>{isLoading ? 'Ativando...' : 'Permitir Receber Alertas'}</span>
      </button>
    </div>
  );
};
