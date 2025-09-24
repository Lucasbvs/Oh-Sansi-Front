import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    
     <><nav className="flex justify-between items-center px-6 py-3 bg-[#4854A1] text-white shadow-md">
      <div className="flex items-center space-x-3">
        <Image src="/umss-logo.png" alt="UMSS" width={70} height={70} />
        <Link
          href="#"
          className="bg-white text-[#4854A1] px-4 py-1 rounded-full font-medium hover:bg-gray-200 transition"
        >
          Información
        </Link>
      </div>

      <div>
        <span className="font-bold">Universidad Mayor de San Simon</span>
      </div>

      <div className="flex space-x-4">
        <Link
          href="#"
          className="bg-white text-[#4854A1] px-4 py-1 rounded-full font-medium hover:bg-gray-200 transition"
        >
          Ayuda
        </Link>
        <Link
          href="#"
          className="bg-white text-[#4854A1] px-4 py-1 rounded-full font-medium hover:bg-gray-200 transition"
        >
          Contactos
        </Link>
      </div>
    </nav><div
      className="relative w-full h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden"
      style={{
        backgroundImage: "url('/fondo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 flex flex-col items-center justify-center max-h-full overflow-hidden">
          <h1 className="text-7xl md:text-9xl font-Belanosima">Oh! Sansi!</h1>
          <h2 className="text-5xl md:text-7xl font-Belanosima mt-2">Bienvenido</h2>
         
          <br></br>

          <Link href="/login">
  <button className="cursor-pointer bg-white text-[#4854A1] px-6 md:px-8 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-gray-200 transition">
    Ingresar
  </button>
</Link>

        </div>
      </div></>

  )
}
