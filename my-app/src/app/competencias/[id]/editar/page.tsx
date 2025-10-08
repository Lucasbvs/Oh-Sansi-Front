"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import useAuthUser from "@/hooks/useAuthUser";

import {
  EstadoUi, NivelUi, AreaUi,
  EstadoApi, NivelApi, AreaApi,
  estadoApi2Ui, estadoUi2Api,
  nivelApi2Ui,  nivelUi2Api,
  areaApi2Ui,   areaUi2Api,
} from "../../../types";
import { canManageCompetitions } from "@/utils/permissions";

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]{1,45}$/;

type CompetitionApi = {
  id: string;
  nombre: string;
  nivel: NivelApi;
  estado: EstadoApi;
  area: AreaApi;
  participantes: number;
  fechaInicio: string; // ISO
};

export default function EditarCompetenciaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<NivelUi>("Principiante");
  const [estado, setEstado] = useState<EstadoUi>("Inscripción");
  const [area, setArea] = useState<AreaUi>("Matemática");
  const [participantes, setParticipantes] = useState<"1" | "2" | "3" | "4">("1");
  const [fechaInicio, setFechaInicio] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { user, loading: loadingUser } = useAuthUser();
  const showActions =
  !loadingUser && (user?.role === "ADMIN" || user?.role === "RESPONSABLEACADEMICO");

  useEffect(() => {
    if(!id)return;
    async function load() {
      setErrorMsg(null);
      try {
        const res = await fetch(`${API}/api/competitions/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Acepta tanto {competition: {...}} como el objeto directo
        const c: CompetitionApi = (data?.competition ?? data) as CompetitionApi;

        setNombre(c.nombre);
        setNivel(nivelApi2Ui[c.nivel]);
        setEstado(estadoApi2Ui[c.estado]);
        setArea(areaApi2Ui[c.area]);
        setParticipantes(String(c.participantes) as "1" | "2" | "3" | "4");
        setFechaInicio(new Date(c.fechaInicio).toISOString().slice(0, 10)); // YYYY-MM-DD
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

    // Validaciones UI
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
      setSaving(true);

      const body = {
        nombre: nombre.trim(),
        nivel:  nivelUi2Api[nivel],
        estado: estadoUi2Api[estado],
        area:   areaUi2Api[area],
        participantes: Number(participantes),
        fechaInicio, // "YYYY-MM-DD" (z.coerce.date() lo parsea)
      };

      const res = await fetch(`${API}/api/competitions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      router.push("/home");
    } catch (e: any) {
      console.error(e);
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
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-200 rounded-2xl p-6 shadow">
            {/* Nombre */}
            <label className="block">
              <span className="text-sm font-medium text-black">Nombre</span>
              <input
                className="mt-1 w-full text-black rounded-lg border px-3 py-2"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                maxLength={45}
                pattern={NAME_RE.source}
                title="Solo letras y espacios. Máx 45 caracteres."
                required
              />
            </label>

            {/* Nivel + Estado */}
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

            {/* Área + Participantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <label className="block">
                <span className="text-sm font-medium text-black">Cantidad de participantes</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
                  value={participantes}
                  onChange={e => setParticipantes(e.target.value as "1" | "2" | "3" | "4")}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </label>
            </div>

            {/* Fecha de inicio */}
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

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-end gap-2 text-black">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border">
                Cancelar
              </button>
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
