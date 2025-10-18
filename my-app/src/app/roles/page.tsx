"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";

type Role = { id: string; name: string; slug: string; isSystem: boolean; createdAt: string };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        if (!token) { router.push("/login"); return; }
        const res = await fetch(`${API}/api/roles`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
        const data = await res.json();
        setRoles(data.roles ?? []);
      } catch (e:any) { setError(e.message ?? "Error"); }
      finally { setLoading(false); }
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 text-black">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Roles</h1>
        </div>

        {loading ? <div className="h-20 rounded-2xl bg-gray-100 animate-pulse" /> :
          error ? <p className="text-red-600">{error}</p> :
          roles.length === 0 ? <p>No hay roles.</p> :
          <ul className="space-y-2">
            {roles.map(r => (
              <li key={r.id} className="rounded-2xl border bg-white p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{r.name} <span className="text-gray-500">({r.slug})</span></p>
                  {r.isSystem && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">Sistema</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/roles/${r.id}/editar`)} className="px-3 py-1 rounded-xl border">Editar</button>
                  {!r.isSystem && <button onClick={() => router.push(`/roles/${r.id}/eliminar`)} className="px-3 py-1 rounded-xl border text-red-600 border-red-300">Eliminar</button>}
                </div>
              </li>
            ))}
          </ul>}
      </main>
      
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => router.push("/roles/nuevo")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4854A1] text-white px-4 py-2 font-semibold hover:bg-[#3a468a] transition"
        >
          <FiPlus /> Crear Rol
        </button>
      </div>

      <Footer />
    </div>
  );
}
