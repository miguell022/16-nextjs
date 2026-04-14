import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/src/generated/prisma";
import { stackServerApp } from "@/stack/server";
import { redirect, notFound } from "next/navigation";
import SideBar from "@/components/SideBar";
import EditGameForm from "@/components/EditGameForm";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  }),
});

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/");
  }

  const { id } = await params;
  const gameId = Number(id);

  if (!Number.isInteger(gameId) || gameId <= 0) {
    return notFound();
  }

  const game = await prisma.games.findUnique({
    where: { id: gameId },
    include: { console: true },
  });

  if (!game) {
    return notFound();
  }

  const existingGame = game;

  const consoles = await prisma.console.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <SideBar currentPath="/games">
      <div className="p-4 mx-auto mt-16">
        <EditGameForm game={existingGame} consoles={consoles} />
      </div>
    </SideBar>
  );
}
