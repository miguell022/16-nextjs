import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { stackServerApp } from "@/stack/server";
import { deleteManagedAsset } from "@/src/lib/blob";

export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folderValue = String(formData.get("folder") || "games");
    const folder = folderValue === "consoles" ? "consoles" : "games";
    const previousUrl = String(formData.get("previousUrl") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const safeName = file.name.replace(/\s+/g, "-");
    const pathname = `${folder}/${Date.now()}-${safeName}`;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    // En Vercel usamos Blob. En local, si no hay token, guardamos en public/img como fallback.
    if (blobToken) {
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
        token: blobToken,
      });

      if (previousUrl) {
        try {
          await deleteManagedAsset(previousUrl);
        } catch (deleteError) {
          console.error("[UPLOAD] No se pudo borrar la imagen anterior:", deleteError);
        }
      }

      return NextResponse.json({ url: blob.url, pathname: blob.pathname });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "img", folder);
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${Date.now()}-${safeName}`);
    await fs.writeFile(filePath, buffer);

    if (previousUrl) {
      try {
        await deleteManagedAsset(previousUrl);
      } catch (deleteError) {
        console.error("[UPLOAD] No se pudo borrar la imagen anterior:", deleteError);
      }
    }

    const publicUrl = `/img/${folder}/${path.basename(filePath)}`;
    return NextResponse.json({ url: publicUrl, pathname: publicUrl });
  } catch (error) {
    console.error("[UPLOAD] Error al subir imagen:", error);
    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 500 }
    );
  }
}
