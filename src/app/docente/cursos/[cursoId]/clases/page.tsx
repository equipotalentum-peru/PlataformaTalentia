"use client";

import { useEffect, useMemo, useState, } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { obtenerClasesDocente, crearClase, editarClase, cancelarClase, } from "@/lib/clases-api";
import type { ClassSession, } from "@/data/classes";
import { courses } from "@/data/courses";
import ClassHeader from "@/components/common/clases/ClassHeader";
import ClassList from "@/components/common/clases/ClassList";

import CreateClassModal from "@/components/docente/clases/CreateClassModal";
import EditClassModal from "@/components/docente/clases/EditClassModal";

type PageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default function TeacherClassesPage({
    params,
}: PageProps) {
    const [courseId, setCourseId] = useState(1);
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [createOpen, setCreateOpen] = useState(false);

    const [editOpen, setEditOpen] = useState(false);

    const [selectedClass, setSelectedClass] =
        useState<ClassSession | null>(null);

    const [notice, setNotice] = useState("");

        useEffect(() => {
            params.then(({ cursoId }) => {
                const id = Number(cursoId);

                setCourseId(id);

                obtenerClasesDocente(id)
                .then((data) => {
                    setClasses(
                    Array.isArray(data.clases)
                        ? data.clases
                        : []
                    );
                })
                .catch((err) => {
                    console.error(err);

                    setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar las clases."
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
            });
        }, [params]);

    const course = courses.find(
        (item) => item.id === courseId
    );

    const nextClass =
        classes.find((item) => item.estado === "Próxima") ??
        classes.find((item) => item.estado === "Programada");

    const visibleCourse = course ?? courses[0];

    const showNotice = (message: string) => {
        setNotice(message);

        window.setTimeout(() => {
        setNotice("");
        }, 2200);
    };

    const handleCreate = async ({
        title,
        date,
        startTime,
        endTime,
    }: {
        title: string;
        date: string;
        startTime: string;
        endTime: string;
    }) => {
        try {
            await crearClase(
            courseId,
            {
                tema: title,
                iniciaEn: `${date}T${startTime}:00-05:00`,
                terminaEn: `${date}T${endTime}:00-05:00`,
            }
            );

            const data =
            await obtenerClasesDocente(
                courseId
            );

            setClasses(
            Array.isArray(data.clases)
                ? data.clases
                : []
            );

            setCreateOpen(false);

            showNotice(
            "Clase programada correctamente."
            );
        } catch (error) {
            showNotice(
            error instanceof Error
                ? error.message
                : "No se pudo crear la clase."
            );
        }
    };

    const handleEdit = async ({
        id,
        title,
        date,
        startTime,
        endTime,
    }: {
        id: number;
        title: string;
        date: string;
        startTime: string;
        endTime: string;
    }) => {
        try {
            await editarClase(
            courseId,
            id,
            {
                tema: title,
                iniciaEn: `${date}T${startTime}:00-05:00`,
                terminaEn: `${date}T${endTime}:00-05:00`,
            }
            );

            const data =
            await obtenerClasesDocente(
                courseId
            );

            setClasses(
            Array.isArray(data.clases)
                ? data.clases
                : []
            );

            setEditOpen(false);
            setSelectedClass(null);

            showNotice(
            "Clase actualizada correctamente."
            );
        } catch (error) {
            showNotice(
            error instanceof Error
                ? error.message
                : "No se pudo editar la clase."
            );
        }
    };

    const highlightedClass =
        classes.find(
            (item) =>
            item.estado === "En curso"
        ) ??
        classes.find(
            (item) =>
            item.estado === "Próxima"
        ) ??
        classes.find(
            (item) =>
            item.estado === "Programada"
        );

    const handleCancel = async (
        item: ClassSession
    ) => {
        try {
            await cancelarClase(
            courseId,
            item.id
            );

            const data =
            await obtenerClasesDocente(
                courseId
            );

            setClasses(
            Array.isArray(data.clases)
                ? data.clases
                : []
            );

            showNotice(
            "Clase cancelada."
            );
        } catch (error) {
            showNotice(
            error instanceof Error
                ? error.message
                : "No se pudo cancelar la clase."
            );
        }
    };

    const handleStart = async (
        item: ClassSession
    ) => {
        try {
            const response = await fetch(
            `${API_URL}/clases/docente/${courseId}/${item.id}/iniciar`,
            {
                method: "POST",
                credentials: "include",
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(
                data.message ??
                "No se pudo iniciar la clase."
            );
            }

            setClasses((current) =>
            current.map((classItem) =>
                classItem.id === item.id
                ? {
                    ...classItem,
                    estado: "En curso",
                    }
                : classItem
            )
            );

            if (data.startUrl) {
            window.open(
                data.startUrl,
                "_blank",
                "noopener,noreferrer"
            );
            }

            showNotice("Clase iniciada.");
        } catch (error) {
            showNotice(
            error instanceof Error
                ? error.message
                : "No se pudo iniciar la clase."
            );
        }
    };

    const handleRecording = async (
        item: ClassSession
    ) => {
        try {
            const response = await fetch(
            `${API_URL}/clases/docente/${courseId}/${item.id}/grabaciones`,
            {
                credentials: "include",
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(
                data.message ??
                "No se pudo obtener la grabación."
            );
            }

            const grabacion =
            data.grabaciones?.[0];

            if (!grabacion?.url) {
            throw new Error(
                "No hay grabaciones disponibles para esta clase."
            );
            }

            window.open(
            grabacion.url,
            "_blank",
            "noopener,noreferrer"
            );
        } catch (error) {
            showNotice(
            error instanceof Error
                ? error.message
                : "No se pudo obtener la grabación."
            );
        }
    };

    const handleEditOpen = (item: ClassSession) => {
        setSelectedClass(item);
        setEditOpen(true);
    };

    return (
        <div className="min-h-screen px-3 py-4 lg:px-5">
        <div className="mx-auto max-w-[1080px]">

            {/* VOLVER */}
            <Link
            href="/docente/cursos"
            className="mb-2 flex w-fit items-center gap-1.5 text-[11px] font-medium text-gray-700 transition hover:text-[#3186d8]"
            >
            ← Volver a cursos
            </Link>

            {/* BANNER */}
            <div className="relative h-[150px] overflow-hidden rounded-t-xl">
            <img
                src={visibleCourse.imagen}
                alt={visibleCourse.nombre}
                className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/20" />

            <h1 className="absolute bottom-7 left-4 text-[31px] font-bold tracking-[-0.8px] text-white">
                {visibleCourse.nombre}
            </h1>
            </div>

            {/* TABS */}
            <div className="flex flex-wrap border-b border-[#9ca3ad] bg-[#eef2f8]">
            <Link
                href={`/docente/cursos/${courseId}`}
                className="px-3 py-2 text-[10px] text-gray-700 hover:text-black"
            >
                Contenido de curso
            </Link>

            <Link
                href={`/docente/cursos/${courseId}/clases`}
                className="border-b-[3px] border-black px-3 py-2 text-[10px] font-medium text-gray-900"
            >
                Clases
            </Link>

            <Link
                href={`/docente/cursos/${courseId}/foro`}
                className="px-3 py-2 text-[10px] text-gray-700 hover:text-black"
            >
                Foro
            </Link>

            <Link
                href={`/docente/cursos/${courseId}/anuncios`}
                className="px-3 py-2 text-[10px] text-gray-700 hover:text-black"
            >
                Anuncios
            </Link>

            <Link
                href={`/docente/cursos/${courseId}/asistencia`}
                className="px-3 py-2 text-[10px] text-gray-700 hover:text-black"
            >
                Asistencia
            </Link>
            </div>

            <div className="py-4">

            {/* HEADER */}
            <ClassHeader
                showTeacherActions
                onSchedule={() => setCreateOpen(true)}
            />

            {/* PRÓXIMA CLASE */}
            {highlightedClass && (
                <section className="mb-2 rounded-xl bg-white px-5 py-3 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00bbb6]">
                        <svg
                        className="h-7 w-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        >
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="17"
                            rx="2"
                        />
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <path d="M3 9h18" />
                        </svg>
                    </div>

                    <div>
                        <p className="text-[9px] font-medium uppercase text-gray-500">
                            {highlightedClass.estado === "En curso"
                                ? "Clase en curso"
                                : "Próxima clase"}
                        </p>

                        <h2 className="text-[16px] font-bold text-gray-900">
                        Sesión {highlightedClass.numero}:{" "}
                        {highlightedClass.tema}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-gray-600">
                        <span>
                            📅 {highlightedClass.fecha}
                        </span>

                        <span>
                            ◷ {highlightedClass.horario}
                        </span>

                        <span>
                            👤 {highlightedClass.docente}
                        </span>
                        </div>
                    </div>
                    </div>

                    <div className="flex flex-wrap gap-2">

                    <button
                        type="button"
                        onClick={() =>
                        handleEditOpen(highlightedClass)
                        }
                        className="flex items-center gap-1.5 rounded-md bg-[#dbeefa] px-3 py-2 text-[9px] font-medium text-[#3186d8]"
                    >
                        ✎ Editar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                        handleCancel(highlightedClass)
                        }
                        className="flex items-center gap-1.5 rounded-md bg-[#f4dddd] px-3 py-2 text-[9px] font-medium text-[#a44a4a]"
                    >
                        🗑 Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleStart(highlightedClass)
                        }
                        className="flex items-center gap-1.5 rounded-md bg-[#00bbb6] px-3 py-2 text-[9px] font-semibold text-white transition hover:bg-[#00aaa6]"
                        >
                        <span>●</span>

                        {highlightedClass.estado === "En curso"
                            ? "Volver a clase"
                            : "Iniciar clase"}
                    </button>

                    </div>
                </div>
                </section>
            )}

            {/* TABLA */}
            <ClassList
                classes={classes}
                role="teacher"
                onEdit={handleEditOpen}
                onCancel={handleCancel}
                onStart={handleStart}
                onRecording={handleRecording}
                onDetails={(item) =>
                showNotice(
                    `Detalles de la sesión ${item.numero}.`
                )
                }
            />

            </div>
        </div>

        {/* MODALES */}
        <CreateClassModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSave={handleCreate}
        />

        <EditClassModal
            open={editOpen}
            classSession={selectedClass}
            onClose={() => {
            setEditOpen(false);
            setSelectedClass(null);
            }}
            onSave={handleEdit}
        />

        {/* AVISO */}
        {notice && (
            <div className="fixed bottom-5 right-5 z-[120] rounded-lg bg-[#163f66] px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">
            {notice}
            </div>
        )}
        </div>
    );
}