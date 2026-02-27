import { auth } from "@/auth";
import { db } from "@/db";
import { projects, chapters, scenes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId requerido" }, { status: 400 });

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  const projectChapters = await db.select().from(chapters).where(eq(chapters.projectId, projectId)).orderBy(asc(chapters.order));

  const chaptersWithScenes = await Promise.all(
    projectChapters.map(async (chapter) => {
      const chapterScenes = await db.select().from(scenes).where(eq(scenes.chapterId, chapter.id)).orderBy(asc(scenes.order));
      return { ...chapter, scenes: chapterScenes };
    })
  );

  return NextResponse.json({ project, chapters: chaptersWithScenes });
}