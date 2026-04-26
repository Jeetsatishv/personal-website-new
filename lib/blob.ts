/**
 * Thin wrapper around Vercel Blob. The bot uploads any image the user sends
 * (via Telegram) here, gets a public CDN URL back, and either replies to the
 * user with that URL or embeds it into a post's MDX.
 *
 * Auth: reads BLOB_READ_WRITE_TOKEN, which Vercel auto-provisions when you
 * attach a Blob store to the project.
 */

import { put } from "@vercel/blob";

export interface UploadedBlob {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

/**
 * Upload a binary buffer to Vercel Blob.
 *
 * We prefix every upload with `blog/` so the bucket stays organized even if
 * we later add other upload types (resume PDFs, CTF writeups, etc.).
 *
 * `addRandomSuffix: true` means Vercel appends a short random string to the
 * filename so two "screenshot.png" uploads never collide.
 */
export async function uploadImage(args: {
  data: Buffer;
  filename: string;
  contentType?: string;
  pathPrefix?: string;
}): Promise<UploadedBlob> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Attach a Blob store to your Vercel project (Storage → Create → Blob) and redeploy.",
    );
  }

  const safeName = args.filename
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "upload";
  const prefix = args.pathPrefix ?? "blog";
  const key = `${prefix}/${safeName}`;

  const res = await put(key, args.data, {
    access: "public",
    contentType: args.contentType,
    addRandomSuffix: true,
  });

  return {
    url: res.url,
    pathname: res.pathname,
    contentType: args.contentType ?? "application/octet-stream",
    size: args.data.length,
  };
}
