"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import useAuthUser from "@/hooks/useAuthUser";
import Link from "next/link";
import { FaChalkboardTeacher, FaUserPlus, FaUsers, FaMapMarkerAlt } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Tutor = {
  id: string;
  nombre: string;
  email: string;
  ciudad: string;
  _count: {
    estudiantesTutorados: number;
  };
};

export default function TutoresPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutores = async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        const res = await fetch(`${API}/api/tutores`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (data.ok) {
          setTutores(data.tutores);
        } else {
          throw new Error(data.message || "Error cargando tutores");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTutores();
    }
  }, [user]);

  const handleAsignarTutor = async (tutorId: string) => {
    setAsignando(tutorId);
    try {
      const token = localStorage.getItem("ohsansi_token");
      const res = await fetch(`${API}/api/tutores/${tutorId}/asignar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (data.ok) {
        window.location.reload();
      } else {
        console.error(data.message || "Error asignando tutor");
      }
    } catch (err: any) {
      console.error("Error asignando tutor: " + err.message);
    } finally {
      setAsignando(null);
    }
  };

  const handleDesasignarTutor = async () => {
    try {
      const token = localStorage.getItem("ohsansi_token");
      const res = await fetch(`${API}/api/tutores/desasignar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const data = await res.json();
      if (data.ok) {
        window.location.reload();
      } else {
        console.error(data.message || "Error desasignando tutor");
      }
    } catch (err) {
      console.error("Error desasignando tutor");
    }
  };

  if (userLoading) {
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

  // Verificar que el usuario es estudiante
  if (user?.role !== "ESTUDIANTE") {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Navbar />
        <main className="max-w-4xl w-full mx-auto flex-1 px-4 md:px-6 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Acceso no autorizado</h2>
            <p className="text-gray-600 mb-4">Solo los estudiantes pueden acceder a esta página.</p>
            <Link href="/home" className="text-blue-600 hover:underline">
              Volver al inicio
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto flex-1 px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
            <FaChalkboardTeacher className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Tutores Disponibles</h1>
            <p className="text-gray-500">Selecciona un tutor para asignarte</p>
          </div>
        </div>

        {/* Información del tutor actual */}
        {user.tutorId && (
          <div className="bg-white border border-gray-300 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Tutor actualmente asignado</h3>
                <p className="text-gray-600">
                  Ya tienes un tutor asignado. Puedes cambiarlo seleccionando uno nuevo.
                </p>
              </div>
              <button
                onClick={handleDesasignarTutor}
                className="px-4 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a] transition-colors"
              >
                Desasignar Tutor
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : tutores.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-600">No hay tutores disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutores.map((tutor) => (
              <div key={tutor.id} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
                    <FaUserPlus className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{tutor.nombre}</h3>
                    <p className="text-gray-500 text-sm">Tutor</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {tutor.email}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt />
                    <span>{tutor.ciudad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUsers />
                    <span>{tutor._count.estudiantesTutorados} estudiante(s)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAsignarTutor(tutor.id)}
                  disabled={user.tutorId === tutor.id || asignando === tutor.id}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    user.tutorId === tutor.id
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : asignando === tutor.id
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-[#4854A1] text-white hover:bg-[#3a468a]"
                  }`}
                >
                  {asignando === tutor.id ? "Asignando..." : user.tutorId === tutor.id ? "Asignado" : "Asignar Tutor"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}