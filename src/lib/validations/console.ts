import { z } from "zod";

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `El campo ${label} es obligatorio`);

// Esquema reutilizable para crear consolas desde formulario y API.
export const consoleSchema = z.object({
  name: requiredText("nombre"),
  manufacturer: requiredText("fabricante"),
  releaseDate: requiredText("fecha de lanzamiento"),
  description: requiredText("descripcion"),
  image: z.string().trim().default("no-image.png"),
});

// En editar usamos los mismos campos del formulario actual.
export const updateConsoleSchema = consoleSchema;

export type ConsoleInput = z.infer<typeof consoleSchema>;
export type UpdateConsoleInput = z.infer<typeof updateConsoleSchema>;
