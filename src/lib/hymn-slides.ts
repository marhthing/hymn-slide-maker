export interface Hymn {
  number: number;
  title: string;
  verses: { verse: number; text: string }[];
  chorus?: string;
}

export interface HymnDb {
  title: string;
  total: number;
  hymns: Hymn[];
}

export interface Slide {
  title: string;
  lines: string[];
  kind: "verse" | "chorus";
}

export function buildSlides(hymn: Hymn): Slide[] {
  const slides: Slide[] = [];
  const chorusLines = hymn.chorus
    ? prefixFirst(hymn.chorus.split("\n"), "Chorus: ")
    : null;

  hymn.verses.forEach((v, idx) => {
    slides.push({
      title: hymn.title,
      lines: prefixFirst(v.text.split("\n"), `${idx + 1}. `),
      kind: "verse",
    });
    if (chorusLines) {
      slides.push({ title: hymn.title, lines: chorusLines, kind: "chorus" });
    }
  });

  return slides;
}

function prefixFirst(lines: string[], prefix: string): string[] {
  if (lines.length === 0) return [prefix];
  return [prefix + lines[0], ...lines.slice(1)];
}

function fileBase(hymn: Hymn) {
  const safe = hymn.title.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `GHS_${hymn.number}_${safe}`;
}

export async function downloadPptx(hymn: Hymn) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `GHS ${hymn.number} - ${hymn.title}`;

  const slides = buildSlides(hymn);
  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: "156082" };

    // gradient overlay
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%" as unknown as number,
      h: "100%" as unknown as number,
      fill: {
        type: "solid",
        color: "4EA72E",
        transparency: 80,
      },
      line: { type: "none" } as never,
    });

    slide.addText(s.title, {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.9,
      align: "center",
      fontSize: 36,
      bold: true,
      color: "0E2841",
      fontFace: "Aptos Display",
      lineSpacingMultiple: 0.9,
    });

    const paragraphs = s.lines.map((line, i) => ({
      text: line,
      options: {
        align: "center" as const,
        breakLine: i < s.lines.length - 1,
      },
    }));

    slide.addText(paragraphs, {
      x: 0.7,
      y: 1.4,
      w: 8.6,
      h: 5.8,
      align: "center",
      fontSize: 32,
      color: "0E2841",
      fontFace: "Aptos",
      lineSpacingMultiple: 2.5,
      valign: "top",
      wrap: true,
    });
  }

  await pptx.writeFile({ fileName: `${fileBase(hymn)}.pptx` });
}

export async function downloadPdf(hymn: Hymn) {
  const { jsPDF } = await import("jspdf");
  const slides = buildSlides(hymn);
  // 16:9 landscape in mm
  const W = 297;
  const H = 167;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [W, H] });

  slides.forEach((s, idx) => {
    if (idx > 0) doc.addPage([W, H], "landscape");

    // base blue
    doc.setFillColor(21, 96, 130);
    doc.rect(0, 0, W, H, "F");
    // green overlay (approximate gradient)
    const gs = (doc as unknown as { GState: new (o: { opacity: number }) => unknown; setGState: (g: unknown) => void });
    try {
      gs.setGState(new gs.GState({ opacity: 0.2 }));
      doc.setFillColor(78, 167, 46);
      doc.rect(0, 0, W, H, "F");
      gs.setGState(new gs.GState({ opacity: 1 }));
    } catch {
      // ignore if GState unsupported
    }

    // title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(14, 40, 65);
    doc.text(s.title, W / 2, 22, { align: "center" });

    // body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(15);
    const lineHeight = 14;
    const totalH = s.lines.length * lineHeight;
    let y = (H - totalH) / 2 + 18;
    for (const line of s.lines) {
      doc.text(line, W / 2, y, { align: "center", maxWidth: W - 30 });
      y += lineHeight;
    }
  });

  doc.save(`${fileBase(hymn)}.pdf`);
}
