"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Essencia } from "@/lib/supabase";

const CATEGORIAS = [
  "Floral",
  "Oriental",
  "Amadeirado",
  "Fresco",
  "Cítrico",
  "Fougère",
  "Chipre",
  "Gourmand",
];

export default function EssenciasPage() {
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Essencia | null>(null);
  const [detail, setDetail] = useState<Essencia | null>(null);
  const [form, setForm] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    descricao_longa: "",
    categoria: "Floral",
    acordes: "",
    ativa: true,
  });

  const loadEssencias = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("essencias")
      .select("*")
      .order("codigo");
    setEssencias(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEssencias();
  }, [loadEssencias]);

  const resetForm = () => {
    setForm({
      codigo: "",
      nome: "",
      descricao: "",
      descricao_longa: "",
      categoria: "Floral",
      acordes: "",
      ativa: true,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (ess: Essencia) => {
    setForm({
      codigo: ess.codigo,
      nome: ess.nome,
      descricao: ess.descricao || "",
      descricao_longa: ess.descricao_longa || "",
      categoria: ess.categoria || "Floral",
      acordes: Object.entries(ess.acordes)
        .map(([k, v]) => `${k}:${v}`)
        .join(", "),
      ativa: ess.ativa,
    });
    setEditing(ess);
    setShowForm(true);
    setDetail(null);
  };

  const parseAcordes = (str: string): Record<string, number> => {
    const result: Record<string, number> = {};
    str.split(",").forEach((pair) => {
      const [key, val] = pair.split(":").map((s) => s.trim());
      if (key && val) result[key] = parseFloat(val) || 0;
    });
    return result;
  };

  const handleSave = async () => {
    if (!supabase || !form.codigo || !form.nome) return;

    const payload = {
      codigo: form.codigo,
      nome: form.nome,
      descricao: form.descricao || null,
      descricao_longa: form.descricao_longa || null,
      categoria: form.categoria || null,
      acordes: parseAcordes(form.acordes),
      ativa: form.ativa,
    };

    if (editing) {
      await supabase.from("essencias").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("essencias").insert(payload);
    }

    resetForm();
    loadEssencias();
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Excluir essência permanentemente?")) return;
    await supabase.from("essencias").delete().eq("id", id);
    loadEssencias();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#CCC] text-sm">Carregando...</div>
      </div>
    );
  }

  // ── Detail view
  if (detail) {
    const maxAccord = Math.max(...Object.values(detail.acordes), 1);
    return (
      <div>
        <button
          onClick={() => setDetail(null)}
          className="text-[12px] text-[#888] mb-4 hover:text-[#1A1A1A]"
        >
          ← Voltar
        </button>
        <div className="bg-white border border-[#E8E4DF] p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-serif text-[28px] tracking-[2px]">
                {detail.codigo}
              </div>
              <div className="text-lg mt-1">{detail.nome}</div>
              {detail.descricao && (
                <div className="text-[13px] text-[#888] mt-1">
                  {detail.descricao}
                </div>
              )}
            </div>
            <span
              className={`badge ${
                detail.ativa ? "badge-success" : "badge-info"
              }`}
            >
              {detail.ativa ? "Ativa" : "Inativa"}
            </span>
          </div>

          {detail.descricao_longa && (
            <div className="text-[14px] text-[#555] leading-[1.8] mb-6 border-t border-[#E8E4DF] pt-4">
              {detail.descricao_longa}
            </div>
          )}

          <div className="border-t border-[#E8E4DF] pt-4">
            <div className="text-[10px] font-semibold tracking-[1.5px] uppercase mb-3 text-[#888]">
              Perfil de Acordes
            </div>
            <div className="space-y-2">
              {Object.entries(detail.acordes)
                .sort(([, a], [, b]) => b - a)
                .map(([accord, value]) => (
                  <div key={accord} className="flex items-center gap-3">
                    <div className="w-24 text-[12px] text-[#888] text-right capitalize">
                      {accord}
                    </div>
                    <div className="flex-1 h-5 bg-[#F4F1ED] relative">
                      <div
                        className="h-full bg-[#1A1A1A] transition-all"
                        style={{
                          width: `${(value / maxAccord) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-[11px] text-[#888]">{value}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={() => handleEdit(detail)} className="btn-primary">
              Editar
            </button>
            <button onClick={() => setDetail(null)} className="btn-secondary">
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl tracking-[1px]">Essências</h1>
          <p className="text-[13px] text-[#888] mt-1">
            {essencias.length} essência{essencias.length !== 1 ? "s" : ""}{" "}
            cadastrada{essencias.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          + Nova Essência
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#E8E4DF] p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase">
              {editing ? "Editar Essência" : "Nova Essência"}
            </div>
            <button
              onClick={resetForm}
              className="text-[#AAA] hover:text-[#1A1A1A]"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Código *
              </label>
              <input
                className="input-admin"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="SHI Nº 01"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Nome *
              </label>
              <input
                className="input-admin"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Flor de Laranjeira"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Descrição curta
              </label>
              <input
                className="input-admin"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Floral cítrico"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Categoria
              </label>
              <select
                className="input-admin"
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value })
                }
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Descrição longa
              </label>
              <textarea
                className="input-admin min-h-[80px] resize-y"
                value={form.descricao_longa}
                onChange={(e) =>
                  setForm({ ...form, descricao_longa: e.target.value })
                }
                placeholder="Uma fragrância que evoca..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                Acordes (formato: acorde:valor, ...)
              </label>
              <input
                className="input-admin"
                value={form.acordes}
                onChange={(e) => setForm({ ...form, acordes: e.target.value })}
                placeholder="floral:100, citrus:70, fresh:40, musky:15"
              />
              <div className="text-[10px] text-[#AAA] mt-1">
                Dominant=100, Prominent=70, Moderate=40, Subtle=15
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-[12px]">Ativa</label>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleSave} className="btn-primary">
              {editing ? "Salvar" : "Criar Essência"}
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
                <th>Código</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Acordes</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {essencias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[#AAA] py-8">
                    Nenhuma essência cadastrada
                  </td>
                </tr>
              ) : (
                essencias.map((e) => (
                  <tr
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => setDetail(e)}
                  >
                    <td className="font-medium font-serif tracking-[1px]">
                      {e.codigo}
                    </td>
                    <td>{e.nome}</td>
                    <td className="text-[#888]">{e.categoria || "-"}</td>
                    <td className="text-[#888] text-[12px]">
                      {Object.keys(e.acordes).length} acordes
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          e.ativa ? "badge-success" : "badge-info"
                        }`}
                      >
                        {e.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td
                      className="text-right"
                      onClick={(ev) => ev.stopPropagation()}
                    >
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
