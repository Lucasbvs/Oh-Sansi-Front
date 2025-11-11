"use client";

import { useEffect, useState, useMemo } from "react";
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

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]{1,45}$/;
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

type Fase = {
  id?: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

type CompetitionApi = {
  id: string;
  nombre: string;
  nivel: NivelApi;
  area: AreaApi;
  participantes: number;
  modalidad: "PRESENCIAL" | "VIRTUAL";
  formaCalificacion: string;
  fechaInicio: string;
  etapaActual: EstadoApi;
  etapas: { etapa: EtapaKey; fechaInicio: string; fechaFin: string | null }[];
  fases: Fase[]; 
};

export default function EditarCompetenciaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { user, loading: loadingUser } = useAuthUser();
  const perms = (user as any)?.roleInfo?.permissions ?? {};
  const canUpdate = !!perms?.competitions?.update;

  useEffect(() => {
    if (!loadingUser && !canUpdate) router.replace("/home?error=No%20autorizado");
  }, [loadingUser, canUpdate, router]);

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<NivelUi>("Principiante");
  const [area, setArea] = useState<AreaUi>("Matemática");
  const [participantes, setParticipantes] = useState<"1" | "2" | "3" | "4" | "5">("1");
  const [modalidad, setModalidad] = useState<"PRESENCIAL" | "VIRTUAL">("PRESENCIAL");
  const [forma, setForma] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>("");

  // Etapa actual (estado visible)
  const [etapaActual, setEtapaActual] = useState<EtapaUi>("Inscripción");
  // Fechas de etapas
  const [etapas, setEtapas] = useState<Record<EtapaKey, { inicio: string; fin: string | null }>>({
    INSCRIPCION: { inicio: "", fin: "" },
    DESARROLLO:  { inicio: "", fin: "" },
    EVALUACION:  { inicio: "", fin: "" },
    CORRECCION:  { inicio: "", fin: null },
    PREMIACION:  { inicio: "", fin: "" },
  });


  const [fases, setFases] = useState<Fase[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  function validarFasesAntesDeEnviar() {
    const desarrollo = etapas.DESARROLLO;
    
    
    if (!desarrollo.inicio || !desarrollo.fin) {
      return "La etapa de Desarrollo necesita fechas de inicio y fin para validar las fases";
    }
    
    const inicioDesarrollo = new Date(desarrollo.inicio);
    const finDesarrollo = new Date(desarrollo.fin);
    
  
    for (const fase of fases) {
      if (!fase.fechaInicio || !fase.fechaFin) {
        return `La fase "${fase.nombre || 'Sin nombre'}" necesita fechas de inicio y fin`;
      }
      
      const inicioFase = new Date(fase.fechaInicio);
      const finFase = new Date(fase.fechaFin);
      

      if (finFase < inicioFase) {
        return `La fase "${fase.nombre}" tiene fecha de fin (${finFase.toLocaleDateString()}) anterior a la fecha de inicio (${inicioFase.toLocaleDateString()})`;
      }
      

      if (inicioFase < inicioDesarrollo) {
        return `La fase "${fase.nombre}" inicia antes del Desarrollo (${inicioDesarrollo.toLocaleDateString()})`;
      }
      if (finFase > finDesarrollo) {
        return `La fase "${fase.nombre}" finaliza después del Desarrollo (${finDesarrollo.toLocaleDateString()})`;
      }
    }
    
    return null;
  }

  function addFase() {
    setFases([...fases, { nombre: "", fechaInicio: "", fechaFin: "" }]);
  }

  // Cargar competencia
  useEffect(() => {
    if (!id) return;
    (async () => {
      setErrorMsg(null);
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
        const res = await fetch(`${API}/api/competitions/${id}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const c: CompetitionApi = data?.competition ?? data;

        setNombre(c.nombre);
        setNivel(nivelApi2Ui[c.nivel]);
        setArea(areaApi2Ui[c.area]);
        setParticipantes(String(c.participantes) as any);
        setModalidad(c.modalidad);
        setForma(c.formaCalificacion || "");
        setFechaInicio(new Date(c.fechaInicio).toISOString().slice(0, 10));
        setEtapaActual(estadoApi2Ui[c.etapaActual] as EtapaUi);

        if (c.fases && Array.isArray(c.fases)) {
          setFases(c.fases.map(fase => ({
            id: fase.id,
            nombre: fase.nombre,
            fechaInicio: new Date(fase.fechaInicio).toISOString().slice(0, 10),
            fechaFin: new Date(fase.fechaFin).toISOString().slice(0, 10)
          })));
        }

        const dict = { ...etapas };
        ALL_ETAPAS.forEach(({ api }) => {
          const row = c.etapas.find((e) => e.etapa === api);
          dict[api] = {
            inicio: row ? row.fechaInicio.slice(0, 10) : "",
            fin: row ? (row.fechaFin ? row.fechaFin.slice(0, 10) : null) : api === "CORRECCION" ? null : "",
          };
        });
        setEtapas(dict);
      } catch (e) {
        console.error(e);
        setErrorMsg("No se pudo cargar la competencia.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!NAME_RE.test(nombre.trim())) return setErrorMsg("Nombre inválido.");
    if (!fechaInicio) return setErrorMsg("Seleccione una fecha de inicio.");
    for (const { api } of ALL_ETAPAS) {
      const r = etapas[api];
      if (!r.inicio) return setErrorMsg(`Falta fecha de inicio en ${api}.`);
      if (api !== "CORRECCION" && !r.fin) return setErrorMsg(`Falta fecha de fin en ${api}.`);
    }

    // Validación de fases
    const errorFases = validarFasesAntesDeEnviar();
    if (errorFases) {
      setErrorMsg(errorFases);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
    if (!token) { setErrorMsg("Debe iniciar sesión."); return; }

    try {
      setSaving(true);
      const body = {
        nombre: nombre.trim(),
        nivel:  nivelUi2Api[nivel],
        area:   areaUi2Api[area],
        participantes: Number(participantes),
        modalidad,
        formaCalificacion: forma,
        fechaInicio,
        etapaActual: estadoUi2Api[etapaActual],
        etapas: ALL_ETAPAS.map(({ api }) => ({
          etapa: api,
          fechaInicio: etapas[api].inicio,
          fechaFin: api === "CORRECCION" ? (etapas[api].fin ?? null) : etapas[api].fin,
        })),
        
        fases: fases.map(fase => ({
          nombre: fase.nombre,
          fechaInicio: fase.fechaInicio,
          fechaFin: fase.fechaFin
        }))
      };

      const res = await fetch(`${API}/api/competitions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message?.includes("fase") || data?.message?.includes("DESARROLLO")) {
          throw new Error(`Error de validación: ${data.message}`);
        }
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

  if (loadingUser || !canUpdate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600 text-sm">{loadingUser ? "Cargando…" : "No autorizado"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <main className="bg-white flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Editar competencia</h1>

        {loading ? (
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-200 rounded-2xl p-6 shadow text-black">
            {/* Nombre */}
            <label className="block">
              <span className="text-sm font-medium">Nombre</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                maxLength={45}
                pattern={NAME_RE.source}
                title="Solo letras y espacios. Máx 45 caracteres."
                required
              />
            </label>

            {/* Nivel + Etapa actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Nivel</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={nivel}
                  onChange={e => setNivel(e.target.value as NivelUi)}
                >
                  <option>Principiante</option>
                  <option>Intermedio</option>
                  <option>Avanzado</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Etapa actual</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={etapaActual}
                  onChange={e => setEtapaActual(e.target.value as EtapaUi)}
                >
                  {ALL_ETAPAS.map(e => <option key={e.api}>{e.ui}</option>)}
                </select>
              </label>
            </div>

            {/* Área + Participantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Área</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
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
                <span className="text-sm font-medium">Cantidad de participantes</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={participantes}
                  onChange={e => setParticipantes(e.target.value as any)}
                >
                  {["1","2","3","4","5"].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>

            {/* Modalidad + Fecha de inicio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Modalidad</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={modalidad}
                  onChange={e => setModalidad(e.target.value as any)}
                >
                  <option value="PRESENCIAL">PRESENCIAL</option>
                  <option value="VIRTUAL">VIRTUAL</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Fecha de inicio</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  required
                />
              </label>
            </div>

            {/* Forma de calificación */}
            <label className="block">
              <span className="text-sm font-medium">Forma de calificación</span>
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={forma}
                onChange={e => setForma(e.target.value)}
                maxLength={400}
              />
            </label>

            {}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold">Etapas</legend>
              <div className="space-y-3">
                {/* Inscripción */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Etapa</label>
                    <input value="Inscripción" disabled className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inicio</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.INSCRIPCION.inicio}
                      onChange={(e) => setEtapas(p => ({ ...p, INSCRIPCION: { ...p.INSCRIPCION, inicio: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fin</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.INSCRIPCION.fin ?? ""}
                      onChange={(e) => setEtapas(p => ({ ...p, INSCRIPCION: { ...p.INSCRIPCION, fin: e.target.value || null } }))}
                    />
                  </div>
                </div>

                {/* Desarrollo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Etapa</label>
                    <input value="Desarrollo" disabled className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inicio</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.DESARROLLO.inicio}
                      onChange={(e) => setEtapas(p => ({ ...p, DESARROLLO: { ...p.DESARROLLO, inicio: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fin</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.DESARROLLO.fin ?? ""}
                      onChange={(e) => setEtapas(p => ({ ...p, DESARROLLO: { ...p.DESARROLLO, fin: e.target.value || null } }))}
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Sección de Fases (medio) */}
            <div className="mt-4 border rounded-xl p-4">
              <h2 className="font-semibold text-black mb-2">Fases</h2>
              <div className="mb-3 text-sm text-gray-600">
                <p>Las fases deben estar dentro del rango de fechas de la etapa de Desarrollo</p>
              </div>
              {fases.map((f, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    placeholder="Nombre de la fase"
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
                    placeholder="Inicio"
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
                    placeholder="Fin"
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

            {}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold">Etapas (Continuación)</legend>
              <div className="space-y-3">
                {/* Evaluación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Etapa</label>
                    <input value="Evaluación" disabled className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inicio</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.EVALUACION.inicio}
                      onChange={(e) => setEtapas(p => ({ ...p, EVALUACION: { ...p.EVALUACION, inicio: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fin</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.EVALUACION.fin ?? ""}
                      onChange={(e) => setEtapas(p => ({ ...p, EVALUACION: { ...p.EVALUACION, fin: e.target.value || null } }))}
                    />
                  </div>
                </div>

                {/* Corrección */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Etapa</label>
                    <input value="Corrección" disabled className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inicio</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.CORRECCION.inicio}
                      onChange={(e) => setEtapas(p => ({ ...p, CORRECCION: { ...p.CORRECCION, inicio: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fin (opcional)</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.CORRECCION.fin ?? ""}
                      onChange={(e) => setEtapas(p => ({ ...p, CORRECCION: { ...p.CORRECCION, fin: e.target.value || null } }))}
                    />
                  </div>
                </div>

                {/* Premiación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Etapa</label>
                    <input value="Premiación" disabled className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inicio</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.PREMIACION.inicio}
                      onChange={(e) => setEtapas(p => ({ ...p, PREMIACION: { ...p.PREMIACION, inicio: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fin</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={etapas.PREMIACION.fin ?? ""}
                      onChange={(e) => setEtapas(p => ({ ...p, PREMIACION: { ...p.PREMIACION, fin: e.target.value || null } }))}
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 font-medium">Error de validación:</p>
                <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
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