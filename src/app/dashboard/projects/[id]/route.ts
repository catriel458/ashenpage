import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project.length) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(project[0]);
}