"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function EliminarRolPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function doDelete() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("ohsansi_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/api/roles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => null);

      if (res.status === 409) {
        setError(data?.message || "No se puede eliminar: el rol tiene usuarios asignados.");
        return;
      }
      if (res.status === 403) {
        setError(data?.message || "No autorizado.");
        return;
      }
      if (res.status === 404) {
        setError("Rol no encontrado.");
        return;
      }
      if (!res.ok) {
        setError(data?.message || `HTTP ${res.status}`);
        return;
      }

      setMessage("Rol eliminado correctamente.");
      // Redirige luego de un pequeño delay
      setTimeout(() => router.push("/roles"), 1000);
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) doDelete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Eliminar rol</h1>
        {loading && <p className="text-gray-600">Eliminando…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {message && <p className="text-green-700">{message}</p>}
      </main>
      <Footer />
    </div>
  );
}
