    "use client";

    import { useMemo, useState } from "react";

    import {
    attendanceStudents,
    type AttendanceStudent,
    type AttendanceState,
    } from "@/data/attendance";

    type TeacherAttendanceProps = {
    courseId: number;
    };

    function CheckIcon() {
    return (
        <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        >
        <path d="m5 12 4 4L19 6" />
        </svg>
    );
    }

    function XIcon() {
    return (
        <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        >
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
        </svg>
    );
    }

    function getStats(semanas: AttendanceState[]) {
    const presentes = semanas.filter(
        (semana) => semana === "presente"
    ).length;

    const faltas = semanas.length - presentes;

    const porcentaje = Math.round(
        (presentes / semanas.length) * 100
    );

    return {
        porcentaje,
        faltas,
    };
    }

    export default function TeacherAttendance({
    courseId,
    }: TeacherAttendanceProps) {
    const [students, setStudents] =
        useState<AttendanceStudent[]>(
        attendanceStudents
        );

    const [editing, setEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [saved, setSaved] = useState(false);

    const filteredStudents = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
        return students;
        }

        return students.filter((student) =>
        student.nombre.toLowerCase().includes(term)
        );
    }, [students, search]);

    const toggleAttendance = (
        studentId: number,
        weekIndex: number
    ) => {
        if (!editing) {
        return;
        }

        setStudents((current) =>
        current.map((student) => {
            if (student.id !== studentId) {
            return student;
            }

            const semanas = [...student.semanas];

            semanas[weekIndex] =
            semanas[weekIndex] === "presente"
                ? "falta"
                : "presente";

            return {
            ...student,
            semanas,
            };
        })
        );

        setSaved(false);
    };

    const handleSave = () => {
        /*
        * Por ahora solo guardamos en el estado local.
        * Más adelante esto llamará a la API REST.
        */
        setEditing(false);
        setSaved(true);

        window.setTimeout(() => {
        setSaved(false);
        }, 2500);
    };

    return (
        <div className="w-full">

        {/* CABECERA DE ASISTENCIA */}
        <section className="rounded-xl bg-white px-4 py-3 shadow-sm">

            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <h1 className="text-[15px] font-bold text-gray-900">
                Registrar asistencia
            </h1>

            <div className="flex gap-2">

                <button
                type="button"
                onClick={() => {
                    setEditing((current) => !current);
                    setSaved(false);
                }}
                className={`rounded-md px-4 py-2 text-[10px] font-semibold transition ${
                    editing
                    ? "bg-[#eef5fc] text-[#3186d8]"
                    : "bg-[#3186d8] text-white hover:bg-[#2777c1]"
                }`}
                >
                {editing
                    ? "Terminar edición"
                    : "Editar asistencia"}
                </button>

                <button
                type="button"
                onClick={handleSave}
                disabled={!editing}
                className={`rounded-md px-4 py-2 text-[10px] font-semibold transition ${
                    editing
                    ? "bg-[#00b8b3] text-white hover:bg-[#00a7a2]"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
                >
                Guardar asistencia
                </button>

            </div>
            </div>

            {/* BUSCADOR */}
            <div className="mb-4 flex h-9 w-full max-w-[360px] items-center rounded-md bg-[#eeeeee] px-3">

            <svg
                className="mr-2 h-4 w-4 text-[#3186d8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </svg>

            <input
                type="text"
                value={search}
                onChange={(event) =>
                setSearch(event.target.value)
                }
                placeholder="Buscar estudiante"
                className="w-full bg-transparent text-[11px] outline-none"
            />
            </div>

            {/* TABLA */}
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-[10px]">

                <thead>
                <tr className="bg-[#eeeeee]">

                    <th
                    rowSpan={2}
                    className="w-[42px] border-r border-gray-300 px-2 py-2 text-center font-semibold"
                    >
                    N°
                    </th>

                    <th
                    rowSpan={2}
                    className="min-w-[220px] border-r border-gray-300 px-3 py-2 text-left font-semibold"
                    >
                    Estudiante
                    </th>

                    <th
                    colSpan={21}
                    className="border-r border-gray-300 px-2 py-2 text-center font-semibold"
                    >
                    Semanas
                    </th>

                    <th
                    rowSpan={2}
                    className="w-[60px] px-2 py-2 text-center font-semibold"
                    >
                    Asistencia
                    </th>

                    <th
                    rowSpan={2}
                    className="w-[52px] px-2 py-2 text-center font-semibold"
                    >
                    % Asis.
                    </th>

                    <th
                    rowSpan={2}
                    className="w-[52px] px-2 py-2 text-center font-semibold"
                    >
                    Faltas
                    </th>

                </tr>

                <tr className="bg-[#f7f7f7]">
                    {Array.from(
                    { length: 21 },
                    (_, index) => (
                        <th
                        key={index}
                        className="w-[28px] border-r border-gray-200 px-1 py-1 text-center font-medium"
                        >
                        {index + 1}
                        </th>
                    )
                    )}
                </tr>

                </thead>

                <tbody>
                {filteredStudents.map(
                    (student, index) => {
                    const stats = getStats(
                        student.semanas
                    );

                    return (
                        <tr
                        key={student.id}
                        className="border-t border-gray-200"
                        >

                        <td className="border-r border-gray-200 px-2 py-2 text-center">
                            {index + 1}
                        </td>

                        <td className="border-r border-gray-200 px-3 py-2 font-medium text-gray-800">
                            {student.nombre}
                        </td>

                        {student.semanas.map(
                            (state, weekIndex) => (
                            <td
                                key={`${student.id}-${weekIndex}`}
                                className="border-r border-gray-200 p-0 text-center"
                            >
                                <button
                                type="button"
                                disabled={!editing}
                                onClick={() =>
                                    toggleAttendance(
                                    student.id,
                                    weekIndex
                                    )
                                }
                                className={`flex h-[30px] w-full items-center justify-center ${
                                    editing
                                    ? "cursor-pointer hover:bg-gray-100"
                                    : "cursor-default"
                                }`}
                                >
                                {state === "presente" ? (
                                    <span className="text-[#20c85a]">
                                    <CheckIcon />
                                    </span>
                                ) : (
                                    <span className="text-[#ff5252]">
                                    <XIcon />
                                    </span>
                                )}
                                </button>
                            </td>
                            )
                        )}

                        <td className="px-2 py-2 text-center font-medium">
                            {student.semanas.length - stats.faltas}/{student.semanas.length}
                        </td>

                        <td className="px-2 py-2 text-center font-medium">
                            {stats.porcentaje}%
                        </td>

                        <td className="px-2 py-2 text-center font-medium">
                            {stats.faltas}
                        </td>

                        </tr>
                    );
                    }
                )}
                </tbody>

            </table>
            </div>

            {filteredStudents.length === 0 && (
            <div className="py-10 text-center text-[11px] text-gray-500">
                No se encontraron estudiantes.
            </div>
            )}

        </section>

        {saved && (
            <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#163f66] px-4 py-3 text-[11px] font-medium text-white shadow-xl">
            Asistencia guardada correctamente.
            </div>
        )}

        </div>
    );
    }