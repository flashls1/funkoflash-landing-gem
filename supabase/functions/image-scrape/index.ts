import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  names: string[];
}

async function fetchWikiImage(name: string, lang: string = "en"): Promise<string | null> {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
  const params = new URLSearchParams({
    action: "query",
    titles: name,
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
        // Try English then Spanish Wikipedia
        const en = await fetchWikiImage(n, "en");
        if (en) return { name: n, imageUrl: en };
        const es = await fetchWikiImage(n, "es");
        if (es) return { name: n, imageUrl: es };
        return { name: n, imageUrl: null };
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
