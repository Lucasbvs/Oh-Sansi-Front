"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type EtapaKey = "INSCRIPCION" | "DESARROLLO" | "EVALUACION" | "CORRECCION" | "PREMIACION";
type EtapaUi = "Inscripción" | "Desarrollo" | "Evaluación" | "Corrección" | "Premiación";
const ALL_ETAPAS: { api: EtapaKey; ui: EtapaUi }[] = [
  { api: "INSCRIPCION", ui: "Inscripción" },
  { api: "DESARROLLO",  ui: "Desarrollo"  },
  { api: "EVALUACION",  ui: "Evaluación"  },
  { api: "CORRECCION",  ui: "Corrección"  },
  { api: "PREMIACION",  ui: "Premiación"  },
];

export default function NuevaCompetenciaPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("PRINCIPIANTE");
  const [area, setArea] = useState("MATEMATICA");
  const [participantes, setParticipantes] = useState(1);
  const [modalidad, setModalidad] = useState<"PRESENCIAL" | "VIRTUAL">("PRESENCIAL");
  const [forma, setForma] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  
  // Etapa actual (al lado de forma de calificación)
  const [etapaActual, setEtapaActual] = useState<EtapaUi>("Inscripción");

  // Fases (las que ya tenías)
  const [fases, setFases] = useState(
    [] as { nombre: string; fechaInicio: string; fechaFin: string }[]
  );

  // Etapas (fechas)
  const [etapas, setEtapas] = useState<Record<EtapaKey, { inicio: string; fin: string | null }>>({
    INSCRIPCION: { inicio: "", fin: "" },
    DESARROLLO:  { inicio: "", fin: "" },
    EVALUACION:  { inicio: "", fin: "" },
    CORRECCION:  { inicio: "", fin: null },
    PREMIACION:  { inicio: "", fin: "" },
  });

  const [error, setError] = useState<string | null>(null);

  function addFase() {
    setFases([...fases, { nombre: "", fechaInicio: "", fechaFin: "" }]);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);
    try {
      // Validar etapas mínimas
      for (const { api } of ALL_ETAPAS) {
        const r = etapas[api];
        if (!r.inicio) throw new Error(`Falta fecha de inicio en ${api}.`);
        if (api !== "CORRECCION" && !r.fin) throw new Error(`Falta fecha de fin en ${api}.`);
      }

      const token = localStorage.getItem("ohsansi_token");
      const res = await fetch(`${API}/api/competitions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          nivel,
          area,
          participantes,
          modalidad,
          formaCalificacion: forma,
          fases,
          // Nuevo:
          etapas: ALL_ETAPAS.map(({ api }) => ({
            etapa: api,
            fechaInicio: etapas[api].inicio,
            fechaFin: api === "CORRECCION" ? (etapas[api].fin ?? null) : etapas[api].fin,
          })),
          etapaActual: // el backend la setea a INSCRIPCION por defecto, pero igual podemos enviar
            {
              "Inscripción": "INSCRIPCION",
              "Desarrollo": "DESARROLLO",
              "Evaluación": "EVALUACION",
              "Corrección": "CORRECCION",
              "Premiación": "PREMIACION",
            }[etapaActual],
          fechaInicio,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.message || `HTTP ${res.status}`);
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="text-black max-w-3xl w-full mx-auto flex-1 p-6">
        <h1 className="text-xl font-bold mb-6 text-black">
          Competencia nueva
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 bg-gray-100 rounded-2xl p-6">
          {/* Nombre */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-black mb-1">
              Nombre
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de competencia"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* Nivel y Área */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Nivel</label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option>PRINCIPIANTE</option>
                <option>INTERMEDIO</option>
                <option>AVANZADO</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Área</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option>MATEMATICA</option>
                <option>FISICA</option>
                <option>ROBOTICA</option>
                <option>QUIMICA</option>
                <option>PROGRAMACION</option>
              </select>
            </div>
          </div>

          {/* Participantes y Modalidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Cantidad de participantes</label>
              <select
                value={participantes}
                onChange={(e) => setParticipantes(Number(e.target.value))}
                className="border rounded-lg px-3 py-2"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Modalidad</label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as any)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="PRESENCIAL">PRESENCIAL</option>
                <option value="VIRTUAL">VIRTUAL</option>
              </select>
            </div>
          </div>

          {/* Forma de calificación + Etapa actual (lado a lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Forma de calificación</label>
              <textarea
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                placeholder="Forma de calificación"
                className="w-full border rounded-lg px-3 py-2"
                maxLength={400}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Etapa actual</label>
              <select
                value={etapaActual}
                onChange={(e) => setEtapaActual(e.target.value as EtapaUi)}
                className="border rounded-lg px-3 py-2"
              >
                {ALL_ETAPAS.map(e => <option key={e.api}>{e.ui}</option>)}
              </select>
            </div>
          </div>

          {/* Fecha de inicio general de la competencia */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-black mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* Etapas (fechas) */}
          <div className="mt-2">
            <h2 className="font-semibold text-black mb-2">Etapas</h2>
            <div className="space-y-3">
              {ALL_ETAPAS.map(({ api, ui }) => (
                <div key={api} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Etapa</label>
                    <input value={ui} disabled className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inicio</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas[api].inicio}
                      onChange={(e) => setEtapas(p => ({ ...p, [api]: { ...p[api], inicio: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fin{api === "CORRECCION" ? " (opcional)" : ""}</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas[api].fin ?? ""}
                      onChange={(e) => setEtapas(p => ({ ...p, [api]: { ...p[api], fin: e.target.value || null } }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fases */}
          <div className="mt-4">
            <h2 className="font-semibold text-black mb-2">Fases</h2>
            {fases.map((f, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder="Nombre"
                  value={f.nombre}
                  onChange={(e) => {
                    const updated = [...fases];
                    updated[i].nombre = e.target.value;
                    setFases(updated);
                  }}
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="date"
                  value={f.fechaInicio}
                  onChange={(e) => {
                    const updated = [...fases];
                    updated[i].fechaInicio = e.target.value;
                    setFases(updated);
                  }}
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="date"
                  value={f.fechaFin}
                  onChange={(e) => {
                    const updated = [...fases];
                    updated[i].fechaFin = e.target.value;
                    setFases(updated);
                  }}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addFase}
              className="bg-[#4854A1] text-white px-4 py-2 rounded-lg hover:bg-[#3a468a]"
            >
              Añadir fase
            </button>
          </div>

          {/* Error */}
          {error && <p className="text-red-600">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="bg-[#4854A1] text-white w-full rounded-lg py-2 font-semibold hover:bg-[#3a468a]"
          >
            Crear competencia
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
