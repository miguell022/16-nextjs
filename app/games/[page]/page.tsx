export const dynamic = "force-dynamic";

import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import SideBar from "@/components/SideBar";
import GamesInfo from "@/components/GamesInfo";
import { PrismaClient } from "@/src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import Paginator from "@/components/paginator";

export default async function GamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ search?: string; console?: string }>;
}) {
  const { page: pageParam } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  const search = String(resolvedSearchParams.search || "").trim();
  const selectedConsole = String(resolvedSearchParams.console || "").trim();

  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const where = {
    ...(search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(selectedConsole
      ? {
          console: {
            name: selectedConsole,
          },
        }
      : {}),
  };

  const [games, total, consoles] = await Promise.all([
    prisma.games.findMany({
      orderBy: { id: "desc" },
      include: { console: true },
      where,
      skip,
      take: pageSize,
    }),
    prisma.games.count({ where }),
    prisma.console.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <SideBar currentPath="/games">
      <GamesInfo
        games={games}
        consoles={consoles}
        initialSearch={search}
        initialConsole={selectedConsole}
      />
      <Paginator
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/games"
        cleanUrl
        query={{
          ...(search ? { search } : {}),
          ...(selectedConsole ? { console: selectedConsole } : {}),
        }}
      />
    </SideBar>
  );
}
