import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Database, RefreshCw, CheckCircle2, Code, Copy, Check, ExternalLink, X } from 'lucide-react';
import { SUPABASE_URL } from '../../lib/supabase';

export const SupabaseStatusBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isSupabaseConnected, refreshSupabaseAppointments, showToast } = useBarbershop();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSupabaseAppointments();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dados sincronizados com o Supabase com sucesso!', 'success', '⚡ Supabase');
    }, 600);
  };

  const sqlScript = `-- 💈 Tabela de Agendamentos em Tempo Real - Estúdio VIP Barbearia
-- Execute no SQL Editor do seu Supabase (https://cmjrsttgfbjksxsyntf.supabase.co)

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  service_id TEXT,
  service_name TEXT NOT NULL,
  service_price NUMERIC,
  service_duration INTEGER,
  service_ids JSONB,
  services JSONB,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  tolerance_expiry_time TEXT,
  payment_type TEXT,
  payment_method TEXT,
  payment_status TEXT,
  deposit_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  remaining_payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'agendado',
  cancellation_reason TEXT,
  cancelled_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TEXT,
  completed_at TEXT,
  notes TEXT
);

-- Ativar Realtime (para que os dados apareçam instantaneamente no telemóvel e no PC)
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Permissões de Leitura e Escrita
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica" ON appointments FOR SELECT USING (true);
CREATE POLICY "Permitir insercao publica" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao publica" ON appointments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delecao publica" ON appointments FOR DELETE USING (true);
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setHasCopiedSql(true);
    showToast('Script SQL copiado para a área de transferência!', 'info');
    setTimeout(() => setHasCopiedSql(false), 3000);
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              isSupabaseConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
            title={`Supabase: ${SUPABASE_URL}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono">
              {isSupabaseConnected ? '⚡ Supabase Realtime Ativo' : '⚡ Supabase Conectando...'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Sincronizar agendamentos agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition-colors text-[11px]"
            title="Ver Script SQL da Tabela appointments"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal SQL */}
        {isSqlModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-zinc-100">
                    Estrutura da Tabela appointments no Supabase
                  </h3>
                </div>
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-300">
                  Caso ainda não tenha criado a tabela no painel do Supabase, copie o comando SQL abaixo e execute na aba <strong>SQL Editor</strong> do seu projeto Supabase:
                </p>

                <div className="relative">
                  <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-amber-300 font-mono overflow-x-auto max-h-64 selection:bg-amber-500/30">
                    {sqlScript}
                  </pre>
                  <button
                    onClick={copySql}
                    className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                  >
                    {hasCopiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong>Sincronização Instantânea Ativa:</strong> Qualquer agendamento, cancelamento ou pagamento feito no celular do cliente ou no painel administrativo do PC é transmitido em tempo real pelo canal Realtime do Supabase.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isSupabaseConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                Integração Supabase Cloud &amp; Realtime
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isSupabaseConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                {isSupabaseConnected ? 'Conectado em Tempo Real' : 'Sincronizado / Cache Ativo'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              URL: {SUPABASE_URL.replace('https://', '')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Recarregar agendamentos do Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ver Script SQL da Tabela"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Script SQL</span>
          </button>
        </div>
      </div>

      {/* Modal SQL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Estrutura da Tabela appointments no Supabase
                </h3>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-zinc-300">
                Execute no <strong>SQL Editor</strong> do seu projeto Supabase para habilitar o armazenamento e atualizações automáticas em tempo real:
              </p>

              <div className="relative">
                <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-amber-300 font-mono overflow-x-auto max-h-64 selection:bg-amber-500/30">
                  {sqlScript}
                </pre>
                <button
                  onClick={copySql}
                  className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                >
                  {hasCopiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Sincronização Instantânea:</strong> Agendamentos feitos pelo celular dos clientes ou pelo PC do barbeiro aparecem automaticamente em tempo real sem precisar recarregar a página!
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
