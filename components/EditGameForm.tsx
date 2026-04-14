"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import { updateGameSchema } from "@/src/lib/validations/game";

type Game = {
  id: number;
  cover: string;
  title: string;
  price: number;
  developer: string;
  console_id: number;
  console?: { id: number; name: string };
};

type Console = {
  id: number;
  name: string;
};

export default function EditGameForm({
  game,
  consoles = [],
}: {
  game: Game;
  consoles?: Console[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>(
    !game.cover || game.cover === "no-image.png" ? "no-image.png" : game.cover
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentImage =
    !coverUrl || coverUrl === "no-image.png"
      ? "/img/no-image.png"
      : coverUrl.startsWith("/img/")
        ? coverUrl
        : `/img/games/${coverUrl}`;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "games");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir la imagen");
      }

      setCoverUrl(data.url);
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      developer: String(formData.get("developer") || ""),
      price: String(formData.get("price") || ""),
      console_id: String(formData.get("console_id") || ""),
      cover: coverUrl,
    };

    try {
      // Validamos el payload del formulario antes de enviarlo al endpoint PUT.
      const parsed = updateGameSchema.safeParse(payload);

      if (!parsed.success) {
        await Swal.fire({
          icon: "error",
          title: "Formulario invalido",
          text: parsed.error.issues[0]?.message || "Revisa los campos del juego",
          confirmButtonText: "Entendido",
        });
        return;
      }

      // En edicion hacemos lo mismo: mandamos los datos al endpoint API y la API persiste en Neon.
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo actualizar",
          text: data.error || "No se pudo actualizar el juego",
          confirmButtonText: "Entendido",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Juego actualizado",
        text: "Los cambios se guardaron correctamente",
        confirmButtonText: "Aceptar",
      });

      router.push("/games");
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
      <input type="hidden" name="cover" value={coverUrl} />
      <div className="bg-base-200 rounded-xl shadow-2xl p-5 flex gap-6 items-center w-full max-w-3xl border border-base-300">
        <div className="flex flex-col items-center w-48">
          <div
            className="relative cursor-pointer group"
            onClick={handleImageClick}
          >
            <img
              src={preview || currentImage}
              alt={game.title}
              className="rounded-lg object-cover w-40 h-56 border-2 border-base-300 shadow-xl group-hover:opacity-80 transition"
              onError={(e) => {
                e.currentTarget.src = "/img/no-image.png";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-lg">
              <span className="text-white text-lg font-bold">
                {uploading ? "Subiendo..." : "Cambiar foto"}
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

        <div className="flex-1 max-w-lg space-y-4">
          <h2 className="text-2xl font-bold mb-5 text-center">Editar juego</h2>

          <div>
            <label className="block font-semibold">Título</label>
            <input
              className="input input-bordered w-full"
              name="title"
              defaultValue={game.title}
            />
          </div>

          <div>
            <label className="block font-semibold">Consola</label>
            <select
              className="select select-bordered w-full"
              name="console_id"
              defaultValue={game.console_id}
            >
              <option value="" disabled>
                Selecciona una consola
              </option>
              {consoles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold">Precio</label>
            <input
              className="input input-bordered w-full"
              name="price"
              type="number"
              step="0.01"
              defaultValue={game.price}
            />
          </div>

          <div>
            <label className="block font-semibold">Desarrollador</label>
            <input
              className="input input-bordered w-full"
              name="developer"
              defaultValue={game.developer}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={loading || uploading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <Link href="/games" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
