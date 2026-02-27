import { auth } from "@/auth";
import { db } from "@/db";
import { userProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = session.user.id;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  let [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));

  // Crear perfil si no existe
  if (!profile) {
    const [newProfile] = await db
      .insert(userProfiles)
      .values({ id: nanoid(), userId })
      .returning();
    profile = newProfile;
  }

  return NextResponse.json({ user, profile });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const { name, bio, website, location } = body;

  // Actualizar nombre en users
  if (name !== undefined) {
    await db.update(users).set({ name }).where(eq(users.id, userId));
  }

  // Actualizar o crear perfil
  const [existing] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));

  if (existing) {
    await db.update(userProfiles).set({ bio, website, location, updatedAt: new Date() }).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ id: nanoid(), userId, bio, website, location });
  }

  return NextResponse.json({ success: true });
}