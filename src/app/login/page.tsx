import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#EEF2F8]">
      {/* Columna Izquierda - Logo Talentia sin fondo blanco */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-[#EEF2F8]">
        <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[480px] h-24 min-[480px]:h-32 min-[600px]:h-40 min-[860px]:h-48 min-[1100px]:h-64">
          <Image
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Columna Derecha - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-3 min-[380px]:p-4 min-[480px]:p-6 min-[600px]:p-8 min-[860px]:p-10 min-[1100px]:p-12 bg-[#EEF2F8]">
        <div className="w-full max-w-[320px] min-[380px]:max-w-[350px] min-[480px]:max-w-[390px] min-[600px]:max-w-[420px] min-[1100px]:max-w-[450px] bg-white rounded-2xl min-[480px]:rounded-3xl p-4 min-[380px]:p-5 min-[480px]:p-7 min-[600px]:p-8 min-[1100px]:p-10 shadow-sm transition-all duration-200">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}