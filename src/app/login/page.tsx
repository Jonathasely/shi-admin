"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("E-mail ou senha incorretos");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1ED] px-4">
      <div className="w-full max-w-[380px] bg-white p-10 border border-[#E8E4DF]">
        <div className="text-center mb-8">
          <div className="font-serif text-[42px] tracking-[6px] leading-none">
            SHI
          </div>
          <div className="text-[9px] font-light text-[#888] tracking-[4px] uppercase mt-1">
            Aroma Lab
          </div>
          <div className="w-8 h-px bg-[#CCC] mx-auto mt-5 mb-3" />
          <div className="text-[11px] text-[#888] tracking-[2px] uppercase">
            Painel Administrativo
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] text-[#888] tracking-[2px] uppercase mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shiaromalab.com.br"
              className="input-admin"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#888] tracking-[2px] uppercase mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-admin"
              required
            />
          </div>

          {error && (
            <div className="text-[12px] text-[#C0392B] text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
