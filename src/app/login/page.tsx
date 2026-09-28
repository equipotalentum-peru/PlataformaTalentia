import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#e8ecf2]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">

        {/* ==========================================
            LADO IZQUIERDO
           ========================================== */}

        <section className="hidden items-center justify-center px-10 lg:flex">

          <div className="flex w-full max-w-[620px] items-center justify-center">
            <img
              src="/images/Talentia_grande_sin_fondo.png"
              alt="Talentia - Escuela de Especialización Profesional"
              className="w-full max-w-[570px] object-contain"
            />
          </div>

        </section>

        {/* ==========================================
            LADO DERECHO
           ========================================== */}

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10">

          <div
            className="
              w-full
              max-w-[500px]
              rounded-[22px]
              bg-white
              px-8 py-10
              shadow-sm
              sm:px-12 sm:py-12
            "
          >
            <LoginForm />
          </div>

        </section>

      </div>
    </main>
  );
}