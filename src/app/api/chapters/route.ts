import { auth } from "@/auth";
import { db } from "@/db";
import { chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId requerido" }, { status: 400 });

  const result = await db
    .select()
    .from(chapters)
    .where(eq(chapters.projectId, projectId))
    .orderBy(chapters.order);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { projectId, title, order } = body;
  if (!projectId || !title) return NextResponse.json({ error: "projectId y título requeridos" }, { status: 400 });

  const newChapter = await db
    .insert(chapters)
    .values({ id: nanoid(), projectId, title, order: order ?? 0 })
    .returning();

  return NextResponse.json(newChapter[0], { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, title } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updated = await db
    .update(chapters)
    .set({ title })
    .where(eq(chapters.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await db.delete(chapters).where(eq(chapters.id, id));
  return NextResponse.json({ success: true });
}