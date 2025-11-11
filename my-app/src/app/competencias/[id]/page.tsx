"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import { getPermissions } from "@/utils/permissions";
import { useAuthUser } from "@/hooks/useAuthUser";
import { FaClipboardCheck, FaUsers } from "react-icons/fa";

type Competition = {
  id: string;
  nombre: string;
  nivel: string;
  area: string;
  participantes: number;
  modalidad: string;
  formaCalificacion: string;
  estado: boolean;
  fechaInicio: string;
  fases: { id: string; nombre: string; fechaInicio: string; fechaFin: string }[];
  etapas: {
    id: string;
    etapa: "INSCRIPCION" | "DESARROLLO" | "EVALUACION" | "CORRECCION" | "PREMIACION";
    fechaInicio: string;
    fechaFin?: string | null;
  }[];
};

type MineInscription = { id: string; competitionId: string; fechaInscripcion?: string | null };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: loadingUser } = useAuthUser();
  const [comp, setComp] = useState<Competition | null>(null);
  const [mine, setMine] = useState<MineInscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [yaAsignadoEvaluador, setYaAsignadoEvaluador] = useState(false);
  const [asignando, setAsignando] = useState(false);

  const perms = user?.roleInfo?.permissions ?? getPermissions();
  const authToken = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      // 1) Competencia
      const cRes = await fetch(`${API}/api/competitions/${id}`, {
        headers: { Accept: "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        cache: "no-store",
      });
      const cJson = await cRes.json();
      if (!cRes.ok || !cJson.ok) throw new Error(cJson?.message || `HTTP ${cRes.status}`);
      setComp(cJson.competition);

      setYaAsignadoEvaluador(cJson.competition.yaAsignadoEvaluador || false);
      // 2) Mis inscripciones (si hay sesión)
      if (authToken) {
        const iRes = await fetch(`${API}/api/inscriptions/mis`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        });

        if (iRes.ok) {
          const iJson = await iRes.json();
          const items: any[] = Array.isArray(iJson) ? iJson : (iJson.items ?? iJson.competitions ?? []);
          const foundRaw = items.find((it: any) => {
            const cid = it?.competitionId ?? it?.competition?.id;
            return cid === id;
          });

          // Normaliza para el componente
          const normalized: MineInscription | null = foundRaw
            ? {
                id: foundRaw.id ?? foundRaw.inscriptionId ?? "insc",
                competitionId: foundRaw.competitionId ?? foundRaw?.competition?.id,
                fechaInscripcion: foundRaw.fechaInscripcion ?? foundRaw.createdAt ?? null,
              }
            : null;

          setMine(normalized);
        } else if (iRes.status === 404 || iRes.status === 403) {
          setMine(null);
        }
      } else {
        setMine(null);
      }
    } catch (e: any) {
      setMsg(e.message || "No se pudo cargar la competencia");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const etapaActual = useMemo(() => {
    if (!comp?.etapas?.length) return null;
    const now = new Date();
    return (
      comp.etapas.find((e) => {
        const ini = new Date(e.fechaInicio);
        ini.setHours(0, 0, 0, 0);
        const fin = e.fechaFin ? new Date(e.fechaFin) : null;
        if (fin) fin.setHours(23, 59, 59, 999);
        return now >= ini && (!fin || now <= fin);
      }) ?? null
    );
  }, [comp]);

  const insc = useMemo(() => {
    if (!comp?.etapas?.length) return null;
    return comp.etapas.find(e => e.etapa === "INSCRIPCION") ?? null;
  }, [comp]);

  const inscAbierta = useMemo(() => {
    if (!insc) return false;
    const now = new Date();
    const ini = new Date(insc.fechaInicio); ini.setHours(0,0,0,0);
    const fin = insc.fechaFin ? new Date(insc.fechaFin) : null;
    if (fin) fin.setHours(23,59,59,999);
    return now >= ini && (!fin || now <= fin);
  }, [insc]);

  
  const tieneTutor = useMemo(() => {
    if (!user || user.role !== "ESTUDIANTE") return true; 
    return !!(user as any)?.tutorId;
  }, [user]);

  const puedeInscribirse = useMemo(() => {
    if (!comp) return false;
    if (!comp.estado) return false;
    if (!authToken) return false;
    if (!perms?.inscriptions?.create && !loadingUser) return false;
    if (mine) return false;
    if (!inscAbierta) return false;
   
    if (!tieneTutor) return false;
    return true;
  }, [comp, inscAbierta, mine, authToken, perms, loadingUser, tieneTutor]);

  const puedeDesinscribirse = useMemo(() => {
    if (!comp) return false;
    if (!authToken) return false;
    if (!perms?.inscriptions?.delete) return false;
    return !!mine;
  }, [comp, authToken, perms, mine]);

  async function inscribirme() {
    if (!comp) return;
    if (!authToken) {
      router.push("/login?next=" + encodeURIComponent(`/competencias/${comp.id}`));
      return;
    }
    
    
    if (user?.role === "ESTUDIANTE" && !tieneTutor) {
      setMsg("No puedes inscribirte sin tener un tutor asignado. Por favor, asigna un tutor primero desde la sección de Tutores.");
      return;
    }
    
    setEnrolling(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/api/competitions/${comp.id}/inscribirse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setMsg("¡Inscripción realizada!");
      await load();
    } catch (e: any) {
      setMsg(e.message || "No se pudo completar la inscripción");
    } finally {
      setEnrolling(false);
    }
  }

  async function desinscribirme() {
    if (!comp) return;
    if (!authToken) return;
    setEnrolling(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/api/competitions/${comp.id}/desinscribirse`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setMsg("Te desinscribiste correctamente.");
      await load();
    } catch (e: any) {
      setMsg(e.message || "No se pudo desinscribirse");
    } finally {
      setEnrolling(false);
    }
  }

  const fechaInscFmt = useMemo(() => {
    if (!mine?.fechaInscripcion) return null;
    const d = new Date(mine.fechaInscripcion);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString();
  }, [mine]);

  async function asignarseEvaluador() {
    if (!comp || !authToken) return;
    setAsignando(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/api/evaluaciones/asignar/${comp.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setMsg("¡Te asignaste como evaluador!");
      await load();
    } catch (e: any) {
      setMsg(e.message || "No se pudo asignar como evaluador");
    } finally {
      setAsignando(false);
    }
  }

  async function desasignarseEvaluador() {
    if (!comp || !authToken) return;
    setAsignando(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/api/evaluaciones/desasignar/${comp.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setMsg("Dejaste de evaluar esta competencia.");
      await load();
    } catch (e: any) {
      setMsg(e.message || "No se pudo desasignar");
    } finally {
      setAsignando(false);
    }
  }


  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-6">
        {loading ? (
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse mt-3" />
        ) : !comp ? (
          <p className="text-red-600">No se encontró la competencia.</p>
        ) : (
          <div className="space-y-4 mt-3">
            {msg && (
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  /error|http|no se pudo/i.test(msg) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {msg}
              </div>
            )}

            {}
            {user?.role === "ESTUDIANTE" && !tieneTutor && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-yellow-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Tutor requerido</h3>
                    <p className="text-yellow-700 text-sm">
                      Necesitas asignarte un tutor antes de poder inscribirte en competencias.
                    </p>
                    <button
                      onClick={() => router.push("/tutores")}
                      className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Asignar Tutor
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-gray-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">{comp.nombre}</h1>
                <span className="text-xs px-2 py-1 rounded-lg border">{comp.estado ? "Habilitada" : "Deshabilitada"}</span>
              </div>

              <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <b>Nivel:</b> {comp.nivel}
                </div>
                <div>
                  <b>Área:</b> {comp.area}
                </div>
                <div>
                  <b>Modalidad:</b> {comp.modalidad}
                </div>
                <div>
                  <b>Fecha inicio:</b> {new Date(comp.fechaInicio).toLocaleDateString()}
                </div>
                <div className="md:col-span-2">
                  <b>Forma de calificación:</b> {comp.formaCalificacion}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold">Etapas</h3>
                <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
                  {comp.etapas.map((e) => (
                    <div
                      key={e.id}
                      className={`rounded-xl border px-3 py-2 ${
                        e.id === etapaActual?.id ? "bg-blue-50 border-blue-300" : "bg-white"
                      }`}
                    >
                      <b>{e.etapa}</b>
                      <div>Inicio: {new Date(e.fechaInicio).toLocaleDateString()}</div>
                      <div>Fin: {e.fechaFin ? new Date(e.fechaFin).toLocaleDateString() : "—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold">Fases</h3>
                <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
                  {comp.fases.map((f) => (
                    <div key={f.id} className="rounded-xl border bg-white px-3 py-2">
                      <b>{f.nombre}</b>
                      <div>
                        {new Date(f.fechaInicio).toLocaleDateString()} → {new Date(f.fechaFin).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 items-center">
                {puedeInscribirse && (
                  <button
                    onClick={inscribirme}
                    disabled={enrolling}
                    className="px-4 py-2 rounded-xl bg-[#4854A1] text-white disabled:opacity-60"
                  >
                    {enrolling ? "Inscribiendo..." : "Inscribirme"}
                  </button>
                )}

                {puedeDesinscribirse && (
                  <button
                    onClick={desinscribirme}
                    disabled={enrolling}
                    className="px-4 py-2 rounded-xl border border-[#4854A1] text-[#4854A1] disabled:opacity-60"
                  >
                    {enrolling ? "Procesando..." : "Desinscribirme"}
                  </button>
                )}

                {!puedeInscribirse && !puedeDesinscribirse && (
                  <span className="text-sm text-gray-600">
                    {user?.role === "ESTUDIANTE" && !tieneTutor 
                      ? "Necesitas asignar un tutor para inscribirte."
                      : "Debe estar abierta la etapa de INSCRIPCION y necesitas iniciar sesión con permisos válidos."
                    }
                  </span>
                )}

                {mine && (
                  <span className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-sm">
                    Ya estás inscrito{fechaInscFmt ? ` ( ${fechaInscFmt} )` : ""}
                  </span>
                )}

                {perms?.evaluaciones?.create && (
                  <>
                    {!yaAsignadoEvaluador ? (
                      <button
                        onClick={asignarseEvaluador}
                        disabled={asignando}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-60 hover:bg-purple-700 flex items-center gap-2"
                      >
                        <FaClipboardCheck />
                        {asignando ? "Asignando..." : "Evaluar"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={desasignarseEvaluador}
                          disabled={asignando}
                          className="px-4 py-2 rounded-xl border border-purple-600 text-purple-600 disabled:opacity-60 hover:bg-purple-50"
                        >
                          {asignando ? "Procesando..." : "Dejar de evaluar"}
                        </button>
                        <button
                          onClick={() => router.push(`/competencias/${comp.id}/estudiantes`)}
                          className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                        >
                          <FaUsers />
                          Ver Estudiantes
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}