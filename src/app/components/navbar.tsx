 "use client";
import Link from "next/link";
import { FaHome } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function Navbar() {
  const router = useRouter();

    return (
    <nav className="flex justify-between items-center px py bg-[#4854A1] text-white shadow-md">
      <div className="flex items-center">
        <Image src="/UMSS.png" alt="UMSS" width={50} height={50} />
      </div>
    
         <div className="flex space-x-4">
        <Link href="/" className="p-2 rounded-full hover:bg-gray-200 transition">
          <FaHome className="text-2xl text-white hover:text-[#3a468a]" />
        </Link>

         <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <FaArrowLeft className="text-2xl text-white hover:text-[#3a468a]" />
        </button>

        <button
          onClick={() => router.forward()}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <FaArrowRight className="text-2xl text-white hover:text-[#3a468a]" />
        </button>

        </div>
    </nav>
  )
}