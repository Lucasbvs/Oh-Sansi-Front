import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Link from "next/link";

export default function Home({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
          <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#4854A1]">
          Iniciar Sesión
        </h1>
        <form className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Correo"
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="border p-2 rounded"
          />
         
          <Link href="/home">
  <button className="bg-[#4854A1] text-white py-2 rounded hover:bg-[#3b4780] transition">
    Entrar
  </button>
</Link>

        </form>
      </div>
    </div>
      <Footer/>
    </main>
  );
}