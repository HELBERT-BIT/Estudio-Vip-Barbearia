import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, CheckCircle2, X, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'menu' | 'banner';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
  onInstalled
}) => {
  const { isInstalled, isIOS, install, deferredPrompt } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  // If app is already running in standalone mode (already installed), hide or render minimal check
  if (isInstalled && !justInstalled) {
    return null;
  }

  const handleClick = async () => {
    // 1. Verifica se o evento beforeinstallprompt está disponível
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__pwaDeferredPrompt : null);

    if (promptEvent) {
      setIsPrompting(true);
      try {
        // Executa o comando deferredPrompt.prompt() imediatamente ao clicar
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setJustInstalled(true);
          if (onInstalled) onInstalled();
        }
      } catch (err) {
        console.warn('Erro ao executar deferredPrompt.prompt():', err);
        // Fallback para o modal explicativo em caso de restrição do navegador
        setShowGuideModal(true);
      } finally {
        setIsPrompting(false);
      }
    } else {
      // Se o evento não estiver disponível no navegador (como no iPhone ou em bloqueios do sistema),
      // mantém o pop-up com o passo a passo dos 3 pontinhos que já está funcionando.
      setShowGuideModal(true);
    }
  };

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs animate-fadeIn">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Instalado!</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPrompting}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Instalar App da Barbearia na Tela Inicial"
        >
          <Download className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
          <span className="whitespace-nowrap">Instalar App da Barbearia</span>
        </button>
      )}

      {variant === 'menu' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPrompting}
          className={`w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-zinc-100 font-bold text-xs">Instalar App da Barbearia</p>
              <p className="text-[10px] text-amber-400 font-normal">Acesso rápido direto na sua tela inicial</p>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md bg-amber-500 text-zinc-950 text-[10px] font-bold">
            Instalar
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg ${className}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-amber-400 font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-100 truncate">Estúdio VIP Barbearia</p>
              <p className="text-[11px] text-zinc-400 truncate">Instale para agendar mais rápido e receber avisos</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClick}
            disabled={isPrompting}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar App da Barbearia</span>
          </button>
        </div>
      )}

      {/* Modal explicativo para dispositivos sem disparo nativo imediato ou iOS Safari */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-left space-y-4">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-brand">
                  Instalar App da Barbearia
                </h3>
                <p className="text-xs text-zinc-400">
                  Estúdio VIP no seu celular
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 text-xs text-zinc-300">
                <p className="font-semibold text-amber-400">No iPhone ou iPad (Safari):</p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    Toque no botão <strong className="text-white">Compartilhar</strong> (ícone com quadrado e seta para cima <Share className="w-3 h-3 inline text-amber-400" />) na barra do Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    Role a lista e toque em <strong className="text-white">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3 h-3 inline text-amber-400" />).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    Toque em <strong className="text-white">Adicionar</strong> no canto superior direito para finalizar!
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 text-xs text-zinc-300">
                <p className="font-semibold text-amber-400">Como instalar no seu navegador:</p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    Toque no menu de <strong className="text-white">3 pontinhos (⋮)</strong> no topo ou rodapé do navegador Chrome/Edge.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    Selecione a opção <strong className="text-white">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    O ícone do <strong className="text-amber-400">Estúdio VIP</strong> ficará salvo como um app no seu celular!
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
