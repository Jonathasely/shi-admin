"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

interface Topper {
  id: string;
  name: string;
  category: string;
  description: string;
  is_active: boolean;
}

const categories = ["Todas", "Floral", "Cítrico", "Amadeirado", "Gourmand", "Especiado", "Acorde", "Resinoso", "Sensorial", "Frutado", "Herbáceo", "Aromático", "Musk"];

export default function ToppersPage() {
  const [toppers, setToppers] = useState<Topper[]>([]);
  const [filter, setFilter] = useState("Todas");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("toppers")
        .select("*")
        .order("sort_order");
      if (data) setToppers(data);
    }
    load();
  }, []);

  const filtered = filter === "Todas" ? toppers : toppers.filter((t) => t.category === filter);

  const categoryColors: Record<string, string> = {
    Floral: "bg-pink-50 text-pink-600 border-pink-200",
    Cítrico: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Amadeirado: "bg-amber-50 text-amber-700 border-amber-200",
    Gourmand: "bg-orange-50 text-orange-600 border-orange-200",
    Especiado: "bg-red-50 text-red-600 border-red-200",
    Acorde: "bg-info-light text-info border-blue-200",
    Resinoso: "bg-purple-50 text-purple-600 border-purple-200",
    Sensorial: "bg-success-light text-success border-green-200",
    Frutado: "bg-rose-50 text-rose-600 border-rose-200",
    Herbáceo: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Aromático: "bg-teal-50 text-teal-600 border-teal-200",
    Musk: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-dark mb-1">Toppers</h1>
        <p className="text-g2 text-sm">{toppers.length} gotinhas cadastradas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs transition ${
              filter === cat
                ? "bg-dark text-bg-card"
                : "bg-bg-card border border-g5 text-g2 hover:border-g3"
            }`}
          >
            {cat}
            {cat !== "Todas" && (
              <span className="ml-1 opacity-60">
                {toppers.filter((t) => t.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((topper) => (
          <div
            key={topper.id}
            className="bg-bg-card rounded-xl border border-g5 p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center font-serif text-dark text-lg shrink-0">
              💧
            </div>
            <div className="min-w-0">
              <h4 className="text-sm text-dark font-medium truncate">{topper.name}</h4>
              <p className="text-xs text-g2 mb-1.5">{topper.description}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[topper.category] || "bg-bg text-g2 border-g5"}`}>
                {topper.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
