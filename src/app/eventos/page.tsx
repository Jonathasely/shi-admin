"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

interface Event {
  id: string;
  name: string;
  slug: string;
  password: string;
  date: string;
  status: string;
  client_name: string | null;
  created_at: string;
}

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    password: "",
    date: "",
    client_name: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEvents(data);
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const { error } = await supabase.from("events").insert({
      name: form.name,
      slug,
      password: form.password,
      date: form.date,
      client_name: form.client_name || null,
      status: "active",
    });

    if (!error) {
      setShowForm(false);
      setForm({ name: "", slug: "", password: "", date: "", client_name: "" });
      loadEvents();
    }
  }

  async function toggleStatus(event: Event) {
    const newStatus = event.status === "active" ? "inactive" : "active";
    await supabase.from("events").update({ status: newStatus }).eq("id", event.id);
    loadEvents();
  }

  const statusColors: Record<string, string> = {
    active: "bg-success-light text-success",
    inactive: "bg-g5 text-g2",
    finished: "bg-error-light text-error",
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-dark mb-1">Eventos</h1>
          <p className="text-g2 text-sm">{events.length} eventos cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-dark text-bg-card text-sm font-medium transition hover:opacity-90"
        >
          + Novo evento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={createEvent} className="bg-bg-card rounded-xl border border-g5 p-6 mb-6">
          <h3 className="font-serif text-lg text-dark mb-4">Novo evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">Nome do evento *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Casamento Ana & Lucas"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
                required
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="casamento-ana-e-lucas (automático)"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">Senha do evento *</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Ex: ANA2508"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
                required
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
                required
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">Nome do cliente</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Opcional"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-dark text-bg-card text-sm font-medium">
              Criar evento
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-g5 text-g2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Events list */}
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="bg-bg-card rounded-xl border border-g5 p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-serif text-lg text-dark">{event.name}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${statusColors[event.status]}`}>
                  {event.status === "active" ? "Ativo" : event.status === "inactive" ? "Inativo" : "Encerrado"}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-g2">
                <span>📅 {new Date(event.date).toLocaleDateString("pt-BR")}</span>
                <span>🔗 /evento/{event.slug}</span>
                <span>🔑 {event.password}</span>
                {event.client_name && <span>👤 {event.client_name}</span>}
              </div>
            </div>
            <button
              onClick={() => toggleStatus(event)}
              className="px-4 py-2 rounded-lg border border-g5 text-xs text-g2 hover:border-g3 transition"
            >
              {event.status === "active" ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-16 text-g3">
            <p className="font-serif text-xl mb-2">Nenhum evento cadastrado</p>
            <p className="text-sm">Crie seu primeiro evento para começar</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
