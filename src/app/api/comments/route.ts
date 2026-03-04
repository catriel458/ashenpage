import { auth } from "@/auth";
import { db } from "@/db";
import { sceneComments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sceneId = searchParams.get("sceneId");
  if (!sceneId) return NextResponse.json({ error: "sceneId requerido" }, { status: 400 });

  const comments = await db
    .select()
    .from(sceneComments)
    .where(eq(sceneComments.sceneId, sceneId))
    .orderBy(sceneComments.createdAt);

  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { sceneId, text, anchor } = await req.json();
  if (!sceneId || !text || !anchor) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const [comment] = await db
    .insert(sceneComments)
    .values({ id: nanoid(), sceneId, text, anchor })
    .returning();

  return NextResponse.json(comment);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await db.delete(sceneComments).where(eq(sceneComments.id, id));
  return NextResponse.json({ success: true });
}