"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

interface Base {
  id: string;
  code: string;
  name: string;
  description: string;
  family: string;
  inspiration: string | null;
  top_notes: string | null;
  heart_notes: string | null;
  base_notes: string | null;
  accords: { name: string; value: number }[];
  is_active: boolean;
}

export default function EssenciasPage() {
  const [bases, setBases] = useState<Base[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("bases")
        .select("*")
        .order("sort_order");
      if (data) {
        setBases(
          data.map((b) => ({
            ...b,
            accords:
              typeof b.accords === "string"
                ? JSON.parse(b.accords)
                : b.accords || [],
          }))
        );
      }
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-dark mb-1">Fragrâncias SHI</h1>
        <p className="text-g2 text-sm">
          {bases.length} fragrâncias cadastradas (23 + 1 infantil)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bases.map((base) => (
          <div
            key={base.id}
            className="bg-bg-card rounded-xl border border-g5 p-5 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <p className="text-xs text-g3 tracking-wider uppercase font-medium">
                  {base.code}
                </p>
                <h3 className="font-serif text-xl text-dark">{base.name}</h3>
                {base.inspiration && (
                  <p className="text-xs text-g3 mt-0.5">
                    Ref: {base.inspiration}
                  </p>
                )}
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-bg text-g2 shrink-0 ml-2">
                {base.family}
              </span>
            </div>

            <p className="text-sm text-text mb-4 leading-relaxed">
              {base.description}
            </p>

            {/* Accord bars */}
            <div className="space-y-2 mb-3">
              {base.accords.slice(0, 4).map((accord) => (
                <div key={accord.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-g2">{accord.name}</span>
                    <span className="text-g3">{accord.value}%</span>
                  </div>
                  <div className="h-1.5 bg-g5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-dark rounded-full"
                      style={{ width: `${accord.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Expandable notes */}
            <button
              onClick={() =>
                setExpanded(expanded === base.id ? null : base.id)
              }
              className="text-xs text-g3 hover:text-g2 transition"
            >
              {expanded === base.id ? "▲ Menos detalhes" : "▼ Ver notas"}
            </button>

            {expanded === base.id && (
              <div className="mt-3 pt-3 border-t border-g5 space-y-2 text-xs">
                {base.top_notes && (
                  <div>
                    <span className="text-g3 uppercase tracking-wider">
                      Topo:{" "}
                    </span>
                    <span className="text-text">{base.top_notes}</span>
                  </div>
                )}
                {base.heart_notes && (
                  <div>
                    <span className="text-g3 uppercase tracking-wider">
                      Coração:{" "}
                    </span>
                    <span className="text-text">{base.heart_notes}</span>
                  </div>
                )}
                {base.base_notes && (
                  <div>
                    <span className="text-g3 uppercase tracking-wider">
                      Fundo:{" "}
                    </span>
                    <span className="text-text">{base.base_notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
