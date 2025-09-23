"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

type Estado = "Activo" | "Archivado" | "Borrador";
type Nivel = "Principiante" | "Intermedio" | "Avanzado";

export default function NuevaCompetenciaPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<Nivel>("Principiante");
  const [estado, setEstado] = useState<Estado>("Activo");
  const [areasText, setAreasText] = useState(""); // separado por comas
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
    const areas = areasText.split(",").map(a => a.trim()).filter(Boolean);

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/competitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nombre, nivel, estado, areas }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error HTTP ${res.status}`);
      }
      router.push("/home");
    } catch (e: any) {
      setErrorMsg(e.message || "No se pudo crear la competencia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Nueva competencia</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-400 rounded-2xl p-6 shadow">
          <label className="block">
            <span className="text-sm font-medium text-black">Nombre</span>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-black" value={nombre} onChange={e => setNombre(e.target.value)} required />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-black">Nivel</span>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 text-black" value={nivel} onChange={e => setNivel(e.target.value as Nivel)}>
                <option>Principiante</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-black">Estado</span>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 text-black" value={estado} onChange={e => setEstado(e.target.value as Estado)}>
                <option>Activo</option>
                <option>Archivado</option>
                <option>Borrador</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-black">Áreas</span>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-black" value={areasText} onChange={e => setAreasText(e.target.value)} placeholder="Ej: Cinemática, Derivados e integrales" />
          </label>

          {errorMsg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{errorMsg}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border">Cancelar</button>
            <button disabled={loading} className="px-4 py-2 rounded-xl bg-[#4854A1] text-white hover:bg-[#3a468a]">{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
