    "use client";

    import { useMemo, useState } from "react";

    import { courses } from "@/data/courses";
    import {
    teacherGrades,
    type TeacherGradeRow,
    } from "@/data/teacher-grades";

    const PAGE_SIZE = 8;

    function getGradeClasses(value: number | null) {
    if (value === null) {
        return "bg-[#ededed] text-gray-700";
    }

    if (value >= 14) {
        return "bg-[#c6f2cf] text-[#15933a]";
    }

    if (value >= 11) {
        return "bg-[#ffe5b2] text-[#ce8900]";
    }

    return "bg-[#f7c5cc] text-[#bd4051]";
    }

    function getAverage(row: TeacherGradeRow) {
    const values = [
        row.exam1,
        row.practica1,
        row.exam2,
        row.practica2,
    ].filter(
        (value): value is number =>
        value !== null
    );

    if (values.length === 0) {
        return null;
    }

    return (
        values.reduce((sum, value) => sum + value, 0) /
        values.length
    );
    }

    export default function TeacherGradesPage() {
    const [selectedCourse, setSelectedCourse] =
        useState(courses[0]?.id ?? 1);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);

    const [grades, setGrades] =
        useState<TeacherGradeRow[]>(teacherGrades);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
        return grades;
        }

        return grades.filter((student) =>
        student.alumno
            .toLowerCase()
            .includes(term)
        );
    }, [grades, search]);

    const totalPages = Math.ceil(
        filteredRows.length / PAGE_SIZE
    );

    const visibleRows = filteredRows.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const allValues = grades.flatMap((row) =>
        [
        row.exam1,
        row.practica1,
        row.exam2,
        row.practica2,
        ].filter(
        (value): value is number =>
            value !== null
        )
    );

    const generalAverage =
        allValues.length > 0
        ? (
            allValues.reduce(
                (sum, value) => sum + value,
                0
            ) / allValues.length
            ).toFixed(1)
        : "0.0";

    const studentsWithGrade = grades.filter(
        (row) => getAverage(row) !== null
    ).length;

    const pending = grades.length - studentsWithGrade;

    const updateGrade = (
        id: number,
        field:
        | "exam1"
        | "practica1"
        | "exam2"
        | "practica2",
        value: string
    ) => {
        const numericValue =
        value === ""
            ? null
            : Number(value);

        if (
        numericValue !== null &&
        (numericValue < 0 ||
            numericValue > 20 ||
            Number.isNaN(numericValue))
        ) {
        return;
        }

        setGrades((current) =>
        current.map((row) =>
            row.id === id
            ? {
                ...row,
                [field]: numericValue,
                }
            : row
        )
        );
    };

    const selectedCourseObject =
        courses.find(
        (course) =>
            course.id === selectedCourse
        ) ?? courses[0];

    return (
        <main className="min-h-screen px-[22px] py-[22px] lg:px-[28px]">

        {/* CABECERA */}
        <header className="mb-5">
            <p className="text-[9px] font-medium uppercase text-gray-500">
            Lunes, 7 de septiembre, 2026
            </p>

            <h1 className="mt-1 text-[31px] font-semibold tracking-[-0.8px] text-gray-950">
            Calificaciones por Curso
            </h1>

            <p className="mt-1 text-[10px] text-gray-700">
            Selecciona un curso y registra la nota individual de cada alumno.
            </p>
        </header>

        {/* CURSO */}
        <section className="mb-4">
            <label className="mb-1 block text-[10px] font-semibold text-[#3186d8]">
            Curso
            </label>

            <select
            value={selectedCourse}
            onChange={(event) => {
                setSelectedCourse(
                Number(event.target.value)
                );
                setPage(1);
            }}
            className="h-9 w-[220px] rounded-md border border-[#70a9dd] bg-white px-3 text-[10px] text-[#3186d8] outline-none"
            >
            {courses.map((course) => (
                <option
                key={course.id}
                value={course.id}
                >
                {course.nombre}
                </option>
            ))}
            </select>
        </section>

        {/* RESUMEN */}
        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

            <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#9ce9ed] px-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#73dce0] text-[#3186d8]">
                <span className="text-xl">👥</span>
            </div>

            <div>
                <p className="text-[26px] font-bold leading-none text-[#1554a0]">
                {grades.length}
                </p>

                <p className="text-[9px] text-gray-700">
                Alumnos del curso
                </p>
            </div>
            </article>

            <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#b5efc0] px-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#82e58f] text-[#1c9f43]">
                ✓
            </div>

            <div>
                <p className="text-[26px] font-bold leading-none text-[#199441]">
                {studentsWithGrade}
                </p>

                <p className="text-[9px] text-gray-700">
                Con calificación
                </p>
            </div>
            </article>

            <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#ffe4ab] px-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffd379] text-[#df9600]">
                ◷
            </div>

            <div>
                <p className="text-[26px] font-bold leading-none text-[#d89200]">
                {pending}
                </p>

                <p className="text-[9px] text-gray-700">
                Pendientes por calificar
                </p>
            </div>
            </article>

            <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#e1b7f8] px-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d092f3] text-[#8c40b7]">
                ▥
            </div>

            <div>
                <p className="text-[26px] font-bold leading-none text-[#8c40b7]">
                {generalAverage}
                </p>

                <p className="text-[9px] text-gray-700">
                Promedio más alto del curso
                </p>
            </div>
            </article>

        </section>

        {/* BUSCADOR */}
        <div className="mb-3 flex h-9 w-[250px] items-center rounded-md border border-gray-300 bg-white px-3">

            <svg
            className="mr-2 h-4 w-4 text-gray-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
            </svg>

            <input
            value={search}
            onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
            }}
            placeholder="Buscar alumno por nombre"
            className="w-full bg-transparent text-[10px] outline-none"
            />

        </div>

        {/* TABLA */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-[13px]">

                <thead>
                <tr className="bg-[#eceef2]">
                    <th className="px-5 py-4 text-left text-[13px] font-semibold">
                    Alumno
                    </th>

                    <th className="px-4 py-4 text-center text-[13px] font-semibold">
                    Examen 1
                    </th>

                    <th className="px-4 py-4 text-center text-[13px] font-semibold">
                    Práctica 1
                    </th>

                    <th className="px-4 py-4 text-center text-[13px] font-semibold">
                    Examen 2
                    </th>

                    <th className="px-4 py-4 text-center text-[13px] font-semibold">
                    Práctica 2
                    </th>

                    <th className="px-4 py-4 text-center text-[13px] font-semibold">
                    Promedio
                    </th>
                </tr>
                </thead>

                <tbody>
                {visibleRows.map((row) => {
                    const average =
                    getAverage(row);

                    return (
                    <tr
                        key={row.id}
                        className="border-t border-gray-200"
                    >

                        <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3186d8] text-[8px] font-semibold text-white">
                            {row.alumno
                                .split(" ")
                                .slice(0, 2)
                                .map((word) => word[0])
                                .join("")}
                            </div>

                            <span className="text-[13px] font-medium text-gray-800">
                                {row.alumno}
                            </span>
                        </div>
                        </td>

                        {(
                        [
                            "exam1",
                            "practica1",
                            "exam2",
                            "practica2",
                        ] as const
                        ).map((field) => (
                        <td
                            key={field}
                            className="px-3 py-2 text-center"
                        >
                            <div
                            className={`mx-auto flex h-10 w-[90px] overflow-hidden rounded-md ${getGradeClasses(
                                row[field]
                            )}`}
                            >
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={row[field] ?? ""}
                                    onChange={(event) =>
                                    updateGrade(
                                        row.id,
                                        field,
                                        event.target.value
                                    )
                                    }
                                    className={`w-[60px] bg-transparent px-2 text-center text-[13px] font-semibold outline-none ${getGradeClasses(
                                    row[field]
                                    )}`}
                                    aria-label={`${row.alumno} ${field}`}
                                />

                                <span className="flex w-[30px] items-center justify-center border-l border-current/30 text-[11px] font-medium">
                                    Pts
                                </span>
                            </div>
                        </td>
                        ))}

                        <td className="px-4 py-2 text-center">
                        <span
                            className={`inline-flex min-w-[64px] justify-center rounded-md px-3 py-2 text-[13px] font-semibold ${getGradeClasses(
                                average
                            )}`}
                        >
                        {average === null
                        ? "—"
                        : average.toFixed(1)}
                        </span>
                        </td>

                    </tr>
                    );
                })}
                </tbody>

            </table>
            </div>

            {visibleRows.length === 0 && (
            <div className="py-10 text-center text-[11px] text-gray-500">
                No se encontraron alumnos.
            </div>
            )}

        </section>

        {/* PAGINACIÓN */}
        <div className="mt-3 flex items-center justify-between">

            <p className="text-[10px] text-gray-600">
            Mostrando{" "}
            {visibleRows.length} de{" "}
            {filteredRows.length} alumnos
            </p>

            <div className="flex items-center gap-1">

            <button
                type="button"
                onClick={() =>
                setPage((current) =>
                    Math.max(1, current - 1)
                )
                }
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white disabled:opacity-40"
            >
                ‹
            </button>

            {Array.from(
                { length: totalPages },
                (_, index) => index + 1
            ).map((pageNumber) => (
                <button
                key={pageNumber}
                type="button"
                onClick={() =>
                    setPage(pageNumber)
                }
                className={`h-7 min-w-7 rounded border px-2 text-[9px] ${
                    page === pageNumber
                    ? "border-[#3186d8] bg-[#3186d8] text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
                >
                {pageNumber}
                </button>
            ))}

            <button
                type="button"
                onClick={() =>
                setPage((current) =>
                    Math.min(
                    totalPages,
                    current + 1
                    )
                )
                }
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white disabled:opacity-40"
            >
                ›
            </button>

            </div>

        </div>

        <p className="mt-2 text-[9px] text-gray-500">
            Curso seleccionado:{" "}
            {selectedCourseObject?.nombre}
        </p>

        </main>
    );
    }