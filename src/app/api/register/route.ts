import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  // Verificar si el email ya existe
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    id: nanoid(),
    name,
    email,
    password: hashedPassword,
    provider: "credentials",
  });

  return NextResponse.json({ success: true }, { status: 201 });
}