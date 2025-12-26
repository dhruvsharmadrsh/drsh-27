import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CopywritingRequest {
  productName: string;
  productType: string;
  campaignType: string;
  targetAudience?: string;
  tone?: string;
  existingCopy?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productType, campaignType, targetAudience, tone, existingCopy }: CopywritingRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert advertising copywriter specializing in digital and retail marketing.

Generate compelling, conversion-focused copy variations. Consider:
- AIDA framework (Attention, Interest, Desire, Action)
- Power words and emotional triggers
- Urgency without being pushy
- Clear value propositions
- Platform-specific character limits
- Brand voice consistency

Return exactly 25-30 variations in this JSON format:
{
  "headlines": [
    { "text": "string", "charCount": number, "style": "bold|minimal|emotional|urgent|playful" }
  ],
  "ctas": [
    { "text": "string", "charCount": number, "style": "direct|soft|urgent|benefit|discovery" }
  ],
  "taglines": [
    { "text": "string", "charCount": number }
  ]
}

Headlines: 10 variations (under 50 chars each)
CTAs: 10 variations (under 20 chars each)
Taglines: 10 variations (under 80 chars each)`;

    const userPrompt = `Generate copy variations for:

Product: ${productName}
Product Type: ${productType}
Campaign: ${campaignType}
Target Audience: ${targetAudience || 'General consumers'}
Tone: ${tone || 'Professional yet approachable'}
${existingCopy ? `Current Copy: "${existingCopy}"` : ''}

Create compelling, diverse variations that could work across Instagram, Facebook, and retail displays.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Higher creativity for copy
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const copyVariations = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(copyVariations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Copywriting error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
