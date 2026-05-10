import type { Slide } from "@/lib/hymn-slides";

export function SlidePreview({ slide }: { slide: Slide }) {
  return (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md"
      style={{
        background:
          "linear-gradient(20deg, rgba(78,167,46,0.25) 16%, rgba(21,96,130,0.55) 85%), #156082",
        fontFamily: "'Aptos Display', Calibri, Arial, sans-serif",
      }}
    >
      {/* decorative wave top-right */}
      <svg
        className="absolute -top-6 -right-10 w-40 h-40 opacity-30 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M0,100 Q60,20 120,80 T200,60 L200,0 L0,0 Z"
          fill="#ffffff"
        />
      </svg>
      {/* decorative wave bottom-right */}
      <svg
        className="absolute -bottom-8 -right-6 w-44 h-32 opacity-20 pointer-events-none"
        viewBox="0 0 200 100"
        fill="none"
      >
        <path d="M0,100 Q80,20 160,60 T200,40 L200,100 Z" fill="#ffffff" />
      </svg>

      <div className="relative h-full flex flex-col items-center px-[5%] py-[4%]">
        <h3
          className="text-center font-bold leading-tight"
          style={{
            color: "#0E2841",
            fontSize: "clamp(0.85rem, 2.4vw, 1.6rem)",
          }}
        >
          {slide.title}
        </h3>
        <div
          className="flex-1 flex flex-col justify-center text-center w-full"
          style={{
            color: "#0E2841",
            fontFamily: "'Aptos', Calibri, Arial, sans-serif",
            fontSize: "clamp(0.65rem, 1.6vw, 1.05rem)",
            lineHeight: 2.2,
          }}
        >
          {slide.lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
