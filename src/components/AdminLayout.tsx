"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "◻" },
  { label: "Eventos", href: "/eventos", icon: "◈" },
  { label: "Essências", href: "/essencias", icon: "◇" },
  { label: "Ingredientes", href: "/ingredientes", icon: "○" },
  { label: "Participantes", href: "/participantes", icon: "◎" },
  { label: "Configurações", href: "/configuracoes", icon: "⚙" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkAuth();

    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) router.push("/login");
        else setUser(session.user);
      });
      return () => subscription.unsubscribe();
    }
  }, [router]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-serif text-2xl tracking-[4px] text-[#CCC]">
          SHI
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-50 w-[240px] h-screen bg-white border-r border-[#E8E4DF] flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 pb-4 border-b border-[#E8E4DF]">
          <div className="font-serif text-[28px] tracking-[4px] leading-none">
            SHI
          </div>
          <div className="text-[8px] font-light text-[#888] tracking-[3px] uppercase mt-0.5">
            Aroma Lab — Admin
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 mb-0.5 text-[13px] transition-all ${
                  isActive
                    ? "bg-[#1A1A1A] text-white font-medium"
                    : "text-[#555] hover:bg-[#F4F1ED]"
                }`}
              >
                <span className="text-sm w-4 text-center opacity-60">
                  {item.icon}
                </span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#E8E4DF]">
          <div className="text-[11px] text-[#888] truncate mb-2">
            {user?.email || "Admin"}
          </div>
          <button
            onClick={handleLogout}
            className="text-[10px] text-[#AAA] tracking-[1px] uppercase hover:text-[#C0392B] transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-[#E8E4DF]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-lg leading-none"
          >
            ☰
          </button>
          <div className="font-serif text-lg tracking-[3px]">SHI</div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
