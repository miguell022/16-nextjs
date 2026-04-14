import { z } from "zod";

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `El campo ${label} es obligatorio`);

// Esquema reutilizable para validar el payload completo al crear juegos.
export const gameSchema = z.object({
  title: requiredText("titulo"),
  developer: requiredText("desarrollador"),
  genre: requiredText("genero"),
  description: requiredText("descripcion"),
  releaseDate: requiredText("fecha de lanzamiento"),
  cover: z.string().trim().default("no-image.png"),
  console_id: z.coerce
    .number({ error: "Debes seleccionar una consola valida" })
    .int("Debes seleccionar una consola valida")
    .positive("Debes seleccionar una consola valida"),
  price: z.coerce
    .number({ error: "El precio no es valido" })
    .min(0, "El precio no puede ser negativo"),
});

// En editar solo validamos los campos que realmente se modifican en este formulario.
export const updateGameSchema = z.object({
  title: requiredText("titulo"),
  developer: requiredText("desarrollador"),
  cover: z.string().trim().default("no-image.png"),
  console_id: z.coerce
    .number({ error: "Debes seleccionar una consola valida" })
    .int("Debes seleccionar una consola valida")
    .positive("Debes seleccionar una consola valida"),
  price: z.coerce
    .number({ error: "El precio no es valido" })
    .min(0, "El precio no puede ser negativo"),
});

export type GameInput = z.infer<typeof gameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
