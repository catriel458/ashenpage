import { auth } from "@/auth";
import { db } from "@/db";
import { characters, places, worldRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, action, context, tone } = body;

  // Cargar la Biblia del proyecto
  const [projectCharacters, projectPlaces, projectRules] = await Promise.all([
    db.select().from(characters).where(eq(characters.projectId, projectId)),
    db.select().from(places).where(eq(places.projectId, projectId)),
    db.select().from(worldRules).where(eq(worldRules.projectId, projectId)),
  ]);

  // Construir el contexto de la Biblia
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
    continue: `Sos un escritor colaborativo. Continuá la siguiente escena de forma natural, manteniendo el estilo, tono y coherencia con los personajes y el mundo definidos. Escribí entre 150 y 300 palabras. No agregues títulos ni explicaciones, solo el texto narrativo continuando desde donde termina.`,
    improve: `Sos un editor literario. Analizá el siguiente fragmento y sugerí mejoras concretas de ritmo, tensión, estilo o caracterización. Sé específico y constructivo. Respondé en español.`,
    consistency: `Sos un editor de continuidad. Revisá el siguiente fragmento y detectá cualquier inconsistencia con los personajes, lugares o reglas del mundo definidos. Si todo está bien, decilo. Respondé en español.`,
    alternative: `Sos un escritor creativo. Reescribí la siguiente escena de una forma completamente diferente, manteniendo los mismos personajes y eventos pero cambiando el enfoque narrativo, el punto de vista o el tono. Respondé en español.`,
    tension: `Sos un escritor especialista en horror y suspenso. Reescribí o sugerí cómo reescribir el siguiente fragmento para aumentar la tensión y el ritmo sin cambiar los eventos principales. Respondé en español.`,
  };

  const systemPrompt = `Sos un asistente de escritura creativa especializado en horror y ciencia ficción en español. Conocés a fondo el universo de esta historia:

${bibleContext}

Tu trabajo es ayudar al escritor a desarrollar su historia de forma coherente con todo lo que está definido arriba. Siempre escribís en español rioplatense cuando generás texto narrativo.`;

  const userPrompt = `${actions[action] || actions.continue}

TEXTO ACTUAL:
${context}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini error:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Error al generar respuesta", details: String(error) }, { status: 500 });
  }
}