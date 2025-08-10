import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  names: string[];
}

async function fetchWikiDirect(title: string, lang: string): Promise<string | null> {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "pageimages",
    piprop: "original",
    redirects: "1",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${endpoint}?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages || {};
  for (const key of Object.keys(pages)) {
    const page = pages[key];
    const url: string | undefined = page?.original?.source;
    if (url) return url;
  }
  return null;
}

async function fetchWikiSearch(query: string, lang: string): Promise<string | null> {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "1",
    prop: "pageimages",
    piprop: "original",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${endpoint}?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages || {};
  for (const key of Object.keys(pages)) {
    const page = pages[key];
    const url: string | undefined = page?.original?.source;
    if (url) return url;
  }
  return null;
}

function nameVariants(name: string): string[] {
  const variants = new Set<string>([name]);
  // Specific known aliases/clarifications for this roster
  const lower = name.toLowerCase();
  if (lower.includes("lalo garza")) {
    variants.add("Eduardo Garza (voice actor)");
    variants.add("Eduardo Garza");
  }
  if (lower.includes("laura torres")) {
    variants.add("Laura Torres (actress)");
    variants.add("Laura Torres (actriz de voz)");
  }
  if (lower.includes("geraldo") || lower.includes("gerardo reyero")) {
    variants.add("Gerardo Reyero");
  }
  if (lower.includes("rene garcia") || lower.includes("rené garcía")) {
    variants.add("René García (actor)");
  }
  if (lower.includes("mario castañeda") || lower.includes("mario castaneda")) {
    variants.add("Mario Castañeda");
  }
  if (lower.includes("luis manuel ávila") || lower.includes("luis manuel avila")) {
    variants.add("Luis Manuel Ávila");
  }
  if (lower.includes("carlos segundo")) {
    variants.add("Carlos Segundo");
  }
  // Generic disambiguations
  variants.add(`${name} (voice actor)`);
  variants.add(`${name} (actor)`);
  variants.add(`${name} (actriz de voz)`);
  variants.add(`${name} (actor de voz)`);
  return Array.from(variants);
}

async function findBestImageForName(name: string): Promise<string | null> {
  const langs = ["en", "es"] as const;
  const candidates = nameVariants(name);

  // Try direct title fetches first
  for (const lang of langs) {
    for (const title of candidates) {
      const url = await fetchWikiDirect(title, lang);
      if (url) return url;
    }
  }

  // Try search queries
  for (const lang of langs) {
    for (const title of candidates) {
      const url = await fetchWikiSearch(title, lang);
      if (url) return url;
    }
  }

  // Last resort: raw search by name
  for (const lang of langs) {
    const url = await fetchWikiSearch(name, lang);
    if (url) return url;
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body?.names || !Array.isArray(body.names) || body.names.length === 0) {
      return new Response(JSON.stringify({ error: "names array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.allSettled(
      body.names.map(async (n) => {
        const imageUrl = await findBestImageForName(n);
        return { name: n, imageUrl };
      })
    );

    const images = results
      .map((r) => (r.status === "fulfilled" ? r.value : { name: "unknown", imageUrl: null }))
      .filter((i) => i.imageUrl);

    return new Response(JSON.stringify({ success: true, images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("image-scrape error", error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
