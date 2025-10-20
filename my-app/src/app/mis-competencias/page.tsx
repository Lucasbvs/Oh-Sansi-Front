"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

type Item = {
  id: string;
  fechaInscripcion: string;
  competition: { id: string; nombre: string; area: string; nivel: string; modalidad: string };
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function MyCompetitionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  function token() {
    return typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const res = await fetch(`${API}/api/inscriptions/mis`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token()}` },
          cache: "no-store",
        });

        if (res.status === 404) {
          setItems([]);
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        setItems(json.items || []);
      } catch (e: any) {
        setMsg(e.message || "No se pudieron cargar tus competencias");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 text-black">
        <h1 className="text-2xl font-bold mb-4">Mis competencias</h1>

        {msg && <p className="text-sm text-red-600 mb-3">{msg}</p>}

        {loading ? (
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no estás inscrito en ninguna competencia.</p>
        ) : (
          <div className="grid gap-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{it.competition.nombre}</h3>
                    <p className="text-xs text-gray-600">
                      {it.competition.area} • {it.competition.nivel} • {it.competition.modalidad}
                    </p>
                  </div>
                  <Link href={`/competencias/${it.competition.id}`} className="px-3 py-2 rounded-xl bg-[#4854A1] text-white text-sm">
                    Ver detalle
                  </Link>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Inscrito el {new Date(it.fechaInscripcion).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer/>
    </div>
  );
}
