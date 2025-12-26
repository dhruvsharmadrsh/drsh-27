import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 20+ style variations for the Creative Multiverse Generator
const styleVariations = [
  { id: "premium-luxury", name: "Premium Luxury", description: "Elegant gold accents, dark backgrounds, sophisticated typography", colors: { primary: "#D4AF37", secondary: "#1A1A2E", accent: "#F8F0E3", text: "#FFFFFF" }, style: "luxury" },
  { id: "minimal-clean", name: "Minimal Clean", description: "White space, simple typography, muted colors", colors: { primary: "#1A1A1A", secondary: "#FFFFFF", accent: "#E5E5E5", text: "#333333" }, style: "minimal" },
  { id: "festive-celebration", name: "Festive Celebration", description: "Bright reds, golds, celebratory elements", colors: { primary: "#DC2626", secondary: "#FEF3C7", accent: "#F59E0B", text: "#FFFFFF" }, style: "festive" },
  { id: "neon-glow", name: "Neon Glow", description: "Vibrant neon colors, dark backgrounds, glowing effects", colors: { primary: "#FF00FF", secondary: "#0D0D0D", accent: "#00FFFF", text: "#FFFFFF" }, style: "neon" },
  { id: "vintage-retro", name: "Vintage Retro", description: "Sepia tones, classic typography, nostalgic feel", colors: { primary: "#8B4513", secondary: "#F5DEB3", accent: "#CD853F", text: "#3E2723" }, style: "vintage" },
  { id: "modern-3d", name: "Modern 3D", description: "Depth effects, shadows, dimensional elements", colors: { primary: "#6366F1", secondary: "#EEF2FF", accent: "#A78BFA", text: "#1E1B4B" }, style: "3d" },
  { id: "lifestyle-organic", name: "Lifestyle Organic", description: "Natural textures, earthy tones, warm feeling", colors: { primary: "#22C55E", secondary: "#ECFDF5", accent: "#86EFAC", text: "#14532D" }, style: "organic" },
  { id: "dark-mode", name: "Dark Mode", description: "Deep blacks, subtle contrasts, modern feel", colors: { primary: "#3B82F6", secondary: "#111827", accent: "#1F2937", text: "#F9FAFB" }, style: "dark" },
  { id: "illustrated-playful", name: "Illustrated Playful", description: "Hand-drawn elements, fun colors, casual vibe", colors: { primary: "#F472B6", secondary: "#FDF2F8", accent: "#FBBF24", text: "#831843" }, style: "illustrated" },
  { id: "high-contrast", name: "High Contrast", description: "Bold black and white, striking visuals", colors: { primary: "#000000", secondary: "#FFFFFF", accent: "#FF0000", text: "#000000" }, style: "contrast" },
  { id: "trendy-gradient", name: "Trendy Gradient", description: "Smooth color transitions, modern aesthetic", colors: { primary: "#8B5CF6", secondary: "#EC4899", accent: "#3B82F6", text: "#FFFFFF" }, style: "gradient" },
  { id: "corporate-professional", name: "Corporate Professional", description: "Business-appropriate, trustworthy, clean", colors: { primary: "#1E40AF", secondary: "#F8FAFC", accent: "#3B82F6", text: "#1E293B" }, style: "corporate" },
  { id: "summer-vibes", name: "Summer Vibes", description: "Bright yellows, beach colors, energetic", colors: { primary: "#FBBF24", secondary: "#FEF3C7", accent: "#F97316", text: "#78350F" }, style: "summer" },
  { id: "winter-frost", name: "Winter Frost", description: "Cool blues, icy whites, crisp feel", colors: { primary: "#0EA5E9", secondary: "#F0F9FF", accent: "#BAE6FD", text: "#0C4A6E" }, style: "winter" },
  { id: "autumn-warmth", name: "Autumn Warmth", description: "Rich oranges, browns, cozy atmosphere", colors: { primary: "#EA580C", secondary: "#FFF7ED", accent: "#FDBA74", text: "#7C2D12" }, style: "autumn" },
  { id: "spring-fresh", name: "Spring Fresh", description: "Light greens, florals, renewal theme", colors: { primary: "#84CC16", secondary: "#F7FEE7", accent: "#BEF264", text: "#365314" }, style: "spring" },
  { id: "tech-futuristic", name: "Tech Futuristic", description: "Cyber elements, sci-fi inspired, innovative", colors: { primary: "#06B6D4", secondary: "#0F172A", accent: "#22D3EE", text: "#E0F2FE" }, style: "tech" },
  { id: "art-deco", name: "Art Deco", description: "Geometric patterns, gold accents, 1920s glamour", colors: { primary: "#B8860B", secondary: "#1C1C1C", accent: "#FFD700", text: "#FFFFFF" }, style: "artdeco" },
  { id: "bohemian-artistic", name: "Bohemian Artistic", description: "Rich patterns, warm earth tones, creative", colors: { primary: "#B91C1C", secondary: "#FFFBEB", accent: "#F59E0B", text: "#7C2D12" }, style: "bohemian" },
  { id: "scandinavian-hygge", name: "Scandinavian Hygge", description: "Soft neutrals, cozy minimalism, peaceful", colors: { primary: "#78716C", secondary: "#FAF5F0", accent: "#D6D3D1", text: "#44403C" }, style: "scandinavian" },
  { id: "pop-art", name: "Pop Art", description: "Bold primary colors, comic style, energetic", colors: { primary: "#EF4444", secondary: "#FBBF24", accent: "#3B82F6", text: "#000000" }, style: "popart" },
  { id: "monochrome-elegant", name: "Monochrome Elegant", description: "Single color variations, sophisticated", colors: { primary: "#374151", secondary: "#F3F4F6", accent: "#6B7280", text: "#111827" }, style: "monochrome" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { canvasState, productDescription, selectedStyles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Filter styles if specific ones were requested
    const stylesToGenerate = selectedStyles && selectedStyles.length > 0 
      ? styleVariations.filter(s => selectedStyles.includes(s.id))
      : styleVariations;

    // Generate variations for each style
    const variations = await Promise.all(
      stylesToGenerate.slice(0, 8).map(async (style) => {
        const prompt = `You are a professional creative designer. Based on the following design context, generate a complete canvas layout for a "${style.name}" style variation.

Product/Campaign: ${productDescription || "General marketing creative"}
Style: ${style.name} - ${style.description}
Color Palette: Primary: ${style.colors.primary}, Secondary: ${style.colors.secondary}, Accent: ${style.colors.accent}, Text: ${style.colors.text}

Current canvas dimensions: 1080x1080

Generate a JSON object with fabric.js compatible objects array. Include:
1. A background rectangle covering the full canvas
2. 2-3 text elements (headline, subheadline, CTA)
3. 1-2 decorative shapes that match the style
4. Proper positioning and sizing for visual hierarchy

Respond with ONLY valid JSON in this exact format:
{
  "objects": [
    { "type": "rect", "left": 0, "top": 0, "width": 1080, "height": 1080, "fill": "${style.colors.secondary}", "selectable": false },
    { "type": "i-text", "left": 100, "top": 300, "text": "HEADLINE", "fontSize": 72, "fontWeight": "700", "fill": "${style.colors.text}", "fontFamily": "Inter" }
  ]
}`;

        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a creative design AI. Respond only with valid JSON." },
                { role: "user", content: prompt }
              ],
            }),
          });

          const data = await response.json();
          let content = data.choices?.[0]?.message?.content || "{}";
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const canvasData = JSON.parse(jsonMatch[0]);
            return {
              ...style,
              canvas_data: canvasData,
              generated: true
            };
          }
        } catch (e) {
          console.error(`Error generating ${style.name}:`, e);
        }

        // Fallback to pre-defined template
        return {
          ...style,
          canvas_data: {
            objects: [
              { type: "rect", left: 0, top: 0, width: 1080, height: 1080, fill: style.colors.secondary, selectable: false },
              { type: "i-text", left: 100, top: 300, text: style.name.toUpperCase(), fontSize: 64, fontWeight: "700", fill: style.colors.text, fontFamily: "Inter" },
              { type: "i-text", left: 100, top: 400, text: style.description, fontSize: 24, fontWeight: "400", fill: style.colors.text, fontFamily: "Inter", opacity: 0.8 },
              { type: "rect", left: 100, top: 480, width: 200, height: 50, fill: style.colors.primary, rx: 8, ry: 8 },
              { type: "i-text", left: 140, top: 492, text: "SHOP NOW", fontSize: 18, fontWeight: "600", fill: style.colors.secondary, fontFamily: "Inter" },
            ]
          },
          generated: false
        };
      })
    );

    // Also return the full list of available styles for the UI
    return new Response(JSON.stringify({
      variations,
      allStyles: styleVariations,
      message: `Generated ${variations.length} style variations`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-creative-multiverse function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
