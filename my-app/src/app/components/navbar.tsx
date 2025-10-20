"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { FaArrowLeft, FaArrowRight, FaTrophy, FaUsers, FaShieldAlt } from "react-icons/fa";
import useAuthUser from "@/hooks/useAuthUser";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const perms = (user as any)?.roleInfo?.permissions ?? {};
  const canSeeCompetencias = !!perms?.competitions?.read;
  const canSeeUsuarios     = !!perms?.users?.read;
  const canSeeMisComp      = !!perms?.inscriptions?.read; // 👈 nuevo
  const isAdmin            = (user?.role ?? "") === "ADMIN";

  const NavItem = ({ href, label, icon: Icon }:{
    href: string; label: string; icon: React.ComponentType<any>
  }) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
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
        <span className="hidden md:block font-semibold">Universidad Mayor de San Simón</span>
      </div>

      <div className="flex items-center gap-2">
        {canSeeCompetencias && <NavItem href="/home"     label="Competencias" icon={FaTrophy} />}
        {canSeeMisComp      && <NavItem href="/mis-competencias" label="Mis competencias" icon={FaTrophy} />} {/* 👈 */}
        {canSeeUsuarios     && <NavItem href="/usuarios" label="Usuarios"     icon={FaUsers}  />}
        {isAdmin            && <NavItem href="/roles"    label="Roles"        icon={FaShieldAlt} />}
      </div>

      <div className="flex space-x-2">
        <button onClick={() => history.back()} aria-label="Atrás"    className="p-2 rounded-full hover:bg-white/10"><FaArrowLeft  className="text-2xl" /></button>
        <button onClick={() => history.forward()} aria-label="Adelante" className="p-2 rounded-full hover:bg-white/10"><FaArrowRight className="text-2xl" /></button>
      </div>
    </nav>
  );
}
