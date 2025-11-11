"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaTrophy,
  FaUsers,
  FaShieldAlt,
  FaBars,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaClipboardList
} from "react-icons/fa";
import useAuthUser from "@/hooks/useAuthUser";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthUser();

  const perms = (user as any)?.roleInfo?.permissions ?? {};
  
  // Permisos existentes
  const canSeeCompetencias = !!perms?.competitions?.read;
  const canSeeUsuarios = !!perms?.users?.read;
  const canSeeMisComp = !!perms?.inscriptions?.read;
  const isAdmin = (user?.role ?? "") === "ADMIN";
  
  
  const isEstudiante = user?.role === "ESTUDIANTE";
  const isTutor = user?.role === "TUTOR";

  //Mostrar botón de Tutorías basado en permisos o roles específicos
  const shouldShowTutorias = (canSeeTutorias || canSeeTutoriasNav) || isEstudiante || isTutor || isAdmin;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("ohsansi_token");
    router.push("/login");
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  // --- FIN NUEVO ---

  const NavItem = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<any>;
  }) => {
    const active =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition
          ${active ? "bg-white text-[#4854A1]" : "text-white hover:bg-white/10"}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="text-xl" />
        <span className="hidden sm:inline font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="flex justify-between items-center px-4 py-2 bg-[#4854A1] text-white shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Image src="/UMSS.png" alt="UMSS" width={40} height={40} />
        <span className="hidden md:block font-semibold">
          Universidad Mayor de San Simón
        </span>
      </div>

      <div className="flex items-center gap-2">
        {canSeeCompetencias && (
          <NavItem href="/home"
          label="Competencias"
          icon={FaTrophy} />
        )}

        {canSeeMisComp && (
          <NavItem
            href="/mis-competencias"
            label="Mis competencias"
            icon={FaTrophy}
          />
        )}
        
        {}
        {isEstudiante && (
          <NavItem href="/tutores" label="Tutores" icon={FaChalkboardTeacher} />
        )}
        
        {canSeeUsuarios && (
          <NavItem href="/usuarios"
          label="Usuarios"
          icon={FaUsers} />
        )}

        {canSeeEvaluaciones && (
          <NavItem href="/mis-evaluaciones"
          label="Mis evaluaciones"
          icon={FaClipboardList} />
        )}

        {isAdmin && <NavItem href="/roles"
        label="Roles"
        icon={FaShieldAlt} />}
      </div>


      <div className="flex space-x-2 relative" ref={menuRef}>
        <button
          onClick={() => history.back()}
          aria-label="Atrás"
          className="p-2 rounded-full hover:bg-white/10"
          title="Atrás"
        >
          <FaArrowLeft className="text-2xl" />
        </button>
        <button
          onClick={() => history.forward()}
          aria-label="Adelante"
          className="p-2 rounded-full hover:bg-white/10"
          title="Adelante"
        >
          <FaArrowRight className="text-2xl" />
        </button>


        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menú"
          className="p-2 rounded-full hover:bg-white/10"
          title="Menú"
        >
          <FaBars className="text-2xl" />
        </button>

        {/* Dropdown hacia abajo */}
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-lg bg-white text-black shadow-lg z-50 overflow-hidden"
          >
            {/* Perfil */}
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                router.push("/perfil");
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
            >
              Perfil
            </button>

            {/* Cerrar sesión */}
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}