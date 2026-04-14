"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { updateConsoleSchema } from "@/src/lib/validations/console";

type Console = {
  id: number;
  name: string;
  image: string;
  manufacturer: string;
  description: string;
  releaseDate: Date | string;
};

export default function EditConsoleForm({ consoleItem }: { consoleItem: Console }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(
    !consoleItem.image || consoleItem.image === "no-image.png"
      ? "no-image.png"
      : consoleItem.image
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const releaseDateValue =
    typeof consoleItem.releaseDate === "string"
      ? consoleItem.releaseDate.slice(0, 10)
      : new Date(consoleItem.releaseDate).toISOString().slice(0, 10);

  const currentImage =
    !imageUrl || imageUrl === "no-image.png"
      ? "/img/no-image.png"
      : imageUrl.startsWith("/img/")
        ? imageUrl
        : `/img/consoles/${imageUrl}`;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "consoles");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la imagen");
      }

      setImageUrl(data.url);
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: "error",
        title: "No se pudo subir la imagen",
        text: "Intenta nuevamente con otra imagen o formato",
        confirmButtonText: "Entendido",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Armamos un payload plano a partir del formulario para validarlo con zod.
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      manufacturer: String(formData.get("manufacturer") || ""),
      releaseDate: String(formData.get("releaseDate") || ""),
      description: String(formData.get("description") || ""),
      image: imageUrl,
    };

    try {
      // Validamos el payload del formulario antes de enviarlo al endpoint PUT.
      const parsed = updateConsoleSchema.safeParse(payload);

      if (!parsed.success) {
        await Swal.fire({
          icon: "error",
          title: "Formulario invalido",
          text: parsed.error.issues[0]?.message || "Revisa los campos de la consola",
          confirmButtonText: "Entendido",
        });
        return;
      }

      // En edicion enviamos el payload al endpoint PUT y la API actualiza la BD.
      const res = await fetch(`/api/consoles/${consoleItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo actualizar",
          text: data.error || "No se pudo actualizar la consola",
          confirmButtonText: "Entendido",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Consola actualizada",
        text: "Los cambios se guardaron correctamente",
        confirmButtonText: "Aceptar",
      });

      router.push("/consoles");
      router.refresh();
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: "error",
        title: "Error de red",
        text: "Ocurrio un problema al conectar con el servidor",
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col items-center justify-center min-h-[70vh] space-y-4"
    >
      <input type="hidden" name="image" value={imageUrl} />

      <div className="bg-base-200 rounded-xl shadow-2xl p-6 flex gap-12 items-center w-full max-w-5xl border border-base-300">
        <div className="flex flex-col items-center w-64">
          <div
            className="relative w-56 h-56 cursor-pointer rounded-xl overflow-hidden border-2 border-base-300 shadow-xl"
            onClick={handleImageClick}
          >
            <img
              src={preview || currentImage}
              alt={consoleItem.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/img/no-image.png";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
              <span className="text-sm font-bold text-white">
                {uploading ? "Subiendo..." : "Cambiar imagen"}
              </span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div className="flex-1 space-y-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Editar consola</h2>

          <div>
            <label className="block font-semibold">Nombre</label>
            <input
              className="input input-bordered w-full"
              name="name"
              defaultValue={consoleItem.name}
            />
          </div>

          <div>
            <label className="block font-semibold">Fabricante</label>
            <input
              className="input input-bordered w-full"
              name="manufacturer"
              defaultValue={consoleItem.manufacturer}
            />
          </div>

          <div>
            <label className="block font-semibold">Fecha de lanzamiento</label>
            <input
              className="input input-bordered w-full"
              name="releaseDate"
              type="date"
              defaultValue={releaseDateValue}
            />
          </div>

          <div>
            <label className="block font-semibold">Descripcion</label>
            <textarea
              className="textarea textarea-bordered w-full min-h-32"
              name="description"
              defaultValue={consoleItem.description}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={loading || uploading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <Link href="/consoles" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
