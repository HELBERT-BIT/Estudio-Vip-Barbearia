import React from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBarbershop();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-amber-300 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-zinc-900/95 text-zinc-100 shadow-emerald-950/40';
      case 'warning':
        return 'border-amber-500/40 bg-zinc-900/95 text-zinc-100 shadow-amber-950/40';
      case 'error':
        return 'border-rose-500/40 bg-zinc-900/95 text-zinc-100 shadow-rose-950/40';
      default:
        return 'border-amber-500/30 bg-zinc-900/95 text-zinc-100 shadow-black/60';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${getBorderColor(
            toast.type
          )}`}
        >
          {getIcon(toast.type)}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-xs font-semibold tracking-wider uppercase text-amber-400/90 mb-0.5">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-zinc-200 leading-snug break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
