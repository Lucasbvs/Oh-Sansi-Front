"use client";

export default function Footer() {
  return (
    <footer className="bg-[#4854A1] text-white py-4 mt-8">
      <div className="mx-auto max-w-6xl px-4 md:px-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
        <div className="text-center sm:text-left">
          <p className="font-semibold">Contáctanos: ohsansi@sansi.com</p>
          <p className="font-semibold">Whatsapp: (+591)71530671</p>
        </div>
        <div className="text-center sm:text-right">
          <p className="font-semibold">Avenida Oquendo Nro. 2147</p>
          <p className="font-semibold">Cochabamba - Bolivia</p>
        </div>
      </div>
    </footer>
  );
}
