"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";

import {
  EstadoUi, EstadoApi,
  NivelUi,  NivelApi,
  AreaUi,   AreaApi,
  estadoApi2Ui, estadoUi2Api,
  nivelApi2Ui,  nivelUi2Api,
  areaApi2Ui,   areaUi2Api,
} from "../types";

import useAuthUser  from "@/hooks/useAuthUser";

// --------- Tipos ----------
type CompetitionApi = {
  id: string;
  nombre: string;
  nivel: NivelApi;
  area: AreaApi;
  estado: EstadoApi;
  participantes: number;
};

type CompetitionUi = {
  id: string;
  nombre: string;
  nivel: NivelUi;
  area: AreaUi;
  estado: EstadoUi;
  participantes: number;
};

// --------- Página ----------
export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const { user, loading: loadingUser } = useAuthUser();
  const showActions =
  !loadingUser && (user?.role === "ADMIN" || user?.role === "RESPONSABLEACADEMICO");

  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<CompetitionUi[]>([]);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<EstadoUi | "Todos">("Todos");
  const [nivel, setNivel] = useState<NivelUi | "Todos">("Todos");
  const [area, setArea] = useState<AreaUi | "Todas">("Todas");

  // modal de confirmación de borrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CompetitionUi | null>(null);

  useEffect(() => {
    async function fetchCompetitions() {
      setLoading(true);
      try {
        const url = new URL("/api/competitions", API);
        if (query.trim()) url.searchParams.set("q", query.trim());
        if (estado !== "Todos") url.searchParams.set("estado", estadoUi2Api[estado]);
        if (nivel !== "Todos")  url.searchParams.set("nivel",  nivelUi2Api[nivel]);
        if (area !== "Todas")   url.searchParams.set("area",   areaUi2Api[area]);

        const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
        const data = await res.json();

        const itemsApi: CompetitionApi[] = Array.isArray(data) ? data : data.items ?? [];
        const itemsUi: CompetitionUi[] = itemsApi.map((x) => ({
          id: x.id,
          nombre: x.nombre,
          nivel: nivelApi2Ui[x.nivel],
          area: areaApi2Ui[x.area],
          estado: estadoApi2Ui[x.estado],
          participantes: x.participantes,
        }));

        setCompetitions(itemsUi);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetitions();
  }, [API, query, estado, nivel, area]);

  const allAreas = useMemo<AreaUi[]>(() => {
    const s = new Set<AreaUi>();
    competitions.forEach((c) => s.add(c.area));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [competitions]);

  const filtered = useMemo<CompetitionUi[]>(() => {
    const q = query.toLowerCase().trim();
    return competitions.filter((c) => {
      const byQuery =
        q.length === 0 ||
        c.nombre.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q);
      const byEstado = estado === "Todos" || c.estado === estado;
      const byNivel = nivel === "Todos" || c.nivel === nivel;
      const byArea = area === "Todas" || c.area === area;
      return byQuery && byEstado && byNivel && byArea;
    });
  }, [competitions, query, estado, nivel, area]);

  function handleEdit(id: string) {
    if (!showActions) return;
    router.push(`/competencias/${id}/editar`);
  }

  function openDelete(c: CompetitionUi) {
    if (!showActions) return;
    setToDelete(c);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete || !showActions) return;
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
      alert("No se pudo eliminar la competencia.");
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
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoUi | "Todos")}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm text-black"
          >
            <option value="Todos">Estado</option>
            <option>Inscripción</option>
            <option>Desarrollo</option>
            <option>Evaluación</option>
            <option>Modificaciones</option>
            <option>Finalización</option>
          </select>

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

        {/* Lista scrollable */}
        <div className="space-y-3 overflow-y-auto pr-1 max-h-[23rem] sm:max-h-[21rem]">
          {loading ? (
            Array.from({ length: 1 }).map((_, i) => (
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
                showActions={showActions}
              />
            ))
          )}
        </div>

        {/* Crear (solo con permisos) */}
        {showActions && (
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

      {/* Modal confirmación (solo si hay permiso) */}
      {showActions && confirmOpen && toDelete && (
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
  showActions,
}: {
  c: CompetitionUi;
  onEdit: (id: string) => void;
  onDelete: (c: CompetitionUi) => void;
  showActions: boolean;
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
          <StatusPill estado={c.estado} participantes={c.participantes} />
        </div>

        {showActions && (
          <div className="flex flex-col gap-2">
            <button onClick={() => onEdit(c.id)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-gray-50 text-black">
              <FiEdit2 /> Editar
            </button>
            <button onClick={() => onDelete(c)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-gray-50 text-red-600 border-red-300">
              <FiTrash2 /> Deshabilitar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function StatusPill({ estado, participantes }: { estado: EstadoUi; participantes: number }) {
  const cfg =
    ({
      "Inscripción":   { dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-700" },
      "Desarrollo":    { dot: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700" },
      "Evaluación":    { dot: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-800" },
      "Modificaciones":{ dot: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-800" },
      "Finalización":  { dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700" },
    } as Record<EstadoUi, { dot: string; bg: string; text: string } >)[estado];

  const safe = cfg ?? { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-700" };

  return (
    <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${safe.bg} ${safe.text}`}>
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${safe.dot}`} />
      <span className="font-medium">{estado}</span>
      <span className="text-gray-500">· {participantes} participantes</span>
    </div>
  );
}
