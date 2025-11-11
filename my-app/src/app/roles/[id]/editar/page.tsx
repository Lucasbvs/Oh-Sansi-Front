"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

type Perms = {
  navbar?: Partial<Record<"home" | "competencias" | "usuarios" | "roles" | "tutorias", boolean>>;
  competitions?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  users?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  roles?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  inscriptions?: Partial<Record<"read" | "create" | "delete", boolean>>;
  evaluaciones?: Partial<Record<"read" | "create" | "update" | "delete", boolean>>;
  tutorias?: Partial<Record<"read" | "manage", boolean>>;
};

type RoleDTO = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: Perms | null;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSystem, setIsSystem] = useState(false);
  const [perms, setPerms] = useState<Perms>({
    navbar: { home: true, competencias: true, usuarios: false, roles: false, tutorias: false },
    competitions: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    roles: { read: false, create: false, update: false, delete: false },
    inscriptions: { read: true, create: true, delete: false },
    evaluaciones: { read: false, create: false, update: false, delete: false },
    tutorias: { read: false, manage: false },
  });

  const headerTitle = useMemo(() => (name ? `Editar rol: ${name}` : "Editar rol"), [name]);

  // ------- helpers -------
  function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
  }

  function toggle(path: string) {
    setPerms((prev) => {
      const next: any = { ...prev };
      const parts = path.split(".");
      if (parts.length !== 2) return prev;
      const [group, key] = parts as [keyof Perms, string];
      next[group] = { ...(next[group] || {}) };
      next[group][key] = !Boolean(next[group][key]);
      return next;
    });
  }

  // ------- cargar -------
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const token = getToken();
        const res = await fetch(`${API}/api/roles/${id}`, {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        const r: RoleDTO = json.role;
        setName(r.name);
        setSlug(r.slug);
        setIsSystem(r.isSystem);
        setPerms({
          navbar: { 
            home: true, 
            competencias: true, 
            usuarios: false, 
            roles: false, 
            tutorias: false,
            ...(r.permissions?.navbar || {}) 
          },
          competitions: { read: true, ...(r.permissions?.competitions || {}) },
          users: { ...(r.permissions?.users || {}) },
          roles: { ...(r.permissions?.roles || {}) },
          inscriptions: { read: true, ...(r.permissions?.inscriptions || {}) },
          tutorias: { read: false, manage: false, ...(r.permissions?.tutorias || {}) },
        });
      } catch (e: any) {
        setErrorMsg(e.message || "No se pudo cargar el rol");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ------- guardar -------
  async function save() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const token = getToken();
      const body = {
        name,
        slug, 
        permissions: perms,
      };
      const res = await fetch(`${API}/api/roles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      router.push("/roles");
    } catch (e: any) {
      setErrorMsg(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">{headerTitle}</h1>
          <Link href="/roles" className="px-3 py-2 rounded-xl border">Volver</Link>
        </div>

        {loading ? (
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        ) : (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!saving) save();
            }}
          >
            {!!errorMsg && <p className="text-red-600">{errorMsg}</p>}

            <section className="rounded-2xl bg-gray-100 p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="Nombre legible del rol"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="EJEMPLO_ROL"
                    disabled={isSystem}
                    title={isSystem ? "Los roles de sistema no pueden cambiar de slug" : ""}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSystem}
                    onChange={(e) => setIsSystem(e.target.checked)}
                  />
                  <span className="text-sm">Rol de sistema</span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl bg-gray-100 p-4 space-y-4">
              <h2 className="font-semibold">Permisos de navegación</h2>
              <div className="flex flex-wrap gap-4">
                {(["home", "competencias", "usuarios", "roles", "tutorias"] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!perms.navbar?.[k]}
                      onChange={() => toggle(`navbar.${k}`)}
                    />
                    <span className="capitalize">{k}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-gray-100 p-4 grid md:grid-cols-2 gap-4">
              {/* Competencias */}
              <fieldset className="border rounded-xl p-4">
                <legend className="px-2 text-sm font-semibold">Competencias</legend>
                {(["read", "create", "update", "delete"] as const).map((k) => (
                  <label key={k} className="mr-4">
                    <input
                      type="checkbox"
                      checked={!!perms.competitions?.[k]}
                      onChange={() => toggle(`competitions.${k}`)}
                    />{" "}
                    {k}
                  </label>
                ))}
              </fieldset>

              {/* Usuarios */}
              <fieldset className="border rounded-xl p-4">
                <legend className="px-2 text-sm font-semibold">Usuarios</legend>
                {(["read", "create", "update", "delete"] as const).map((k) => (
                  <label key={k} className="mr-4">
                    <input
                      type="checkbox"
                      checked={!!perms.users?.[k]}
                      onChange={() => toggle(`users.${k}`)}
                    />{" "}
                    {k}
                  </label>
                ))}
              </fieldset>

              {/* Inscripciones */}
              <fieldset className="border rounded-xl p-4">
                <legend className="px-2 text-sm font-semibold">Inscripciones</legend>
                {(["read", "create", "delete"] as const).map((k) => (
                  <label key={k} className="mr-4">
                    <input
                      type="checkbox"
                      checked={!!perms.inscriptions?.[k]}
                      onChange={() => toggle(`inscriptions.${k}`)}
                    />{" "}
                    {k}
                  </label>
                ))}
              </fieldset>

               {/*Tutorías */}
                <fieldset className="border rounded-xl p-4">
                  <legend className="px-2 text-sm font-semibold">Tutorías</legend>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!perms.tutorias?.read}
                        onChange={() => toggle(`tutorias.read`)}
                      />
                      <span>read</span>
                    </label>
                  </div>
                </fieldset>

              <fieldset className="border rounded-xl p-4">
                <legend className="px-2 text-sm font-semibold">Evaluaciones</legend>
                {["read", "create", "update", "delete"].map((k) => (
                  <label key={k} className="mr-4">
                    <input
                      type="checkbox"
                      checked={!!(perms?.evaluaciones as any)?.[k]}
                      onChange={() => toggle(`evaluaciones.${k}`)}
                    />{" "}
                    {k}
                  </label>
                ))}
              </fieldset>
            </section>
            
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#4854A1] text-white disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <Link href="/roles" className="px-4 py-2 rounded-xl border">Cancelar</Link>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}