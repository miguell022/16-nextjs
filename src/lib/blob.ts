import { del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export function isManagedBlobUrl(value: string | null | undefined) {
  if (!value || value === "no-image.png") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.hostname.includes(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function isManagedLocalAsset(value: string | null | undefined) {
  return Boolean(
    value &&
      (value.startsWith("/img/games/") ||
        value.startsWith("/img/consoles/") ||
        value.startsWith("/img/"))
  );
}

export async function deleteManagedAsset(value: string | null | undefined) {
  if (!value || value === "no-image.png") {
    return;
  }

  if (isManagedBlobUrl(value)) {
    await del(value);
    return;
  }

  if (isManagedLocalAsset(value)) {
    const relativePath = value.startsWith("/") ? value.slice(1) : value;
    const absolutePath = path.join(process.cwd(), "public", relativePath.replace(/^img\//, "img/"));

    try {
      await fs.unlink(absolutePath);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
  }
}
