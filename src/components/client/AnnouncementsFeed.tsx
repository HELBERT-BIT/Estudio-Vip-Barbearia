import React from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { Megaphone, AlertCircle, Clock, Calendar, Info, MapPin } from 'lucide-react';

export const AnnouncementsFeed: React.FC = () => {
  const { announcements, setClientActiveTab, settings } = useBarbershop();
  const activeAnnouncements = announcements.filter((a) => a.active);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Aviso':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'Horário':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Aviso':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Horário':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-brand text-zinc-100">
              Mural de Avisos &amp; Novidades
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Informações oficiais da equipe {settings.name}: horários de expediente, regras de tolerância e comunicados aos clientes.
          </p>
        </div>

        <button
          onClick={() => setClientActiveTab('booking')}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
        >
          Agendar Horário
        </button>
      </div>

      {activeAnnouncements.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
          Nenhum comunicado publicado no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl border transition-all ${
                ann.important
                  ? 'bg-zinc-900/90 border-amber-500/40 shadow-xl shadow-amber-500/5'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${getBadgeColor(
                      ann.badge
                    )}`}
                  >
                    {getBadgeIcon(ann.badge)}
                    {ann.badge}
                  </span>
                  {ann.important && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                      Importante
                    </span>
                  )}
                </div>

                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {ann.date}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-zinc-100 font-brand mb-2">
                {ann.title}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
