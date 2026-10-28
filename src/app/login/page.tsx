"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou senha incorretos");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-dark tracking-wider mb-1">SHI</h1>
          <p className="text-xs tracking-[3px] uppercase text-g3">Admin</p>
        </div>

        <form onSubmit={handleLogin} className="bg-bg-card rounded-2xl border border-g5 p-8">
          <h2 className="font-serif text-xl text-dark mb-6 text-center">Entrar</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3 transition"
                required
              />
            </div>
            <div>
              <label className="text-xs text-g2 uppercase tracking-wider block mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg border border-g5 text-dark text-sm focus:outline-none focus:border-g3 transition"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-error text-xs text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-dark text-bg-card text-sm tracking-wider uppercase font-medium transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
