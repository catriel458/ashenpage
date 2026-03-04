import { auth } from "@/auth";
import { db } from "@/db";
import { ratings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { publicationId, stars } = await req.json();
  if (!publicationId || !stars || stars < 1 || stars > 5)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  // Verificar si ya votó
  const [existing] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.publicationId, publicationId), eq(ratings.userId, session.user.id)));

  if (existing) {
    // Actualizar voto existente
    const [updated] = await db
      .update(ratings)
      .set({ stars })
      .where(eq(ratings.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [rating] = await db
    .insert(ratings)
    .values({ id: nanoid(), publicationId, userId: session.user.id, stars })
    .returning();

  return NextResponse.json(rating);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null);

  const { searchParams } = new URL(req.url);
  const publicationId = searchParams.get("publicationId");
  if (!publicationId) return NextResponse.json(null);

  const [rating] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.publicationId, publicationId), eq(ratings.userId, session.user.id)));

  return NextResponse.json(rating || null);
}