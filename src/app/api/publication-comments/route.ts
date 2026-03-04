import { auth } from "@/auth";
import { db } from "@/db";
import { publicationComments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const publicationId = searchParams.get("publicationId");
  if (!publicationId) return NextResponse.json({ error: "publicationId requerido" }, { status: 400 });

  const comments = await db
    .select({
      id: publicationComments.id,
      text: publicationComments.text,
      createdAt: publicationComments.createdAt,
      userId: publicationComments.userId,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(publicationComments)
    .innerJoin(users, eq(publicationComments.userId, users.id))
    .where(eq(publicationComments.publicationId, publicationId))
    .orderBy(desc(publicationComments.createdAt));

  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { publicationId, text } = await req.json();
  if (!publicationId || !text?.trim()) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const [comment] = await db
    .insert(publicationComments)
    .values({ id: nanoid(), publicationId, userId: session.user.id, text: text.trim() })
    .returning();

  const [withAuthor] = await db
    .select({
      id: publicationComments.id,
      text: publicationComments.text,
      createdAt: publicationComments.createdAt,
      userId: publicationComments.userId,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(publicationComments)
    .innerJoin(users, eq(publicationComments.userId, users.id))
    .where(eq(publicationComments.id, comment.id));

  return NextResponse.json(withAuthor);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const [comment] = await db
    .select()
    .from(publicationComments)
    .where(eq(publicationComments.id, id));

  if (!comment || comment.userId !== session.user.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await db.delete(publicationComments).where(eq(publicationComments.id, id));
  return NextResponse.json({ success: true });
}