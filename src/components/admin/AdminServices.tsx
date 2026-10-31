import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BarberService, ServiceCategory } from '../../types';
import { 
  Scissors, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  DollarSign, 
  Check, 
  X,
  Sparkles,
  Tag
} from 'lucide-react';

export const AdminServices: React.FC = () => {
  const { services, addService, updateService, deleteService } = useBarbershop();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('50.00');
  const [durationMinutes, setDurationMinutes] = useState('40');
  const [category, setCategory] = useState<ServiceCategory>('cabelo');
  const [popular, setPopular] = useState(false);
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const handleOpenAdd = () => {
    setEditingServiceId(null);
    setName('');
    setDescription('');
    setPrice('50.00');
    setDurationMinutes('40');
    setCategory('cabelo');
    setPopular(false);
    setActive(true);
    setImageUrl('');
    setModalOpen(true);
  };

  const handleOpenEdit = (s: BarberService) => {
    setEditingServiceId(s.id);
    setName(s.name);
    setDescription(s.description);
    setPrice(s.price.toString());
    setDurationMinutes(s.durationMinutes.toString());
    setCategory(s.category);
    setPopular(!!s.popular);
    setActive(s.active);
    setImageUrl(s.imageUrl || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseFloat(price.replace(',', '.')) || 0;
    const parsedDuration = parseInt(durationMinutes, 10) || 30;

    if (editingServiceId) {
      updateService(editingServiceId, {
        name,
        description,
        price: parsedPrice,
        durationMinutes: parsedDuration,
        category,
        popular,
        active,
        imageUrl: imageUrl.trim() || undefined,
      });
    } else {
      addService({
        name,
        description,
        price: parsedPrice,
        durationMinutes: parsedDuration,
        category,
        popular,
        active,
        imageUrl: imageUrl.trim() || undefined,
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-brand text-zinc-100 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            Catálogo de Serviços &amp; Preços
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre novos procedimentos, defina durações, precificação e visibilidade no agendamento.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Services List Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              service.active
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-zinc-950/60 border-zinc-800/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Scissors className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-100 text-base">{service.name}</h3>
                      {service.popular && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 uppercase font-mono tracking-wider">
                      {service.category}
                    </span>
                  </div>
                </div>

                <span className="text-lg font-bold font-brand text-amber-400 whitespace-nowrap tabular-nums">
                  R$ {service.price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                {service.description}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {service.durationMinutes} minutos
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateService(service.id, { active: !service.active })
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    service.active
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {service.active ? 'Ativo' : 'Oculto'}
                </button>

                <button
                  onClick={() => handleOpenEdit(service)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Editar serviço"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Deseja remover "${service.name}"?`)) {
                      deleteService(service.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-rose-400 transition-colors"
                  title="Excluir serviço"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Service */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-zinc-100 font-brand text-base">
                {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê Navalhado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva o que está incluso no atendimento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Duração (min) *
                  </label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="cabelo">Cabelo</option>
                    <option value="barba">Barba</option>
                    <option value="combo">Combo</option>
                    <option value="especial">Especial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Foto / Imagem do Serviço
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Scissors className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="URL ou caminho da imagem (ex: /src/assets/images/...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Destacar como "Mais Pedido"</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Disponível para agendamento</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  {editingServiceId ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
