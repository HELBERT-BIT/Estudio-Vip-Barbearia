import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { X, Lock, Mail, Phone, User, CheckCircle2, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'register',
  onSuccess 
}) => {
  const { currentUser, registeredClients, loginClient, logoutClient, setClientActiveTab } = useBarbershop();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail) return;

    // Procura na base de clientes cadastrados
    const inputClean = phoneOrEmail.trim();
    const isEmail = inputClean.includes('@');
    const cleanDigits = inputClean.replace(/\D/g, '');
    const existing = registeredClients.find((c) => {
      const matchEmail = isEmail && c.email?.toLowerCase() === inputClean.toLowerCase();
      const matchPhone = !isEmail && cleanDigits.length >= 8 && c.phone.replace(/\D/g, '').includes(cleanDigits);
      return matchEmail || matchPhone;
    });

    let resolvedName = name.trim();
    if (!resolvedName && existing && existing.name && existing.name !== 'Cliente Cadastrado') {
      resolvedName = existing.name;
    } else if (!resolvedName && isEmail) {
      // Gera nome real formatado a partir do prefixo do email (ex: homegasilva34 -> Homega Silva)
      const userPart = inputClean.split('@')[0].replace(/[0-9_.-]/g, ' ').trim();
      resolvedName = userPart
        ? userPart.split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Cliente';
    }

    loginClient(phoneOrEmail, resolvedName, email || existing?.email, password);
    setClientActiveTab('booking');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Estúdio VIP Barbearia
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-100 font-brand mt-1">
              {currentUser 
                ? 'Perfil do Cliente' 
                : isRegister 
                ? 'Criar Conta de Cliente' 
                : 'Acessar Minha Conta'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {currentUser 
                ? 'Seus dados e agendamentos salvos no seu aparelho' 
                : isRegister
                ? 'Cadastre-se para agendar seu horário com facilidade'
                : 'Digite seus dados para acessar seus agendamentos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                  {currentUser.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-zinc-100 truncate">{currentUser.name}</h4>
                  <p className="text-xs text-zinc-400 font-mono">{currentUser.phone}</p>
                  {currentUser.email && <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Login ativo e salvo automaticamente no seu dispositivo.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
                >
                  Continuar Agendando
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logoutClient();
                    onClose();
                  }}
                  className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Toggle Register / Login */}
              <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isRegister
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Criar Conta
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isRegister
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Já Tenho Conta
                </button>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {isRegister ? 'WhatsApp (Telefone) *' : 'WhatsApp ou E-mail *'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="(67) 99944-0532"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    E-mail (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Digite sua senha que usará nas próximas vezes"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Seu login ficará salvo automaticamente neste aparelho.</span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-2"
              >
                {isRegister ? 'Criar Conta & Ficar Conectado' : 'Entrar na Conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
