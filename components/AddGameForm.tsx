"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { gameSchema } from "@/src/lib/validations/game";

export default function AddGameForm({
  consoles,
}: {
  consoles: { id: number; name: string }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    developer: "",
    price: "",
    genre: "",
    description: "",
    releaseDate: "",
    cover: "no-image.png",
    console_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((current) => ({
      ...current,
      [e.target.name]: undefined,
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

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
      setError("");

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

      setForm((prev) => ({
        ...prev,
        cover: data.url,
      }));
    } catch (error) {
      console.error(error);
      setError("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      // Primera capa: validacion en cliente antes de llamar a la API.
      const parsed = gameSchema.safeParse(form);

      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }

      // El formulario no guarda directo en la BD: envia el payload al endpoint /api/games.
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({
          title: "",
          developer: "",
          price: "",
          genre: "",
          description: "",
          releaseDate: "",
          cover: "no-image.png",
          console_id: "",
        });
        setPreview(null);
        setFieldErrors({});

        await Swal.fire({
          icon: "success",
          title: "Juego agregado",
          text: "El juego se creo correctamente",
          confirmButtonText: "Aceptar",
        });

        router.push("/games");
        router.refresh();
      } else {
        setError(data.error || "No se pudo agregar el juego");
        await Swal.fire({
          icon: "error",
          title: "No se pudo agregar",
          text: data.error || "No se pudo agregar el juego",
          confirmButtonText: "Entendido",
        });
      }
    } catch {
      setError("Error de red");
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
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <form onSubmit={handleSubmit} noValidate className="mt-4 w-full max-w-4xl space-y-4 sm:mt-10">
        <div className="bg-base-200 rounded-xl shadow-2xl p-4 flex flex-col gap-6 items-center w-full border border-base-300 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-center w-full lg:w-56">
            <h2 className="text-2xl font-bold mb-5 text-center sm:text-3xl sm:mb-6">Agregar Juego</h2>

            <div
              className="relative h-56 w-40 cursor-pointer overflow-hidden rounded-xl border-2 border-base-300 shadow-xl sm:h-64 sm:w-48"
              onClick={handleImageClick}
            >
              <img
                src={preview || (form.cover === "no-image.png" ? "/img/no-image.png" : form.cover)}
                alt="Preview juego"
                className="h-full w-full object-cover"
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

          <div className="w-full flex-1 space-y-3 sm:max-w-xl sm:space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${fieldErrors.title?.[0] ? "input-error" : ""}`}
                  placeholder="Titulo"
                />
                {fieldErrors.title?.[0] && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.title[0]}</p>
                )}
              </div>

              <div>
                <input
                  name="developer"
                  value={form.developer}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${fieldErrors.developer?.[0] ? "input-error" : ""}`}
                  placeholder="Desarrollador"
                />
                {fieldErrors.developer?.[0] && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.developer[0]}</p>
                )}
              </div>

              <div>
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${fieldErrors.price?.[0] ? "input-error" : ""}`}
                  placeholder="Precio"
                  type="number"
                  min="0"
                  step="0.01"
                />
                {fieldErrors.price?.[0] && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.price[0]}</p>
                )}
              </div>

              <div>
                <input
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${fieldErrors.genre?.[0] ? "input-error" : ""}`}
                  placeholder="Genero"
                />
                {fieldErrors.genre?.[0] && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.genre[0]}</p>
                )}
              </div>

              <div>
                <input
                  name="releaseDate"
                  value={form.releaseDate}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${fieldErrors.releaseDate?.[0] ? "input-error" : ""}`}
                  type="date"
                />
                {fieldErrors.releaseDate?.[0] && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.releaseDate[0]}</p>
                )}
              </div>

              <div>
                <select
                  name="console_id"
                  value={form.console_id}
                  onChange={handleChange}
                  className={`select select-bordered w-full ${fieldErrors.console_id?.[0] ? "select-error" : ""}`}
                >
                  <option value="">Selecciona una consola</option>
                  {consoles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.console_id?.[0] && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.console_id[0]}</p>
                )}
              </div>
            </div>

            <div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={`textarea textarea-bordered w-full min-h-24 sm:min-h-28 ${fieldErrors.description?.[0] ? "textarea-error" : ""}`}
                placeholder="Descripcion"
              />
              {fieldErrors.description?.[0] && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.description[0]}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
            {loading ? "Agregando..." : "Agregar"}
          </button>
        </div>

        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </form>
    </div>
  );
}
