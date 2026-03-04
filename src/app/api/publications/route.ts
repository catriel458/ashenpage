import { auth } from "@/auth";
import { db } from "@/db";
import { publications, ratings, publicationComments, users, chapters, scenes } from "@/db/schema";
import { eq, avg, count, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const projectId = searchParams.get("projectId");

  // Obtener una publicación específica con detalle
  if (id) {
    const [pub] = await db
      .select({
        id: publications.id,
        title: publications.title,
        description: publications.description,
        genre: publications.genre,
        publishedAt: publications.publishedAt,
        projectId: publications.projectId,
        userId: publications.userId,
        authorName: users.name,
        authorImage: users.image,
      })
      .from(publications)
      .innerJoin(users, eq(publications.userId, users.id))
      .where(eq(publications.id, id));

    if (!pub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const [ratingData] = await db
      .select({ avg: avg(ratings.stars), count: count(ratings.id) })
      .from(ratings)
      .where(eq(ratings.publicationId, id));

    const pubChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.projectId, pub.projectId))
      .orderBy(chapters.order);

    const pubScenes = await db
      .select()
      .from(scenes)
      .orderBy(scenes.order);

    const chaptersWithScenes = pubChapters.map((ch) => ({
      ...ch,
      scenes: pubScenes.filter((s) => s.chapterId === ch.id),
    }));

    return NextResponse.json({
      ...pub,
      avgRating: ratingData?.avg ? parseFloat(Number(ratingData.avg).toFixed(1)) : null,
      ratingCount: ratingData?.count || 0,
      chapters: chaptersWithScenes,
    });
  }

  // Verificar si un proyecto ya está publicado
  if (projectId) {
    const [pub] = await db
      .select()
      .from(publications)
      .where(eq(publications.projectId, projectId));
    return NextResponse.json(pub || null);
  }

  // Feed completo
  const allPubs = await db
    .select({
      id: publications.id,
      title: publications.title,
      description: publications.description,
      genre: publications.genre,
      publishedAt: publications.publishedAt,
      userId: publications.userId,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(publications)
    .innerJoin(users, eq(publications.userId, users.id))
    .orderBy(desc(publications.publishedAt));

  const pubsWithRatings = await Promise.all(
    allPubs.map(async (pub) => {
      const [ratingData] = await db
        .select({ avg: avg(ratings.stars), count: count(ratings.id) })
        .from(ratings)
        .where(eq(ratings.publicationId, pub.id));
      return {
        ...pub,
        avgRating: ratingData?.avg ? parseFloat(Number(ratingData.avg).toFixed(1)) : null,
        ratingCount: ratingData?.count || 0,
      };
    })
  );

  return NextResponse.json(pubsWithRatings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { projectId, title, description, genre } = await req.json();
  if (!projectId || !title || !genre) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  // Verificar que no esté ya publicado
  const [existing] = await db
    .select()
    .from(publications)
    .where(eq(publications.projectId, projectId));

  if (existing) return NextResponse.json({ error: "Ya publicado" }, { status: 400 });

  const [pub] = await db
    .insert(publications)
    .values({ id: nanoid(), projectId, userId: session.user.id, title, description, genre })
    .returning();

  return NextResponse.json(pub);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const [pub] = await db.select().from(publications).where(eq(publications.id, id));
  if (!pub || pub.userId !== session.user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await db.delete(publications).where(eq(publications.id, id));
  return NextResponse.json({ success: true });
}