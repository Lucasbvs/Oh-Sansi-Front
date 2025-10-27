"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import useAuthUser from "@/hooks/useAuthUser";
import Link from "next/link";
import { FaUser, FaTrophy, FaUserGraduate, FaExclamationTriangle, FaMapMarkerAlt } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type MisInscripcion = {
  competition: { id: string; nombre: string; etapaActual?: string };
  createdAt?: string;
  fechaInscripcion?: string;
};

type TutorInfo = {
  id: string;
  nombre: string;
  email: string;
  ciudad: string;
};

export default function PerfilPage() {
  const { user, loading, error } = useAuthUser();
  const [tutor, setTutor] = useState<TutorInfo | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [inscripciones, setInscripciones] = useState<MisInscripcion[] | null>(null);
  const [loadingIns, setLoadingIns] = useState(true);

  // Cargar información del tutor
  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        if (!token) {
          setLoadingTutor(false);
          return;
        }

        const res = await fetch(`${API}/api/tutores/mi-tutor`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.tutor) {
            setTutor(data.tutor);
          }
        }
      } catch (error) {
        console.error("Error fetching tutor:", error);
      } finally {
        setLoadingTutor(false);
      }
    };

    if (user) {
      fetchTutor();
    }
  }, [user]);

  // Cargar inscripciones
  useEffect(() => {
    const fetchInscripciones = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
        if (!token) {
          setLoadingIns(false);
          return;
        }

        const res = await fetch(`${API}/api/inscriptions/mis`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: "no-store",
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        const list = data?.items ?? data?.competitions ?? data ?? [];

        const norm: MisInscripcion[] = list.map((row: any) => {
          const fechaInscripcion = row?.fechaInscripcion || row?.createdAt;
          
          if (row?.competition) {
            return {
              competition: {
                id: row.competition.id,
                nombre: row.competition.nombre,
                etapaActual: row.competition.etapaActual,
              },
              createdAt: fechaInscripcion,
              fechaInscripcion: fechaInscripcion,
            };
          }
          
          return {
            competition: {
              id: row.id,
              nombre: row.nombre,
              etapaActual: row.etapaActual,
            },
            createdAt: fechaInscripcion,
            fechaInscripcion: fechaInscripcion,
          };
        });

        setInscripciones(norm);
      } catch (error) {
        console.error("Error fetching inscripciones:", error);
        setInscripciones([]);
      } finally {
        setLoadingIns(false);
      }
    };

    if (user) {
      fetchInscripciones();
    }
  }, [user]);

  
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
        setTutor(null);
        
        window.location.reload();
      } else {
        console.error(data.message || "Error desasignando tutor");
      }
    } catch (err) {
      console.error("Error desasignando tutor");
    }
  };

  // Si no hay usuario y no está loading, redirigir o mostrar mensaje
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Navbar />
        <main className="max-w-5xl w-full mx-auto flex-1 px-4 md:px-6 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Debes iniciar sesión</h2>
            <Link href="/login" className="text-blue-600 hover:underline">
              Ir al login
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

      <main className="max-w-5xl w-full mx-auto flex-1 px-4 md:px-6 py-6">
        <h1 className="text-3xl font-bold mb-1">Mi perfil</h1>
        <p className="text-gray-500 mb-6">Información y competencias inscritas</p>

        {/* Información personal */}
        <section className="border rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
              <FaUser className="text-white text-lg" />
            </div>
            <h2 className="text-lg font-semibold">Información personal</h2>
          </div>

          {loading ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ) : error ? (
            <p className="text-red-600">No se pudo cargar el usuario.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-500">Nombre completo</p>
                <p className="font-medium">{user?.name ?? "—"}</p>
              </div>

              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-500">Documento de identidad</p>
                <p className="font-medium">{user?.documentoIdentidad ?? "—"}</p>
              </div>

              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium">{user?.email ?? "—"}</p>
              </div>

              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-500">Ciudad</p>
                <p className="font-medium">{user?.ciudad ?? "—"}</p>
              </div>

              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-500">Rol</p>
                <p className="font-medium">{user?.role ?? "—"}</p>
              </div>

              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">
                  {user?.activo === false ? "Inactivo" : "Activo"}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Tutor asignado*/}
        <section className="border rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
              <FaUserGraduate className="text-white text-lg" />
            </div>
            <h2 className="text-lg font-semibold">Tutor asignado</h2>
          </div>

          {loadingTutor ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ) : tutor ? (
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="font-medium text-lg">{tutor.nombre}</p>
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {tutor.email}
                  </p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaMapMarkerAlt />
                    <span>{tutor.ciudad}</span>
                  </div>
                </div>
                <button
                  onClick={handleDesasignarTutor}
                  className="px-4 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a] text-sm"
                >
                  Desasignar
                </button>
              </div>
            </div>
          ) : user?.role === "ESTUDIANTE" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-yellow-600 text-xl" />
                <div>
                  <p className="text-yellow-800 font-medium">No tienes tutor asignado</p>
                  <p className="text-yellow-700 text-sm">
                    Necesitas un tutor para poder inscribirte en competencias.
                  </p>
                  <Link 
                    href="/tutores" 
                    className="inline-block mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    Asignar Tutor
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-600">No aplica para tu rol.</p>
            </div>
          )}
        </section>

        {/* Competencias inscritas */}
        <section className="border rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
              <FaTrophy className="text-white text-lg" />
            </div>
            <h2 className="text-lg font-semibold">Competencias Inscritas</h2>
          </div>

          {loadingIns ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ) : !inscripciones || inscripciones.length === 0 ? (
            <p className="text-gray-600">No tienes inscripciones registradas.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left font-semibold px-4 py-2">Competencia</th>
                    <th className="text-left font-semibold px-4 py-2">Fecha de inscripción</th>
                    <th className="text-left font-semibold px-4 py-2">Estado</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inscripciones.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-4 py-2 font-medium">
                        {item.competition.nombre}
                      </td>
                      <td className="px-4 py-2">
                        {item.fechaInscripcion
                          ? new Date(item.fechaInscripcion).toLocaleDateString()
                          : item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {item.competition.etapaActual ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                            <span className="w-2 h-2 rounded-full bg-[#6F7FF7]" />
                            {item.competition.etapaActual}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/competencias/${item.competition.id}`}
                          className="text-[#4854A1] hover:underline"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}