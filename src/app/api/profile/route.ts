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
  const { name, bio, website, location, avatar } = body;

  if (name !== undefined) {
    await db.update(users).set({ name }).where(eq(users.id, userId));
  }

  const [existing] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (bio !== undefined) updateData.bio = bio;
  if (website !== undefined) updateData.website = website;
  if (location !== undefined) updateData.location = location;
  if (avatar !== undefined) updateData.avatar = avatar;

  if (existing) {
    await db.update(userProfiles).set(updateData).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ id: nanoid(), userId, bio, website, location, avatar });
  }

  return NextResponse.json({ success: true });
}