"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

interface Stats {
  events: number;
  activeEvents: number;
  participants: number;
  bases: number;
  toppers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    events: 0,
    activeEvents: 0,
    participants: 0,
    bases: 0,
    toppers: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const [events, activeEvents, participants, bases, toppers] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("participants").select("id", { count: "exact", head: true }),
        supabase.from("bases").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("toppers").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      setStats({
        events: events.count || 0,
        activeEvents: activeEvents.count || 0,
        participants: participants.count || 0,
        bases: bases.count || 0,
        toppers: toppers.count || 0,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { label: "Eventos", value: stats.events, sub: `${stats.activeEvents} ativos`, color: "bg-info-light text-info" },
    { label: "Participantes", value: stats.participants, sub: "total", color: "bg-success-light text-success" },
    { label: "Bases SHI", value: stats.bases, sub: "essências ativas", color: "bg-warning-light text-warning" },
    { label: "Toppers", value: stats.toppers, sub: "gotinhas disponíveis", color: "bg-bg text-dark" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-dark mb-1">Dashboard</h1>
        <p className="text-g2 text-sm">Visão geral do SHI Aroma Lab</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-bg-card rounded-xl border border-g5 p-6"
          >
            <p className="text-xs text-g2 uppercase tracking-wider mb-2">{card.label}</p>
            <p className="font-serif text-3xl text-dark">{card.value}</p>
            <p className="text-xs text-g3 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-card rounded-xl border border-g5 p-6">
        <h2 className="font-serif text-xl text-dark mb-4">Bem-vindo ao painel SHI</h2>
        <p className="text-sm text-text leading-relaxed">
          Use o menu lateral para gerenciar eventos, essências, toppers e acompanhar os
          participantes. Cada evento possui um link e QR Code exclusivos que as convidadas
          usam para acessar a experiência olfativa.
        </p>
      </div>
    </AdminLayout>
  );
}
