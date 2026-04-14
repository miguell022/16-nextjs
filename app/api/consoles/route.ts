import { NextResponse } from "next/server";
import { PrismaClient } from "@/src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { consoleSchema } from "@/src/lib/validations/console";

const prisma = new PrismaClient({
  // El adapter permite que Prisma use la conexion PostgreSQL alojada en Neon.
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Segunda capa: la API valida aunque el frontend ya haya validado.
    const parsed = consoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Prisma recibe datos ya validados y normalizados por zod.
    // Aqui Prisma crea la consola en la tabla console dentro de Neon.
    const consoleItem = await prisma.console.create({
      data: {
        name: data.name,
        manufacturer: data.manufacturer,
        description: data.description,
        releaseDate: new Date(data.releaseDate),
        image: data.image || "no-image.png",
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, console: consoleItem }, { status: 201 });
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

    console.error("[API] Error al crear consola:", error);
    return NextResponse.json(
      { error: "No se pudo crear la consola" },
      { status: 500 }
    );
  }
}
