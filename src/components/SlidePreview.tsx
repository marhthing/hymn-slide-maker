import { fitConfig, type Slide } from "@/lib/hymn-slides";

export function SlidePreview({ slide }: { slide: Slide }) {
  const fit = fitConfig(slide.lines.length);
  // PPT body is 5.6in tall on a 7.5in slide ≈ 75% of card height.
  // Body font as % of card height = (fontPt / 540pt) where 540pt = 7.5in.
  const bodyFontPct = (fit.fontPt / 540) * 100;
  const titleFontPct = (36 / 540) * 100;

  return (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md"
      style={{
        background:
          "linear-gradient(0deg, rgba(78,167,46,0.20), rgba(78,167,46,0.20)), #156082",
        fontFamily: "'Aptos Display', Calibri, Arial, sans-serif",
        containerType: "size",
      }}
    >
      {/* decorative wave top-right */}
      <svg
        className="absolute -top-6 -right-10 w-1/3 opacity-30 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path d="M0,100 Q60,20 120,80 T200,60 L200,0 L0,0 Z" fill="#ffffff" />
      </svg>
      <svg
        className="absolute -bottom-6 -right-6 w-1/3 opacity-20 pointer-events-none"
        viewBox="0 0 200 100"
        fill="none"
      >
        <path d="M0,100 Q80,20 160,60 T200,40 L200,100 Z" fill="#ffffff" />
      </svg>

      <div className="relative h-full w-full flex flex-col items-stretch px-[5%] py-[4%]">
        <h3
          className="text-center font-bold leading-tight shrink-0"
          style={{
            color: "#FFFFFF",
            fontSize: `${titleFontPct}cqh`,
          }}
        >
          {slide.title}
        </h3>
        <div
          className="flex-1 flex flex-col justify-center items-center text-center w-full overflow-hidden font-bold"
          style={{
            color: "#FFFFFF",
            fontFamily: "'Aptos', Calibri, Arial, sans-serif",
            fontSize: `${bodyFontPct}cqh`,
            lineHeight: fit.spacing,
          }}
        >
          {slide.lines.map((line, i) => (
            <div key={i} className="w-full">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
