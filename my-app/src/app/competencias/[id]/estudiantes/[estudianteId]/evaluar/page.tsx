"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import { FaUserGraduate, FaSave } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Estudiante = {
  id: string;
  name: string;
  email: string;
  documentoIdentidad: string | null;
  ciudad: string;
};

type Evaluacion = {
  calificacion: number;
  detalles: string | null;
  fechaEvaluacion: string;
  estudiante: Estudiante;
  competition: {
    id: string;
    nombre: string;
    nivel: string;
    area: string;
  };
};

export default function EvaluarEstudiantePage() {
  const { id: competitionId, estudianteId } = useParams<{ id: string; estudianteId: string }>();
  const router = useRouter();

  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [competencia, setCompetencia] = useState<any>(null);
  const [calificacion, setCalificacion] = useState<string>("");
  const [detalles, setDetalles] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Obtener evaluación existente (si existe)
        const res = await fetch(
          `${API}/api/evaluaciones/estudiante/${competitionId}/${estudianteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.evaluacion) {
            setCalificacion(data.evaluacion.calificacion.toString());
            setDetalles(data.evaluacion.detalles || "");
            setEstudiante(data.evaluacion.estudiante);
            setCompetencia(data.evaluacion.competition);
          }
        }

        // Si no hay evaluación previa, obtener datos del estudiante
        if (!estudiante) {
          const estudiantesRes = await fetch(`${API}/api/evaluaciones/estudiantes/${competitionId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          });

          if (estudiantesRes.ok) {
            const estudiantesData = await estudiantesRes.json();
            const est = estudiantesData.estudiantes.find((e: any) => e.id === estudianteId);
            if (est) {
              setEstudiante({
                id: est.id,
                name: est.nombre,
                email: est.email,
                documentoIdentidad: est.documentoIdentidad,
                ciudad: est.ciudad,
              });
            }
          }

          // Obtener datos de la competencia
          const compRes = await fetch(`${API}/api/competitions/${competitionId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          });

          if (compRes.ok) {
            const compData = await compRes.json();
            setCompetencia(compData.competition);
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    if (competitionId && estudianteId) fetchData();
  }, [competitionId, estudianteId, router, estudiante]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const calNum = parseFloat(calificacion);
    if (isNaN(calNum) || calNum < 0 || calNum > 100) {
      setError("La calificación debe ser un número entre 0 y 100");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("ohsansi_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${API}/api/evaluaciones/calificar/${competitionId}/${estudianteId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            calificacion: calNum,
            detalles: detalles.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      setSuccessMsg("Evaluación guardada correctamente");
      setTimeout(() => {
        router.push(`/competencias/${competitionId}/estudiantes`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar evaluación");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!estudiante || !competencia) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">No se pudieron cargar los datos</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a]"
            >
              Volver
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Evaluar Estudiante</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Volver
          </button>
        </div>

        {/* Información de la competencia */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-indigo-900 mb-2">Competencia</h2>
          <p className="text-indigo-800">{competencia.nombre}</p>
          <div className="flex gap-4 mt-2 text-sm text-indigo-700">
            <span>Nivel: {competencia.nivel}</span>
            <span>Área: {competencia.area}</span>
          </div>
        </div>

        {/* Información del estudiante */}
        <div className="border rounded-xl p-5 mb-6 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
              <FaUserGraduate className="text-white text-xl" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{estudiante.name}</h2>
              <p className="text-sm text-gray-600">{estudiante.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Documento de Identidad:</span>{" "}
              <span className="font-medium">{estudiante.documentoIdentidad || "No registrado"}</span>
            </div>
            <div>
              <span className="text-gray-600">Ciudad:</span>{" "}
              <span className="font-medium">{estudiante.ciudad}</span>
            </div>
          </div>
        </div>

        {/* Formulario de evaluación */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Evaluación</h2>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Calificación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación (0-100) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4854A1] focus:border-transparent text-lg font-semibold"
              placeholder="Ej: 85.5"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingrese un número entre 0 y 100. Puede usar decimales.
            </p>
          </div>

          {/* Detalles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detalles de la evaluación
            </label>
            <textarea
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4854A1] focus:border-transparent resize-none"
              rows={6}
              placeholder="Escriba comentarios, observaciones o retroalimentación para el estudiante..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Este campo es opcional. Puede incluir comentarios sobre el desempeño del estudiante.
            </p>
          </div>

          {/* Botón de guardar */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a] transition disabled:opacity-60"
            >
              <FaSave />
              {saving ? "Guardando..." : "Guardar Evaluación"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}