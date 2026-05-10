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

/**
 * Pick a font size + line-spacing multiplier so N lines fit within
 * the available body height of a 16:9 slide. Tiers descend from large
 * (few lines) to small (many lines) so content always fits.
 */
export function fitConfig(numLines: number) {
  const tiers: { max: number; fontPt: number; spacing: number }[] = [
    { max: 3, fontPt: 40, spacing: 2.4 },
    { max: 4, fontPt: 36, spacing: 2.2 },
    { max: 5, fontPt: 32, spacing: 2.0 },
    { max: 6, fontPt: 30, spacing: 1.9 },
    { max: 7, fontPt: 28, spacing: 1.8 },
    { max: 9, fontPt: 24, spacing: 1.6 },
    { max: 12, fontPt: 20, spacing: 1.4 },
    { max: 16, fontPt: 17, spacing: 1.3 },
    { max: 999, fontPt: 14, spacing: 1.2 },
  ];
  return tiers.find((t) => numLines <= t.max)!;
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

    const fit = fitConfig(s.lines.length);
    slide.addText(paragraphs, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 5.6,
      align: "center",
      fontSize: fit.fontPt,
      color: "0E2841",
      fontFace: "Aptos",
      lineSpacingMultiple: fit.spacing,
      valign: "middle",
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

    // body — fit-aware
    const fit = fitConfig(s.lines.length);
    // pt -> mm
    const fontMm = fit.fontPt * 0.3528;
    const lineHeight = fontMm * fit.spacing;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fit.fontPt);
    doc.setTextColor(14, 40, 65);

    const bodyTop = 32;
    const bodyBottom = H - 10;
    const bodyH = bodyBottom - bodyTop;
    const totalH = s.lines.length * lineHeight;
    let y = bodyTop + Math.max(0, (bodyH - totalH) / 2) + fontMm;
    for (const line of s.lines) {
      doc.text(line, W / 2, y, { align: "center", maxWidth: W - 24 });
      y += lineHeight;
    }
  });

  doc.save(`${fileBase(hymn)}.pdf`);
}
