'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Activity, Calendar, MapPin, Award, BookOpen, Loader2 
} from 'lucide-react';

export default function DashboardNogTech() {
  const [dadosBanco, setDadosBanco] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [filtroUF, setFiltroUF] = useState('Todos');

  // Busca os dados reias da API conectada ao PostgreSQL
  useEffect(() => {
    fetch('/api/vendas')
      .then((res) => res.json())
      .then((data) => {
        setDadosBanco(data);
        setCarregando(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar dados do banco:", err);
        setCarregando(false);
      });
  }, []);

  // Lógica de Filtragem
  const dadosFiltrados = useMemo(() => {
    return dadosBanco.filter(item => {
      if (!item.data_transacao) return false;
      
      const mesItem = item.data_transacao.substring(0, 7); // Extrai YYYY-MM
      const passaMes = filtroMes === 'Todos' || mesItem === filtroMes;
      const passaUF = filtroUF === 'Todos' || item.estado === filtroUF;
      return passaMes && passaUF;
    });
  }, [filtroMes, filtroUF, dadosBanco]);

  // Cálculo de KPIs
  const kpis = useMemo(() => {
    const totalVendas = dadosFiltrados.length;
    // Garante que o valor vindo do banco seja numérico (o pacote pg pode trazer decimais como string)
    const receitaTotal = dadosFiltrados.reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0);
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;

    const engajados = dadosFiltrados.filter(i => i.horas_assistidas !== null);
    const mediaHoras = engajados.length ? engajados.reduce((a, b) => a + parseFloat(b.horas_assistidas || 0), 0) / engajados.length : 0;
    
    const npsComNota = dadosFiltrados.filter(i => i.nps_score !== null);
    const mediaNps = npsComNota.length ? npsComNota.reduce((a, b) => a + parseFloat(b.nps_score || 0), 0) / npsComNota.length : 0;

    return { totalVendas, receitaTotal, ticketMedio, mediaHoras, mediaNps };
  }, [dadosFiltrados]);

  // Agrupamento para Gráfico: Vendas por Período (Mês)
  const vendasPorPeriodo = useMemo(() => {
    const mapa: Record<string, number> = {};
    dadosFiltrados.forEach(item => {
      const mes = item.data_transacao.substring(0, 7);
      mapa[mes] = (mapa[mes] || 0) + parseFloat(item.valor || 0);
    });
    return Object.entries(mapa).sort().map(([mes, valor]) => ({ mes, valor }));
  }, [dadosFiltrados]);

  // Agrupamento para Gráfico: Vendas por Estado
  const vendasPorEstado = useMemo(() => {
    const mapa: Record<string, number> = {};
    dadosFiltrados.forEach(item => {
      // Ignora casos onde o estado é nulo
      if(item.estado) {
        mapa[item.estado] = (mapa[item.estado] || 0) + parseFloat(item.valor || 0);
      }
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .map(([estado, valor]) => ({ estado, valor }));
  }, [dadosFiltrados]);

  // Tela de Loading
  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <h2 className="text-xl font-bold">Conectando ao PostgreSQL...</h2>
        <p className="text-sm text-slate-500 mt-2">Carregando dados da camada fato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header e Filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="text-indigo-500" size={32} />
              NogTech Executive Panel
            </h1>
            <p className="text-sm text-slate-400 mt-1">Dados higienizados e anonimizados (Base Fato LGPD)</p>
          </div>
          
          <div className="flex gap-4 mt-6 md:mt-0 w-full md:w-auto">
            <div className="flex-1 md:w-48">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2 mb-2"><Calendar size={14}/> Período</label>
              <select 
                value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="Todos">Todo o Histórico</option>
                {/* Popula os meses dinamicamente baseado no banco */}
                {[...new Set(dadosBanco.map(item => item.data_transacao?.substring(0, 7)).filter(Boolean))].sort().map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 md:w-48">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2 mb-2"><MapPin size={14}/> Estado (UF)</label>
              <select 
                value={filtroUF} onChange={e => setFiltroUF(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="Todos">Brasil (Nacional)</option>
                {/* Popula os estados dinamicamente baseado no banco */}
                {[...new Set(dadosBanco.map(item => item.estado).filter(Boolean))].sort().map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Linha 1: KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total de Vendas" value={kpis.totalVendas} icon={<Users />} color="text-blue-400" bg="bg-blue-500/10" />
          <KpiCard 
            title="Receita Total" 
            value={kpis.receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            icon={<TrendingUp />} color="text-emerald-400" bg="bg-emerald-500/10" 
          />
          <KpiCard 
            title="Ticket Médio" 
            value={kpis.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            icon={<DollarSign />} color="text-amber-400" bg="bg-amber-500/10" 
          />
          <KpiCard 
            title="NPS Médio (Engajamento)" 
            value={`${kpis.mediaNps.toFixed(1)} / 10`} 
            icon={<Award />} color="text-purple-400" bg="bg-purple-500/10" 
            subtitle={`${kpis.mediaHoras.toFixed(0)}h assistidas/aluno`}
          />
        </div>

        {/* Linha 2: Gráficos (Período e Estado) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Vendas por Período */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Calendar className="text-indigo-400"/> Evolução da Receita por Período</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendasPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value) => {
                      const amount = typeof value === 'number' ? value : Number(value ?? 0);
                      return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    }}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Vendas por Estado */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><MapPin className="text-blue-400"/> Receita por Estado (UF)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasPorEstado} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="estado" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={40} />
                  <RechartsTooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(value) => {
                      const amount = typeof value === 'number' ? value : Number(value ?? 0);
                      return [amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Receita'] as [string, string];
                    }}
                  />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabela de Dados (Auditoria) */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><BookOpen className="text-slate-400"/> Lote de Transações (Amostra Anonimizada)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="py-4 px-6">Transação</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">CPF (Mascarado)</th>
                  <th className="py-4 px-6">UF</th>
                  <th className="py-4 px-6 text-right">Valor Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {dadosFiltrados.slice(0, 50).map((venda) => (
                  <tr key={venda.id_transacao} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-indigo-300">{venda.id_transacao}</td>
                    <td className="py-4 px-6">{venda.data_transacao.split('-').reverse().join('/')}</td>
                    <td className="py-4 px-6 font-mono tracking-widest">{venda.cpf_aluno}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-700 text-slate-300 py-1 px-2 rounded text-xs font-bold">{venda.estado}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-emerald-400">
                      {parseFloat(venda.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dadosFiltrados.length === 0 && (
              <p className="text-center text-slate-500 py-8">Nenhum dado encontrado com os filtros selecionados.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Componente utilitário para os Cards
function KpiCard({ title, value, icon, color, bg, subtitle }: any) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4 hover:border-slate-600 transition-colors">
      <div className={`p-4 rounded-xl ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}