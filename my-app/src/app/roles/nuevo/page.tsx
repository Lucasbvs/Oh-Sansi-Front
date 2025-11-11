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
  inscriptions?: Partial<Record<"read" | "create" | "delete", boolean>>;
  evaluaciones?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  tutorias?: Partial<Record<"read" | "manage", boolean>>;
};

function generarSlug(nombre: string) {
  return nombre
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_"); 
}

export default function NuevoRolPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [perms, setPerms] = useState<Perms>({
    competitions: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    roles: { read: false, create: false, update: false, delete: false },
    inscriptions: { read: true, create: true, delete: false },
    evaluaciones: { read: false, create: false, update: false, delete: false },
    tutorias: { read: false, manage: false },
  });

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
                setSlug(generarSlug(n));
              }}
              required
            />
          </label>

          {/* Competencias */}
          <fieldset className="border rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold">Competencias</legend>
            {["ver", "crear", "editar", "eliminar"].map((k) => (
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
            {["ver", "crear", "editar", "eliminar"].map((k) => (
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

          {/* Inscripciones */}
          <fieldset className="border rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold">Inscripciones</legend>
            {["ver", "crear", "eliminar"].map((k) => (
              <label key={k} className="mr-4">
                <input
                  type="checkbox"
                  checked={!!(perms?.inscriptions as any)?.[k]}
                  onChange={() => toggle(`inscriptions.${k}`)}
                />{" "}
                {k}
              </label>
            ))}
          </fieldset>

          <fieldset className="border rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold">Evaluaciones</legend>
            {["ver", "crear", "editar", "eliminar"].map((k) => (
              <label key={k} className="mr-4">
                <input
                  type="checkbox"
                  checked={!!(perms?.evaluaciones as any)?.[k]}
                  onChange={() => toggle(`evaluaciones.${k}`)}
                />{" "}
                {k}
              </label>
            ))}
          {/* Tutorías */}
          <fieldset className="border rounded-xl p-4">
            <legend className="px-2 text-sm font-semibold">Tutorías</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!perms?.tutorias?.read}
                  onChange={() => toggle(`tutorias.read`)}
                />
                <span>read</span>
              </label>
            </div>
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