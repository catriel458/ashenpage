import { auth } from "@/auth";
import { db } from "@/db";
import { places } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId requerido" }, { status: 400 });

  const result = await db.select().from(places).where(eq(places.projectId, projectId));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { projectId, name, description, atmosphere, notes } = body;
  if (!projectId || !name) return NextResponse.json({ error: "projectId y nombre requeridos" }, { status: 400 });

  const newPlace = await db.insert(places).values({ id: nanoid(), projectId, name, description, atmosphere, notes }).returning();
  return NextResponse.json(newPlace[0], { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, name, description, atmosphere, notes } = body;
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updated = await db.update(places).set({ name, description, atmosphere, notes }).where(eq(places.id, id)).returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await db.delete(places).where(eq(places.id, id));
  return NextResponse.json({ success: true });
}