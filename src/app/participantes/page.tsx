"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

/* ─── Types ─── */
interface EventOption {
  id: string;
  name: string;
}

interface Base {
  id: string;
  code: string;
  name: string;
}

interface Topper {
  id: string;
  name: string;
  category: string;
}

interface Participant {
  id: string;
  event_id: string;
  name: string;
  surname: string | null;
  email: string | null;
  phone: string | null;
  passport_code: string | null;
  result_profile_name: string | null;
  result_base_id: string | null;
  result_accords: { name: string; value: number }[] | null;
  selected_perfumes: { name: string; brand?: string }[] | null;
  selected_toppers: { id: string; name: string }[] | null;
  topper_drops: Record<string, number> | null;
  second_base_id: string | null;
  admin_notes: string | null;
  created_at: string;
  events: { name: string } | null;
}

/* ─── Drop rules ─── */
function maxDropsPerTopper(count: number) {
  if (count === 1) return 10;
  if (count === 2) return 5;
  return 3; // 3 toppers
}

/* ─── Edit Modal ─── */
function EditModal({
  participant,
  bases,
  toppers,
  onClose,
  onSaved,
}: {
  participant: Participant;
  bases: Base[];
  toppers: Topper[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [resultBaseId, setResultBaseId] = useState(participant.result_base_id || "");
  const [secondBaseId, setSecondBaseId] = useState(participant.second_base_id || "");
  const [selectedToppers, setSelectedToppers] = useState<{ id: string; name: string }[]>(
    participant.selected_toppers || []
  );
  const [topperDrops, setTopperDrops] = useState<Record<string, number>>(
    participant.topper_drops || {}
  );
  const [notes, setNotes] = useState(participant.admin_notes || "");
  const [saving, setSaving] = useState(false);

  const maxDrops = maxDropsPerTopper(selectedToppers.length);

  function toggleTopper(t: Topper) {
    setSelectedToppers((prev) => {
      const exists = prev.find((x) => x.id === t.id);
      if (exists) {
        const next = prev.filter((x) => x.id !== t.id);
        const newDrops = { ...topperDrops };
        delete newDrops[t.id];
        setTopperDrops(newDrops);
        return next;
      }
      if (prev.length >= 3) return prev;
      return [...prev, { id: t.id, name: t.name }];
    });
  }

  function setDrops(topperId: string, value: number) {
    const clamped = Math.max(0, Math.min(value, maxDrops));
    setTopperDrops((prev) => ({ ...prev, [topperId]: clamped }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("participants")
      .update({
        result_base_id: resultBaseId || null,
        second_base_id: secondBaseId || null,
        selected_toppers: selectedToppers.length > 0 ? selectedToppers : [],
        topper_drops: Object.keys(topperDrops).length > 0 ? topperDrops : {},
        admin_notes: notes || "",
      })
      .eq("id", participant.id);

    setSaving(false);
    if (!error) onSaved();
  }

  // Group toppers by category
  const grouped = useMemo(() => {
    const map: Record<string, Topper[]> = {};
    toppers.forEach((t) => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    return map;
  }, [toppers]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-xl border border-g5 w-full max-w-2xl my-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-g5">
          <div>
            <h2 className="font-serif text-xl text-dark">
              {participant.name} {participant.surname || ""}
            </h2>
            <p className="text-xs text-g3">
              {participant.passport_code} · {participant.events?.name}
            </p>
          </div>
          <button onClick={onClose} className="text-g3 hover:text-dark text-xl">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Essência principal */}
          <div>
            <label className="text-xs text-g2 uppercase tracking-wider font-medium block mb-2">
              Essência Principal (resultado do algoritmo)
            </label>
            <select
              value={resultBaseId}
              onChange={(e) => setResultBaseId(e.target.value)}
              className="w-full border border-g5 rounded-lg px-3 py-2 text-sm text-dark bg-white"
            >
              <option value="">— Selecionar —</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Segunda essência */}
          <div>
            <label className="text-xs text-g2 uppercase tracking-wider font-medium block mb-2">
              Segunda Essência (troca manual)
            </label>
            <select
              value={secondBaseId}
              onChange={(e) => setSecondBaseId(e.target.value)}
              className="w-full border border-g5 rounded-lg px-3 py-2 text-sm text-dark bg-white"
            >
              <option value="">— Nenhuma —</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toppers */}
          <div>
            <label className="text-xs text-g2 uppercase tracking-wider font-medium block mb-2">
              Toppers (máx. 3)
            </label>
            {selectedToppers.length > 0 && (
              <div className="mb-3 space-y-2">
                {selectedToppers.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-3 bg-bg rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-dark flex-1">{st.name}</span>
                    <label className="text-xs text-g3">Gotas:</label>
                    <input
                      type="number"
                      min={0}
                      max={maxDrops}
                      value={topperDrops[st.id] || 0}
                      onChange={(e) => setDrops(st.id, parseInt(e.target.value) || 0)}
                      className="w-16 border border-g5 rounded px-2 py-1 text-sm text-center"
                    />
                    <span className="text-xs text-g3">/ {maxDrops}</span>
                    <button
                      onClick={() => toggleTopper({ id: st.id, name: st.name, category: "" })}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      remover
                    </button>
                  </div>
                ))}
                <p className="text-xs text-g3">
                  Regra: 1 topper = 10 gotas · 2 toppers = 5 cada · 3 toppers = 3 cada
                </p>
              </div>
            )}
            <div className="max-h-48 overflow-y-auto border border-g5 rounded-lg p-3 space-y-3">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs text-g3 uppercase tracking-wider mb-1">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((t) => {
                      const isSelected = selectedToppers.some((s) => s.id === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTopper(t)}
                          disabled={!isSelected && selectedToppers.length >= 3}
                          className={`text-xs px-2.5 py-1 rounded-full border transition ${
                            isSelected
                              ? "bg-dark text-white border-dark"
                              : selectedToppers.length >= 3
                              ? "bg-g5/30 text-g3 border-g5 cursor-not-allowed"
                              : "bg-white text-g2 border-g5 hover:border-g3"
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs text-g2 uppercase tracking-wider font-medium block mb-2">
              Notas do Admin
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observações, trocas, preferências..."
              className="w-full border border-g5 rounded-lg px-3 py-2 text-sm text-dark resize-none"
            />
          </div>

          {/* Perfumes escolhidos (read-only) */}
          {participant.selected_perfumes && participant.selected_perfumes.length > 0 && (
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider font-medium block mb-2">
                Perfumes Escolhidos (pelo convidado)
              </label>
              <div className="flex flex-wrap gap-2">
                {participant.selected_perfumes.map((p, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-bg text-g2 border border-g5"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-g5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-g2 hover:text-dark transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-dark text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ParticipantesPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [toppers, setToppers] = useState<Topper[]>([]);
  const [filterEvent, setFilterEvent] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [pRes, eRes, bRes, tRes] = await Promise.all([
      supabase
        .from("participants")
        .select("*, events(name)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("events").select("id, name").order("created_at", { ascending: false }),
      supabase.from("bases").select("id, code, name").order("sort_order"),
      supabase.from("toppers").select("id, name, category").eq("is_active", true).order("sort_order"),
    ]);
    if (pRes.data) setParticipants(pRes.data as Participant[]);
    if (eRes.data) setEvents(eRes.data);
    if (bRes.data) setBases(bRes.data);
    if (tRes.data) setToppers(tRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    let list = participants;
    if (filterEvent !== "all") {
      list = list.filter((p) => p.event_id === filterEvent);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.surname && p.surname.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q)) ||
          (p.passport_code && p.passport_code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [participants, filterEvent, search]);

  /* ─── Export helpers ─── */
  function buildRows() {
    return filtered.map((p) => ({
      Nome: `${p.name}${p.surname ? ` ${p.surname}` : ""}`,
      Email: p.email || "",
      Telefone: p.phone || "",
      Evento: p.events?.name || "",
      Perfil: p.result_profile_name || "",
      "Código Passaporte": p.passport_code || "",
      "Perfumes Escolhidos": p.selected_perfumes
        ? p.selected_perfumes.map((x) => x.name).join(", ")
        : "",
      Toppers: p.selected_toppers
        ? p.selected_toppers.map((x) => x.name).join(", ")
        : "",
      Notas: p.admin_notes || "",
      Data: new Date(p.created_at).toLocaleDateString("pt-BR"),
    }));
  }

  function exportXLSX() {
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    const eventName = filterEvent !== "all" ? events.find((e) => e.id === filterEvent)?.name || "todos" : "todos";
    XLSX.writeFile(wb, `participantes_${eventName.replace(/\s+/g, "_")}.xlsx`);
  }

  function exportXML() {
    const rows = buildRows();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<participantes>\n';
    rows.forEach((r) => {
      xml += "  <participante>\n";
      Object.entries(r).forEach(([k, v]) => {
        const tag = k.replace(/\s+/g, "_").replace(/[^\w]/g, "").toLowerCase();
        xml += `    <${tag}>${escapeXml(String(v))}</${tag}>\n`;
      });
      xml += "  </participante>\n";
    });
    xml += "</participantes>";
    downloadText(xml, `participantes.xml`, "application/xml");
  }

  function escapeXml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function downloadText(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${selected.size} participante${selected.size > 1 ? "s" : ""}? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    setDeleting(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("participants").delete().in("id", ids);
    if (!error) {
      setSelected(new Set());
      await loadAll();
    }
    setDeleting(false);
  }

  async function deleteOne(id: string) {
    const confirmed = window.confirm("Excluir este participante? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    await supabase.from("participants").delete().eq("id", id);
    await loadAll();
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-dark mb-1">Participantes</h1>
        <p className="text-g2 text-sm">
          {filtered.length} de {participants.length} participante
          {participants.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="border border-g5 rounded-lg px-3 py-2 text-sm text-dark bg-white min-w-[200px]"
        >
          <option value="all">Todos os eventos</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar nome, email, telefone..."
          className="border border-g5 rounded-lg px-3 py-2 text-sm text-dark bg-white flex-1 min-w-[200px]"
        />

        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="px-4 py-2 text-xs uppercase tracking-wider bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {deleting ? "Excluindo..." : `Excluir ${selected.size} selecionado${selected.size > 1 ? "s" : ""}`}
            </button>
          )}
          <button
            onClick={exportXLSX}
            disabled={filtered.length === 0}
            className="px-4 py-2 text-xs uppercase tracking-wider bg-dark text-white rounded-lg hover:opacity-90 transition disabled:opacity-40"
          >
            Exportar Excel
          </button>
          <button
            onClick={exportXML}
            disabled={filtered.length === 0}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-dark text-dark rounded-lg hover:bg-dark hover:text-white transition disabled:opacity-40"
          >
            Exportar XML
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-xl border border-g5 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-g5">
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#2D2B29]"
                />
              </th>
              {["Nome", "Telefone", "Evento", "Perfil", "Código", "Toppers", "Data", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs text-g2 uppercase tracking-wider font-medium"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-g3 text-sm">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-g3 text-sm">
                  Nenhum participante encontrado
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-g5 last:border-0 hover:bg-bg/50 transition ${selected.has(p.id) ? "bg-amber-50/50" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 accent-[#2D2B29]"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-dark">
                      {p.name}
                      {p.surname ? ` ${p.surname}` : ""}
                    </p>
                    {p.email && <p className="text-xs text-g3">{p.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-g2">{p.phone || "—"}</td>
                  <td className="px-5 py-3 text-sm text-g2">{p.events?.name || "—"}</td>
                  <td className="px-5 py-3 text-sm text-dark">
                    {p.result_profile_name || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-g2 tracking-wider">
                    {p.passport_code || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-g2">
                    {p.selected_toppers && p.selected_toppers.length > 0
                      ? p.selected_toppers.map((t) => t.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-g3">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(p)}
                        className="text-xs text-g3 hover:text-dark underline transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteOne(p.id)}
                        className="text-xs text-red-500 hover:text-red-700 underline transition"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditModal
          participant={editing}
          bases={bases}
          toppers={toppers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadAll();
          }}
        />
      )}
    </AdminLayout>
  );
}
