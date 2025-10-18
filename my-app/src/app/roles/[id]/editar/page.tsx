"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Role = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions?: {
    competitions?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
    users?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
    roles?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  } | null;
};

function generarSlug(nombre: string) {
  return nombre
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export default function EditarRolPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [perms, setPerms] = useState<Role["permissions"]>({
    competitions: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    roles: { read: false, create: false, update: false, delete: false },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(path: string) {
    const [g, k] = path.split(".");
    setPerms((prev) => {
      const base = prev ?? {};
      const group: any = { ...(base as any)[g] };
      group[k] = !group[k];
      return { ...base, [g]: group };
    });
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${API}/api/roles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        const r: Role | undefined = data?.role;
        if (!r) throw new Error("No encontrado");

        setRole(r);
        setName(r.name);
        setSlug(r.slug);
        setPerms(r.permissions ?? { competitions: {}, users: {}, roles: {} });
      } catch (e: any) {
        setError(e.message ?? "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!role) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("ohsansi_token");
      const res = await fetch(`${API}/api/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          // slug se mantiene sincronizado automático con el name
          slug: slug || generarSlug(name),
          permissions: perms,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.message || `HTTP ${res.status}`);
      router.push("/roles");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-6 text-black">
        <h1 className="text-2xl font-bold mb-4">Editar rol</h1>

        {loading ? (
          <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !role ? (
          <p>No encontrado.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 bg-gray-100 rounded-2xl p-6">
            {/* Nombre */}
            <label className="block">
              <span className="text-sm font-medium">Nombre</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={name}
                onChange={(e) => {
                  const n = e.target.value;
                  setName(n);
                  // Si es rol de sistema, no cambiamos el slug.
                  if (!role.isSystem) setSlug(generarSlug(n));
                }}
                required
                disabled={role.isSystem && role.slug === "ADMIN"} // opcional: evita editar nombre de ADMIN
              />
            </label>

            {/* Slug (solo lectura y auto) */}
            <label className="block">
              <span className="text-sm font-medium">Slug (automático)</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-50 text-gray-600"
                value={slug}
                readOnly
              />
            </label>

            {/* 🔥 Sin sección “NavBar” (la visibilidad del menú se deriva de READ) */}

            {/* Competencias */}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold">Competencias</legend>
              {["read", "create", "update", "delete"].map((k) => (
                <label key={k} className="mr-4">
                  <input
                    type="checkbox"
                    checked={!!(perms?.competitions as any)?.[k]}
                    onChange={() => toggle(`competitions.${k}`)}
                    disabled={role.isSystem && role.slug === "ADMIN"}
                  />{" "}
                  {k}
                </label>
              ))}
            </fieldset>

            {/* Usuarios */}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold">Usuarios</legend>
              {["read", "create", "update", "delete"].map((k) => (
                <label key={k} className="mr-4">
                  <input
                    type="checkbox"
                    checked={!!(perms?.users as any)?.[k]}
                    onChange={() => toggle(`users.${k}`)}
                    disabled={role.isSystem && role.slug === "ADMIN"}
                  />{" "}
                  {k}
                </label>
              ))}
            </fieldset>

            {/* Roles */}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold">Roles</legend>
              {["read", "create", "update", "delete"].map((k) => (
                <label key={k} className="mr-4">
                  <input
                    type="checkbox"
                    checked={!!(perms?.roles as any)?.[k]}
                    onChange={() => toggle(`roles.${k}`)}
                    disabled={role.isSystem && role.slug === "ADMIN"}
                  />{" "}
                  {k}
                </label>
              ))}
            </fieldset>

            {role.isSystem && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Este rol es de sistema; algunos campos se encuentran bloqueados.
              </p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border">
                Cancelar
              </button>
              <button disabled={saving} className="px-4 py-2 rounded-xl bg-[#4854A1] text-white">
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
