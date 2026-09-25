"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Evento } from "@/lib/supabase";

const TIPOS = ["Perfume", "Aroma Caseiro"];
const STATUS_OPTIONS = ["ativo", "agendado", "encerrado"];

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [form, setForm] = useState({
    nome: "",
    tipo: "Perfume",
    data: "",
    horario: "",
    local: "",
    endereco: "",
    capacidade: "100",
    senha: "",
    status: "agendado",
    observacoes: "",
  });

  const loadEventos = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .order("data", { ascending: false });
    setEventos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const resetForm = () => {
    setForm({
      nome: "",
      tipo: "Perfume",
      data: "",
      horario: "",
      local: "",
      endereco: "",
      capacidade: "100",
      senha: "",
      status: "agendado",
      observacoes: "",
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (evento: Evento) => {
    setForm({
      nome: evento.nome,
      tipo: evento.tipo,
      data: evento.data,
      horario: evento.horario || "",
      local: evento.local || "",
      endereco: evento.endereco || "",
      capacidade: String(evento.capacidade),
      senha: evento.senha,
      status: evento.status,
      observacoes: evento.observacoes || "",
    });
    setEditing(evento);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!supabase || !form.nome || !form.data || !form.senha) return;

    const payload = {
      nome: form.nome,
      tipo: form.tipo,
      data: form.data,
      horario: form.horario || null,
      local: form.local || null,
      endereco: form.endereco || null,
      capacidade: parseInt(form.capacidade) || 100,
      senha: form.senha.toUpperCase(),
      status: form.status,
      slug: generateSlug(form.nome),
      observacoes: form.observacoes || null,
    };

    if (editing) {
      await supabase.from("eventos").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("eventos").insert(payload);
    }

    resetForm();
    loadEventos();
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Excluir evento permanentemente?")) return;
    await supabase.from("eventos").delete().eq("id", id);
    loadEventos();
  };

  const statusBadge = (status: string) => {
    const cls =
      status === "ativo"
        ? "badge-success"
        : status === "agendado"
        ? "badge-warning"
        : "badge-info";
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#CCC] text-sm">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl tracking-[1px]">Eventos</h1>
          <p className="text-[13px] text-[#888] mt-1">
            {eventos.length} evento{eventos.length !== 1 ? "s" : ""} cadastrado
            {eventos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          + Novo Evento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#E8E4DF] p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase">
              {editing ? "Editar Evento" : "Novo Evento"}
            </div>
            <button onClick={resetForm} className="text-[#AAA] hover:text-[#1A1A1A]">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Nome do evento *
              </label>
              <input
                className="input-admin"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Casamento Ana & Lucas"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Tipo *
              </label>
              <select
                className="input-admin"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Data *
              </label>
              <input
                type="date"
                className="input-admin"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Horário
              </label>
              <input
                type="time"
                className="input-admin"
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Local
              </label>
              <input
                className="input-admin"
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                placeholder="Espaço Jardim"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Endereço
              </label>
              <input
                className="input-admin"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Capacidade
              </label>
              <input
                type="number"
                className="input-admin"
                value={form.capacidade}
                onChange={(e) =>
                  setForm({ ...form, capacidade: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Senha do evento *
              </label>
              <input
                className="input-admin uppercase tracking-widest"
                value={form.senha}
                onChange={(e) =>
                  setForm({ ...form, senha: e.target.value.toUpperCase() })
                }
                placeholder="ANA2508"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Status
              </label>
              <select
                className="input-admin"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Observações
              </label>
              <input
                className="input-admin"
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleSave} className="btn-primary">
              {editing ? "Salvar" : "Criar Evento"}
            </button>
            <button onClick={resetForm} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E8E4DF]">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Status</th>
                <th>Senha</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[#AAA] py-8">
                    Nenhum evento cadastrado
                  </td>
                </tr>
              ) : (
                eventos.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium">{e.nome}</td>
                    <td className="text-[#888]">{e.tipo}</td>
                    <td className="text-[#888]">
                      {new Date(e.data + "T12:00:00").toLocaleDateString(
                        "pt-BR"
                      )}
                    </td>
                    <td>{statusBadge(e.status)}</td>
                    <td>
                      <code className="text-[11px] tracking-widest bg-[#F4F1ED] px-2 py-0.5">
                        {e.senha}
                      </code>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleEdit(e)}
                        className="text-[11px] text-[#888] hover:text-[#1A1A1A] mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-[11px] text-[#AAA] hover:text-[#C0392B]"
                      >
                        Excluir
                      </button>
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
