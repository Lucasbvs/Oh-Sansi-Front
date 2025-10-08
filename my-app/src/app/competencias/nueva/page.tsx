"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

import {
  EstadoUi, NivelUi, AreaUi,
  estadoUi2Api, nivelUi2Api, areaUi2Api
} from "../../types";

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]{1,45}$/;

export default function NuevaCompetenciaPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<NivelUi>("Principiante");
  const [estado, setEstado] = useState<EstadoUi>("Inscripción");
  const [area, setArea] = useState<AreaUi>("Matemática");
  const [participantes, setParticipantes] = useState<"1" | "2" | "3" | "4">("1");
  const [fechaInicio, setFechaInicio] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const payload = {
  nombre: nombre.trim(),
  nivel:  nivelUi2Api[nivel],
  estado: estadoUi2Api[estado],
  area:   areaUi2Api[area],
  participantes: Number(participantes),
  fechaInicio,
};
console.log("payload", payload);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!NAME_RE.test(nombre.trim())) {
      setErrorMsg("Nombre inválido: solo letras/espacios y máx. 45 caracteres.");
      return;
    }
    if (!fechaInicio) {
      setErrorMsg("Seleccione una fecha de inicio.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
    if (!token) { setErrorMsg("Debe iniciar sesión."); return; }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/competitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          nivel:  nivelUi2Api[nivel],
          estado: estadoUi2Api[estado],
          area:   areaUi2Api[area],
          participantes:  Number(participantes),
          fechaInicio
        }),
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

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-200 rounded-2xl p-6 shadow">
          {/* Nombre */}
          <label className="block">
            <span className="text-sm font-medium text-black">Nombre</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              maxLength={45}
              pattern={NAME_RE.source}
              title="Solo letras y espacios. Máx 45 caracteres."
              required
            />
          </label>

          {/* Nivel + Estado lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-black">Nivel</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
                value={nivel}
                onChange={e => setNivel(e.target.value as NivelUi)}
              >
                <option>Principiante</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-black">Estado</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
                value={estado}
                onChange={e => setEstado(e.target.value as EstadoUi)}
              >
                <option>Inscripción</option>
                <option>Desarrollo</option>
                <option>Evaluación</option>
                <option>Modificaciones</option>
                <option>Finalización</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Área (select fijo) */}
            <label className="block">
              <span className="text-sm font-medium text-black">Área</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
                value={area}
                onChange={e => setArea(e.target.value as AreaUi)}
              >
                <option>Matemática</option>
                <option>Física</option>
                <option>Robótica</option>
                <option>Química</option>
                <option>Programación</option>
              </select>
            </label>

            {/* Participantes 1..4 */}
            <label className="block">
              <span className="text-s font-medium text-black">Cantidad de participantes</span>
              <select
               className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
               value={participantes}
               onChange={e => setParticipantes(e.target.value as "1"|"2"|"3"|"4")}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </label>
          </div>

          {/* Fecha de inicio*/}
          <div>
            <span className="text-sm font-medium text-black">Fecha de inicio</span>
            <div className="mt-1">
              <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-black"
              required
            />
            </div>
          </div>

          {errorMsg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{errorMsg}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border text-black">Cancelar</button>
            <button disabled={loading} className="px-4 py-2 rounded-xl bg-[#4854A1] text-white hover:bg-[#3a468a]">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}