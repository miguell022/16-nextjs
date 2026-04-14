import { NextResponse } from "next/server";
import { PrismaClient } from "@/src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { updateGameSchema } from "@/src/lib/validations/game";
import { stackServerApp } from "@/stack/server";

const prisma = new PrismaClient({
  // Este cliente Prisma tambien usa el adapter de Neon para hablar con PostgreSQL.
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    // Aqui Prisma elimina el juego directamente en la base de datos.
    await prisma.games.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] Error al eliminar:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el juego" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    // La API de edicion usa el mismo criterio de validacion que el formulario.
    const parsed = updateGameSchema.safeParse(body);

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

    // Aqui Prisma actualiza el juego existente en la base de datos de Neon.
    const game = await prisma.games.update({
      where: { id },
      data: {
        title: data.title,
        developer: data.developer,
        price: data.price,
        cover: data.cover || "no-image.png",
        console_id: data.console_id,
      },
      select: { id: true, title: true },
    });

    return NextResponse.json({ ok: true, game });
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

    console.error("[API] Error al editar juego:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el juego" },
      { status: 500 }
    );
  }
}
