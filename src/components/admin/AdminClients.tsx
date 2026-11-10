import React, { useState } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { RegisteredClient } from '../../types';
import { 
  Users, 
  Search, 
  Download, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Scissors, 
  Trash2, 
  MessageCircle,
  FileSpreadsheet,
  FileJson,
  X,
  CheckCircle2,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const AdminClients: React.FC = () => {
  const { 
    registeredClients, 
    deleteRegisteredClient, 
    addOrUpdateRegisteredClient, 
    showToast 
  } = useBarbershop();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Filtered clients list
  const filteredClients = registeredClients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = client.name.toLowerCase().includes(q);
    const matchPhone = client.phone.includes(q) || client.phone.replace(/\D/g, '').includes(q);
    const matchEmail = client.email ? client.email.toLowerCase().includes(q) : false;
    return matchName || matchPhone || matchEmail;
  });

  // KPI Metrics
  const totalClients = registeredClients.length;
  const totalBookings = registeredClients.reduce((sum, c) => sum + (c.totalBookings || 0), 0);
  const totalRevenue = registeredClients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgBookingsPerClient = totalClients > 0 ? (totalBookings / totalClients).toFixed(1) : '0';

  // Export to CSV (Formatted with UTF-8 BOM for Microsoft Excel compatibility)
  const handleExportCSV = () => {
    if (registeredClients.length === 0) {
      showToast('Nenhum cliente cadastrado para exportar.', 'warning');
      return;
    }

    const headers = [
      'Nome Completo',
      'WhatsApp',
      'E-mail',
      'Data de Cadastro',
      'Total de Agendamentos',
      'Total Investido (R$)',
      'Último Agendamento'
    ];

    const rows = registeredClients.map((client) => [
      `"${client.name.replace(/"/g, '""')}"`,
      `"${client.phone}"`,
      `"${client.email || 'Não informado'}"`,
      `"${client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}"`,
      client.totalBookings || 0,
      `"${(client.totalSpent || 0).toFixed(2).replace('.', ',')}"`,
      `"${client.lastBookingDate || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map((row) => row.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clientes_estudio_vip_${new Date().toISOString().slice(0, 10)}.csv`);
    const container = typeof document !== 'undefined' ? document.body : null;
    if (container && typeof container.appendChild === 'function') {
      container.appendChild(link);
      link.click();
      container.removeChild(link);
    } else {
      link.click();
    }
    URL.revokeObjectURL(url);

    showToast('Planilha de clientes exportada com sucesso (Excel/CSV)!', 'success', 'Exportação Concluída');
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (registeredClients.length === 0) {
      showToast('Nenhum cliente cadastrado para exportar.', 'warning');
      return;
    }

    const dataStr = JSON.stringify(registeredClients, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clientes_estudio_vip_${new Date().toISOString().slice(0, 10)}.json`);
    const container = typeof document !== 'undefined' ? document.body : null;
    if (container && typeof container.appendChild === 'function') {
      container.appendChild(link);
      link.click();
      container.removeChild(link);
    } else {
      link.click();
    }
    URL.revokeObjectURL(url);

    showToast('Arquivo JSON de clientes exportado com sucesso!', 'success', 'Exportação Concluída');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      showToast('Preencha pelo menos o nome e o WhatsApp do cliente.', 'warning');
      return;
    }

    addOrUpdateRegisteredClient({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      totalBookings: 0,
      totalSpent: 0,
    });

    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setIsAddModalOpen(false);
    showToast('Novo cliente cadastrado com sucesso!', 'success', 'Cliente Salvo');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Clientes Cadastrados</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-brand text-zinc-100 mt-2">{totalClients}</p>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Base ativa salva
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Total de Agendamentos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-brand text-zinc-100 mt-2">{totalBookings}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Média de {avgBookingsPerClient} cortes / cliente
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Faturamento Estimado</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-brand text-emerald-400 mt-2">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Total acumulado</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Exportação Pronta</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-brand text-zinc-100 mt-2">Excel / JSON</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">1 clique para baixar</span>
        </div>
      </div>

      {/* Control bar: Search + Export Buttons + Add Client */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Exportar todos os clientes para planilha Excel (.csv com formatação brasileira UTF-8)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel (CSV)</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Exportar banco completo de clientes em formato JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Clients Table / Cards */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-zinc-200">Nenhum cliente encontrado</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `Não foram encontrados clientes com o termo "${searchQuery}".`
              : 'Nenhum cliente cadastrado no momento. Quando os clientes criarem conta ou fizerem agendamentos, aparecerão automaticamente aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">WhatsApp / Contato</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Cadastro</th>
                  <th className="py-3 px-4 text-center">Agendamentos</th>
                  <th className="py-3 px-4 text-right">Total Investido</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredClients.map((client) => {
                  const rawPhoneDigits = client.phone.replace(/\D/g, '');
                  const waNumber = rawPhoneDigits.startsWith('55') ? rawPhoneDigits : `55${rawPhoneDigits}`;
                  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Olá ${client.name}! Aqui é o barbeiro Mariano do Estúdio VIP.`)}`;

                  return (
                    <tr key={client.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-100 block">{client.name}</span>
                            {client.lastBookingDate && (
                              <span className="text-[10px] text-zinc-500">
                                Último corte: {client.lastBookingDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{client.phone}</span>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="py-3.5 px-4 text-zinc-400">
                        {client.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="truncate max-w-[180px]">{client.email}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>

                      {/* Cadastro */}
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Agendamentos */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {client.totalBookings || 0} cortes
                        </span>
                      </td>

                      {/* Total Investido */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        R$ {(client.totalSpent || 0).toFixed(2).replace('.', ',')}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(`Remover cliente ${client.name} da base?`)) {
                                deleteRegisteredClient(client.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Excluir cadastro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
            {filteredClients.map((client) => {
              const rawPhoneDigits = client.phone.replace(/\D/g, '');
              const waNumber = rawPhoneDigits.startsWith('55') ? rawPhoneDigits : `55${rawPhoneDigits}`;
              const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Olá ${client.name}! Aqui é o barbeiro Mariano do Estúdio VIP.`)}`;

              return (
                <div key={client.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-zinc-100 text-sm truncate">{client.name}</h4>
                        <p className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{client.phone}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remover cliente ${client.name} da base?`)) {
                          deleteRegisteredClient(client.id);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                      title="Excluir cadastro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="text-zinc-400">
                      <span className="block text-[10px] text-zinc-500 uppercase font-semibold">Agendamentos</span>
                      <span className="font-bold text-amber-400">{client.totalBookings || 0} cortes</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-500 uppercase font-semibold">Total Investido</span>
                      <span className="font-bold text-emerald-400">
                        R$ {(client.totalSpent || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Conversar no WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-bold text-zinc-100 font-brand text-base">Cadastrar Novo Cliente</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Adiciona manualmente um cliente à base da barbearia</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-xl bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Matheus Ferreira"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  WhatsApp (Telefone) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(67) 99999-9999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
