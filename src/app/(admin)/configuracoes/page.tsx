"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Configuracao } from "@/lib/supabase";

const CONFIG_GROUPS = [
  {
    title: "API Fragella",
    keys: ["fragella_api_key", "fragella_base_url"],
  },
  {
    title: "Templates de Mensagem",
    keys: ["whatsapp_template", "email_template"],
  },
  {
    title: "Geral",
    keys: ["app_url", "admin_url"],
  },
];

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("configuracoes").select("*").order("chave");
    setConfigs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (chave: string) => {
    if (!supabase) return;
    const existing = configs.find((c) => c.chave === chave);
    if (existing) {
      await supabase.from("configuracoes").update({ valor: editVal }).eq("id", existing.id);
    } else {
      await supabase.from("configuracoes").insert({ chave, valor: editVal });
    }
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  const getVal = (chave: string) => configs.find((c) => c.chave === chave)?.valor || "";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-[#CCC] text-sm">Carregando...</div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl tracking-[1px]">Configurações</h1>
        <p className="text-[13px] text-[#888] mt-1">Configurações do sistema SHI Aroma Lab</p>
      </div>

      {saved && (
        <div className="bg-[#E8F5E9] text-[#27AE60] text-[12px] px-4 py-2 mb-4">
          Configuração salva com sucesso
        </div>
      )}

      {CONFIG_GROUPS.map((group) => (
        <div key={group.title} className="bg-white border border-[#E8E4DF] mb-4">
          <div className="px-5 py-4 border-b border-[#E8E4DF]">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase">{group.title}</div>
          </div>
          <div className="divide-y divide-[#F4F1ED]">
            {group.keys.map((key) => {
              const val = getVal(key);
              const isEditing = editing === key;
              const isLong = key.includes("template");
              return (
                <div key={key} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[12px] font-medium mb-1">{key}</div>
                      {isEditing ? (
                        isLong ? (
                          <textarea
                            className="input-admin min-h-[100px] resize-y text-[13px]"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                          />
                        ) : (
                          <input
                            className="input-admin text-[13px]"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                          />
                        )
                      ) : (
                        <div className="text-[13px] text-[#888] break-all">
                          {key.includes("api_key") && val
                            ? val.slice(0, 8) + "••••••"
                            : val || "(não definido)"}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleSave(key)} className="btn-primary text-[10px] px-3 py-1.5">
                            Salvar
                          </button>
                          <button onClick={() => setEditing(null)} className="btn-secondary text-[10px] px-3 py-1.5">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditing(key); setEditVal(val); }}
                          className="text-[11px] text-[#888] hover:text-[#1A1A1A]"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
