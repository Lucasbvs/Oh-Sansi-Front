"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import useAuthUser from "@/hooks/useAuthUser";

type NivelApi = "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO";
type AreaApi = "MATEMATICA" | "FISICA" | "ROBOTICA" | "QUIMICA" | "PROGRAMACION";
type EtapaApi = "INSCRIPCION" | "DESARROLLO" | "EVALUACION" | "CORRECCION" | "PREMIACION";

type CompetitionApi = {
  id: string;
  nombre: string;
  nivel: NivelApi;
  area: AreaApi;
  participantes: number;
  estado: boolean;
  createdAt: string;
  etapas: { etapa: EtapaApi; fechaInicio: string; fechaFin: string | null }[];
};

type NivelUi = "Principiante" | "Intermedio" | "Avanzado";
type AreaUi  = "Matemática" | "Física" | "Robótica" | "Química" | "Programación";
type EtapaUi = "Inscripción" | "Desarrollo" | "Evaluación" | "Corrección" | "Premiación";

const nivelApi2Ui: Record<NivelApi, NivelUi> = {
  PRINCIPIANTE: "Principiante",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};
const areaApi2Ui: Record<AreaApi, AreaUi> = {
  MATEMATICA: "Matemática",
  FISICA: "Física",
  ROBOTICA: "Robótica",
  QUIMICA: "Química",
  PROGRAMACION: "Programación",
};
const etapaApi2Ui: Record<EtapaApi, EtapaUi> = {
  INSCRIPCION: "Inscripción",
  DESARROLLO: "Desarrollo",
  EVALUACION: "Evaluación",
  CORRECCION: "Corrección",
  PREMIACION: "Premiación",
};

type CompetitionUi = {
  id: string;
  nombre: string;
  nivel: NivelUi;
  area: AreaUi;
  participantes: number;
  etapaActual?: EtapaUi;
};

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const { user, loading: loadingUser } = useAuthUser();
  const perms = (user as any)?.roleInfo?.permissions ?? {};
  const canCreate = !!perms?.competitions?.create;
  const canUpdate = !!perms?.competitions?.update;
  const canDelete = !!perms?.competitions?.delete;

  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<CompetitionUi[]>([]);
  const [query, setQuery] = useState("");
  const [nivel, setNivel] = useState<NivelUi | "Todos">("Todos");
  const [area, setArea] = useState<AreaUi | "Todas">("Todas");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CompetitionUi | null>(null);

  useEffect(() => {
    async function fetchCompetitions() {
      setLoading(true);
      try {
        const url = new URL("/api/competitions", API);
        if (query.trim()) url.searchParams.set("q", query.trim());
        if (nivel !== "Todos") {
          const inv: Record<NivelUi, NivelApi> = {
            Principiante: "PRINCIPIANTE",
            Intermedio: "INTERMEDIO",
            Avanzado: "AVANZADO",
          };
          url.searchParams.set("nivel", inv[nivel]);
        }
        if (area !== "Todas") {
          const inv: Record<AreaUi, AreaApi> = {
            Matemática: "MATEMATICA",
            Física: "FISICA",
            Robótica: "ROBOTICA",
            Química: "QUIMICA",
            Programación: "PROGRAMACION",
          };
          url.searchParams.set("area", inv[area]);
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;

        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const itemsApi: CompetitionApi[] = data?.competitions ?? [];
        const itemsUi: CompetitionUi[] = itemsApi.map((c) => {
          // etapa actual = la que tenga fechaInicio más reciente que hoy (simple)
          const now = Date.now();
          const etapaActual = c.etapas
            .filter((e) => new Date(e.fechaInicio).getTime() <= now)
            .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())[0];

          return {
            id: c.id,
            nombre: c.nombre,
            nivel: nivelApi2Ui[c.nivel],
            area: areaApi2Ui[c.area],
            participantes: c.participantes,
            etapaActual: etapaActual ? etapaApi2Ui[etapaActual.etapa] : undefined,
          };
        });

        setCompetitions(itemsUi);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetitions();
  }, [API, query, nivel, area, router]);

  const allAreas = useMemo<AreaUi[]>(() => {
    const s = new Set<AreaUi>();
    competitions.forEach((c) => s.add(c.area));
    return ["Matemática", "Física", "Robótica", "Química", "Programación"].filter((a) =>
      s.has(a as AreaUi)
    ) as AreaUi[];
  }, [competitions]);

  const filtered = useMemo<CompetitionUi[]>(() => {
    const q = query.toLowerCase().trim();
    return competitions.filter((c) => {
      const byQuery =
        q.length === 0 ||
        c.nombre.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q);
      const byNivel = nivel === "Todos" || c.nivel === nivel;
      const byArea = area === "Todas" || c.area === area;
      return byQuery && byNivel && byArea;
    });
  }, [competitions, query, nivel, area]);

  function handleEdit(id: string) {
    if (!canUpdate) return;
    router.push(`/competencias/${id}/editar`);
  }

  function openDelete(c: CompetitionUi) {
    if (!canDelete) return;
    setToDelete(c);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete || !canDelete) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
      const res = await fetch(`${API}/api/competitions/${toDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al eliminar: ${res.status} ${text}`);
      }
      setCompetitions((prev) => prev.filter((c) => c.id !== toDelete.id));
    } catch (e) {
      console.error(e);
      alert("No se pudo deshabilitar/eliminar la competencia.");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-black">Gestor de competencias</h1>

        {/* Buscador */}
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-sm text-black">
            <span className="text-gray-500">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar competencias"
              className="w-full outline-none"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as AreaUi | "Todas")}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm text-black"
          >
            <option value="Todas">Áreas</option>
            {allAreas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelUi | "Todos")}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm text-black"
          >
            <option value="Todos">Niveles</option>
            <option>Principiante</option>
            <option>Intermedio</option>
            <option>Avanzado</option>
          </select>
        </div>

        {/* Lista */}
        <div className="space-y-3 overflow-y-auto pr-1 max-h-[23rem] sm:max-h-[21rem]">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-gray-600">No se encontraron competencias.</p>
          ) : (
            filtered.map((c) => (
              <CompetitionCard
                key={c.id}
                c={c}
                onEdit={handleEdit}
                onDelete={openDelete}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))
          )}
        </div>

        {/* Crear (según permiso) */}
        {canCreate && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => router.push("/competencias/nueva")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4854A1] text-white px-4 py-2 font-semibold hover:bg-[#3a468a] transition"
            >
              <FiPlus /> Crear competencia
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Modal confirmación */}
      {canDelete && confirmOpen && toDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-black">Confirmar deshabilitación</h3>
            <p className="text-sm text-gray-600">
              ¿Seguro que deseas deshabilitar <b>{toDelete.nombre}</b>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setConfirmOpen(false); setToDelete(null); }} className="px-4 py-2 rounded-xl border text-black">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitionCard({
  c,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: {
  c: CompetitionUi;
  onEdit: (id: string) => void;
  onDelete: (c: CompetitionUi) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate text-black">{c.nombre}</h2>
          <p className="text-sm text-gray-600">Nivel: {c.nivel}</p>
          <p className="text-sm text-gray-600 truncate">Área: {c.area}</p>
        </div>

        <div>
          {c.etapaActual && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-indigo-50 text-indigo-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="font-medium">{c.etapaActual}</span>
              <span className="text-gray-500">· {c.participantes} participantes</span>
            </div>
          )}
        </div>

        {(canUpdate || canDelete) && (
          <div className="flex flex-col gap-2">
            {canUpdate && (
              <button onClick={() => onEdit(c.id)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-gray-50 text-black">
                <FiEdit2 /> Editar
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(c)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-gray-50 text-red-600 border-red-300">
                <FiTrash2 /> Deshabilitar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
