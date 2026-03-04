import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 });

  const filename = `covers/${session.user.id}-${Date.now()}-${file.name.replace(/\s/g, "_")}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}