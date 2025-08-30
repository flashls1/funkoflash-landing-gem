import React from "react";

type HeroShellProps = {
  imageUrl: string;
  children?: React.ReactNode;
};

export default function HeroShell({ imageUrl, children }: HeroShellProps) {
  const heights =
    "h-[180px] sm:h-[200px] md:h-[220px] lg:h-[240px] xl:h-[240px] 2xl:h-[260px]";

  return (
    <section className={`relative w-full bg-black rounded-2xl overflow-hidden isolate ${heights}`} aria-label="Hero section">
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