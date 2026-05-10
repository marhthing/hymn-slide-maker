import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Download, Music2 } from "lucide-react";
import {
  buildSlides,
  downloadPdf,
  downloadPptx,
  type Hymn,
  type HymnDb,
  type Slide,
} from "@/lib/hymn-slides";
import { SlidePreview } from "@/components/SlidePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GHS Hymn Slide Generator" },
      {
        name: "description",
        content:
          "Generate PowerPoint and PDF slides for Gospel Hymns and Songs (GHS) by hymn number.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [db, setDb] = useState<HymnDb | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch("/GHS-1-260.json")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((d: HymnDb) => setDb(d))
      .catch(() =>
        setDbError(
          "Could not load hymn data. Make sure GHS-1-260.json is in the same folder."
        )
      );
  }, []);

  function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setHymn(null);
    setSlides([]);
    if (!db) return;
    const n = Number(number);
    if (!Number.isInteger(n) || n < 1 || n > 252) {
      setError("Please enter a whole number between 1 and 252.");
      return;
    }
    const found = db.hymns.find((h) => h.number === n);
    if (!found) {
      setError(`Hymn #${n} not found.`);
      return;
    }
    setHymn(found);
    setSlides(buildSlides(found));
  }

  async function handlePptx() {
    if (!hymn) return;
    setPptxLoading(true);
    try {
      await downloadPptx(hymn);
    } finally {
      setPptxLoading(false);
    }
  }

  async function handlePdf() {
    if (!hymn) return;
    setPdfLoading(true);
    try {
      await downloadPdf(hymn);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="text-white"
        style={{ backgroundColor: "#0E2841" }}
      >
        <div className="container mx-auto px-4 py-5 flex items-center gap-3">
          <Music2 className="h-6 w-6" />
          <h1 className="text-lg sm:text-xl font-bold">
            GHS Hymn Slide Generator
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <form
          onSubmit={handleGenerate}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="ghs-number"
              className="block text-sm font-medium mb-1"
            >
              Enter GHS Number (1–252)
            </label>
            <Input
              id="ghs-number"
              type="number"
              min={1}
              max={252}
              inputMode="numeric"
              placeholder="e.g. 16"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={!db}
            className="text-white"
            style={{ backgroundColor: "#156082" }}
          >
            Generate
          </Button>
        </form>

        {dbError && (
          <p className="mt-4 text-sm text-destructive">{dbError}</p>
        )}
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {hymn && (
          <section className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  GHS {hymn.number}: {hymn.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {slides.length} slide{slides.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handlePptx}
                  disabled={pptxLoading}
                  className="text-white w-full sm:w-auto"
                  style={{ backgroundColor: "#156082" }}
                >
                  {pptxLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PPTX
                </Button>
                <Button
                  onClick={handlePdf}
                  disabled={pdfLoading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {slides.map((s, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Slide {i + 1} · {s.kind === "chorus" ? "Chorus" : "Verse"}
                  </p>
                  <SlidePreview slide={s} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
