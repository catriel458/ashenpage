import { auth } from "@/auth";
import { db } from "@/db";
import { worldRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId requerido" }, { status: 400 });

  const result = await db.select().from(worldRules).where(eq(worldRules.projectId, projectId));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { projectId, category, title, description } = body;
  if (!projectId || !title) return NextResponse.json({ error: "projectId y título requeridos" }, { status: 400 });

  const newRule = await db.insert(worldRules).values({ id: nanoid(), projectId, category, title, description }).returning();
  return NextResponse.json(newRule[0], { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, category, title, description } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updated = await db.update(worldRules).set({ category, title, description }).where(eq(worldRules.id, id)).returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await db.delete(worldRules).where(eq(worldRules.id, id));
  return NextResponse.json({ success: true });
}