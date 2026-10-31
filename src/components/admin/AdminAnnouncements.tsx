import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Announcement } from '../../types';
import { Megaphone, Plus, Trash2, CheckCircle2, Tag, AlertCircle } from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const { announcements, addAnnouncement, deleteAnnouncement, toggleAnnouncement } = useBarbershop();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [badge, setBadge] = useState<Announcement['badge']>('Aviso');
  const [important, setImportant] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addAnnouncement({
      title,
      content,
      badge,
      date: 'Hoje',
      active: true,
      important,
    });

    setTitle('');
    setContent('');
    setImportant(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold font-brand text-zinc-100 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-amber-400" />
          Mural de Avisos &amp; Novidades (Gestão)
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Publique avisos de funcionamento, tolerância de atraso e comunicados oficiais aos clientes de Coxim.
        </p>
      </div>

      {/* New Announcement Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
          Publicar no Mural de Avisos &amp; Novidades
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Título do Aviso *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: ⏰ Lembrete: Tolerância de 10 minutos após o horário agendado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Mensagem para os Clientes *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Escreva os detalhes, datas válidas ou orientações aos clientes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value as Announcement['badge'])}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Aviso">Aviso</option>
                  <option value="Promoção">Promoção</option>
                  <option value="Novidade">Novidade</option>
                  <option value="Horário especial">Horário especial</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 mt-4">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                />
                <span className="font-semibold text-amber-400">Destacar como "Importante"</span>
              </label>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10 mt-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Aviso</span>
            </button>
          </div>
        </form>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Avisos Publicados ({announcements.length})
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                ann.active ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950/60 border-zinc-800/40 opacity-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-amber-400 border border-zinc-700">
                    {ann.badge}
                  </span>
                  {ann.important && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-zinc-950">
                      Importante
                    </span>
                  )}
                  <h4 className="font-bold text-zinc-100 text-sm">{ann.title}</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{ann.content}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => toggleAnnouncement(ann.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    ann.active
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                >
                  {ann.active ? 'Visível' : 'Oculto'}
                </button>

                <button
                  onClick={() => deleteAnnouncement(ann.id)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-rose-400 transition-colors"
                  title="Excluir comunicado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
