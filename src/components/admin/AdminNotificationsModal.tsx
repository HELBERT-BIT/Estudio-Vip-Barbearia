import React from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Bell, X, Check, Timer, Scissors, CreditCard, ShieldAlert } from 'lucide-react';

interface AdminNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminNotificationsModal: React.FC<AdminNotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setAdminActiveTab } = useBarbershop();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'novo_agendamento':
        return <Scissors className="w-4 h-4 text-amber-400" />;
      case 'cancelamento_atraso':
        return <Timer className="w-4 h-4 text-rose-400" />;
      case 'pagamento_confirmado':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-zinc-100 font-brand text-base">
              Notificações do Proprietário
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-zinc-950/30 border-b border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {notifications.filter((n) => !n.read).length} não lidas
          </span>
          <button
            onClick={markAllNotificationsAsRead}
            className="text-amber-400 hover:text-amber-300 font-semibold"
          >
            Marcar todas como lidas
          </button>
        </div>

        {/* Notifications list */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-xs text-zinc-500">
              Nenhuma notificação recebida ainda.
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  setAdminActiveTab('appointments');
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                    : 'bg-zinc-950 border-amber-500/40 shadow-md shadow-black/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-zinc-100 truncate">{notif.title}</h4>
                      <span className="text-[10px] text-zinc-500 shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-zinc-300 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
