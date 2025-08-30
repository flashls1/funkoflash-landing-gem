import React from "react";

type HeroShellProps = {
  imageUrl: string;
  mode?: "auto" | "full"; // 'auto' recommended if app has sticky headers
  children?: React.ReactNode;
};

export default function HeroShell({ imageUrl, mode = "auto", children }: HeroShellProps) {
  const base = "relative w-full bg-black rounded-2xl overflow-hidden isolate";
  // Prevent "mini hero" on desktop by enforcing generous min-heights by breakpoint.
  const autoHeights = "min-h-[48vh] sm:min-h-[56vh] md:min-h-[60vh] lg:min-h-[70vh] xl:min-h-screen";
  const fullHeights = "min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[92vh] xl:min-h-screen";
  const heightClass = mode === "full" ? fullHeights : autoHeights;

  return (
    <section className={`${base} ${heightClass}`} aria-label="Hero section">
      <img
        src={imageUrl}
        alt="Hero background"
        className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
        sizes="100vw"
        decoding="async"
        loading="eager"
      />
      {/* Gradient to guarantee readability regardless of image brightness */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" aria-hidden="true" />
      <div className="relative h-full w-full">{children}</div>
    </section>
  );
}