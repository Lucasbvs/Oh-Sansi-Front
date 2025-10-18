"use client";

import { useState } from "react";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Perms = {
  competitions?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  users?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  roles?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
};

function generarSlug(nombre: string) {
  return nombre
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toUpperCase()
    .replace(/\s+/g, "_"); // espacios -> _
}

export default function NuevoRolPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [perms, setPerms] = useState<Perms>({
    competitions: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    roles: { read: false, create: false, update: false, delete: false },
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(path: string) {
    // path: "competitions.read" | "users.create" | "roles.update"
    const [g, k] = path.split(".");
    setPerms((prev) => {
      const base = prev ?? {};
      const group: any = { ...(base as any)[g] };
      group[k] = !group[k];
      return { ...base, [g]: group };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Ingresa un nombre.");
      return;
    }
    const payload = {
      name: name.trim(),
      slug: slug || generarSlug(name),
      permissions: perms,
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("ohsansi_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      router.push("/roles");
    } catch (e: any) {
      setError(e.message || "No se pudo crear el rol.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-6 text-black">
        <h1 className="text-2xl font-bold mb-4">Nuevo rol</h1>

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
                setSlug(generarSlug(n)); // 👈 slug automático
              }}
              required
            />
          </label>

          {/* Slug (solo lectura, se autogenera) */}
          <label className="block">
            <span className="text-sm font-medium">Slug (automático)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-50 text-gray-600"
              value={slug}
              readOnly
            />
          </label>

          {/* 🔥 Importante: NO mostramos sección "NavBar".
              La visibilidad del menú se deriva de los permisos READ de cada módulo. */}

          {/* Competencias */}
          <fieldset className="border rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold">Competencias</legend>
            {["read", "create", "update", "delete"].map((k) => (
              <label key={k} className="mr-4">
                <input
                  type="checkbox"
                  checked={!!(perms?.competitions as any)?.[k]}
                  onChange={() => toggle(`competitions.${k}`)}
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
                />{" "}
                {k}
              </label>
            ))}
          </fieldset>

          {/* Roles (gestión de roles) */}
          <fieldset className="border rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold">Roles</legend>
            {["read", "create", "update", "delete"].map((k) => (
              <label key={k} className="mr-4">
                <input
                  type="checkbox"
                  checked={!!(perms?.roles as any)?.[k]}
                  onChange={() => toggle(`roles.${k}`)}
                />{" "}
                {k}
              </label>
            ))}
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border">
              Cancelar
            </button>
            <button disabled={saving} className="px-4 py-2 rounded-xl bg-[#4854A1] text-white">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
