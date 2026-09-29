
export default function AdministradorDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#EEF2F8] font-sans">

      {/* Área Principal del Dashboard */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-extrabold text-[#0F2851] mb-8">
          Dashboard administrativo
        </h1>

        {/* Fila Superior: Gráfico Donut + Gráfico de Líneas */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
          {/* Card Aprobados vs desaprobados */}
          <div className="xl:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-[#0F2851]">
              Aprobados vs desaprobados
            </h2>
            <p className="text-xs text-[#6F83A5] mb-6">
              Resultado académico general de los alumnos.
            </p>

            <div className="flex items-center justify-between gap-4">
              {/* Círculo simulado de gráfica Donut */}
              <div className="relative w-36 h-36 rounded-full border-[14px] border-[#2D97E8] border-t-[#FF6584] border-r-[#FFB800] flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-xl font-extrabold text-[#0F2851]">
                    1,248
                  </span>
                  <span className="text-[10px] text-[#6F83A5]">alumnos</span>
                </div>
              </div>

              {/* Leyenda */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2D97E8]"></span>
                  <div>
                    <span className="font-bold text-[#0F2851]">Aprobados </span>
                    <span className="font-extrabold text-[#0F2851]">68%</span>
                    <p className="text-[10px] text-[#6F83A5]">848 alumnos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#A259FF]"></span>
                  <div>
                    <span className="font-bold text-[#0F2851]">Desaprobados </span>
                    <span className="font-extrabold text-[#0F2851]">18%</span>
                    <p className="text-[10px] text-[#6F83A5]">225 alumnos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF6584]"></span>
                  <div>
                    <span className="font-bold text-[#0F2851]">En riesgo </span>
                    <span className="font-extrabold text-[#0F2851]">14%</span>
                    <p className="text-[10px] text-[#6F83A5]">175 alumnos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Actividad de matrículas */}
          <div className="xl:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h2 className="text-base font-bold text-[#0F2851]">
                  Actividad de matrículas
                </h2>
                <p className="text-xs text-[#6F83A5]">
                  Nuevas matrículas por mes y tendencia.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#2D97E8]">
                Últimos 6 meses
              </span>
            </div>

            {/* Simulación visual de gráfica de barras + línea */}
            <div className="h-44 mt-6 flex items-end justify-between px-4 pb-2 border-b border-gray-100 text-xs text-[#6F83A5]">
              {["Ene", "Feb", "Mar", "Abr", "May", "Jun"].map((mes, idx) => (
                <div key={mes} className="flex flex-col items-center gap-2">
                  <div
                    className="w-8 bg-[#80C3F8] rounded-t-lg transition-all"
                    style={{ height: `${(idx + 2) * 18}px` }}
                  ></div>
                  <span>{mes}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#2D97E8]">
                ● Nuevas matrículas
              </span>
              <span className="flex items-center gap-1.5 text-[#7F32D9]">
                ● Tendencia
              </span>
            </div>
          </div>
        </div>

        {/* Fila Media: Alumnos destacados + Cursos con baja continuidad */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
          {/* Card Alumnos destacados */}
          <div className="xl:col-span-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F2851]">
                  Alumnos destacados
                </h2>
                <p className="text-xs text-[#6F83A5]">
                  Mejores promedios del período.
                </p>
              </div>
              <button className="text-xs font-semibold text-[#2D97E8] hover:underline">
                Ver todos
              </button>
            </div>

            {/* Podio Top 3 */}
            <div className="flex justify-center items-end gap-3 mt-6 mb-4">
              {/* Top 2 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#B2DAFC] flex items-center justify-center font-bold text-xs text-[#2D97E8] mb-1">
                  2
                </div>
                <div className="bg-[#EBF4FE] p-3 rounded-2xl text-center w-28">
                  <p className="text-xs font-extrabold text-[#0F2851]">9.5</p>
                </div>
              </div>

              {/* Top 1 */}
              <div className="flex flex-col items-center -translate-y-2">
                <div className="w-7 h-7 rounded-full bg-[#FFB800] text-white flex items-center justify-center text-xs font-bold mb-1">
                  1
                </div>
                <div className="bg-[#FFF9E6] p-4 rounded-2xl text-center w-32">
                  <p className="text-xs font-bold text-[#0F2851]">Carlos Mendoza</p>
                  <p className="text-sm font-extrabold text-[#0F2851]">9.8</p>
                </div>
              </div>

              {/* Top 3 */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#FF7D00] text-white flex items-center justify-center text-xs font-bold mb-1">
                  3
                </div>
                <div className="bg-[#F6EBFD] p-3 rounded-2xl text-center w-28">
                  <p className="text-xs font-bold text-[#0F2851]">Luis Ramírez</p>
                  <p className="text-xs font-extrabold text-[#0F2851]">9.2</p>
                </div>
              </div>
            </div>

            {/* Fila Top 4 */}
            <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl text-xs">
              <span className="font-bold text-[#6F83A5]">4</span>
              <span className="font-bold text-[#0F2851]">Diego Sánchez</span>
              <span className="font-extrabold text-[#0F2851]">8.7</span>
            </div>
          </div>

          {/* Card Cursos con baja continuidad */}
          <div className="xl:col-span-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-[#0F2851]">
              Cursos con baja continuidad
            </h2>
            <p className="text-xs text-[#6F83A5] mb-6">
              Alumnos que siguen activos por curso.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F2851] w-4">1</span>
                <span className="font-bold text-[#0F2851] flex-1 ml-2">
                  Diseño UX
                </span>
                <div className="w-32 bg-gray-100 h-2.5 rounded-full overflow-hidden mr-3">
                  <div className="bg-[#FF6584] h-full w-[58%]"></div>
                </div>
                <span className="font-extrabold text-[#0F2851] w-8">58%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F2851] w-4">2</span>
                <span className="font-bold text-[#0F2851] flex-1 ml-2">
                  Programación Web
                </span>
                <div className="w-32 bg-gray-100 h-2.5 rounded-full overflow-hidden mr-3">
                  <div className="bg-[#FF6584] h-full w-[62%]"></div>
                </div>
                <span className="font-extrabold text-[#0F2851] w-8">62%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F2851] w-4">3</span>
                <span className="font-bold text-[#0F2851] flex-1 ml-2">
                  Marketing Digital
                </span>
                <div className="w-32 bg-gray-100 h-2.5 rounded-full overflow-hidden mr-3">
                  <div className="bg-[#FFB800] h-full w-[69%]"></div>
                </div>
                <span className="font-extrabold text-[#0F2851] w-8">69%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fila Inferior: Distribución académica */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-[#0F2851]">
            Distribución académica
          </h2>
          <p className="text-xs text-[#6F83A5] mb-4">
            Estado general de los alumnos.
          </p>

          {/* Barra segmentada */}
          <div className="h-6 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white text-center leading-6 mb-4">
            <div className="bg-[#2D97E8] w-[42%]">42%</div>
            <div className="bg-[#34D399] w-[28%]">28%</div>
            <div className="bg-[#A259FF] w-[18%]">18%</div>
            <div className="bg-[#FF6584] w-[8%]">8%</div>
            <div className="bg-gray-300 w-[4%] text-gray-700">4%</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D97E8]"></span>
              <div>
                <p className="font-bold text-[#0F2851]">En progreso</p>
                <p className="text-[10px] text-[#6F83A5]">524 alumnos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]"></span>
              <div>
                <p className="font-bold text-[#0F2851]">Aprobados</p>
                <p className="text-[10px] text-[#6F83A5]">349 alumnos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A259FF]"></span>
              <div>
                <p className="font-bold text-[#0F2851]">Desaprobados</p>
                <p className="text-[10px] text-[#6F83A5]">225 alumnos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6584]"></span>
              <div>
                <p className="font-bold text-[#0F2851]">En riesgo</p>
                <p className="text-[10px] text-[#6F83A5]">100 alumnos</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}