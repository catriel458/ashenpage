import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  return NextResponse.json(userProjects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, genre } = body;

  if (!title || !genre) {
    return NextResponse.json({ error: "Título y género son requeridos" }, { status: 400 });
  }

  const newProject = await db
    .insert(projects)
    .values({
      id: nanoid(),
      userId: session.user.id,
      title,
      description,
      genre,
    })
    .returning();

  return NextResponse.json(newProject[0], { status: 201 });
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

  await db
    .delete(projects)
    .where(eq(projects.id, id));

  return NextResponse.json({ success: true });
}