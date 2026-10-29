"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

interface Base {
  id: string;
  code: string;
  name: string;
  family: string;
  inspiration: string | null;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  password: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  location: string | null;
  selected_bases: string[];
  welcome_line1: string | null;
  welcome_line2: string | null;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  password: "",
  date: "",
  start_time: "",
  end_time: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  location: "",
  selected_bases: [] as string[],
  welcome_line1: "",
  welcome_line2: "",
};

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    loadBases();
  }, []);

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setEvents(
        data.map((e) => ({
          ...e,
          selected_bases: Array.isArray(e.selected_bases) ? e.selected_bases : [],
        }))
      );
    }
  }

  async function loadBases() {
    const { data } = await supabase
      .from("bases")
      .select("id, code, name, family, inspiration")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setBases(data);
  }

  const toggleBase = useCallback(
    (baseId: string) => {
      setForm((prev) => {
        const selected = prev.selected_bases.includes(baseId)
          ? prev.selected_bases.filter((id) => id !== baseId)
          : prev.selected_bases.length < 8
          ? [...prev.selected_bases, baseId]
          : prev.selected_bases;
        return { ...prev, selected_bases: selected };
      });
    },
    []
  );

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault();
    const slug =
      form.slug ||
      form.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const payload = {
      name: form.name,
      slug,
      password: form.password,
      date: form.date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      client_name: form.client_name || null,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      location: form.location || null,
      selected_bases: form.selected_bases,
      welcome_line1: form.welcome_line1 || null,
      welcome_line2: form.welcome_line2 || null,
      status: "active",
    };

    if (editingId) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingId);
      if (error) return alert("Erro ao salvar: " + error.message);
    } else {
      const { error } = await supabase.from("events").insert(payload);
      if (error) return alert("Erro ao criar: " + error.message);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    loadEvents();
  }

  function editEvent(event: Event) {
    setForm({
      name: event.name,
      slug: event.slug,
      password: event.password,
      date: event.date,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      client_name: event.client_name || "",
      client_phone: event.client_phone || "",
      client_email: event.client_email || "",
      location: event.location || "",
      selected_bases: event.selected_bases || [],
      welcome_line1: event.welcome_line1 || "",
      welcome_line2: event.welcome_line2 || "",
    });
    setEditingId(event.id);
    setShowForm(true);
  }

  async function toggleStatus(event: Event) {
    const newStatus = event.status === "active" ? "inactive" : "active";
    await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", event.id);
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
          <p className="text-g2 text-sm">
            {events.length} evento{events.length !== 1 ? "s" : ""} cadastrado
            {events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="px-5 py-2.5 rounded-xl bg-dark text-bg-card text-sm font-medium transition hover:opacity-90"
        >
          + Novo evento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={saveEvent}
          className="bg-bg-card rounded-xl border border-g5 p-6 mb-6"
        >
          <h3 className="font-serif text-lg text-dark mb-4">
            {editingId ? "Editar evento" : "Novo evento"}
          </h3>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Nome do evento *
              </label>
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
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="casamento-ana-e-lucas (automático)"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Senha do evento *
              </label>
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
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Data *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
                required
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Horário início
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Horário fim
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Local do evento
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ex: Espaço Villa Real, São Paulo"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
          </div>

          {/* Welcome screen texts */}
          <p className="text-xs text-g3 uppercase tracking-wider mb-1 mt-6">
            Textos da tela de boas-vindas
          </p>
          <p className="text-xs text-g2 mb-3">
            Personalize os textos exibidos na tela inicial do app. Deixe em branco para usar o padrão.
          </p>
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Linha 1 — Subtítulo
              </label>
              <input
                type="text"
                value={form.welcome_line1}
                onChange={(e) =>
                  setForm({ ...form, welcome_line1: e.target.value })
                }
                placeholder="EXPERIÊNCIA OLFATIVA GUIADA POR INTELIGÊNCIA ARTIFICIAL"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Linha 2 — Chamada principal
              </label>
              <input
                type="text"
                value={form.welcome_line2}
                onChange={(e) =>
                  setForm({ ...form, welcome_line2: e.target.value })
                }
                placeholder="DESCUBRA QUAL FRAGRÂNCIA SHI COMBINA COM VOCÊ!"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
          </div>

          {/* Client info */}
          <p className="text-xs text-g3 uppercase tracking-wider mb-3 mt-6">
            Dados do cliente
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Nome
              </label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) =>
                  setForm({ ...form, client_name: e.target.value })
                }
                placeholder="Nome do cliente"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={form.client_phone}
                onChange={(e) =>
                  setForm({ ...form, client_phone: e.target.value })
                }
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) =>
                  setForm({ ...form, client_email: e.target.value })
                }
                placeholder="cliente@email.com"
                className="w-full px-4 py-2.5 rounded-lg bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3"
              />
            </div>
          </div>

          {/* Fragrance selection */}
          <p className="text-xs text-g3 uppercase tracking-wider mb-1 mt-2">
            Fragrâncias do evento
          </p>
          <p className="text-xs text-g2 mb-3">
            Selecione <strong>8 fragrâncias</strong> que estarão disponíveis
            neste evento ({form.selected_bases.length}/8 selecionadas)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6 max-h-[320px] overflow-y-auto pr-1">
            {bases.map((base) => {
              const selected = form.selected_bases.includes(base.id);
              return (
                <button
                  key={base.id}
                  type="button"
                  onClick={() => toggleBase(base.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition text-sm ${
                    selected
                      ? "border-dark bg-dark/5"
                      : form.selected_bases.length >= 8
                      ? "border-g5 bg-bg opacity-40 cursor-not-allowed"
                      : "border-g5 bg-bg hover:border-g3"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? "border-dark bg-dark" : "border-g4"
                    }`}
                  >
                    {selected && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="#F9F7F6"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-dark font-medium truncate">
                      {base.code} · {base.name}
                    </p>
                    <p className="text-g3 text-xs truncate">{base.family}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-dark text-bg-card text-sm font-medium"
            >
              {editingId ? "Salvar alterações" : "Criar evento"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="px-5 py-2.5 rounded-lg border border-g5 text-g2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Events list */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-bg-card rounded-xl border border-g5 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-serif text-lg text-dark">
                    {event.name}
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full shrink-0 ${
                      statusColors[event.status]
                    }`}
                  >
                    {event.status === "active"
                      ? "Ativo"
                      : event.status === "inactive"
                      ? "Inativo"
                      : "Encerrado"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-g2">
                  <span>
                    📅 {new Date(event.date + "T12:00").toLocaleDateString("pt-BR")}
                  </span>
                  {event.start_time && event.end_time && (
                    <span>
                      🕐 {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
                    </span>
                  )}
                  <span>🔗 /evento/{event.slug}</span>
                  <span>🔑 {event.password}</span>
                  {event.client_name && <span>👤 {event.client_name}</span>}
                  {event.location && <span>📍 {event.location}</span>}
                </div>
                {event.selected_bases.length > 0 && (
                  <p className="text-xs text-g3 mt-2">
                    🧪 {event.selected_bases.length} fragrância
                    {event.selected_bases.length !== 1 ? "s" : ""} selecionada
                    {event.selected_bases.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button
                  onClick={() => editEvent(event)}
                  className="px-4 py-2 rounded-lg border border-g5 text-xs text-g2 hover:border-g3 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleStatus(event)}
                  className="px-4 py-2 rounded-lg border border-g5 text-xs text-g2 hover:border-g3 transition"
                >
                  {event.status === "active" ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
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
