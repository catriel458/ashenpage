import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

  if (!user?.password) {
    return NextResponse.json({ error: "Esta cuenta no tiene contraseña" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ password: hashed }).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}