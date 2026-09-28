import Image from "next/image";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Columna Izquierda - Logo Talentia */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="relative w-full max-w-md h-48 md:h-64">
          <Image
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Columna Derecha - Formulario de Registro */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#EEF2F8]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}