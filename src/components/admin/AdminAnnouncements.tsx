import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Announcement } from '../../types';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Tag, 
  AlertCircle, 
  Radio, 
  Send, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  RefreshCw,
  Bell
} from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const { 
    announcements, 
    addAnnouncement, 
    deleteAnnouncement, 
    toggleAnnouncement,
    supabaseNotifications,
    sendBarberAnnouncement,
    deleteBarberAnnouncement,
    refreshSupabaseNotifications,
    showToast
  } = useBarbershop();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [badge, setBadge] = useState<Announcement['badge']>('Aviso');
  const [type, setType] = useState<string>('aviso');
  const [isSending, setIsSending] = useState(false);

  // Quick 1-click templates for Mariano
  const quickTemplates = [
    {
      label: '⏰ Tolerância de 10 min',
      title: '⏰ Lembrete: Tolerância de 10 minutos',
      content: 'Atenção ao horário agendado! Há tolerância máxima de 10 minutos para manter a pontualidade de todos os clientes.',
      badge: 'Horário' as Announcement['badge'],
      type: 'horario',
    },
    {
      label: '💈 Vagas de Encaixe Hoje',
      title: '💈 Vagas de Encaixe Liberadas para Hoje!',
      content: 'Abrimos horários extras na agenda de hoje! Acesse a aba Agendar Horário no app para garantir sua vaga.',
      badge: 'Novidade' as Announcement['badge'],
      type: 'promocao',
    },
    {
      label: '⚠️ Fechamento Antecipado',
      title: '⚠️ Expediente Encerrado Mais Cedo Hoje',
      content: 'Hoje encerraremos o atendimento 1 hora mais cedo para manutenção e organização do estúdio.',
      badge: 'Aviso' as Announcement['badge'],
      type: 'urgente',
    },
    {
      label: '🎉 Promoção Combo VIP',
      title: '🎉 Promoção da Semana: Combo Estúdio VIP',
      content: 'Combo Corte Degradê Fade + Barba Completa com toalha quente e pós-barba especial com valor promocional!',
      badge: 'Novidade' as Announcement['badge'],
      type: 'promocao',
    },
  ];

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setBadge(tpl.badge);
    setType(tpl.type);
    showToast(`Modelo "${tpl.label}" preenchido. Clique em Enviar para publicar!`, 'info');
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Por favor, preencha o título e a mensagem do aviso.', 'warning');
      return;
    }

    console.log('📢 [AdminAnnouncements] Botão Enviar clicado. Iniciando envio com await:', {
      title: title.trim(),
      message: content.trim(),
      active: true,
      type,
    });

    setIsSending(true);
    try {
      // 1. Grava na tabela 'notifications' do Supabase em Tempo Real usando await
      console.log('📢 [AdminAnnouncements] Chamando sendBarberAnnouncement com await...');
      const success = await sendBarberAnnouncement(title.trim(), content.trim(), type);
      console.log('📢 [AdminAnnouncements] Resultado retornado por sendBarberAnnouncement:', success);

      if (success) {
        // 2. Também adiciona no mural geral do app
        addAnnouncement({
          title: title.trim(),
          content: content.trim(),
          badge,
          date: 'Hoje',
          active: true,
          important: type === 'urgente',
        });

        setTitle('');
        setContent('');
      } else {
        console.error('❌ [AdminAnnouncements] Falha ao enviar comunicado: sendBarberAnnouncement retornou false');
      }
    } catch (err) {
      console.error('❌ [AdminAnnouncements] Exceção capturada no envio do aviso:', err);
      showToast('Erro ao transmitir aviso aos clientes.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Hoje';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Hoje';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Hoje';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-brand text-zinc-100">
              Disparo de Avisos em Tempo Real (Supabase Realtime)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Envie comunicados, avisos de atraso ou novidades. Os dados são gravados na tabela <strong>notifications</strong> do Supabase e transmitidos instantaneamente para a tela de todos os clientes conectados.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Tabela notifications Ativa</span>
          </span>
        </div>
      </div>

      {/* Formulário Simples para o Barbeiro Enviar Aviso */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              <span>Novo Comunicado para os Celulares dos Clientes</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Preencha os campos abaixo ou escolha um modelo rápido.
            </p>
          </div>
        </div>

        {/* Modelos Rápidos de 1 Clique */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Modelos Rápidos (Clique para preencher):
          </label>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-xs text-zinc-200 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendNotice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Título do Aviso *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: ⏰ Tolerância de 10 minutos após o horário"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Mensagem do Comunicado *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Digite as orientações aos clientes que aparecerão em tempo real no aplicativo..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none placeholder:text-zinc-600"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Tipo / Categoria
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (e.target.value === 'urgente') setBadge('Aviso');
                    else if (e.target.value === 'horario') setBadge('Horário');
                    else if (e.target.value === 'promocao') setBadge('Novidade');
                    else setBadge('Aviso');
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="aviso">📢 Comunicado Geral</option>
                  <option value="urgente">⚠️ Aviso Urgente / Atenção</option>
                  <option value="horario">⏰ Horário / Tolerância</option>
                  <option value="promocao">🎉 Promoção / Novidade</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/15 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
              <span>{isSending ? 'Gravando no Supabase...' : 'Enviar Aviso aos Clientes (Ao Vivo)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SEÇÃO DE AVISOS GRAVADOS NO SUPABASE (TABELA NOTIFICATIONS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Avisos Gravados na Tabela notifications ({supabaseNotifications.length})</span>
          </h3>

          <button
            onClick={() => refreshSupabaseNotifications()}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Recarregar avisos do Supabase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
        </div>

        {supabaseNotifications.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl text-zinc-500 text-xs">
            Nenhum aviso transmitido ainda na tabela notifications. Use o formulário acima para enviar seu primeiro comunicado!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {supabaseNotifications.map((sn) => (
              <div
                key={sn.id}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 uppercase">
                      {sn.type || 'aviso'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ID: {sn.id} • {formatTimestamp(sn.created_at)}
                    </span>
                    <h4 className="font-bold text-zinc-100 text-sm">{sn.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{sn.message}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => deleteBarberAnnouncement(sn.id)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-rose-400 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
                    title="Excluir da tabela notifications do Supabase"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
