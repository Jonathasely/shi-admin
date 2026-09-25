"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  totalEventos: number;
  eventosAtivos: number;
  totalEssencias: number;
  totalParticipantes: number;
  totalCombinacoes: number;
  participantesHoje: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalEventos: 0,
    eventosAtivos: 0,
    totalEssencias: 0,
    totalParticipantes: 0,
    totalCombinacoes: 0,
    participantesHoje: 0,
  });
  const [recentParticipants, setRecentParticipants] = useState<
    { id: string; nome: string; evento_nome: string; created_at: string; essencia_codigo: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const [eventos, essencias, participantes, combinacoes, participantesHoje, recent] =
      await Promise.all([
        supabase.from("eventos").select("id, status"),
        supabase.from("essencias").select("id", { count: "exact", head: true }),
        supabase.from("participantes").select("id", { count: "exact", head: true }),
        supabase.from("combinacoes").select("id", { count: "exact", head: true }),
        supabase
          .from("participantes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today + "T00:00:00"),
        supabase
          .from("participantes")
          .select("id, nome, created_at, evento_id, essencia_recomendada_id, eventos(nome), essencias!participantes_essencia_recomendada_id_fkey(codigo)")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    const eventosData = eventos.data || [];

    setStats({
      totalEventos: eventosData.length,
      eventosAtivos: eventosData.filter((e: { status: string }) => e.status === "ativo").length,
      totalEssencias: essencias.count || 0,
      totalParticipantes: participantes.count || 0,
      totalCombinacoes: combinacoes.count || 0,
      participantesHoje: participantesHoje.count || 0,
    });

    setRecentParticipants(
      (recent.data || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        evento_nome: p.eventos?.nome || "-",
        created_at: p.created_at,
        essencia_codigo: p.essencias?.codigo || null,
      }))
    );

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#CCC] text-sm">Carregando...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Eventos ativos", value: stats.eventosAtivos, sub: `${stats.totalEventos} total` },
    { label: "Essências", value: stats.totalEssencias },
    { label: "Participantes", value: stats.totalParticipantes, sub: `${stats.participantesHoje} hoje` },
    { label: "Combinações", value: stats.totalCombinacoes },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl tracking-[1px]">Dashboard</h1>
        <p className="text-[13px] text-[#888] mt-1">
          Visão geral do SHI Aroma Lab
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-[#E8E4DF] p-5"
          >
            <div className="text-[10px] text-[#888] tracking-[1.5px] uppercase mb-2">
              {card.label}
            </div>
            <div className="font-serif text-[32px] leading-none">
              {card.value}
            </div>
            {card.sub && (
              <div className="text-[11px] text-[#AAA] mt-1">{card.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Recent participants */}
      <div className="bg-white border border-[#E8E4DF]">
        <div className="px-5 py-4 border-b border-[#E8E4DF] flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[1.5px] uppercase">
            Participantes recentes
          </div>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Evento</th>
                <th>Essência</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentParticipants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-[#AAA] py-8">
                    Nenhum participante ainda
                  </td>
                </tr>
              ) : (
                recentParticipants.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nome}</td>
                    <td className="text-[#888]">{p.evento_nome}</td>
                    <td>
                      {p.essencia_codigo ? (
                        <span className="badge badge-success">
                          {p.essencia_codigo}
                        </span>
                      ) : (
                        <span className="badge badge-info">Pendente</span>
                      )}
                    </td>
                    <td className="text-[#888] text-[13px]">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
