import { open } from "@tauri-apps/plugin-dialog";
import type { VaultSession } from "@/vault/session";

/**
 * Pick an image from disk and copy it into the vault's attachments/ folder under `baseName`.
 * Returns the vault-relative path + a data URL for immediate display, or null if cancelled.
 * Does NOT commit the person — the caller decides where the relpath goes.
 */
export async function importPhoto(
  session: VaultSession,
  baseName: string,
): Promise<{ rel: string; dataUrl?: string } | null> {
  const src = await open({
    multiple: false,
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"] }],
  });
  if (typeof src !== "string") return null;
  const rel = await session.importAttachment(src, baseName);
  let dataUrl: string | undefined;
  try {
    dataUrl = await session.readAttachment(rel);
  } catch {
    /* the file copied but couldn't be re-read; the relpath still persists */
  }
  return { rel, dataUrl };
}
