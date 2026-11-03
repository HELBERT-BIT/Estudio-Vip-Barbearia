import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import {
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Scissors,
  Clock,
  Lock,
  RotateCcw
} from 'lucide-react';

interface AdminResetTestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminResetTestDataModal: React.FC<AdminResetTestDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { resetTestData, appointments, reviews, isSystemCleaned } = useBarbershop();
  const [isResetting, setIsResetting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = () => {
    setIsResetting(true);
    try {
      resetTestData();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-left space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 font-brand">
              Zerar Dados de Teste
            </h3>
            <p className="text-xs text-zinc-400">
              Prepare o sistema para receber seus primeiros clientes reais.
            </p>
          </div>
        </div>

        {/* Current status info */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-300">
            <span>Agendamentos de teste atuais:</span>
            <strong className="text-amber-400 font-bold">{appointments.length}</strong>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Avaliações fictícias atuais:</span>
            <strong className="text-amber-400 font-bold">{reviews.length}</strong>
          </div>
        </div>

        {/* Breakdown of what is cleaned vs what is preserved */}
        <div className="space-y-3 text-xs">
          {/* Will be cleaned */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-400 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>O que será apagado (dados temporários):</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-zinc-300 text-[11px]">
              <li>Todos os agendamentos de teste e simulações na agenda</li>
              <li>Todas as avaliações fictícias e comentários de demonstração</li>
              <li>Notificações temporárias da simulação de teste</li>
            </ul>
          </div>

          {/* Will be strictly preserved */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>O que permanecerá 100% intacto e protegido:</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-zinc-300 text-[11px]">
              <li>
                <strong className="text-white">Lista de Serviços &amp; Preços:</strong> Todos os cortes, barba, sobrancelha e fotos originais.
              </li>
              <li>
                <strong className="text-white">Horários de Funcionamento:</strong> 08:30 às 19:00 e intervalos configurados.
              </li>
              <li>
                <strong className="text-white">Regras de Atendimento:</strong> Tolerância de 10 minutos e regras da casa.
              </li>
              <li>
                <strong className="text-white">Painel do Proprietário:</strong> Usuário e senha administrativa preservados.
              </li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmReset}
            disabled={isResetting || success}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              success
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/20'
            }`}
          >
            {success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Sistema Zerado!</span>
              </>
            ) : isResetting ? (
              <span>Limpando...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Zerar Dados de Teste</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
