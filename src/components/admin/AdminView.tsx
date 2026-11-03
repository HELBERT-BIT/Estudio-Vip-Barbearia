import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminSchedule } from './AdminSchedule';
import { AdminServices } from './AdminServices';
import { AdminHoursConfig } from './AdminHoursConfig';
import { AdminPayments } from './AdminPayments';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminCancellationsLog } from './AdminCancellationsLog';
import { AdminReviewsManager } from './AdminReviewsManager';
import { AdminLogin } from './AdminLogin';
import { AdminPushDispatcherModal } from './AdminPushDispatcherModal';
import { AdminResetTestDataModal } from './AdminResetTestDataModal';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Scissors, 
  Clock, 
  DollarSign, 
  Megaphone, 
  ShieldAlert, 
  Star,
  LogOut,
  BellRing,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { 
    adminActiveTab, 
    setAdminActiveTab, 
    appointments,
    reviews,
    isSystemCleaned,
    showToast
  } = useBarbershop();

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('estudio_vip_admin_logged') === 'true';
  });

  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('estudio_vip_admin_logged');
    setIsAdminLoggedIn(false);
    showToast('Sessão encerrada com sucesso.', 'info', 'Logout');
  };

  if (!isAdminLoggedIn) {
    return <AdminLogin onLoginSuccess={() => setIsAdminLoggedIn(true)} />;
  }

  const delayedCount = appointments.filter((a) => a.status === 'cancelado_atraso').length;
  const unrepliedReviewsCount = reviews.filter((r) => !r.ownerReply).length;

  const tabs: {
    id: typeof adminActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'appointments',
      label: 'Agenda do Dia',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'services',
      label: 'Serviços & Preços',
      icon: <Scissors className="w-4 h-4" />,
    },
    {
      id: 'schedule',
      label: 'Horários & Expediente',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'payments',
      label: 'Controle de Caixa',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: 'reviews',
      label: 'Avaliações dos Clientes',
      icon: <Star className="w-4 h-4" />,
      badge: unrepliedReviewsCount > 0 ? unrepliedReviewsCount : undefined,
    },
    {
      id: 'announcements',
      label: 'Mural de Avisos & Novidades',
      icon: <Megaphone className="w-4 h-4" />,
    },
    {
      id: 'cancellations',
      label: 'Cancelamentos & Atrasos',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: delayedCount > 0 ? delayedCount : undefined,
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top action bar: Tabs + Push Notification + Reset Test Data + Logout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-zinc-800 gap-3 pb-3">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          {tabs.map((tab) => {
            const isActive = adminActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-zinc-950 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Admin Tools: Push Alerts & Reset Test Data */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Botão de Disparo de Notificação Push */}
          <button
            type="button"
            onClick={() => setIsPushModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Disparar notificação push aos clientes (alteração de horário, lembretes, avisos)"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Disparar Notificação</span>
          </button>

          {/* Botão de Limpar/Zerar Dados de Teste */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isSystemCleaned
                ? 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40'
            }`}
            title="Apaga apenas agendamentos de teste e avaliações fictícias, deixando o sistema zerado para o primeiro cliente real"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isSystemCleaned ? 'Sistema Zerado' : 'Limpar Dados de Teste'}</span>
          </button>

          {/* Sair do Painel */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            title="Encerrar sessão de administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Admin Views */}
      {adminActiveTab === 'overview' && <AdminDashboard />}
      {adminActiveTab === 'appointments' && <AdminSchedule />}
      {adminActiveTab === 'services' && <AdminServices />}
      {adminActiveTab === 'schedule' && <AdminHoursConfig />}
      {adminActiveTab === 'payments' && <AdminPayments />}
      {adminActiveTab === 'reviews' && <AdminReviewsManager />}
      {adminActiveTab === 'announcements' && <AdminAnnouncements />}
      {adminActiveTab === 'cancellations' && <AdminCancellationsLog />}

      {/* Modals */}
      <AdminPushDispatcherModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />

      <AdminResetTestDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
