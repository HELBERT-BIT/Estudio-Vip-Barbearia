import React, { useState, useMemo } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { PaymentMethod, PaymentStatus, Appointment } from '../../types';
import { getTodayString } from '../../data/initialData';
import { 
  CreditCard, 
  DollarSign, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Search, 
  Banknote,
  Filter,
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  Percent,
  Scissors,
  ArrowUpRight,
  Download,
  X,
  Building,
  Phone,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  CartesianGrid 
} from 'recharts';

type PeriodType = 'dia' | 'semana' | 'mes' | 'ano' | 'geral';

export const AdminPayments: React.FC = () => {
  const { appointments, registerPayment, settings } = useBarbershop();

  const [period, setPeriod] = useState<PeriodType>('dia');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  const todayStr = getTodayString();
  const todayDate = new Date();

  // Helper date calculations for period filtering
  const isDateInPeriod = (dateStr: string, targetPeriod: PeriodType): boolean => {
    if (targetPeriod === 'geral') return true;
    if (targetPeriod === 'dia') return dateStr === todayStr;

    const [y, m, d] = dateStr.split('-').map(Number);
    const aptDate = new Date(y, m - 1, d);

    if (targetPeriod === 'semana') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(todayDate.getDate() - 7);
      return aptDate >= oneWeekAgo && aptDate <= todayDate;
    }

    if (targetPeriod === 'mes') {
      return aptDate.getMonth() === todayDate.getMonth() && aptDate.getFullYear() === todayDate.getFullYear();
    }

    if (targetPeriod === 'ano') {
      return aptDate.getFullYear() === todayDate.getFullYear();
    }

    return true;
  };

  // Base list filtered by period (excluding non-concluded cancellations)
  const periodAppointments = useMemo(() => {
    return appointments.filter(
      (a) => !a.status.startsWith('cancelado') && isDateInPeriod(a.date, period)
    );
  }, [appointments, period, todayStr]);

  // Financial Metrics for the selected period
  const totalCollected = useMemo(() => {
    return periodAppointments.reduce((acc, a) => {
      if (a.paymentStatus === 'pago') return acc + a.servicePrice;
      if (a.paymentStatus === 'sinal_pago') return acc + (a.depositAmount || a.servicePrice * 0.5);
      return acc;
    }, 0);
  }, [periodAppointments]);

  const totalPending = useMemo(() => {
    return periodAppointments.reduce((acc, a) => {
      if (a.paymentStatus === 'pendente') return acc + a.servicePrice;
      if (a.paymentStatus === 'sinal_pago') return acc + (a.remainingAmount || a.servicePrice * 0.5);
      return acc;
    }, 0);
  }, [periodAppointments]);

  const totalRevenueProjected = totalCollected + totalPending;

  const paidCount = periodAppointments.filter((a) => a.paymentStatus === 'pago' || a.paymentStatus === 'sinal_pago').length;
  const averageTicket = paidCount > 0 ? totalCollected / paidCount : 0;
  const settlementRate = totalRevenueProjected > 0 ? (totalCollected / totalRevenueProjected) * 100 : 0;

  // Breakdown by payment method
  const methodBreakdown = useMemo(() => {
    const methods: Record<string, { label: string; count: number; total: number; color: string }> = {
      pix: { label: 'Pix (Antecipado + Balcão)', count: 0, total: 0, color: 'bg-emerald-500' },
      cartao_credito: { label: 'Cartão de Crédito', count: 0, total: 0, color: 'bg-blue-500' },
      cartao_debito: { label: 'Cartão de Débito', count: 0, total: 0, color: 'bg-cyan-500' },
      dinheiro: { label: 'Dinheiro em Espécie', count: 0, total: 0, color: 'bg-amber-500' },
    };

    periodAppointments
      .filter((a) => a.paymentStatus === 'pago')
      .forEach((a) => {
        if (methods[a.paymentMethod]) {
          methods[a.paymentMethod].count += 1;
          methods[a.paymentMethod].total += a.servicePrice;
        }
      });

    return methods;
  }, [periodAppointments]);

  // Breakdown by type (Antecipado vs Presencial)
  const typeBreakdown = useMemo(() => {
    let antecipado = 0;
    let presencial = 0;

    periodAppointments
      .filter((a) => a.paymentStatus === 'pago')
      .forEach((a) => {
        if (a.paymentType === 'antecipado') antecipado += a.servicePrice;
        else presencial += a.servicePrice;
      });

    return { antecipado, presencial };
  }, [periodAppointments]);

  // Services profitability ranking
  const topServices = useMemo(() => {
    const srvMap: Record<string, { name: string; count: number; total: number }> = {};

    periodAppointments
      .filter((a) => a.paymentStatus === 'pago')
      .forEach((a) => {
        if (!srvMap[a.serviceName]) {
          srvMap[a.serviceName] = { name: a.serviceName, count: 0, total: 0 };
        }
        srvMap[a.serviceName].count += 1;
        srvMap[a.serviceName].total += a.servicePrice;
      });

    return Object.values(srvMap).sort((a, b) => b.total - a.total);
  }, [periodAppointments]);

  const paymentPieData = useMemo(() => {
    const list = [
      { name: 'Pix', value: methodBreakdown.pix?.total || 0, color: '#10b981' },
      { name: 'Crédito', value: methodBreakdown.cartao_credito?.total || 0, color: '#3b82f6' },
      { name: 'Débito', value: methodBreakdown.cartao_debito?.total || 0, color: '#06b6d4' },
      { name: 'Dinheiro', value: methodBreakdown.dinheiro?.total || 0, color: '#f59e0b' },
    ].filter((p) => p.value > 0);

    if (list.length > 0) return list;
    return [
      { name: 'Pix', value: 350, color: '#10b981' },
      { name: 'Cartão', value: 200, color: '#3b82f6' },
      { name: 'Dinheiro', value: 80, color: '#f59e0b' },
    ];
  }, [methodBreakdown]);

  // Detailed filtered list for table view
  const filteredList = useMemo(() => {
    return periodAppointments.filter((a) => {
      if (filterStatus === 'pago' && a.paymentStatus !== 'pago') return false;
      if (filterStatus === 'pendente' && a.paymentStatus !== 'pendente') return false;
      if (filterType === 'antecipado' && a.paymentType !== 'antecipado') return false;
      if (filterType === 'presencial' && a.paymentType !== 'presencial') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return a.clientName.toLowerCase().includes(q) || a.serviceName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [periodAppointments, filterStatus, filterType, searchTerm]);

  // Export to Excel / CSV (.xls / .csv)
  const handleExportXLS = () => {
    const periodLabelMap: Record<PeriodType, string> = {
      dia: 'Hoje',
      semana: 'Ultima_Semana',
      mes: 'Mes_Atual',
      ano: 'Ano_Atual',
      geral: 'Periodo_Geral',
    };

    const periodName = periodLabelMap[period];
    const header = [
      'Data',
      'Horario',
      'Cliente',
      'Telefone',
      'Servico',
      'Valor (R$)',
      'Tipo de Pagamento',
      'Forma de Pagamento',
      'Status Pagamento',
      'Status Atendimento'
    ];

    const rows = filteredList.map((apt) => [
      apt.date,
      apt.time,
      `"${apt.clientName}"`,
      `"${apt.clientPhone}"`,
      `"${apt.serviceName}"`,
      apt.servicePrice.toFixed(2).replace('.', ','),
      apt.paymentType === 'antecipado' ? 'Antecipado' : 'Presencial',
      apt.paymentMethod.replace('_', ' ').toUpperCase(),
      apt.paymentStatus === 'pago' ? 'Pago' : 'Pendente',
      apt.status
    ]);

    // Summary line
    const summaryRow = [
      'TOTAL DO PERIODO',
      '',
      '',
      '',
      `${filteredList.length} atendimentos`,
      totalCollected.toFixed(2).replace('.', ','),
      '',
      '',
      `R$ ${totalCollected.toFixed(2)} Recebidos`,
      `R$ ${totalPending.toFixed(2)} Pendentes`
    ];

    // CSV with UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + [
      header.join(';'),
      ...rows.map(r => r.join(';')),
      '',
      summaryRow.join(';')
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_financeiro_estudiovip_${periodName}_${todayStr}.csv`;
    const container = typeof document !== 'undefined' ? document.body : null;
    if (container && typeof container.appendChild === 'function') {
      container.appendChild(link);
      link.click();
      container.removeChild(link);
    } else {
      link.click();
    }
    URL.revokeObjectURL(url);
  };

  const getMethodBadge = (method: PaymentMethod, type: string) => {
    return (
      <span className="flex items-center gap-1 text-xs text-zinc-300">
        {method === 'pix' ? (
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
        ) : method === 'dinheiro' ? (
          <Banknote className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
        )}
        <span className="capitalize">{method.replace('_', ' ')}</span>
        <span className="text-[10px] text-zinc-500">
          ({type === 'antecipado' ? 'Antecipado' : 'No Balcão'})
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-brand text-zinc-100">
              Dashboard Financeiro &amp; Controle de Caixa
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Análise geral do faturamento, fluxo de pagamentos e relatórios exportáveis do Estúdio VIP Barbearia.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportXLS}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            title="Exportar planilha compatível com Microsoft Excel e Google Planilhas"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar XLS / Planilha</span>
          </button>

          <button
            onClick={() => setShowPdfModal(true)}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs flex items-center gap-2 border border-zinc-700 transition-colors"
            title="Visualizar e Imprimir relatório formatado em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mr-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Filtrar Período:
          </span>

          <button
            onClick={() => setPeriod('dia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'dia'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Hoje (Dia)
          </button>

          <button
            onClick={() => setPeriod('semana')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'semana'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Semana
          </button>

          <button
            onClick={() => setPeriod('mes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'mes'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Este Mês
          </button>

          <button
            onClick={() => setPeriod('ano')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'ano'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Este Ano
          </button>

          <button
            onClick={() => setPeriod('geral')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'geral'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Todos os Dados
          </button>
        </div>

        <span className="text-[11px] text-zinc-500 font-mono">
          {periodAppointments.length} registros no período
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Recebido */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Recebido</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-brand text-emerald-400">
              R$ {totalCollected.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">
              {paidCount} atendimentos liquidados
            </span>
          </div>
        </div>

        {/* Card 2: Pendente no Balcão */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendente no Balcão</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-brand text-amber-400">
              R$ {totalPending.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">
              {periodAppointments.length - paidCount} a receber na barbearia
            </span>
          </div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-brand text-zinc-100">
              R$ {averageTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">
              Média por atendimento
            </span>
          </div>
        </div>

        {/* Card 4: Taxa de Liquidação */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Recebimento</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-brand text-purple-400">
              {settlementRate.toFixed(1).replace('.', ',')}%
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">
              {totalRevenueProjected > 0 ? `De R$ ${totalRevenueProjected.toFixed(2)} total` : 'Sem movimentação'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Payment Methods & Top Services with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Métodos de Pagamento */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              Distribuição por Meio de Pagamento
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Total R$ {totalCollected.toFixed(2)}</span>
          </div>

          {/* Interactive Recharts Donut Chart */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`R$ ${Number(val).toFixed(2).replace('.', ',')}`, 'Total Recebido']}
                />
                <Pie
                  data={paymentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#18181b"
                  strokeWidth={2}
                >
                  {paymentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Progress Bars */}
          <div className="space-y-3 pt-1">
            {Object.entries(methodBreakdown).map(([key, data]) => {
              const percentage = totalCollected > 0 ? (data.total / totalCollected) * 100 : 0;
              return (
                <div key={key} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${data.color}`}></span>
                      {data.label}
                    </span>
                    <span className="font-mono text-zinc-200">
                      R$ {data.total.toFixed(2).replace('.', ',')}{' '}
                      <span className="text-zinc-500 text-[10px]">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full ${data.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subcard: Antecipado vs Presencial */}
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                Pix Antecipado
              </span>
              <strong className="text-emerald-400 text-sm font-brand font-bold block mt-0.5">
                R$ {typeBreakdown.antecipado.toFixed(2).replace('.', ',')}
              </strong>
              <span className="text-[10px] text-zinc-500">Recebimento adiantado</span>
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                Presencial no Balcão
              </span>
              <strong className="text-zinc-200 text-sm font-brand font-bold block mt-0.5">
                R$ {typeBreakdown.presencial.toFixed(2).replace('.', ',')}
              </strong>
              <span className="text-[10px] text-zinc-500">Recebido na barbearia</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Ranking de Serviços Mais Rentáveis com Gráfico de Barras */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Serviços Mais Rentáveis no Período
            </h3>
            <span className="text-xs text-zinc-500 font-mono">{topServices.length} serviços</span>
          </div>

          {topServices.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">
              Nenhum pagamento liquidado registrado neste período.
            </p>
          ) : (
            <>
              {/* Mini Recharts Bar Chart */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topServices.slice(0, 4)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis 
                      type="number" 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickFormatter={(v) => `R$${v}`} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#a1a1aa" 
                      fontSize={10} 
                      width={80} 
                      tick={{ fill: '#d4d4d8' }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#f4f4f5',
                        fontSize: '11px',
                      }}
                      formatter={(val: any) => [`R$ ${Number(val).toFixed(2).replace('.', ',')}`, 'Receita']}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="#f59e0b" 
                      radius={[0, 6, 6, 0]} 
                      barSize={16} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Service Cards Ranking */}
              <div className="space-y-2">
                {topServices.slice(0, 4).map((srv, idx) => {
                  const srvPct = totalCollected > 0 ? (srv.total / totalCollected) * 100 : 0;
                  return (
                    <div
                      key={srv.name}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-zinc-200 block">{srv.name}</strong>
                          <span className="text-[10px] text-zinc-500">
                            {srv.count} atendimentos realizados
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong className="text-amber-400 font-brand block">
                          R$ {srv.total.toFixed(2).replace('.', ',')}
                        </strong>
                        <span className="text-[10px] text-zinc-500">{srvPct.toFixed(0)}% da receita</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pago">Apenas Pagos</option>
              <option value="pendente">Apenas Pendentes</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todas as Formas</option>
              <option value="antecipado">Antecipado (Pix)</option>
              <option value="presencial">Presencial no Balcão</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Cliente</th>
                <th className="p-3">Serviço</th>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Método &amp; Tipo</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right rounded-r-xl">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Nenhum registro encontrado para este filtro e período.
                  </td>
                </tr>
              ) : (
                filteredList.map((apt) => (
                  <tr key={apt.id} className="hover:bg-zinc-950/40">
                    <td className="p-3 font-semibold text-zinc-200">
                      {apt.clientName}
                      <span className="block text-[10px] text-zinc-500 font-mono">
                        {apt.clientPhone}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-300">{apt.serviceName}</td>
                    <td className="p-3 text-zinc-400 font-mono">
                      {apt.date} às {apt.time}
                    </td>
                    <td className="p-3">
                      {getMethodBadge(apt.paymentMethod, apt.paymentType)}
                    </td>
                    <td className="p-3 font-bold font-brand text-amber-400 text-sm">
                      R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-3">
                      {apt.paymentStatus === 'sinal_pago' ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-block">
                            Sinal 50% Pix Pago
                          </span>
                          <span className="block text-[9px] text-zinc-400 mt-0.5">
                            R$ {(apt.depositAmount || apt.servicePrice * 0.5).toFixed(2).replace('.', ',')} pago • Resta R$ {(apt.remainingAmount || apt.servicePrice * 0.5).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.paymentStatus === 'pago'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {apt.paymentStatus === 'pago' ? '✓ 100% Pago' : '⏳ Pendente'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {apt.paymentStatus === 'sinal_pago' ? (
                        <button
                          onClick={() => registerPayment(apt.id, apt.remainingPaymentMethod || 'dinheiro', 'pago')}
                          className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                          title="Dar baixa nos 50% restantes acertados presencialmente no balcão"
                        >
                          Receber Restante (100%)
                        </button>
                      ) : apt.paymentStatus === 'pendente' ? (
                        <button
                          onClick={() => registerPayment(apt.id, 'pix', 'pago')}
                          className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                        >
                          Confirmar Pagamento
                        </button>
                      ) : (
                        <button
                          onClick={() => registerPayment(apt.id, apt.paymentMethod, 'pendente')}
                          className="text-zinc-500 hover:text-zinc-300 text-[10px] underline"
                        >
                          Reverter
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export Modal / Printable Preview */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Controls */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-zinc-100 font-brand text-sm">
                  Relatório Financeiro para Impressão / Salvar em PDF
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="overflow-y-auto p-6 sm:p-8 bg-zinc-950 space-y-6 text-zinc-200 print:text-black print:bg-white">
              {/* Document Header */}
              <div className="border-b border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black font-brand text-zinc-100 uppercase tracking-wider">
                    {settings.name}
                  </h1>
                  <p className="text-xs text-amber-400 font-semibold italic">
                    "{settings.tagline}"
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {settings.address} - {settings.neighborhood}, {settings.city}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Contato: {settings.phone} ({settings.barberName})
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 inline-block mb-1">
                    Relatório Financeiro
                  </span>
                  <p className="text-zinc-400">
                    Período: <strong className="text-zinc-200 uppercase">{period}</strong>
                  </p>
                  <p className="text-zinc-500 text-[10px]">
                    Gerado em: {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Financial Summary Box */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Liquidado (Pago)</span>
                  <strong className="text-lg font-bold font-brand text-emerald-400">
                    R$ {totalCollected.toFixed(2).replace('.', ',')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Pendente no Balcão</span>
                  <strong className="text-lg font-bold font-brand text-amber-400">
                    R$ {totalPending.toFixed(2).replace('.', ',')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Atendimentos no Período</span>
                  <strong className="text-lg font-bold font-brand text-zinc-100">
                    {filteredList.length} clientes
                  </strong>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Detalhamento de Transações
                </h4>
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Data / Hora</th>
                        <th className="p-2.5">Cliente</th>
                        <th className="p-2.5">Serviço</th>
                        <th className="p-2.5">Forma</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-[11px]">
                      {filteredList.map((apt) => (
                        <tr key={apt.id}>
                          <td className="p-2.5 font-mono text-zinc-400">
                            {apt.date} {apt.time}
                          </td>
                          <td className="p-2.5 font-semibold text-zinc-200">
                            {apt.clientName}
                          </td>
                          <td className="p-2.5 text-zinc-300">{apt.serviceName}</td>
                          <td className="p-2.5 capitalize">{apt.paymentMethod.replace('_', ' ')}</td>
                          <td className="p-2.5">
                            <span className={apt.paymentStatus === 'pago' ? 'text-emerald-400' : 'text-amber-400'}>
                              {apt.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold font-mono">
                            R$ {apt.servicePrice.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-900 font-bold text-xs border-t border-zinc-800">
                      <tr>
                        <td colSpan={5} className="p-3 text-right text-zinc-300">
                          Total Pago no Período:
                        </td>
                        <td className="p-3 text-right text-emerald-400 font-brand text-sm">
                          R$ {totalCollected.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer notes */}
              <div className="text-[10px] text-zinc-500 pt-3 border-t border-zinc-800 flex justify-between">
                <span>Estúdio VIP Barbearia • Coxim - MS • Responsável: Mariano</span>
                <span>Documento oficial para controle interno de caixa</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
