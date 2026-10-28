"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/eventos", label: "Eventos", icon: "📅" },
  { href: "/essencias", label: "Essências", icon: "🧪" },
  { href: "/toppers", label: "Toppers", icon: "💧" },
  { href: "/participantes", label: "Participantes", icon: "👥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 h-screen bg-dark flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="font-serif text-2xl text-[#F9F7F6] tracking-wider">SHI</h1>
        <p className="text-[10px] tracking-[3px] uppercase text-g3">Aroma Lab · Admin</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition ${
                isActive
                  ? "bg-white/10 text-[#F9F7F6] font-medium"
                  : "text-g3 hover:text-[#F9F7F6] hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left px-6 py-2 text-sm text-g3 hover:text-[#F9F7F6] transition"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
