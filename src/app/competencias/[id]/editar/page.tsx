"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";

type Estado = "Activo" | "Archivado" | "Borrador";
type Nivel = "Principiante" | "Intermedio" | "Avanzado";

export default function EditarCompetenciaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<Nivel>("Principiante");
  const [estado, setEstado] = useState<Estado>("Activo");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/competitions/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const c = await res.json(); // { id, nombre, nivel, estado, area, participantes }
        setNombre(c.nombre);
        setNivel(c.nivel);
        setEstado(c.estado);
        setArea(c.area ?? "");
      } catch (e) {
        console.error(e);
        setErrorMsg("No se pudo cargar la competencia.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
    if (!token) { setErrorMsg("Debe iniciar sesión."); return; }

    try {
      setSaving(true);
      const res = await fetch(`${API}/api/competitions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, nivel, estado, area }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/home");
    } catch (e: any) {
      setErrorMsg(e.message || "No se pudo actualizar la competencia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <main className="bg-white flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Editar competencia</h1>

        {loading ? (
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-100 rounded-2xl p-6 shadow">
            <label className="block">
              <span className="text-sm font-medium text-black">Nombre</span>
              <input className="mt-1 w-full text-black rounded-lg border px-3 py-2" value={nombre} onChange={e => setNombre(e.target.value)} required />
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
              <span className="text-sm font-medium text-black">Área</span>
              <input className="mt-1 w-full rounded-lg border px-3 py-2 text-black" value={area} onChange={e => setArea(e.target.value)} />
            </label>

            {errorMsg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{errorMsg}</p>}

            <div className="flex justify-end gap-2 text-black">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border">Cancelar</button>
              <button disabled={saving} className="px-4 py-2 rounded-xl bg-[#4854A1] text-white hover:bg-[#3a468a]">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
