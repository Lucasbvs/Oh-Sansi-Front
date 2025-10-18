// src/app/usuarios/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import useAuthUser from "@/hooks/useAuthUser";

/* --------- Tipos ---------- */
type UserApi = {
  id: string;
  name: string;
  email: string;
  role: string;          // slug plano
  roleIsSystem?: boolean;
  createdAt: string;
};

/* --------- Helpers ---------- */
const defaultBadge = { bg: "bg-gray-100", text: "text-gray-800" };
const roleBadge: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-gray-200", text: "text-gray-800" },
  RESPONSABLEACADEMICO: { bg: "bg-indigo-100", text: "text-indigo-800" },
  EVALUADOR: { bg: "bg-amber-100", text: "text-amber-900" },
  ESTUDIANTE: { bg: "bg-blue-100", text: "text-blue-800" },
  TUTOR: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

const rolePretty: Record<string, string> = {
  ADMIN: "Admin",
  RESPONSABLEACADEMICO: "Responsable Academico",
  EVALUADOR: "Evaluador",
  ESTUDIANTE: "Estudiante",
  TUTOR: "Tutor",
};

function prettyFromSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w|\s\w/g, (m) => m.toUpperCase());
}

/* --------- Página ---------- */
export default function UsuariosPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const { user: me, loading: loadingMe } = useAuthUser();
  const perms = (me as any)?.roleInfo?.permissions ?? {};
  const canCreate = !!perms?.users?.create;
  const canDelete = !!perms?.users?.delete;
  const canUpdate = !!perms?.users?.update;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserApi[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("Todos");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;

        const res = await fetch(`${API}/api/users`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const list: UserApi[] = await res.json();
        const normalized = list.map((u) => ({
          ...u,
          role: typeof (u as any).role === "string" ? (u as any).role : "UNKNOWN",
          roleIsSystem: !!(u as any).roleIsSystem,
        }));
        setUsers(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [API, router]);

  const roleOptions = useMemo(() => {
    const s = new Set<string>();
    users.forEach((u) => s.add(u.role));
    return ["Todos", ...Array.from(s).sort()];
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users
      .filter((u) => roleFilter === "Todos" || u.role === roleFilter)
      .filter(
        (u) =>
          q.length === 0 ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [users, roleFilter, query]);

  async function handleDelete(user: UserApi) {
    if (!canDelete) return;
    if (user.id === me?.id) {
      alert("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (user.roleIsSystem || user.role === "ADMIN") {
      alert("No se puede eliminar un usuario con rol de sistema.");
      return;
    }
    const ok = confirm(
      `¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ohsansi_token")
          : null;
      const res = await fetch(`${API}/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el usuario.");
    }
  }

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
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm text-black"
          >
            {roleOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "Todos"
                  ? "Todos los roles"
                  : rolePretty[opt] ?? prettyFromSlug(opt)}
              </option>
            ))}
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
            filtered.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                meId={me?.id}
                canDelete={canDelete}
                canUpdate={canUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Crear (solo si tiene permiso) */}
        {canCreate && (
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
function UserRow({
  u,
  meId,
  canDelete,
  canUpdate,
  onDelete,
}: {
  u: UserApi;
  meId?: string;
  canDelete: boolean;
  canUpdate: boolean;
  onDelete: (u: UserApi) => void;
}) {
  const router = useRouter();
  const badge = roleBadge[u.role] ?? defaultBadge;
  const label = rolePretty[u.role] ?? prettyFromSlug(u.role);

  const deletable =
    canDelete && u.id !== meId && u.role !== "ADMIN" && !u.roleIsSystem;

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate text-black">{u.name}</h2>
          <p className="text-sm text-gray-600 truncate">{u.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`rounded-full px-3 py-1 text-sm ${badge.bg} ${badge.text}`}
            title={u.role}
          >
            {label}
          </div>

          {/* Editar si tiene permiso */}
          {canUpdate && (
            <button
              onClick={() => router.push(`/usuarios/${u.id}/editar`)}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-gray-50 text-black"
              title="Editar usuario"
            >
              <FiEdit2 /> Editar
            </button>
          )}

          {/* Eliminar si cumple condiciones */}
          {deletable && (
            <button
              onClick={() => onDelete(u)}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-gray-50 text-red-600 border-red-300"
              title="Eliminar usuario"
            >
              <FiTrash2 /> Eliminar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
