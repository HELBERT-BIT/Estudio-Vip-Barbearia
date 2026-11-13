import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BookingWizard } from './BookingWizard';
import { MyAppointments } from './MyAppointments';
import { AnnouncementsFeed } from './AnnouncementsFeed';
import { BarberProfileView } from './BarberProfileView';
import { 
  Scissors, 
  Clock, 
  MapPin, 
  CalendarDays, 
  ShieldCheck, 
  ChevronRight, 
  Megaphone,
  Crown,
  Sparkles,
  Phone,
  Coffee,
  Star,
  MessageCircle,
  Home,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PWAInstallButton } from '../PWAInstallButton';
import { PushNotificationBanner } from '../notifications/PushNotificationBanner';
import { RealtimeNotificationsBanner } from './RealtimeNotificationsBanner';

export const ClientView: React.FC = () => {
  const { 
    settings, 
    services, 
    clientActiveTab, 
    setClientActiveTab, 
    isOpenNow,
    announcements,
    currentUser,
    openAuthModal,
    getBarberRatingStats 
  } = useBarbershop();

  const stats = getBarberRatingStats();

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | undefined>(undefined);

  const status = isOpenNow();
  const importantAnnouncement = announcements.find((a) => a.active && a.important);

  const categories: { id: string; label: string }[] = [
    { id: 'todos', label: 'Todos os Serviços' },
    { id: 'cabelo', label: 'Cortes de Cabelo' },
    { id: 'barba', label: 'Barba' },
    { id: 'sobrancelha', label: 'Sobrancelha' },
  ];

  const filteredServices = services.filter((s) => {
    if (!s.active) return false;
    if (selectedCategory === 'todos') return true;
    return s.category === selectedCategory;
  });

  const popularServices = services.filter((s) => s.active && s.popular).slice(0, 3);

  const handleBookServiceDirectly = (serviceId?: string) => {
    setPreSelectedServiceId(serviceId);
    if (!currentUser) {
      openAuthModal();
    } else {
      setClientActiveTab('booking');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 w-full max-w-full">
      {/* ========================================================================= */}
      {/* BARRA DE NAVEGAÇÃO DE ABAS SUPERIOR (Mobile & Desktop)                    */}
      {/* ========================================================================= */}
      <div 
        onWheel={(e) => {
          if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex flex-nowrap md:flex-wrap border-b border-zinc-800/80 gap-2 pb-2.5 overflow-x-auto md:overflow-x-visible scrollbar-none touch-pan-x overscroll-x-contain scroll-smooth"
      >
        <button
          onClick={() => setClientActiveTab('home')}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            clientActiveTab === 'home'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800/60'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Início</span>
        </button>

        <button
          onClick={() => handleBookServiceDirectly(undefined)}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            clientActiveTab === 'booking'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800/60'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Agendar</span>
        </button>

        <button
          onClick={() => setClientActiveTab('services')}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            clientActiveTab === 'services'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800/60'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Serviços</span>
        </button>

        <button
          onClick={() => setClientActiveTab('my-appointments')}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            clientActiveTab === 'my-appointments'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Meus Cortes</span>
        </button>

        <button
          onClick={() => setClientActiveTab('announcements')}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            clientActiveTab === 'announcements'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Avisos</span>
        </button>

        <button
          onClick={() => setClientActiveTab('barber')}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            clientActiveTab === 'barber'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span>Barbeiro ({stats.average}★)</span>
        </button>
      </div>

      {/* Banner de Avisos em Tempo Real (Exibido fora do fluxo de agendamento/pagamento para manter foco total na ação) */}
      {clientActiveTab !== 'booking' && <RealtimeNotificationsBanner />}

      {/* ========================================================================= */}
      {/* ABA INÍCIO: HERO BANNER DESTACADO COM A IMAGEM REALÇADA DENTRO DO CARD    */}
      {/* EXCLUSIVO DA TELA INICIAL (NÃO APARECE NAS OUTRAS ABAS)                   */}
      {/* ========================================================================= */}
      {clientActiveTab === 'home' && (
        <div key="tab-home" className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
          {/* Card Principal Hero com Imagem 3D Realçada no Fundo do Quadrado */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 shadow-2xl p-4 sm:p-8 md:p-10 bg-zinc-950/85 backdrop-blur-md max-w-full">
            
            {/* IMAGEM DO EMBLEMA COMO PLANO DE FUNDO REALÇADO DENTRO DO PRÓPRIO QUADRADO */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-3xl">
              <img 
                src="/assets/aistudio/image_8c6b8778.png" 
                alt="Emblema Estúdio VIP Barbearia" 
                className="w-full h-full object-cover object-center opacity-65 sm:opacity-80 filter brightness-105 contrast-125 scale-105" 
              />
              {/* Degradês cinematográficos para destacar o emblema sem prejudicar a leitura do texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/75 to-zinc-950/40" />
              <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/35 rounded-3xl" />
            </div>

            {/* Efeitos de luz dourada ambiente */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/15 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

            {/* Conteúdo com espaçamento e quebras de linha blindadas contra overflow */}
            <div className="relative z-10 max-w-4xl space-y-4 sm:space-y-5">
              
              {/* Badges de Status, Localização e Avaliação */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border ${
                    status.isOpen
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  <span>
                    {status.isOpen 
                      ? (status.isManualOverride ? 'Barbearia Aberta (Confirmado)' : 'Barbearia Aberta')
                      : (status.isManualOverride ? 'Fechada pelo Proprietário' : 'Barbearia Fechada')}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-zinc-900/95 border border-zinc-800 text-zinc-300 max-w-full">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {settings.neighborhood}, Coxim - MS
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Atendimento VIP
                </span>

                {/* Avaliações do Mariano */}
                <button
                  type="button"
                  onClick={() => setClientActiveTab('barber')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition-all shadow-sm group cursor-pointer max-w-full"
                  title="Clique para ver o perfil e avaliações do barbeiro Mariano"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="truncate">{stats.average} ({stats.count} avaliações)</span>
                  <span className="text-[10px] text-amber-400/80 group-hover:text-amber-200 underline ml-0.5 hidden sm:inline">
                    • Ver Mariano
                  </span>
                </button>
              </div>

              {/* Títulos e Textos Principais - Com quebra segura em qualquer tamanho de tela */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-brand tracking-tight text-zinc-100 leading-tight break-words">
                  {settings.name}
                </h1>

                <p className="text-base sm:text-xl md:text-2xl text-amber-400 font-brand font-semibold italic break-words">
                  "{settings.tagline}"
                </p>

                <p className="text-xs sm:text-sm md:text-base text-zinc-200 pt-1 leading-relaxed max-w-3xl break-words">
                  Localizada no bairro São Judas Tadeu, próximo à <strong className="text-white font-bold">Escola Pedro Mendes Fontoura</strong> em Coxim - MS. 
                  Atendimento de segunda a sábado das 08:30h às 12:00h e das 14:00h às 19:00h. Agende seu horário com antecedência!
                </p>

                {/* Alerta de abertura manual caso ativada */}
                {status.isOpen && status.isManualOverride && (
                  <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <div className="break-words">
                      <strong className="text-white uppercase tracking-wide">Atendimento Confirmado Hoje:</strong>{' '}
                      O barbeiro Mariano ativou o expediente para hoje! Os horários já estão liberados no agendamento online.
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação Rápida - Flexíveis e acessíveis no mobile */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-2 w-full">
                <button
                  onClick={() => handleBookServiceDirectly(undefined)}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-zinc-950 shrink-0" />
                  <span>Agendar Horário Online</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  onClick={() => setClientActiveTab('services')}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Ver Serviços &amp; Preços</span>
                </button>

                <a
                  href="https://wa.me/556799440532"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Falar no WhatsApp com o Mariano"
                >
                  <MessageCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="truncate">WhatsApp: (67) 9944-0532</span>
                </a>
              </div>

              {/* Diferenciais em Grid Compacto e Blindado contra Overflow */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                  <Coffee className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <strong className="text-amber-300 block truncate">Cortesia Exclusiva:</strong>
                    <span className="text-zinc-300 text-xs break-words">
                      Café quentinho &amp; água gelada de cortesia.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/85 border border-zinc-800 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <strong className="text-zinc-200 block truncate">Tolerância 10 min:</strong>
                    <span className="text-zinc-400 text-xs break-words">
                      Chegue 5 a 10 min antes. Pontualidade rigorosa.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/85 border border-zinc-800 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <strong className="text-zinc-200 block truncate">Atendimento:</strong>
                    <span className="text-zinc-400 text-xs break-words">
                      Seg a Sáb (08:30 às 19:00). Domingo sob aviso.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card / Banner de Instalação do App PWA */}
          <PWAInstallButton variant="banner" />

          {/* Banner de Notificações Web Push (Alertas de Horários & Lembretes) */}
          <PushNotificationBanner variant="banner" />

          {/* Micro Banner de Aviso Importante caso configurado */}
          {importantAnnouncement && (
            <div 
              onClick={() => setClientActiveTab('announcements')}
              className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-500/20 transition-colors shadow-lg shadow-amber-500/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Megaphone className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Mural de Avisos &amp; Novidades
                  </span>
                  <p className="text-xs text-zinc-100 font-medium truncate">{importantAnnouncement.title}</p>
                </div>
              </div>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 shrink-0">
                Ver aviso <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Seção de Serviços Populares na Home com Agendamento Direto */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-brand text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Serviços Mais Procurados
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Escolha um ou monte seu combo no agendamento.
                </p>
              </div>

              <button
                onClick={() => setClientActiveTab('services')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="relative h-40 bg-zinc-950 overflow-hidden">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-amber-400 ${service.imageUrl ? 'hidden' : 'flex'}`}
                    >
                      <Scissors className="w-10 h-10 opacity-30" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-zinc-950 shadow-md">
                      Mais Pedido
                    </span>

                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md border border-zinc-800 text-amber-400 font-brand font-bold text-sm">
                      R$ {service.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm group-hover:text-amber-400 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {service.durationMinutes} min
                      </span>

                      <button
                        onClick={() => handleBookServiceDirectly(service.id)}
                        className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                      >
                        <span>Agendar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Resumo do Barbeiro Mariano & Avaliações */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0 shadow-md">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-amber-400 font-brand font-black text-sm">
                  VIP
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-zinc-100 text-sm">Mariano • Barbeiro Master</h4>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {stats.average} ({stats.count} avaliações)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Especialista em degradê, cortes clássicos e barba alinhada em Coxim - MS.
                </p>
              </div>
            </div>

            <button
              onClick={() => setClientActiveTab('barber')}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors shrink-0"
            >
              <span>Ver Perfil &amp; Avaliações</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Informações Institucionais da Barbearia (Exclusivas da Aba Início) */}
          <footer className="rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 p-5 sm:p-7 text-zinc-400 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 mb-6">
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

            <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500">
              <p>© {new Date().getFullYear()} {settings.name}. Coxim - MS. Todos os direitos reservados.</p>
              <p className="text-zinc-400 font-brand italic text-xs">"{settings.tagline}"</p>
            </div>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OUTRAS ABAS: EXIBIDAS DIRETAMENTE NO TOPO (SEM O HERO CARD E SEM RODAPÉ)  */}
      {/* ========================================================================= */}

      {/* Aba de Agendamento */}
      {clientActiveTab === 'booking' && (
        <div key="tab-booking" className="animate-in fade-in duration-200">
          <BookingWizard 
            onBookingSuccess={() => setClientActiveTab('my-appointments')} 
            preSelectedServiceId={preSelectedServiceId}
          />
        </div>
      )}

      {/* Aba Meus Agendamentos */}
      {clientActiveTab === 'my-appointments' && (
        <div key="tab-my-appointments" className="animate-in fade-in duration-200">
          <MyAppointments />
        </div>
      )}

      {/* Aba Mural de Avisos */}
      {clientActiveTab === 'announcements' && (
        <div key="tab-announcements" className="animate-in fade-in duration-200">
          <AnnouncementsFeed />
        </div>
      )}

      {/* Aba Perfil do Barbeiro & Avaliações */}
      {clientActiveTab === 'barber' && (
        <div key="tab-barber" className="animate-in fade-in duration-200">
          <BarberProfileView />
        </div>
      )}

      {/* Aba Tabela de Serviços & Preços */}
      {clientActiveTab === 'services' && (
        <div key="tab-services" className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-brand text-zinc-100">
                Tabela Oficial de Serviços &amp; Preços
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Estúdio VIP Barbearia • Coxim - MS • Valores originais conforme tabela oficial.
              </p>
            </div>

            {/* Filtros de Categoria */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-lg hover:shadow-amber-500/5"
              >
                {/* Imagem do Serviço */}
                <div className="relative w-full h-48 sm:h-52 bg-zinc-950 overflow-hidden">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-amber-400 ${service.imageUrl ? 'hidden' : 'flex'}`}
                  >
                    <Scissors className="w-12 h-12 opacity-30" />
                  </div>

                  {/* Scrim degradê */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-950/20 to-transparent pointer-events-none" />

                  {/* Badges sobrepostos */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-800">
                      {service.category}
                    </span>
                    {service.popular && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-zinc-950 shadow-md">
                        Mais Pedido
                      </span>
                    )}
                  </div>

                  {/* Etiqueta de Preço */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80">
                    <span className="font-brand text-base font-bold text-amber-400 tabular-nums">
                      R$ {service.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-lg group-hover:text-amber-400 transition-colors mb-2">
                      {service.name}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.durationMinutes} minutos
                    </span>

                    <button
                      onClick={() => handleBookServiceDirectly(service.id)}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                    >
                      <span>Agendar Horário</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
