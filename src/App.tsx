import React, { useState, useRef, useLayoutEffect } from 'react';
import { BarbershopProvider, useBarbershop } from './context/BarbershopContext';
import { Navbar, MobileBottomNav } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { ClientView } from './components/client/ClientView';
import { AdminView } from './components/admin/AdminView';
import { AuthModal } from './components/client/AuthModal';
import { AdminNotificationsModal } from './components/admin/AdminNotificationsModal';

const BarbershopApp: React.FC = () => {
  const {
    activeView,
    clientActiveTab,
    adminActiveTab,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useBarbershop();
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const mainViewportRef = useRef<HTMLElement | null>(null);

  // Sempre trava e foca no topo exato da aba/página selecionada ao trocar de tela ou aba
  useLayoutEffect(() => {
    if (mainViewportRef.current) {
      mainViewportRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [activeView, clientActiveTab, adminActiveTab]);

  return (
    <div className="relative h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 overflow-hidden">
      {/* ========================================================================= */}
      {/* PLANO DE FUNDO FIXO GLOBAL (Fica por trás de tudo em todas as páginas)     */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-zinc-950"
      >
        <img
          src="/assets/aistudio/image_8c6b8778.png"
          alt="Papel de parede Estúdio VIP"
          className="w-full h-full object-cover object-center opacity-15 sm:opacity-22 filter brightness-[0.6] contrast-[1.1] scale-105"
        />
        {/* Degradês cinematográficos para escurecer o fundo e destacar os textos e botões */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/75 via-zinc-950/88 to-zinc-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,#09090b_90%)] pointer-events-none" />
      </div>

      {/* Cabeçalho de Navegação Superior Fixo (z-40) */}
      <Navbar
        onOpenAuth={openAuthModal}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* Área Exclusiva de Conteúdo da Aba Ativa (Scroll independente por aba, sem rodapé global puxando para baixo) */}
      <main
        ref={mainViewportRef}
        id="app-main-viewport"
        className="app-scroll-viewport relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-6 sm:pb-10">
          {activeView === 'client' ? <ClientView /> : <AdminView />}
        </div>
      </main>

      {/* Barra Inferior Nativa Mobile (Fixa na base do app sem cobrir o conteúdo) */}
      <MobileBottomNav
        onOpenAuth={openAuthModal}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* Modais Globais & Toasts */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <AdminNotificationsModal isOpen={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <BarbershopProvider>
      <BarbershopApp />
    </BarbershopProvider>
  );
}