"use client";

import { useState } from "react";

interface Scene {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
}

interface ProjectData {
  project: { title: string; description: string; genre: string };
  chapters: Chapter[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

export default function ExportModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<"pdf" | "txt">("pdf");

  async function fetchData(): Promise<ProjectData> {
    const res = await fetch(`/api/export?projectId=${projectId}`);
    return res.json();
  }

  async function exportTXT() {
    setLoading(true);
    const data = await fetchData();
    let content = `${data.project.title.toUpperCase()}\n`;
    if (data.project.genre) content += `${data.project.genre}\n`;
    content += `\n${"─".repeat(50)}\n\n`;

    for (const chapter of data.chapters) {
      content += `\n${chapter.title.toUpperCase()}\n${"─".repeat(30)}\n\n`;
      for (const scene of chapter.scenes) {
        if (scene.title) content += `${scene.title}\n\n`;
        if (scene.content) content += `${stripHtml(scene.content)}\n\n`;
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.project.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
    onClose();
  }

  async function exportPDF() {
    setLoading(true);
    const data = await fetchData();

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 25;
    const maxW = pageW - margin * 2;
    let y = margin;

    function checkPage(needed: number = 10) {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function addText(text: string, size: number, style: "normal" | "bold" = "normal", color: [number, number, number] = [30, 30, 30]) {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW);
      for (const line of lines) {
        checkPage(size * 0.4 + 2);
        doc.text(line, margin, y);
        y += size * 0.4 + 1;
      }
    }

    // Portada
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(data.project.title, maxW);
    let titleY = pageH / 2 - 20;
    for (const line of titleLines) {
      doc.text(line, pageW / 2, titleY, { align: "center" });
      titleY += 12;
    }
    if (data.project.genre) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(data.project.genre, pageW / 2, titleY + 8, { align: "center" });
    }

    // Contenido
    doc.addPage();
    y = margin;

    for (const chapter of data.chapters) {
      checkPage(20);
      y += 8;
      addText(chapter.title.toUpperCase(), 14, "bold", [20, 20, 20]);
      y += 4;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + maxW, y);
      y += 8;

      for (const scene of chapter.scenes) {
        if (scene.content) {
          checkPage(15);
          if (scene.title) {
            addText(scene.title, 10, "bold", [80, 80, 80]);
            y += 3;
          }
          const plainText = stripHtml(scene.content);
          const paragraphs = plainText.split(/\n+/).filter(p => p.trim());
          for (const para of paragraphs) {
            checkPage(15);
            addText(para, 11, "normal", [30, 30, 30]);
            y += 4;
          }
          y += 4;
        }
      }
      y += 8;
    }

    // Números de página
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${i - 1}`, pageW / 2, pageH - 10, { align: "center" });
    }

    doc.save(`${data.project.title}.pdf`);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Exportar novela</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-lg">×</button>
        </div>

        <p className="text-zinc-500 text-xs">Exportá toda tu novela con capítulos y escenas en el formato que prefieras.</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setFormat("pdf")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${format === "pdf" ? "border-white bg-zinc-800 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
          >
            <span className="text-xl">📄</span>
            <div>
              <p className="text-sm font-medium">PDF</p>
              <p className="text-xs text-zinc-500">Con portada y formato profesional</p>
            </div>
          </button>
          <button
            onClick={() => setFormat("txt")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${format === "txt" ? "border-white bg-zinc-800 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
          >
            <span className="text-xl">📝</span>
            <div>
              <p className="text-sm font-medium">TXT</p>
              <p className="text-xs text-zinc-500">Texto plano, compatible con todo</p>
            </div>
          </button>
        </div>

        <button
          onClick={format === "pdf" ? exportPDF : exportTXT}
          disabled={loading}
          className="bg-white text-zinc-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? "Exportando..." : "Exportar"}
        </button>
      </div>
    </div>
  );
}