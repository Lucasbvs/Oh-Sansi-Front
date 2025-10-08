"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { FiPlus } from "react-icons/fi";
import useAuthUser from "@/hooks/useAuthUser";

/* --------- Tipos ---------- */
type RoleApi =
  | "ADMIN"
  | "RESPONSABLEACADEMICO"
  | "EVALUADOR"
  | "ESTUDIANTE"
  | "TUTOR";

type UserApi = {
  id: string;
  name: string;
  email: string;
  role: RoleApi;
  createdAt: string;
};

/* --------- Helpers ---------- */
const rolePretty: Record<RoleApi, string> = {
  ADMIN: "Admin",
  RESPONSABLEACADEMICO: "Responsable académico",
  EVALUADOR: "Evaluador",
  ESTUDIANTE: "Estudiante",
  TUTOR: "Tutor",
};

const roleBadge: Record<RoleApi, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-gray-200", text: "text-gray-800" },
  RESPONSABLEACADEMICO: { bg: "bg-indigo-100", text: "text-indigo-800" },
  EVALUADOR: { bg: "bg-amber-100", text: "text-amber-900" },
  ESTUDIANTE: { bg: "bg-blue-100", text: "text-blue-800" },
  TUTOR: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

/* --------- Página ---------- */
export default function UsuariosPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const { user: me, loading: loadingMe } = useAuthUser();
  const isAdmin = !loadingMe && me?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserApi[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "Todos" | Exclude<RoleApi, "ADMIN">
  >("Todos");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("ohsansi_token")
            : null;

        const res = await fetch(`${API}/api/users`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          // Si no autorizado, mándalo a login
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        // /api/users devuelve un array
        const list: UserApi[] = Array.isArray(data) ? data : [];

        setUsers(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [API, router]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users
      // ocultar admins en la lista
      .filter((u) => u.role !== "ADMIN")
      // filtro por rol
      .filter((u) => roleFilter === "Todos" || u.role === roleFilter)
      // búsqueda por nombre o email
      .filter(
        (u) =>
          q.length === 0 ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
      // orden: más recientes primero
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [users, roleFilter, query]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-black">
          Usuarios
        </h1>

        {/* Buscador */}
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-sm text-black">
            <span className="text-gray-500">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o correo"
              className="w-full outline-none"
            />
          </div>
        </div>

        {/* Filtro por rol */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as typeof roleFilter)
            }
            className="rounded-full bg-gray-100 px-4 py-2 text-sm text-black"
          >
            <option value="Todos">Todos los roles</option>
            <option value="RESPONSABLEACADEMICO">Responsable académico</option>
            <option value="EVALUADOR">Evaluador</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </div>

        {/* Lista */}
        <div className="space-y-3 overflow-y-auto pr-1 max-h-[23rem] sm:max-h-[21rem]">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-gray-600">No se encontraron usuarios.</p>
          ) : (
            filtered.map((u) => <UserRow key={u.id} u={u} />)
          )}
        </div>

        {/* Crear (solo admin) */}
        {isAdmin && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => router.push("/admin/users/nuevo")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4854A1] text-white px-4 py-2 font-semibold hover:bg-[#3a468a] transition"
            >
              <FiPlus /> Crear usuario
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* --------- Item ---------- */
function UserRow({ u }: { u: UserApi }) {
  const badge = roleBadge[u.role];
  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate text-black">{u.name}</h2>
          <p className="text-sm text-gray-600 truncate">{u.email}</p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-sm ${badge.bg} ${badge.text}`}
          title={u.role}
        >
          {rolePretty[u.role]}
        </div>
      </div>
    </article>
  );
}
