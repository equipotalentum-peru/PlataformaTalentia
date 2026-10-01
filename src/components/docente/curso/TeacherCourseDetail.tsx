"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Course } from "@/data/courses";
import { courseContents, courseModules, type ContentType } from "@/data/courseContents";
import CourseContentIcon from "@/components/common/contenido/CourseContentIcon";
import TeacherCourseInfo from "./TeacherCourseInfo";
import CreateModuleModal from "./modals/CreateModuleModal";
import AddContentModal from "./modals/AddContentModal";
import UploadFileModal from "./modals/UploadFileModal";
import AddLinkModal from "./modals/AddLinkModal";

type TeacherCourseDetailProps = {
  course: Course;
};

type LocalModule = {
  id: number;
  title: string;
};

type LocalContent = {
  id: number;
  moduleId: number;
  order: number;
  title: string;
  type: ContentType;
  file?: string;
  status: "Publicado" | "Borrador";
};

const moduleColors = ["#70a9dc", "#70a9dc", "#70a9dc"];


function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function DottedMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#58708d] hover:bg-[#eef5fb]" aria-label="Acciones del contenido">
        <MoreIcon />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-[40] cursor-default" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-[50] w-24 overflow-hidden rounded-md border border-[#e0e5eb] bg-white py-1 shadow-lg">
            <button type="button" onClick={() => { setOpen(false); onEdit(); }} className="block w-full px-3 py-1.5 text-left text-[10px] text-gray-700 hover:bg-[#f4f8fc]">Editar</button>
            <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="block w-full px-3 py-1.5 text-left text-[10px] text-red-600 hover:bg-red-50">Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function TeacherCourseDetail({ course }: TeacherCourseDetailProps) {
  const router = useRouter();
  const [modules, setModules] = useState<LocalModule[]>(() => courseModules.map(({ id, title }) => ({ id, title })));
  const [contents, setContents] = useState<LocalContent[]>(() =>
    courseContents
      .filter((item) => item.courseId === course.id)
      .map((item) => ({ ...item, status: item.id === 8 ? "Borrador" : "Publicado" }))
  );
  const [openModules, setOpenModules] = useState<number[]>([1]);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [createModuleTitle, setCreateModuleTitle] = useState("");
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(1);
  const [notice, setNotice] = useState("");

  const modulesWithContents = useMemo(() => {
    return modules.map((module) => ({
      ...module,
      contents: contents
        .filter((content) => content.moduleId === module.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [modules, contents]);

  const toggleModule = (id: number) => {
    setOpenModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setSelectedModuleId(id);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const saveModule = (status: "Borrador" | "Publicado") => {
    const title = createModuleTitle.trim();
    if (!title) {
      showNotice("Escribe un título para el módulo.");
      return;
    }

    const nextId = Math.max(0, ...modules.map((module) => module.id)) + 1;
    setModules((current) => [...current, { id: nextId, title }]);
    setOpenModules((current) => [...current, nextId]);
    setSelectedModuleId(nextId);
    setCreateModuleTitle("");
    setCreateModuleOpen(false);
    showNotice(status === "Publicado" ? "Módulo publicado." : "Módulo guardado como borrador.");
  };

  const selectContentType = (type: "file" | "activity" | "quiz" | "link") => {
    setAddContentOpen(false);

    if (type === "file") {
      setUploadOpen(true);
      return;
    }

    if (type === "link") {
      setLinkOpen(true);
      return;
    }

    const moduleId = selectedModuleId ?? modules[0]?.id;
    const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : "";

    if (type === "activity") {
      router.push(`/docente/cursos/${course.id}/crear-actividad${query}`);
      return;
    }

    router.push(`/docente/cursos/${course.id}/crear-evaluacion${query}`);
  };

  const addLocalContent = (type: ContentType, title: string, file?: string) => {
    const moduleId = selectedModuleId ?? modules[0]?.id;
    if (!moduleId) return;
    const currentModuleContents = contents.filter((content) => content.moduleId === moduleId);
    const maxOrder = Math.max(0, ...currentModuleContents.map((content) => content.order));
    const nextId = Math.max(0, ...contents.map((content) => content.id)) + 1;

    setContents((current) => [
      ...current,
      {
        id: nextId,
        moduleId,
        order: maxOrder + 1,
        title,
        type,
        file,
        status: "Borrador",
      },
    ]);
    setOpenModules((current) => current.includes(moduleId) ? current : [...current, moduleId]);
    showNotice("Contenido agregado como borrador.");
  };

  const handleFileSubmit = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type: ContentType = extension === "pdf" ? "pdf" : extension === "ppt" || extension === "pptx" ? "ppt" : extension === "doc" || extension === "docx" ? "word" : extension === "mp4" || extension === "webm" || extension === "mov" ? "video" : "link";
    const safeTitle = file.name.replace(/\.[^.]+$/, "");
    const previewUrl = URL.createObjectURL(file);
    addLocalContent(type, safeTitle, type === "link" ? undefined : previewUrl);
    setUploadOpen(false);
  };

  const handleLinkSubmit = (title: string, url: string) => {
    addLocalContent("link", title, url);
    setLinkOpen(false);
  };

  const deleteContent = (contentId: number) => {
    setContents((current) => current.filter((content) => content.id !== contentId));
    showNotice("Contenido eliminado.");
  };

  const tabs = [
    { label: "Contenido de curso", active: true },
    { label: "Clases", active: false },
    { label: "Foro", active: false },
    { label: "Anuncios", active: false },
    { label: "Asistencia", active: false },
  ];

  return (
    <div className="min-h-screen px-3 py-4 lg:px-5">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/docente/cursos" className="mb-2 flex w-fit items-center gap-1.5 text-[11px] font-medium text-gray-700 transition hover:text-[#3186d8]">
          <BackIcon />
          Volver a cursos
        </Link>

        <div className="relative h-[150px] overflow-hidden rounded-t-xl">
          <img src={course.imagen} alt={course.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <h1 className="absolute bottom-7 left-4 text-[31px] font-bold tracking-[-0.8px] text-white">{course.nombre}</h1>
        </div>

        <div className="flex flex-wrap border-b border-[#9ca3ad] bg-[#eef2f8]">
          <div className="flex flex-wrap border-b border-[#9ca3ad] bg-[#eef2f8]">

            <button
              type="button"
              onClick={() => {}}
              className="border-b-[3px] border-black px-3 py-2 text-[10px] font-medium text-gray-900"
            >
              Contenido de curso
            </button>

            <Link
              href={`/docente/cursos/${course.id}/clases`}
              className="px-3 py-2 text-[10px] text-gray-700 transition hover:text-black"
            >
              Clases
            </Link>

            <Link
              href={`/docente/cursos/${course.id}/foro`}
              className="px-3 py-2 text-[10px] text-gray-700 transition hover:text-black"
            >
              Foro
            </Link>

            <Link
              href={`/docente/cursos/${course.id}/anuncios`}
              className="px-3 py-2 text-[10px] text-gray-700 transition hover:text-black"
            >
              Anuncios
            </Link>

            <Link
              href={`/docente/cursos/${course.id}/asistencia`}
              className="border-b-[3px] border-black px-3 py-2 text-[10px] font-medium"
            >
              Asistencia
            </Link>

          </div>
        </div>

        <div className="flex flex-col gap-5 py-4 lg:flex-row">
          <section className="min-w-0 flex-1">
            <div className="rounded-xl bg-white p-2 shadow-[0_1px_5px_rgba(15,36,61,0.08)] sm:p-3">
              <div className="flex justify-end pb-2">
                <button type="button" onClick={() => setCreateModuleOpen(true)} className="flex h-8 items-center gap-1.5 rounded-md bg-[#3186d8] px-3 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#2777c1]">
                  <PlusIcon />
                  Agregar módulo
                </button>
              </div>

              <div className="space-y-1.5">
                {modulesWithContents.map((module, index) => {
                  const open = openModules.includes(module.id);
                  const color = moduleColors[index % moduleColors.length];

                  return (
                    <div key={module.id} className="overflow-hidden rounded-lg">
                      <button type="button" onClick={() => toggleModule(module.id)} className="flex min-h-[31px] w-full items-center gap-2 px-3 text-left transition hover:brightness-[0.98]" style={{ backgroundColor: color }}>
                        <span className="flex-1 text-[10px] font-semibold text-[#173f63]">Modulo {module.id}: {module.title}</span>
                        <ChevronIcon open={open} />
                      </button>

                      {open && (
                        <div className="bg-white">
                          {module.contents.map((content) => {
                            const contentHref =
                              content.type === "activity"
                                ? `/docente/cursos/${course.id}/actividades/${content.id}`
                                : content.type === "quiz"
                                  ? `/docente/cursos/${course.id}/evaluaciones/${content.id}`
                                  : `/docente/cursos/${course.id}/contenido/${content.id}`;

                            return (
                              <div
                                key={content.id}
                                className="group flex min-h-[31px] items-center gap-2 border-b border-[#eff2f5] px-3"
                              >
                                <Link
                                  href={contentHref}
                                  className="flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 text-left hover:bg-[#f6faff]"
                                  title={`Abrir ${content.title}`}
                                >
                                  <CourseContentIcon
                                    type={content.type}
                                    className="h-4 w-4 shrink-0 text-[#667482]"
                                  />

                                  <span className="min-w-0 flex-1 truncate text-[10px] text-gray-800">
                                    {module.id}.{content.order} {content.title}
                                  </span>
                                </Link>

                                <span
                                  className={`flex h-4 min-w-[53px] shrink-0 items-center justify-center rounded-[4px] px-1 text-[7px] font-medium ${
                                    content.status === "Publicado"
                                      ? "bg-[#c9ecc9] text-[#5eb36a]"
                                      : "bg-[#d59af5] text-white"
                                  }`}
                                >
                                  {content.status}
                                </span>

                                <DottedMenu
                                  onEdit={() =>
                                    showNotice(`Editar: ${content.title}`)
                                  }
                                  onDelete={() => deleteContent(content.id)}
                                />
                              </div>
                            );
                          })}

                          <button type="button" onClick={() => { setSelectedModuleId(module.id); setAddContentOpen(true); }} className="flex w-full items-center gap-1 px-3 py-1.5 text-[9px] font-medium text-[#3186d8] hover:bg-[#f6faff]">
                            <PlusIcon />
                            Agregar contenido
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <TeacherCourseInfo course={course} />
        </div>
      </div>

      {notice && <div className="fixed bottom-5 right-5 z-[120] rounded-lg bg-[#163f66] px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">{notice}</div>}

      <CreateModuleModal open={createModuleOpen} value={createModuleTitle} onChange={setCreateModuleTitle} onClose={() => setCreateModuleOpen(false)} onSave={saveModule} />
      <AddContentModal open={addContentOpen} onClose={() => setAddContentOpen(false)} onSelect={selectContentType} />
      <UploadFileModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSubmit={handleFileSubmit} />
      <AddLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} onSubmit={handleLinkSubmit} />
    </div>
  );
}
