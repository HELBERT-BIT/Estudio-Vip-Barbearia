import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useBarbershop } from '../../context/BarbershopContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { setActiveView, adminLogin } = useBarbershop();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const success = adminLogin(username, password);
    if (success) {
      onLoginSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-3xl shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/10">
        <Lock className="w-8 h-8" />
      </div>
      
      <div>
        <h3 className="text-xl font-bold font-brand text-zinc-100">Painel Restrito - Estúdio VIP</h3>
        <p className="text-xs text-zinc-400 mt-1">Acesso exclusivo para gestão da barbearia (Mariano).</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Usuário Administrador
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              required
              placeholder="Digite o usuário"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Senha Secreta
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-semibold">
            Usuário ou senha incorretos. Verifique os dados informados.
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Entrar no Painel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('client')}
          className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Área do Cliente</span>
        </button>
      </form>
    </div>
  );
};
