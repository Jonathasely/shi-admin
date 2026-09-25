"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Ingrediente } from "@/lib/supabase";

const CATEGORIAS = ["Floral", "Cítrico", "Amadeirado", "Especiaria", "Herbal", "Frutal", "Oriental", "Aquático"];

export default function IngredientesPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingrediente | null>(null);
  const [form, setForm] = useState({
    nome: "",
    categoria: "Floral",
    descricao: "",
    unidade: "gotas",
    ativo: true,
  });

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("ingredientes").select("*").order("nome");
    setIngredientes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ nome: "", categoria: "Floral", descricao: "", unidade: "gotas", ativo: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (item: Ingrediente) => {
    setForm({
      nome: item.nome,
      categoria: item.categoria || "Floral",
      descricao: item.descricao || "",
      unidade: item.unidade,
      ativo: item.ativo,
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!supabase || !form.nome) return;
    const payload = {
      nome: form.nome,
      categoria: form.categoria || null,
      descricao: form.descricao || null,
      unidade: form.unidade,
      ativo: form.ativo,
    };
    if (editing) {
      await supabase.from("ingredientes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("ingredientes").insert(payload);
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Excluir ingrediente?")) return;
    await supabase.from("ingredientes").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#CCC] text-sm">Carregando...</div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl tracking-[1px]">Ingredientes</h1>
          <p className="text-[13px] text-[#888] mt-1">{ingredientes.length} ingrediente{ingredientes.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ Novo Ingrediente</button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E8E4DF] p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase">{editing ? "Editar" : "Novo"} Ingrediente</div>
            <button onClick={resetForm} className="text-[#AAA] hover:text-[#1A1A1A]">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">Nome *</label>
              <input className="input-admin" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Rosa" />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">Categoria</label>
              <select className="input-admin" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">Unidade</label>
              <input className="input-admin" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] text-[#888] tracking-[1.5px] uppercase mb-1">Descrição</label>
              <input className="input-admin" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="w-4 h-4" />
              <label className="text-[12px]">Ativo</label>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleSave} className="btn-primary">{editing ? "Salvar" : "Criar"}</button>
            <button onClick={resetForm} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E8E4DF]">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Nome</th><th>Categoria</th><th>Unidade</th><th>Status</th><th className="text-right">Ações</th></tr>
            </thead>
            <tbody>
              {ingredientes.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-[#AAA] py-8">Nenhum ingrediente</td></tr>
              ) : ingredientes.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium">{i.nome}</td>
                  <td className="text-[#888]">{i.categoria || "-"}</td>
                  <td className="text-[#888]">{i.unidade}</td>
                  <td><span className={`badge ${i.ativo ? "badge-success" : "badge-info"}`}>{i.ativo ? "Ativo" : "Inativo"}</span></td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(i)} className="text-[11px] text-[#888] hover:text-[#1A1A1A] mr-3">Editar</button>
                    <button onClick={() => handleDelete(i.id)} className="text-[11px] text-[#AAA] hover:text-[#C0392B]">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
