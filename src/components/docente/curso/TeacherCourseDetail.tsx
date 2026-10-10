"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { courses, type Course } from "@/data/courses";
import type { ContentType } from "@/data/courseContents";
import { API_URL } from "@/lib/api";
import CourseContentIcon from "@/components/common/contenido/CourseContentIcon";
import TeacherCourseInfo from "./TeacherCourseInfo";
import CreateModuleModal from "./modals/CreateModuleModal";
import AddContentModal from "./modals/AddContentModal";
import UploadFileModal from "./modals/UploadFileModal";
import AddLinkModal from "./modals/AddLinkModal";

import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type TeacherCourseDetailProps = {
  courseId: number;
};

type LocalModule = {
  id: number;
  number: number;
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

function DottedMenu({ onEdit, onDelete, onPublish, status, disabled }: { onEdit: () => void; onDelete: () => void; onPublish: () => void; status: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((value) => !value)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#58708d] hover:bg-[#eef5fb]" aria-label="Acciones del contenido">
        <MoreIcon />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-[40] cursor-default" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-[50] w-40 whitespace-nowrap rounded-md border border-[#e0e5eb] bg-white py-1 shadow-lg">
            <button type="button" onClick={() => { setOpen(false); onPublish(); }} className="block w-full px-3 py-1.5 text-left text-[10px] text-gray-700 hover:bg-[#f4f8fc]">{status === "Borrador" ? "Publicar" : "Volver a borrador"}</button>
            <button type="button" onClick={() => { setOpen(false); onEdit(); }} className="block w-full px-3 py-1.5 text-left text-[10px] text-gray-700 hover:bg-[#f4f8fc]">Editar</button>
            <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="block w-full px-3 py-1.5 text-left text-[10px] text-red-600 hover:bg-red-50">Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}

type ModuleResponse = {
  curso: { id: string; nombre: string; codigo: string; imagen: string | null };
  modulos: { id: string; numero: number; titulo: string; contenidos: {
    id: string; titulo: string; tipo: string; orden: number; rutaArchivo: string | null;
    urlEnlace: string | null; estado: "Publicado" | "Borrador";
  }[] }[];
};

const contentTypes: Record<string, ContentType> = {
  pdf: "pdf", docx: "word", pptx: "ppt", video: "video", enlace: "link",
  actividad: "activity", evaluacion: "quiz",
};

export default function TeacherCourseDetail({ courseId }: TeacherCourseDetailProps) {
  const router = useRouter();
  const [course, setCourse] = useState<Course>(() => ({
    ...(courses.find(item => item.id === courseId) ?? { alumnos: 0, actividades: 0, evaluaciones: 0, progreso: 0, accent: "#54d6d8" }),
    id: courseId, nombre: "", codigo: "", imagen: "",
  }));
  const [modules, setModules] = useState<LocalModule[]>([]);
  const [contents, setContents] = useState<LocalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [openModules, setOpenModules] = useState<number[]>([]);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [createModuleTitle, setCreateModuleTitle] = useState("");
  const [savingModule, setSavingModule] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<LocalContent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API_URL}/cursos/${courseId}/modulos`, { credentials: "include", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "No se pudo cargar el curso.");
        if (controller.signal.aborted) return;
        const result = data as ModuleResponse;
        setCourse(current => ({ ...current, id: Number(result.curso.id), nombre: result.curso.nombre,
          codigo: result.curso.codigo, imagen: result.curso.imagen ?? "" }));
        setModules(result.modulos.map(module => ({ id: Number(module.id), number: module.numero, title: module.titulo })));
        setContents(result.modulos.flatMap(module => module.contenidos.map(content => ({
          id: Number(content.id), moduleId: Number(module.id), order: content.orden, title: content.titulo,
          type: contentTypes[content.tipo] ?? "pdf", status: content.estado,
          file: content.tipo === "enlace" ? content.urlEnlace ?? undefined : content.rutaArchivo ?? undefined,
        }))));
        const first = result.modulos[0];
        if (revision === 0) {
          setOpenModules(first ? [Number(first.id)] : []);
          setSelectedModuleId(first ? Number(first.id) : null);
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "No se pudo cargar el curso.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [courseId, revision]);

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

  const saveModule = async () => {
    if (savingModule) return;
    const title = createModuleTitle.trim();
    if (!title) {
      showNotice("Escribe un título para el módulo.");
      return;
    }

    setSavingModule(true);
    try {
      const response = await fetch(`${API_URL}/cursos/${courseId}/modulos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: title }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "No se pudo guardar el módulo.");
      const module = data.modulo;
      const id = Number(module.id);
      setModules(current => [...current, { id, number: module.numero, title: module.titulo }]);
      setOpenModules(current => [...current, id]);
      setSelectedModuleId(id);
      setCreateModuleTitle("");
      setCreateModuleOpen(false);
      showNotice("Módulo publicado.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo guardar el módulo.");
    } finally {
      setSavingModule(false);
    }
  };

  const deleteModule = async (module: LocalModule) => {
    if (deletingModuleId !== null) return;
    if (!window.confirm(
      `¿Eliminar definitivamente el módulo "${module.title}" y todos sus contenidos?\n\n` +
      "Se eliminarán sus documentos, videos, actividades y evaluaciones, " +
      "incluidos los archivos asociados y los datos académicos vinculados que correspondan.\n\n" +
      "Esta acción no se puede deshacer."
)) return;
    setDeletingModuleId(module.id);
    try {
      const response = await fetch(`${API_URL}/cursos/${courseId}/modulos/${module.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "No se pudo eliminar el módulo.");
      setModules(current => current.filter(item => item.id !== module.id));
      setContents(current => current.filter(item => item.moduleId !== module.id));
      setOpenModules(current => current.filter(id => id !== module.id));
      setSelectedModuleId(current => current === module.id ? null : current);
      showNotice(data.message ?? "Módulo y contenidos eliminados.");
      if (data.archivosPendientes?.length) {
        window.alert(
          data.message +
          "\n\nArchivos pendientes:\n" +
          data.archivosPendientes.join("\n")
  );
}
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo eliminar el módulo.");
    } finally {
      setDeletingModuleId(null);
    }
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

  const handleFileSubmit = async (file: File) => {
    const moduleId = selectedModuleId;
    if (!moduleId) throw new Error("Selecciona un módulo para subir el archivo.");
    const body = new FormData();
    body.append("archivo", file);
    const response = await fetch(`${API_URL}/cursos/${courseId}/modulos/${moduleId}/archivo`, {
      method: "POST", credentials: "include", body,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? "No se pudo subir el archivo.");
    setUploadOpen(false);
    setRevision(value => value + 1);
    showNotice("Archivo guardado como borrador.");
  };

  const handleLinkSubmit = (title: string, url: string) => {
    addLocalContent("link", title, url);
    setLinkOpen(false);
  };

  const updateContent = async (contentId: number, changes: { titulo?: string; estado?: string }, deleting = false) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/cursos/${courseId}/contenidos/${contentId}`, {
        method: deleting ? "DELETE" : "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "No se pudo guardar el cambio.");
      setContents(current => deleting ? current.filter(content => content.id !== contentId) : current.map(content => content.id === contentId ? { ...content, title: data.contenido.titulo, status: data.contenido.estado } : content));
      showNotice(deleting ? "Contenido eliminado." : "Cambio guardado.");
    } finally { setSaving(false); }
  };

  const deleteContent = async (content: LocalContent) => {
    if (!window.confirm(`¿Eliminar "${content.title}" del curso?`)) return;
    try { await updateContent(content.id, {}, true); }
    catch (error) { showNotice(error instanceof Error ? error.message : "No se pudo eliminar."); }
  };

  const publishContent = async (content: LocalContent) => {
    try { await updateContent(content.id, { estado: content.status === "Borrador" ? "Publicado" : "Borrador" }); }
    catch (error) { showNotice(error instanceof Error ? error.message : "No se pudo cambiar el estado."); }
  };

  if (loading || loadError) return <div className="min-h-screen px-3 py-4 lg:px-5"><div className="mx-auto max-w-[1000px]">
    <Link href="/docente/cursos" className="text-[11px] text-gray-700">Volver a cursos</Link>
    <p role={loadError ? "alert" : "status"} className="mt-4 text-[12px] text-gray-600">{loadError || "Cargando curso..."}</p>
  </div></div>;

  return (
    <div className="min-h-screen px-3 py-4 lg:px-5">
      <div className="mx-auto max-w-[1000px]">
        <Link href="/docente/cursos" className="mb-2 flex w-fit items-center gap-1.5 text-[11px] font-medium text-gray-700 transition hover:text-[#3186d8]">
          <BackIcon />
          Volver a cursos
        </Link>

        <CourseHeader
          courseId={courseId}
          nombre={course.nombre}
          imagen={course.imagen}
          fetchIfMissing={false}
        />

        <CourseTabs role="docente" courseId={courseId} active="contenido" />

        <div className="flex flex-col gap-5 py-4 xl:flex-row">
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
                    <div key={module.id} className="rounded-lg">
                      <div className="flex items-center" style={{ backgroundColor: color }}>
                      <button type="button" onClick={() => toggleModule(module.id)} className="flex min-h-[31px] min-w-0 flex-1 items-center gap-2 px-3 text-left transition hover:brightness-[0.98]" aria-expanded={open}>
                        <span className="flex-1 text-[10px] font-semibold text-[#173f63]">Modulo {module.number}: {module.title}</span>
                        <ChevronIcon open={open} />
                      </button>
                      <button type="button" disabled={deletingModuleId !== null} onClick={() => void deleteModule(module)} aria-label={`Eliminar módulo ${module.title}`} className="shrink-0 px-3 py-2 text-[10px] font-semibold text-[#173f63] hover:bg-white/20 disabled:opacity-50">
                        Eliminar
                      </button>
                      </div>

                      {open && (
                        <div className="bg-white">
                          {module.contents.map((content, contentIndex) => {
                            const contentType = (content.type as string)?.toLowerCase();
                            const externalUrl = content.file;

                            // Comprobar si el ítem debe abrirse como enlace externo
                            const isExternalLink =
                              contentType === "link" ||
                              contentType === "url" ||
                              Boolean(externalUrl && (externalUrl.startsWith("http://") || externalUrl.startsWith("https://")));

                            const contentHref =
                              content.type === "activity"
                                ? `/docente/cursos/${course.id}/actividades/${content.id}`
                                : content.type === "quiz"
                                  ? `/docente/cursos/${course.id}/evaluaciones/${content.id}`
                                  : `/docente/cursos/${course.id}/contenido/${content.id}`;

                            const linkContent = (
                              <>
                                <CourseContentIcon
                                  type={content.type}
                                  className="h-4 w-4 shrink-0 text-[#667482]"
                                />
                                <span className="min-w-0 flex-1 truncate text-[10px] text-gray-800">
                                  {module.number}.{contentIndex + 1} {content.title}
                                </span>
                              </>
                            );

                            return (
                              <div
                                key={content.id}
                                className="group flex min-h-[31px] items-center gap-2 border-b border-[#eff2f5] px-3"
                              >
                                {isExternalLink && externalUrl ? (
                                  <a
                                    href={externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 text-left hover:bg-[#f6faff]"
                                    title={`Abrir ${content.title} en nueva pestaña`}
                                  >
                                    {linkContent}
                                  </a>
                                ) : (
                                  <Link
                                    href={contentHref}
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 text-left hover:bg-[#f6faff]"
                                    title={`Abrir ${content.title}`}
                                  >
                                    {linkContent}
                                  </Link>
                                )}

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
                                  disabled={saving}
                                  status={content.status}
                                  onPublish={() => void publishContent(content)}
                                  onEdit={() => { setEditing(content); setEditTitle(content.title); setEditError(""); }}
                                  onDelete={() => void deleteContent(content)}
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

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[120] rounded-lg bg-[#163f66] px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">{notice}</div>}
      {editing && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4">
        <form role="dialog" aria-modal="true" aria-labelledby="edit-content-title" className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl" onSubmit={async event => {
          event.preventDefault();
          if (saving) return;
          setEditError("");
          try { await updateContent(editing.id, { titulo: editTitle }); setEditing(null); }
          catch (error) { setEditError(error instanceof Error ? error.message : "No se pudo guardar."); }
        }}>
          <h2 id="edit-content-title" className="mb-4 text-lg font-semibold text-[#3186d8]">Editar contenido</h2>
          <label htmlFor="content-title" className="text-sm">Título</label>
          <input autoFocus id="content-title" required maxLength={200} disabled={saving} value={editTitle} onChange={event => setEditTitle(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm" />
          {editError && <p role="alert" className="mt-2 text-sm text-red-600">{editError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-md bg-[#efe6fa] px-3 py-2 text-sm">Cancelar</button>
            <button disabled={saving} className="rounded-md bg-[#3186d8] px-3 py-2 text-sm text-white">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>}

      <CreateModuleModal open={createModuleOpen} value={createModuleTitle} saving={savingModule} onChange={setCreateModuleTitle} onClose={() => setCreateModuleOpen(false)} onSave={saveModule} />
      <AddContentModal open={addContentOpen} onClose={() => setAddContentOpen(false)} onSelect={selectContentType} />
      <UploadFileModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSubmit={handleFileSubmit} />
      <AddLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} onSubmit={handleLinkSubmit} />
    </div>
  );
}
