import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/src/generated/prisma";
import { stackServerApp } from "@/stack/server";
import { redirect, notFound } from "next/navigation";
import SideBar from "@/components/SideBar";
import EditConsoleForm from "@/components/EditConsoleForm";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  }),
});

export default async function EditConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/");
  }

  const { id } = await params;
  const consoleId = Number(id);

  if (!Number.isInteger(consoleId) || consoleId <= 0) {
    return notFound();
  }

  const consoleItem = await prisma.console.findUnique({
    where: { id: consoleId },
  });

  if (!consoleItem) {
    return notFound();
  }

  const existingConsole = consoleItem;

  return (
    <SideBar currentPath="/consoles">
      <div className="p-4 mx-auto mt-16">
        <EditConsoleForm consoleItem={existingConsole} />
      </div>
    </SideBar>
  );
}
