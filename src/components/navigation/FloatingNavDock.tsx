import React, { useState, useEffect } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import {
  ArrowUp,
  ArrowDown,
  Compass,
  Home,
  CalendarDays,
  Scissors,
  Clock,
  Megaphone,
  Star,
  LayoutDashboard,
  ShieldAlert,
  DollarSign,
  X
} from 'lucide-react';

export const FloatingNavDock: React.FC = () => {
  const {
    activeView,
    clientActiveTab,
    setClientActiveTab,
    adminActiveTab,
    setAdminActiveTab,
    currentUser,
    openAuthModal,
  } = useBarbershop();

  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(current);
      setMaxScroll(max > 0 ? max : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  const isNearBottom = scrollY > 200 && maxScroll > 0 && scrollY >= maxScroll - 150;
  const isScrolled = scrollY > 200;

  const clientTabs: {
    id: typeof clientActiveTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-4 h-4" /> },
    { id: 'booking', label: 'Agendar', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'services', label: 'Serviços', icon: <Scissors className="w-4 h-4" /> },
    { id: 'my-appointments', label: 'Agendamentos', icon: <Clock className="w-4 h-4" /> },
    { id: 'announcements', label: 'Mural', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'barber', label: 'Barbeiro', icon: <Star className="w-4 h-4" /> },
  ];

  const adminTabs: {
    id: typeof adminActiveTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'appointments', label: 'Agenda', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'services', label: 'Serviços', icon: <Scissors className="w-4 h-4" /> },
    { id: 'schedule', label: 'Horários', icon: <Clock className="w-4 h-4" /> },
    { id: 'payments', label: 'Caixa', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'reviews', label: 'Avaliações', icon: <Star className="w-4 h-4" /> },
    { id: 'announcements', label: 'Mural', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'cancellations', label: 'Cancelamentos', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 pointer-events-none select-none">
      {/* Popover Menu de Navegação Rápida entre Abas */}
      {isMenuOpen && (
        <div className="pointer-events-auto w-64 p-3 rounded-3xl bg-zinc-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200 space-y-2 mb-1">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Navegação Rápida</span>
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-white bg-zinc-800/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {activeView === 'client'
              ? clientTabs.map((tab) => {
                  const isActive = clientActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'booking' && !currentUser) {
                          openAuthModal();
                        } else {
                          setClientActiveTab(tab.id);
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl flex items-center gap-2 font-medium transition-all text-left ${
                        isActive
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {tab.icon}
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })
              : adminTabs.map((tab) => {
                  const isActive = adminActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setAdminActiveTab(tab.id);
                        setIsMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl flex items-center gap-2 font-medium transition-all text-left ${
                        isActive
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {tab.icon}
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-900"
            >
              <ArrowUp className="w-3 h-3" />
              <span>Ir ao topo</span>
            </button>
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-900"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Ir ao final</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Botão de Alternar Abas Rápido */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`h-11 px-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xl border backdrop-blur-md transition-all cursor-pointer ${
            isMenuOpen
              ? 'bg-amber-500 text-zinc-950 border-amber-400'
              : 'bg-zinc-950/90 text-amber-400 border-amber-500/40 hover:bg-zinc-900 hover:border-amber-400 hover:scale-105'
          }`}
          title="Alternar entre telas/abas rapidamente"
        >
          <Compass className="w-4 h-4" />
          <span className="hidden sm:inline">Mudar Tela</span>
        </button>

        {/* Botão Dinâmico de Rolar para o Final ou Topo da Página */}
        {isScrolled ? (
          <button
            onClick={scrollToTop}
            className="w-11 h-11 rounded-2xl bg-zinc-950/90 text-zinc-200 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/50 shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Voltar ao início da página"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={scrollToBottom}
            className="w-11 h-11 rounded-2xl bg-zinc-950/90 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/50 shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Rolar direto até o final da tela"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
