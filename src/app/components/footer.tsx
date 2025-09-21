"use client";

export default function Footer(){
    
    return(
        <footer className="bg-[#4854A1] text-white py-4">

          <div className="container mx-auto flex justify-between px-6">
            
            <div className="flex flex-col space-y-1 text-left">
                <p className="font-semibold">Contactanos: ohsansi@sansi.com</p>
                <p className="font-semibold">Whatsapp: (+591)71530671</p>
            </div>

            <div className="flex flex-col space-y-1 text-right">
                <p className="font-semibold">Avenida Oquendo Nro.2147</p>
                <p className="font-semibold">Cochabamba-Bolivia</p>
            </div>

          </div>
        </footer>

    )    

}