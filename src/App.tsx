import React, { useState } from 'react';
import { BarbershopProvider, useBarbershop } from './context/BarbershopContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { ClientView } from './components/client/ClientView';
import { AdminView } from './components/admin/AdminView';
import { AuthModal } from './components/client/AuthModal';
import { AdminNotificationsModal } from './components/admin/AdminNotificationsModal';
import { FloatingNavDock } from './components/navigation/FloatingNavDock';
import { 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Crown, 
  MessageCircle, 
  Sparkles, 
  CheckCircle2,
  Coffee
} from 'lucide-react';

const BarbershopApp: React.FC = () => {
  const { activeView, settings } = useBarbershop();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 overflow-x-hidden">
      
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

      {/* Cabeçalho de Navegação Superior (z-40) */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
      />

      {/* Conteúdo Dinâmico da Aplicação (z-10, sobreposto à imagem de fundo) */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-32 sm:pb-28 md:pb-24">
        {activeView === 'client' ? <ClientView /> : <AdminView />}
      </main>

      {/* Rodapé Institucional com fundo translúcido */}
      <footer className="relative z-10 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/80 mt-16 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-brand font-bold text-base text-zinc-100 tracking-wider">
                  {settings.name}
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed italic">
                "{settings.tagline}"
              </p>
              <div className="pt-1">
                <a
                  href="https://wa.me/556799440532"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>+55 67 9944-0532 - Mariano</span>
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-xs font-brand">
                Localização &amp; Contato
              </h4>
              <p className="flex items-start gap-2 text-zinc-400">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {settings.address} <br />
                  {settings.neighborhood} - {settings.city} <br />
                  <span className="text-amber-400/90 text-[11px] font-medium">
                    (Próximo à Escola Pedro Mendes Fontoura)
                  </span>
                </span>
              </p>
              <p className="flex items-center gap-2 text-zinc-400 pt-1">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="https://wa.me/556799440532" target="_blank" rel="noreferrer" className="hover:underline font-mono text-zinc-200">
                  +55 67 9944-0532 (Mariano)
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-xs font-brand">
                Horário de Atendimento
              </h4>
              <p className="text-zinc-400">
                <strong className="text-zinc-300">Segunda a Sábado:</strong> <br />
                08:30h às 12:00h • 14:00h às 19:00h
              </p>
              <p className="text-zinc-400">
                <strong className="text-zinc-300">Domingo:</strong> Fechada
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-xs font-brand">
                Diferenciais Estúdio VIP
              </h4>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-2 text-amber-300">
                  <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Café quentinho &amp; água gelada de cortesia</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Ambiente 100% climatizado
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Cortes alinhados &amp; navalhados
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <p>© {new Date().getFullYear()} {settings.name}. Coxim - MS. Todos os direitos reservados.</p>
            <p className="text-zinc-400 font-brand italic text-xs">"{settings.tagline}"</p>
          </div>
        </div>
      </footer>

      {/* Modais Globais & Toasts */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AdminNotificationsModal isOpen={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} />
      <FloatingNavDock />
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