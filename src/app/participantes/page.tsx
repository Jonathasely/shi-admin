"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

interface Participant {
  id: string;
  name: string;
  email: string | null;
  passport_code: string | null;
  result_profile_name: string | null;
  result_base_id: string | null;
  created_at: string;
  events: { name: string } | null;
}

export default function ParticipantesPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("participants")
        .select("*, events(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setParticipants(data as Participant[]);
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-dark mb-1">Participantes</h1>
        <p className="text-g2 text-sm">{participants.length} participantes registrados</p>
      </div>

      <div className="bg-bg-card rounded-xl border border-g5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-g5">
              <th className="text-left px-5 py-3 text-xs text-g2 uppercase tracking-wider font-medium">Nome</th>
              <th className="text-left px-5 py-3 text-xs text-g2 uppercase tracking-wider font-medium">Evento</th>
              <th className="text-left px-5 py-3 text-xs text-g2 uppercase tracking-wider font-medium">Perfil</th>
              <th className="text-left px-5 py-3 text-xs text-g2 uppercase tracking-wider font-medium">Código</th>
              <th className="text-left px-5 py-3 text-xs text-g2 uppercase tracking-wider font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b border-g5 last:border-0">
                <td className="px-5 py-3">
                  <p className="text-sm text-dark">{p.name}</p>
                  {p.email && <p className="text-xs text-g3">{p.email}</p>}
                </td>
                <td className="px-5 py-3 text-sm text-g2">
                  {p.events?.name || "—"}
                </td>
                <td className="px-5 py-3 text-sm text-dark">
                  {p.result_profile_name || "—"}
                </td>
                <td className="px-5 py-3 text-xs font-mono text-g2 tracking-wider">
                  {p.passport_code || "—"}
                </td>
                <td className="px-5 py-3 text-xs text-g3">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}

            {participants.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-g3 text-sm">
                  Nenhum participante ainda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
