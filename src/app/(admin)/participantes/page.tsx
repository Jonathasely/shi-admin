"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Participante, Essencia, Ingrediente } from "@/lib/supabase";

interface ParticipanteView extends Participante {
  evento_nome: string;
  essencia_recomendada_codigo: string | null;
  essencia_escolhida_codigo: string | null;
}

export default function ParticipantesPage() {
  const [participantes, setParticipantes] = useState<ParticipanteView[]>([]);
  const [essencias, setEssencias] = useState<Essencia[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  // Combination form state
  const [combParticipante, setCombParticipante] = useState<ParticipanteView | null>(null);
  const [combBase, setCombBase] = useState("");
  const [combItems, setCombItems] = useState<{ ingrediente_id: string; quantidade: number }[]>([]);
  const [combObs, setCombObs] = useState("");

  // Escolhida override
  const [editEscolhida, setEditEscolhida] = useState<string | null>(null);
  const [escolhidaVal, setEscolhidaVal] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const [pRes, eRes, iRes] = await Promise.all([
      supabase
        .from("participantes")
        .select(
          "*, eventos(nome), er:essencias!participantes_essencia_recomendada_id_fkey(codigo), ee:essencias!participantes_essencia_escolhida_id_fkey(codigo)"
        )
        .order("created_at", { ascending: false }),
      supabase.from("essencias").select("*").eq("ativa", true).order("codigo"),
      supabase.from("ingredientes").select("*").eq("ativo", true).order("nome"),
    ]);

    setParticipantes(
      (pRes.data || []).map((p: any) => ({
        ...p,
        evento_nome: p.eventos?.nome || "-",
        essencia_recomendada_codigo: p.er?.codigo || null,
        essencia_escolhida_codigo: p.ee?.codigo || null,
      }))
    );
    setEssencias(eRes.data || []);
    setIngredientes(iRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = participantes.filter((p) => {
    const matchFilter =
      filter === "todos"
        ? true
        : filter === "pendente"
        ? !p.essencia_escolhida_id
        : filter === "definido"
        ? !!p.essencia_escolhida_id
        : true;
    const matchSearch =
      !search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.evento_nome.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleSetEscolhida = async (participanteId: string, essenciaId: string) => {
    if (!supabase) return;
    await supabase
      .from("participantes")
      .update({ essencia_escolhida_id: essenciaId || null })
      .eq("id", participanteId);
    setEditEscolhida(null);
    load();
  };

  const openCombForm = (p: ParticipanteView) => {
    setCombParticipante(p);
    setCombBase(p.essencia_escolhida_id || p.essencia_recomendada_id || "");
    setCombItems([]);
    setCombObs("");
  };

  const addCombItem = () => {
    setCombItems([...combItems, { ingrediente_id: "", quantidade: 2 }]);
  };

  const removeCombItem = (idx: number) => {
    setCombItems(combItems.filter((_, i) => i !== idx));
  };

  const saveCombinacao = async () => {
    if (!supabase || !combParticipante || !combBase) return;

    const { data: comb } = await supabase
      .from("combinacoes")
      .insert({
        participante_id: combParticipante.id,
        base_essencia_id: combBase,
        base_ml: 7,
        observacoes: combObs || null,
      })
      .select()
      .single();

    if (comb && combItems.length > 0) {
      const validItems = combItems.filter((i) => i.ingrediente_id);
      if (validItems.length > 0) {
        await supabase.from("combinacao_itens").insert(
          validItems.map((i) => ({
            combinacao_id: comb.id,
            ingrediente_id: i.ingrediente_id,
            quantidade: i.quantidade,
          }))
        );
      }
    }

    // Mark essencia escolhida if not set
    if (!combParticipante.essencia_escolhida_id) {
      await supabase
        .from("participantes")
        .update({ essencia_escolhida_id: combBase })
        .eq("id", combParticipante.id);
    }

    setCombParticipante(null);
    load();
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
          <h1 className="font-serif text-2xl tracking-[1px]">Participantes</h1>
          <p className="text-[13px] text-[#888] mt-1">
            {participantes.length} participante{participantes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["todos", "pendente", "definido"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] tracking-[1px] uppercase px-3 py-1.5 transition-all ${
              filter === f
                ? "bg-[#1A1A1A] text-white"
                : "bg-white text-[#888] border border-[#E8E4DF] hover:border-[#1A1A1A]"
            }`}
          >
            {f}
          </button>
        ))}
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-admin ml-auto max-w-[200px] text-[13px] py-1.5"
        />
      </div>

      {/* Combination form modal */}
      {combParticipante && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E8E4DF] p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <div className="text-[11px] font-semibold tracking-[1.5px] uppercase">
                  Registrar Combinação
                </div>
                <div className="text-[13px] text-[#888] mt-1">
                  {combParticipante.nome}
                </div>
              </div>
              <button
                onClick={() => setCombParticipante(null)}
                className="text-[#AAA] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                  Base SHI (7ml)
                </label>
                <select
                  className="input-admin"
                  value={combBase}
                  onChange={(e) => setCombBase(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {essencias.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.codigo} — {e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-[#888] tracking-[1.5px] uppercase">
                    Ingredientes
                  </label>
                  <button
                    onClick={addCombItem}
                    className="text-[11px] text-[#1A1A1A] hover:underline"
                  >
                    + Adicionar
                  </button>
                </div>
                {combItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      className="input-admin flex-1"
                      value={item.ingrediente_id}
                      onChange={(e) => {
                        const ni = [...combItems];
                        ni[idx].ingrediente_id = e.target.value;
                        setCombItems(ni);
                      }}
                    >
                      <option value="">Selecione...</option>
                      {ingredientes.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="input-admin w-20 text-center"
                      value={item.quantidade}
                      min={1}
                      max={10}
                      onChange={(e) => {
                        const ni = [...combItems];
                        ni[idx].quantidade = parseInt(e.target.value) || 1;
                        setCombItems(ni);
                      }}
                    />
                    <span className="text-[11px] text-[#888] self-center w-12">
                      gotas
                    </span>
                    <button
                      onClick={() => removeCombItem(idx)}
                      className="text-[#AAA] hover:text-[#C0392B] text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {combItems.length === 0 && (
                  <div className="text-[12px] text-[#CCC] py-2">
                    Nenhum ingrediente adicionado
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">
                  Observações
                </label>
                <textarea
                  className="input-admin min-h-[60px] resize-y"
                  value={combObs}
                  onChange={(e) => setCombObs(e.target.value)}
                />
              </div>

              {/* Preview */}
              {combBase && (
                <div className="bg-[#FAFAF8] border border-[#E8E4DF] p-4">
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[#888] mb-2">
                    Preview
                  </div>
                  <div className="text-[13px]">
                    <strong>
                      {essencias.find((e) => e.id === combBase)?.codigo}
                    </strong>{" "}
                    (7ml)
                    {combItems
                      .filter((i) => i.ingrediente_id)
                      .map((i, idx) => {
                        const ing = ingredientes.find(
                          (x) => x.id === i.ingrediente_id
                        );
                        return (
                          <span key={idx}>
                            {" "}
                            + {i.quantidade} gotas{" "}
                            {ing?.nome || "?"}
                          </span>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={saveCombinacao} className="btn-primary">
                Registrar
              </button>
              <button
                onClick={() => setCombParticipante(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
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
                <th>Evento</th>
                <th>Perfumes</th>
                <th>Recomendada</th>
                <th>Escolhida</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[#AAA] py-8">
                    Nenhum participante encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium">{p.nome}</div>
                      <div className="text-[11px] text-[#AAA]">
                        {p.whatsapp || p.email || ""}
                      </div>
                    </td>
                    <td className="text-[#888]">{p.evento_nome}</td>
                    <td className="text-[12px] text-[#888]">
                      {p.perfumes?.map((pf) => pf.name).join(", ") || "-"}
                    </td>
                    <td>
                      {p.essencia_recomendada_codigo ? (
                        <span className="badge badge-info">
                          {p.essencia_recomendada_codigo}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {editEscolhida === p.id ? (
                        <div className="flex gap-1">
                          <select
                            className="input-admin text-[12px] py-1 w-32"
                            value={escolhidaVal}
                            onChange={(e) => setEscolhidaVal(e.target.value)}
                          >
                            <option value="">—</option>
                            {essencias.map((e) => (
                              <option key={e.id} value={e.id}>
                                {e.codigo}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSetEscolhida(p.id, escolhidaVal)}
                            className="text-[10px] text-[#27AE60]"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditEscolhida(null)}
                            className="text-[10px] text-[#AAA]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : p.essencia_escolhida_codigo ? (
                        <span
                          className="badge badge-success cursor-pointer"
                          onClick={() => {
                            setEditEscolhida(p.id);
                            setEscolhidaVal(p.essencia_escolhida_id || "");
                          }}
                        >
                          {p.essencia_escolhida_codigo}
                          {p.essencia_escolhida_id !== p.essencia_recomendada_id && (
                            <span title="Ajuste manual"> ✎</span>
                          )}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setEditEscolhida(p.id);
                            setEscolhidaVal(p.essencia_recomendada_id || "");
                          }}
                          className="badge badge-warning cursor-pointer"
                        >
                          Pendente
                        </button>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => openCombForm(p)}
                        className="text-[11px] text-[#888] hover:text-[#1A1A1A]"
                      >
                        + Combinação
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
