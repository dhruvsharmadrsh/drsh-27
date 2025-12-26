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
    const { targetEmotion, industry, existingColors } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing color psychology for:', targetEmotion, industry);

    const prompt = `You are an expert in color psychology and brand design. Generate color recommendations based on:

Target Emotional Response: ${targetEmotion || 'Trust and reliability'}
Industry: ${industry || 'General e-commerce'}
${existingColors ? `Existing Brand Colors: ${existingColors.join(', ')}` : ''}

Provide comprehensive color psychology analysis and palette recommendations. Return a JSON object with:

{
  "primaryPalettes": [
    {
      "name": "Palette name",
      "colors": [
        {
          "hex": "#hex",
          "name": "Color name",
          "psychology": "Emotional association",
          "usage": "Primary/Secondary/Accent/Background"
        }
      ],
      "emotionalImpact": "Description of emotional impact",
      "bestFor": ["Use case 1", "Use case 2"],
      "avoidFor": ["Anti-use case"],
      "accessibilityScore": 85
    }
  ],
  "colorMeanings": [
    {
      "color": "Color name",
      "hex": "#hex",
      "positiveAssociations": ["association1", "association2"],
      "negativeAssociations": ["negative1"],
      "culturalNotes": "Cultural considerations",
      "industryUsage": "How this color is used in the industry"
    }
  ],
  "recommendations": {
    "primary": {
      "hex": "#hex",
      "reasoning": "Why this primary color"
    },
    "secondary": {
      "hex": "#hex",
      "reasoning": "Why this secondary color"
    },
    "accent": {
      "hex": "#hex",
      "reasoning": "Why this accent color"
    },
    "callToAction": {
      "hex": "#hex",
      "reasoning": "Why this CTA color maximizes conversions"
    }
  },
  "colorCombinations": [
    {
      "type": "complementary/analogous/triadic/split-complementary",
      "colors": ["#hex1", "#hex2", "#hex3"],
      "harmonyScore": 92,
      "mood": "Mood description"
    }
  ],
  "conversionOptimization": {
    "highConvertingColors": ["#hex1", "#hex2"],
    "trustBuildingColors": ["#hex1", "#hex2"],
    "urgencyColors": ["#hex1", "#hex2"],
    "calmingColors": ["#hex1", "#hex2"]
  }
}

Provide 3-4 primary palettes with 4-5 colors each. Be specific about psychology and practical applications.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a color psychology expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let colorAnalysis;

    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        colorAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback color analysis
      colorAnalysis = {
        primaryPalettes: [
          {
            name: "Trust & Reliability",
            colors: [
              { hex: "#1E40AF", name: "Royal Blue", psychology: "Trust, stability, professionalism", usage: "Primary" },
              { hex: "#3B82F6", name: "Ocean Blue", psychology: "Calm, reliable, secure", usage: "Secondary" },
              { hex: "#10B981", name: "Emerald", psychology: "Growth, success, health", usage: "Accent" },
              { hex: "#F8FAFC", name: "Snow White", psychology: "Clean, pure, spacious", usage: "Background" }
            ],
            emotionalImpact: "Creates a sense of security and dependability",
            bestFor: ["Financial services", "Healthcare", "Enterprise software"],
            avoidFor: ["Entertainment", "Fast food"],
            accessibilityScore: 92
          },
          {
            name: "Energy & Excitement",
            colors: [
              { hex: "#DC2626", name: "Vibrant Red", psychology: "Energy, passion, urgency", usage: "Primary" },
              { hex: "#F97316", name: "Sunset Orange", psychology: "Enthusiasm, creativity, warmth", usage: "Secondary" },
              { hex: "#FBBF24", name: "Golden Yellow", psychology: "Optimism, happiness, attention", usage: "Accent" },
              { hex: "#1F2937", name: "Charcoal", psychology: "Sophistication, contrast", usage: "Text" }
            ],
            emotionalImpact: "Drives action and creates excitement",
            bestFor: ["Sales promotions", "Sports", "Entertainment"],
            avoidFor: ["Healthcare", "Luxury brands"],
            accessibilityScore: 88
          }
        ],
        colorMeanings: [
          {
            color: "Blue",
            hex: "#3B82F6",
            positiveAssociations: ["Trust", "Stability", "Intelligence"],
            negativeAssociations: ["Cold", "Distant"],
            culturalNotes: "Universally positive in most cultures",
            industryUsage: "Dominant in finance, tech, healthcare"
          }
        ],
        recommendations: {
          primary: { hex: "#3B82F6", reasoning: "Blue builds trust and is universally appealing" },
          secondary: { hex: "#10B981", reasoning: "Green suggests growth and positivity" },
          accent: { hex: "#F59E0B", reasoning: "Amber draws attention without overwhelming" },
          callToAction: { hex: "#DC2626", reasoning: "Red creates urgency and drives clicks" }
        },
        colorCombinations: [
          {
            type: "complementary",
            colors: ["#3B82F6", "#F97316"],
            harmonyScore: 89,
            mood: "Dynamic and balanced"
          }
        ],
        conversionOptimization: {
          highConvertingColors: ["#DC2626", "#22C55E"],
          trustBuildingColors: ["#1E40AF", "#0D9488"],
          urgencyColors: ["#DC2626", "#F97316"],
          calmingColors: ["#06B6D4", "#8B5CF6"]
        }
      };
    }

    console.log('Generated color psychology analysis');

    return new Response(JSON.stringify({ colorAnalysis, targetEmotion, industry }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-color-psychology:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
