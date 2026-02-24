import { auth } from "@/auth";
import { db } from "@/db";
import { scenes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "chapterId requerido" }, { status: 400 });

  const result = await db
    .select()
    .from(scenes)
    .where(eq(scenes.chapterId, chapterId))
    .orderBy(scenes.order);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { chapterId, title, order } = body;
  if (!chapterId || !title) return NextResponse.json({ error: "chapterId y título requeridos" }, { status: 400 });

  const newScene = await db
    .insert(scenes)
    .values({ id: nanoid(), chapterId, title, content: "", order: order ?? 0 })
    .returning();

  return NextResponse.json(newScene[0], { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, title, content } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updated = await db
    .update(scenes)
    .set({ title, content, updatedAt: new Date() })
    .where(eq(scenes.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await db.delete(scenes).where(eq(scenes.id, id));
  return NextResponse.json({ success: true });
}