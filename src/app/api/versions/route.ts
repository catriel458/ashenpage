import { auth } from "@/auth";
import { db } from "@/db";
import { sceneVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sceneId = searchParams.get("sceneId");
  if (!sceneId) return NextResponse.json({ error: "sceneId requerido" }, { status: 400 });

  const versions = await db
    .select()
    .from(sceneVersions)
    .where(eq(sceneVersions.sceneId, sceneId))
    .orderBy(desc(sceneVersions.createdAt))
    .limit(20);

  return NextResponse.json(versions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { sceneId, content } = body;
  if (!sceneId || !content) return NextResponse.json({ error: "sceneId y content requeridos" }, { status: 400 });

  // Guardar versión
  const version = await db
    .insert(sceneVersions)
    .values({ id: nanoid(), sceneId, content })
    .returning();

  // Mantener solo las últimas 20 versiones
  const allVersions = await db
    .select()
    .from(sceneVersions)
    .where(eq(sceneVersions.sceneId, sceneId))
    .orderBy(desc(sceneVersions.createdAt));

  if (allVersions.length > 20) {
    const toDelete = allVersions.slice(20);
    for (const v of toDelete) {
      await db.delete(sceneVersions).where(eq(sceneVersions.id, v.id));
    }
  }

  return NextResponse.json(version[0], { status: 201 });
}