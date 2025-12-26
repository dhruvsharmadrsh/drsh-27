import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Popular font pairings categorized by style
const fontCategories = {
  modern: [
    { heading: "Inter", body: "Inter", style: "Clean & Professional" },
    { heading: "Poppins", body: "Open Sans", style: "Friendly & Modern" },
    { heading: "Montserrat", body: "Roboto", style: "Bold & Contemporary" },
  ],
  elegant: [
    { heading: "Playfair Display", body: "Lato", style: "Luxury & Refined" },
    { heading: "Cormorant Garamond", body: "Proza Libre", style: "Classic Elegance" },
    { heading: "Libre Baskerville", body: "Source Sans Pro", style: "Timeless & Sophisticated" },
  ],
  creative: [
    { heading: "Abril Fatface", body: "Poppins", style: "Bold & Artistic" },
    { heading: "Bebas Neue", body: "Montserrat", style: "Impact & Energy" },
    { heading: "Righteous", body: "Open Sans", style: "Playful & Dynamic" },
  ],
  minimal: [
    { heading: "Space Grotesk", body: "DM Sans", style: "Tech & Minimal" },
    { heading: "Archivo", body: "Work Sans", style: "Industrial Clean" },
    { heading: "Outfit", body: "Nunito Sans", style: "Soft & Minimal" },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandStyle, currentHeadingFont, currentBodyFont, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are an expert typography designer. Based on the following context, suggest 6 font pairings that would work well together.

Brand Style: ${brandStyle || "modern professional"}
Current Heading Font: ${currentHeadingFont || "Not specified"}
Current Body Font: ${currentBodyFont || "Not specified"}
Design Context: ${context || "Marketing creative for digital advertising"}

For each pairing, provide:
1. A heading font (Google Fonts compatible)
2. A body font (Google Fonts compatible)
3. A style description (2-3 words)
4. A brief explanation of why this pairing works (1 sentence)
5. Best use case (e.g., "luxury brands", "tech startups", "fashion")
6. A harmony score from 1-100 based on typographic principles

Return your response as a JSON array with objects containing: headingFont, bodyFont, style, explanation, useCase, harmonyScore

Focus on scientifically-validated font pairings that consider:
- Contrast between heading and body
- X-height compatibility
- Weight balance
- Historical font classifications (serif/sans-serif pairing rules)`;

    console.log("Generating typography suggestions for style:", brandStyle);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert typography designer specializing in font pairing for marketing and branding. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("AI response:", content);

    // Parse AI response
    let aiSuggestions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiSuggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log("Could not parse AI response, using fallbacks");
    }

    // Combine AI suggestions with curated fallbacks
    const curatedPairings = [
      ...fontCategories.modern,
      ...fontCategories.elegant,
      ...fontCategories.creative,
      ...fontCategories.minimal,
    ].slice(0, 6).map((p, i) => ({
      id: `curated-${i}`,
      headingFont: p.heading,
      bodyFont: p.body,
      style: p.style,
      explanation: `A harmonious ${p.style.toLowerCase()} pairing that balances readability with visual impact.`,
      useCase: "General marketing",
      harmonyScore: 85 + Math.floor(Math.random() * 10),
      source: "curated"
    }));

    const suggestions = aiSuggestions.length > 0 
      ? aiSuggestions.map((s: any, i: number) => ({
          id: `ai-${i}`,
          ...s,
          source: "ai"
        }))
      : curatedPairings;

    return new Response(JSON.stringify({
      suggestions: suggestions.slice(0, 8),
      categories: Object.keys(fontCategories),
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-typography-harmony:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      suggestions: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
