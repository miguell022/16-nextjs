import { NextResponse } from "next/server";
import { PrismaClient } from "@/src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { gameSchema } from "@/src/lib/validations/game";

const prisma = new PrismaClient({
  // El adapter conecta Prisma con tu base de datos PostgreSQL en Neon usando DATABASE_URL.
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Segunda capa: la API vuelve a validar aunque el frontend ya haya validado.
    const parsed = gameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const consoleExists = await prisma.console.findUnique({
      where: { id: data.console_id },
      select: { id: true },
    });

    if (!consoleExists) {
      return NextResponse.json(
        { error: "La consola seleccionada no existe" },
        { status: 400 }
      );
    }

    // Aqui Prisma inserta el nuevo juego en la tabla Games de Neon.
    const game = await prisma.games.create({
      data: {
        title: data.title,
        developer: data.developer,
        genre: data.genre,
        description: data.description,
        cover: data.cover || "no-image.png",
        releaseDate: new Date(data.releaseDate),
        price: data.price,
        console_id: data.console_id,
      },
      select: { id: true, title: true },
    });

    return NextResponse.json({ ok: true, game }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un juego con ese titulo" },
        { status: 409 }
      );
    }

    console.error("[API] Error al crear juego:", error);

    return NextResponse.json(
      { error: "No se pudo crear el juego" },
      { status: 500 }
    );
  }
}
