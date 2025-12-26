import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64, brandName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageUrl && !imageBase64) {
      throw new Error("Either imageUrl or imageBase64 is required");
    }

    // Use vision model to analyze the product image
    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: imageBase64 } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const analysisPrompt = `Analyze this product/brand image and extract the brand DNA. Provide a detailed analysis in JSON format.

Extract:
1. Dominant colors (provide exact hex codes) - identify 3-5 main colors
2. Color mood (warm, cool, neutral, vibrant, muted)
3. Brand personality traits (list 5-7 adjectives)
4. Suggested typography style (font categories that would match)
5. Visual style keywords (minimalist, luxury, playful, corporate, etc.)
6. Target audience inference
7. Industry/category guess
8. Recommended primary, secondary, and accent colors for marketing materials

Respond with ONLY valid JSON in this exact format:
{
  "colors": {
    "dominant": ["#hex1", "#hex2", "#hex3"],
    "mood": "warm/cool/neutral",
    "recommended": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "text": "#hex",
      "background": "#hex"
    }
  },
  "personality": {
    "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
    "tone": "description of brand voice",
    "values": ["value1", "value2", "value3"]
  },
  "typography": {
    "headingStyle": "serif/sans-serif/display/script",
    "bodyStyle": "serif/sans-serif",
    "suggestedFonts": {
      "heading": "Font Name",
      "body": "Font Name"
    },
    "characteristics": ["bold", "elegant", "modern"]
  },
  "visualStyle": {
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "aesthetic": "description",
    "patterns": ["geometric", "organic", "minimal"],
    "imagery": "description of ideal imagery style"
  },
  "audience": {
    "demographic": "description",
    "psychographic": "description",
    "interests": ["interest1", "interest2"]
  },
  "industry": {
    "category": "category name",
    "positioning": "premium/mid-market/budget",
    "competitors": "style comparison"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an expert brand strategist and visual designer. Analyze images to extract brand DNA and identity elements. Always respond with valid JSON only." 
          },
          { 
            role: "user", 
            content: [
              { type: "text", text: analysisPrompt },
              imageContent
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse brand DNA from AI response");
    }

    const brandDNA = JSON.parse(jsonMatch[0]);

    // Generate brand kit suggestion based on analysis
    const brandKit = {
      name: brandName || "Extracted Brand",
      primary_color: brandDNA.colors?.recommended?.primary || brandDNA.colors?.dominant?.[0] || "#3B82F6",
      secondary_color: brandDNA.colors?.recommended?.secondary || brandDNA.colors?.dominant?.[1] || "#8B5CF6",
      accent_color: brandDNA.colors?.recommended?.accent || brandDNA.colors?.dominant?.[2] || "#F59E0B",
      font_heading: brandDNA.typography?.suggestedFonts?.heading || "Inter",
      font_body: brandDNA.typography?.suggestedFonts?.body || "Inter",
      guidelines: `Brand Personality: ${brandDNA.personality?.traits?.join(", ") || "Modern, Professional"}
Visual Style: ${brandDNA.visualStyle?.aesthetic || "Clean and contemporary"}
Target Audience: ${brandDNA.audience?.demographic || "General audience"}
Tone: ${brandDNA.personality?.tone || "Professional and approachable"}`
    };

    return new Response(JSON.stringify({
      brandDNA,
      brandKit,
      message: "Brand DNA extracted successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-brand-dna function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
