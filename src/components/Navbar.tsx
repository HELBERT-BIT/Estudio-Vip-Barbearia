import React, { useState } from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { 
  Scissors, 
  Crown, 
  Clock, 
  Bell, 
  User, 
  ShieldCheck, 
  CalendarDays, 
  Megaphone, 
  PlusCircle,
  Menu,
  X,
  Power,
  Star,
  Home
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PushNotificationBanner } from './notifications/PushNotificationBanner';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenNotifications }) => {
  const { 
    settings, 
    isOpenNow, 
    setManualBarbershopStatus,
    activeView, 
    setActiveView, 
    clientActiveTab, 
    setClientActiveTab, 
    adminActiveTab, 
    setAdminActiveTab,
    notifications,
    activeSupabaseNotifications,
    currentUser,
    appointments,
    simulateIncomingBooking,
    getBarberRatingStats,
    isAdminLoggedIn
  } = useBarbershop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const statusInfo = isOpenNow();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const ratingStats = getBarberRatingStats();

  // Active bookings for the current client
  const clientActiveCount = appointments.filter(
    (apt) =>
      ['agendado', 'confirmado_presenca'].includes(apt.status) &&
      (!currentUser || apt.clientPhone === currentUser.phone || apt.clientName === currentUser.name)
  ).length;

  return (
    <header className="shrink-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80">
      {/* Top micro banner with business status & quick demo switch */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/40 px-3 sm:px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Status info */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 relative shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  statusInfo.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${
                  statusInfo.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span className={`font-bold text-[11px] sm:text-xs shrink-0 ${statusInfo.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
              {statusInfo.isOpen ? 'ABERTO' : 'FECHADO'}
            </span>
            <span className="text-zinc-600 shrink-0">•</span>
            <span className="text-zinc-300 font-medium truncate text-[11px] sm:text-xs">
              {statusInfo.message}
            </span>
            <span className="hidden md:inline-block text-zinc-600 shrink-0">•</span>
            <span className="hidden md:inline-block text-amber-400/90 font-medium whitespace-nowrap shrink-0">
              ⏰ Tolerância 10 min
            </span>
          </div>

          {/* Quick role switcher for demo */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
            {/* If in admin view AND logged in, show direct quick toggle button right in the top bar */}
            {activeView === 'admin' && isAdminLoggedIn && (
              <div className="hidden xs:flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800 shrink-0">
                <span className="text-[10px] text-zinc-400 font-medium">Porta:</span>
                <button
                  onClick={() => setManualBarbershopStatus(statusInfo.isOpen ? 'closed' : 'open')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    statusInfo.isOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-400'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-400'
                  }`}
                  title="Clique para alternar o status da barbearia entre Aberta e Fechada"
                >
                  <Power className="w-3 h-3" />
                  <span>{statusInfo.isOpen ? 'Aberta' : 'Fechada'}</span>
                </button>
              </div>
            )}

            <div className="bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                onClick={() => setActiveView('client')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
                  activeView === 'client'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Cliente</span>
              </button>
              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
                  activeView === 'admin'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Painel Dono</span>
                {unreadCount > 0 && isAdminLoggedIn && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity: Estúdio VIP */}
        <div 
          onClick={() => {
            if (activeView === 'client') setClientActiveTab('home');
            else setAdminActiveTab('overview');
          }}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0 min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="shrink-0 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-nowrap whitespace-nowrap">
              <span className="font-brand font-black text-base sm:text-lg tracking-wider text-zinc-100 uppercase group-hover:text-amber-400 transition-colors whitespace-nowrap">
                Estúdio VIP
              </span>
              <span className="text-amber-500 font-brand font-bold text-xs sm:text-sm tracking-widest uppercase whitespace-nowrap">
                Barbearia
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 tracking-wider font-medium whitespace-nowrap flex items-center gap-1">
              <span className="text-amber-400/90 font-semibold">Coxim - MS</span>
              <span className="hidden sm:inline text-zinc-500">•</span>
              <span className="hidden sm:inline">Estilo não é moda, é atitude!</span>
            </p>
          </div>
        </div>

        {/* Center Navigation depending on activeView */}
        {activeView === 'client' ? (
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 shrink-0">
            <button
              onClick={() => setClientActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                clientActiveTab === 'home'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Início</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth();
                } else {
                  setClientActiveTab('booking');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                clientActiveTab === 'booking'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span>Agendar</span>
            </button>
            <button
              onClick={() => setClientActiveTab('services')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                clientActiveTab === 'services'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 shrink-0" />
              <span>Serviços</span>
            </button>
            <button
              onClick={() => setClientActiveTab('my-appointments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
                clientActiveTab === 'my-appointments'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Meus Cortes</span>
              {clientActiveCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-zinc-950 text-[10px] font-bold rounded-full">
                  {clientActiveCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setClientActiveTab('announcements')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                clientActiveTab === 'announcements'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>Avisos</span>
              {activeSupabaseNotifications.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Avisos ao vivo do barbeiro" />
              )}
            </button>
            <button
              onClick={() => setClientActiveTab('barber')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                clientActiveTab === 'barber'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-400 shrink-0" />
              <span>Barbeiro ({ratingStats.average}★)</span>
            </button>
          </nav>
        ) : isAdminLoggedIn ? (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel do Dono
            </span>
            <button
              onClick={simulateIncomingBooking}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 px-3 py-1.5 rounded-lg border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Gera um agendamento fictício para testar a notificação em tempo real"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Simular Agendamento</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 shrink-0 text-xs text-zinc-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Acesso Restrito ao Administrador</span>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Botão de Ativar Avisos do Barbeiro no Topo */}
          {activeView === 'client' && (
            <PushNotificationBanner variant="button" className="hidden lg:flex" />
          )}

          {/* Botão Visível de Instalar App da Barbearia (PWA) */}
          <PWAInstallButton variant="navbar" />

          {/* Admin Notification Bell (ONLY shown if admin is logged in!) */}
          {activeView === 'admin' ? (
            isAdminLoggedIn ? (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors shrink-0 cursor-pointer"
                title="Notificações do Dono"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            ) : null
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-xs text-zinc-200 transition-all hover:bg-zinc-800/80 shrink-0"
              title={currentUser ? `Logado como ${currentUser.name}` : 'Acessar ou Criar Conta'}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser ? currentUser.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-zinc-200 leading-none">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Entrar / Cadastro'}
                </p>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  {currentUser ? 'Cliente' : 'Acesso Rápido'}
                </p>
              </div>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 py-3 space-y-2.5 animate-in slide-in-from-top duration-200">
          {/* Card destacado no menu mobile para instalar o app */}
          <PWAInstallButton variant="menu" />

          {/* Botão direto para ativar avisos do barbeiro no menu mobile */}
          {activeView === 'client' && (
            <PushNotificationBanner variant="button" className="w-full justify-center py-2.5" />
          )}

          {activeView === 'client' ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setClientActiveTab('home');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
                  clientActiveTab === 'home'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <Home className="w-4 h-4" />
                Início
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth();
                  } else {
                    setClientActiveTab('booking');
                  }
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
                  clientActiveTab === 'booking'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Agendar Horário
              </button>
              <button
                onClick={() => {
                  setClientActiveTab('services');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
                  clientActiveTab === 'services'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <Scissors className="w-4 h-4" />
                Serviços
              </button>
              <button
                onClick={() => {
                  setClientActiveTab('my-appointments');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
                  clientActiveTab === 'my-appointments'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                Meus Cortes
              </button>
              <button
                onClick={() => {
                  setClientActiveTab('announcements');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
                  clientActiveTab === 'announcements'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                Avisos
              </button>
              <button
                onClick={() => {
                  setClientActiveTab('barber');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 ${
                  clientActiveTab === 'barber'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Barbeiro ({ratingStats.average}★)
              </button>
            </div>
          ) : isAdminLoggedIn ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-300 font-medium">Status da Barbearia:</span>
                <button
                  onClick={() => setManualBarbershopStatus(statusInfo.isOpen ? 'closed' : 'open')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    statusInfo.isOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {statusInfo.isOpen ? 'Ativada (Aberta)' : 'Desativada (Fechada)'}
                </button>
              </div>

              <button
                onClick={simulateIncomingBooking}
                className="w-full text-xs bg-zinc-900 hover:bg-zinc-800 text-amber-400 p-2.5 rounded-lg border border-amber-500/30 flex items-center justify-center gap-2 font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                Simular Novo Agendamento Agora
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-300 font-medium">Painel Restrito ao Dono (Mariano)</p>
              <p className="text-[11px] text-zinc-500 mt-1">Digite seu usuário e senha no formulário abaixo para acessar a gestão.</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export const MobileBottomNav: React.FC<NavbarProps> = ({ onOpenAuth, onOpenNotifications }) => {
  const {
    activeView,
    setActiveView,
    clientActiveTab,
    setClientActiveTab,
    adminActiveTab,
    setAdminActiveTab,
    notifications,
    activeSupabaseNotifications,
    currentUser,
    appointments,
    isAdminLoggedIn,
  } = useBarbershop();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const clientActiveCount = appointments.filter(
    (apt) =>
      ['agendado', 'confirmado_presenca'].includes(apt.status) &&
      (!currentUser || apt.clientPhone === currentUser.phone || apt.clientName === currentUser.name)
  ).length;

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="md:hidden shrink-0 z-40 w-full bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl"
    >
      {activeView === 'client' || !isAdminLoggedIn ? (
        <>
          <button
            type="button"
            onClick={() => {
              setActiveView('client');
              setClientActiveTab('home');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all min-w-[50px] ${
              activeView === 'client' && clientActiveTab === 'home'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeView === 'client' && clientActiveTab === 'home' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Início</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('client');
              if (!currentUser) {
                onOpenAuth();
              } else {
                setClientActiveTab('booking');
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all min-w-[50px] ${
              activeView === 'client' && clientActiveTab === 'booking'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeView === 'client' && clientActiveTab === 'booking' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Agendar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('client');
              setClientActiveTab('services');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              activeView === 'client' && clientActiveTab === 'services'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeView === 'client' && clientActiveTab === 'services' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Scissors className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Serviços</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('client');
              setClientActiveTab('my-appointments');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] relative ${
              activeView === 'client' && clientActiveTab === 'my-appointments'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${activeView === 'client' && clientActiveTab === 'my-appointments' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Clock className="w-5 h-5" />
              {clientActiveCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {clientActiveCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Meus Horários</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('client');
              setClientActiveTab('announcements');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              activeView === 'client' && clientActiveTab === 'announcements'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`relative p-1 rounded-lg ${activeView === 'client' && clientActiveTab === 'announcements' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Megaphone className="w-5 h-5" />
              {activeSupabaseNotifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-zinc-950" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Avisos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('client');
              setClientActiveTab('barber');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              activeView === 'client' && clientActiveTab === 'barber'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeView === 'client' && clientActiveTab === 'barber' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Star className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Barbeiro</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setAdminActiveTab('overview')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              adminActiveTab === 'overview'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${adminActiveTab === 'overview' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Crown className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveTab('appointments')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              adminActiveTab === 'appointments'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${adminActiveTab === 'appointments' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveTab('schedule')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              adminActiveTab === 'schedule'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${adminActiveTab === 'schedule' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Horários/Slots</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveTab('services')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              adminActiveTab === 'services'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${adminActiveTab === 'services' ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Scissors className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Serviços</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] text-zinc-400 hover:text-zinc-200 relative"
          >
            <div className="p-1 rounded-lg relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Alertas</span>
          </button>
        </>
      )}
    </nav>
  );
};
