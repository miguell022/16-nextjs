import { NextResponse } from "next/server";
import { PrismaClient } from "@/src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { updateConsoleSchema } from "@/src/lib/validations/console";
import { deleteManagedAsset } from "@/src/lib/blob";
import { stackServerApp } from "@/stack/server";

const prisma = new PrismaClient({
  // Prisma usa este adapter para ejecutar updates/deletes en Neon.
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

  // En Next 16 el parametro dinamico puede llegar como Promise.
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  try {
    const existingConsole = await prisma.console.findUnique({
      where: { id },
      select: { image: true },
    });

    // Elimina solo la consola cuyo id llega en la URL /api/consoles/[id].
    // Aqui Prisma elimina la consola directamente en la base de datos.
    await prisma.console.delete({ where: { id } });

    const previousImage = existingConsole?.image;

    if (previousImage) {
      try {
        await deleteManagedAsset(previousImage);
      } catch (deleteError) {
        console.error("[API] No se pudo borrar la imagen de la consola:", deleteError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] Error al eliminar consola:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la consola" },
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
    const parsed = updateConsoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // En edicion reutilizamos el mismo esquema para mantener reglas consistentes.
    // Aqui Prisma actualiza la consola existente en Neon.
    const consoleItem = await prisma.console.update({
      where: { id },
      data: {
        name: data.name,
        manufacturer: data.manufacturer,
        releaseDate: new Date(data.releaseDate),
        image: data.image || "no-image.png",
        description: data.description,
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, console: consoleItem });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una consola con ese nombre" },
        { status: 409 }
      );
    }

    console.error("[API] Error al editar consola:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la consola" },
      { status: 500 }
    );
  }
}
