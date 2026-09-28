import Image from "next/image";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#EEF2F8]">
      {/* Columna Izquierda - Logo Talentia (VISIBLE SOLO EN PANTALLAS GRANDES >= 1024px/lg) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 lg:p-12 bg-[#EEF2F8]">
        <div className="relative w-full max-w-[480px] h-64">
          <Image
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Columna Derecha / Principal en Móvil y Tablet - Contenedor con Formulario */}
      <div className="w-full lg:w-1/2 min-h-screen lg:min-h-0 flex items-center justify-center p-3 min-[380px]:p-4 min-[480px]:p-6 min-[600px]:p-8 min-[860px]:p-10 min-[1100px]:p-12 bg-[#EEF2F8]">
        <div className="w-full max-w-[320px] min-[380px]:max-w-[350px] min-[480px]:max-w-[390px] min-[600px]:max-w-[420px] min-[1100px]:max-w-[450px] bg-white rounded-2xl min-[480px]:rounded-3xl p-4 min-[380px]:p-5 min-[480px]:p-7 min-[600px]:p-8 min-[1100px]:p-10 shadow-sm transition-all duration-200">
          
          {/* Logo DENTRO del cuadro blanco (VISIBLE SOLO EN MÓVIL Y TABLET < lg) */}
          <div className="block lg:hidden relative w-full h-16 min-[380px]:h-20 min-[480px]:h-24 mb-4">
            <Image
              src="/images/Talentia_grande_sin_fondo.png"
              alt="Talentia Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}