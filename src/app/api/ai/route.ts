import { auth } from "@/auth";
import { db } from "@/db";
import { characters, places, worldRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, action, context, tone } = body;

  const [projectCharacters, projectPlaces, projectRules] = await Promise.all([
    db.select().from(characters).where(eq(characters.projectId, projectId)),
    db.select().from(places).where(eq(places.projectId, projectId)),
    db.select().from(worldRules).where(eq(worldRules.projectId, projectId)),
  ]);

  const bibleContext = `
PERSONAJES:
${projectCharacters.map((c) => `
- ${c.name}${c.age ? `, ${c.age}` : ""}
  Personalidad: ${c.personality || "No definida"}
  Historia: ${c.backstory || "No definida"}
  Miedos: ${c.fears || "No definidos"}
  Motivaciones: ${c.motivations || "No definidas"}
  Voz: ${c.voice || "No definida"}
  ${c.notes ? `Notas: ${c.notes}` : ""}
`).join("") || "No hay personajes definidos."}

LUGARES:
${projectPlaces.map((p) => `
- ${p.name}
  Descripción: ${p.description || "No definida"}
  Atmósfera: ${p.atmosphere || "No definida"}
  ${p.notes ? `Notas: ${p.notes}` : ""}
`).join("") || "No hay lugares definidos."}

REGLAS DEL MUNDO:
${projectRules.map((r) => `
- [${r.category}] ${r.title}: ${r.description || "Sin descripción"}
`).join("") || "No hay reglas definidas."}

TONO Y ESTILO: ${tone || "No definido"}
  `.trim();

  const actions: Record<string, string> = {
    continue: `Continuá la siguiente escena de forma natural, manteniendo el estilo, tono y coherencia con los personajes y el mundo definidos. Escribí entre 150 y 300 palabras. No agregues títulos ni explicaciones, solo el texto narrativo continuando desde donde termina.`,
    improve: `Reescribí el siguiente texto aplicando TODAS las mejoras necesarias: corregí errores ortográficos y de puntuación, mejorá el ritmo narrativo, profundizá las descripciones, ajustá la caracterización para que sea coherente con los personajes definidos, reflejá la atmósfera del lugar, y mejorá la claridad de las frases confusas. Aplicá cada cambio directamente sobre el texto sin explicar nada. Devolvé únicamente el texto reescrito y mejorado, manteniendo la voz del autor.`,
    consistency: `Revisá el siguiente fragmento y detectá cualquier inconsistencia con los personajes, lugares o reglas del mundo definidos. Si todo está bien, decilo.`,
    alternative: `Reescribí la siguiente escena de una forma completamente diferente, manteniendo los mismos personajes y eventos pero cambiando el enfoque narrativo, el punto de vista o el tono.`,
    tension: `Reescribí o sugerí cómo reescribir el siguiente fragmento para aumentar la tensión y el ritmo sin cambiar los eventos principales.`,
  };

  const systemPrompt = `Sos un asistente de escritura creativa especializado en horror y ciencia ficción en español rioplatense. Conocés a fondo el universo de esta historia:

${bibleContext}

Tu trabajo es ayudar al escritor a desarrollar su historia de forma coherente con todo lo definido. Siempre respondés en español rioplatense.`;

  const userPrompt = `${actions[action] || actions.continue}

TEXTO ACTUAL:
${context}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Groq error:", error);
    return NextResponse.json({ error: "Error al generar respuesta", details: String(error) }, { status: 500 });
  }
}