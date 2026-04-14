"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { consoleSchema } from "@/src/lib/validations/console";

export default function AddConsoleForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Este estado representa todo el payload que se enviara a la API.
  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    releaseDate: "",
    description: "",
    image: "no-image.png",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let image = form.image;

      if (selectedFile) {
        // Primero subimos la imagen y guardamos solo la URL resultante.
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        uploadData.append("folder", "consoles");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(uploadJson.error || "No se pudo subir la imagen");
          await Swal.fire({
            icon: "error",
            title: "No se pudo subir la imagen",
            text: uploadJson.error || "No se pudo subir la imagen",
            confirmButtonText: "Entendido",
          });
          return;
        }

        image = uploadJson.url;
      }

      // Primera capa: validacion en cliente antes de llamar a la API.
      const parsed = consoleSchema.safeParse({ ...form, image });

      if (!parsed.success) {
        await Swal.fire({
          icon: "error",
          title: "Formulario invalido",
          text: parsed.error.issues[0]?.message || "Revisa los campos de la consola",
          confirmButtonText: "Entendido",
        });
        return;
      }

      // El formulario envia la consola al endpoint API; la API es quien guarda en Neon.
      const res = await fetch("/api/consoles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({
          name: "",
          manufacturer: "",
          releaseDate: "",
          description: "",
          image: "no-image.png",
        });
        setSelectedFile(null);
        setPreview(null);

        await Swal.fire({
          icon: "success",
          title: "Consola agregada",
          text: "La consola se creo correctamente",
          confirmButtonText: "Aceptar",
        });

        router.push("/consoles");
        router.refresh();
      } else {
        setError(data.error || "No se pudo agregar la consola");
        await Swal.fire({
          icon: "error",
          title: "No se pudo agregar",
          text: data.error || "No se pudo agregar la consola",
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
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-base-200 p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Agregar Consola</h2>
        <div className="flex justify-center">
          <div
            className="relative h-40 w-40 cursor-pointer overflow-hidden rounded-xl border-2 border-base-300 shadow-xl"
            onClick={handleImageClick}
          >
            <img
              src={preview || "/img/no-image.png"}
              alt="Preview consola"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
              <span className="text-sm font-bold text-white">Cambiar imagen</span>
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
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Nombre"
        />
        <input
          name="manufacturer"
          value={form.manufacturer}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Fabricante"
        />
        <input
          name="releaseDate"
          value={form.releaseDate}
          onChange={handleChange}
          className="input input-bordered w-full"
          type="date"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
          placeholder="Descripcion"
        />
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Agregando..." : "Agregar"}
        </button>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </form>
    </div>
  );
}
