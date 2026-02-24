import { auth } from "@/auth";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId requerido" }, { status: 400 });
  }

  const result = await db
    .select()
    .from(characters)
    .where(eq(characters.projectId, projectId));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, name, age, personality, backstory, fears, motivations, voice, notes } = body;

  if (!projectId || !name) {
    return NextResponse.json({ error: "projectId y nombre son requeridos" }, { status: 400 });
  }

  const newCharacter = await db
    .insert(characters)
    .values({
      id: nanoid(),
      projectId,
      name,
      age,
      personality,
      backstory,
      fears,
      motivations,
      voice,
      notes,
    })
    .returning();

  return NextResponse.json(newCharacter[0], { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, age, personality, backstory, fears, motivations, voice, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const updated = await db
    .update(characters)
    .set({ name, age, personality, backstory, fears, motivations, voice, notes })
    .where(eq(characters.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  await db.delete(characters).where(eq(characters.id, id));

  return NextResponse.json({ success: true });
}