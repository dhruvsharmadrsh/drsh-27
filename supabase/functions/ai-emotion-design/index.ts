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
    const { emotion, intensity, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating design parameters for emotion:', emotion, 'intensity:', intensity);

    const prompt = `You are an expert in emotional design and color psychology. Translate the emotion "${emotion}" with intensity level ${intensity}/10 into specific visual design parameters.

Context: ${context || 'General advertising creative'}

Generate a comprehensive design specification that captures this emotion. Return a JSON object with:

{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex", 
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "typography": {
    "headingFont": "font-family name",
    "bodyFont": "font-family name",
    "headingWeight": "weight (300-900)",
    "headingStyle": "normal/italic",
    "letterSpacing": "tight/normal/wide",
    "lineHeight": "tight/normal/relaxed"
  },
  "composition": {
    "layout": "centered/asymmetric/grid/diagonal",
    "whitespace": "minimal/balanced/generous",
    "contrast": "subtle/moderate/bold",
    "movement": "static/gentle/dynamic"
  },
  "effects": {
    "shadows": "none/subtle/dramatic",
    "gradients": "none/soft/vibrant",
    "textures": "smooth/textured/rough",
    "overlays": "none/light/dark"
  },
  "mood": {
    "description": "2-3 sentence description of the emotional feel",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "inspirations": ["visual reference 1", "visual reference 2"]
  }
}

Be specific and practical. Choose colors and fonts that genuinely evoke the ${emotion} emotion.`;

    const toolName = "return_emotion_design";

    const gatewayBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an expert emotional design consultant." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: "Return emotion-to-design parameters in the required schema.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                designParams: {
                  type: "object",
                  additionalProperties: true,
                  properties: {
                    colors: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        primary: { type: "string" },
                        secondary: { type: "string" },
                        accent: { type: "string" },
                        background: { type: "string" },
                        text: { type: "string" },
                      },
                      required: ["primary", "secondary", "accent", "background", "text"],
                    },
                    typography: {
                      type: "object",
                      additionalProperties: true,
                      properties: {
                        headingFont: { type: "string" },
                        bodyFont: { type: "string" },
                        headingWeight: { type: "string" },
                      },
                      required: ["headingFont", "bodyFont", "headingWeight"],
                    },
                    mood: {
                      type: "object",
                      additionalProperties: true,
                      properties: {
                        description: { type: "string" },
                        keywords: { type: "array", items: { type: "string" } },
                      },
                      required: ["description", "keywords"],
                    },
                  },
                  required: ["colors", "typography", "mood"],
                },
              },
              required: ["designParams"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let designParams;

    try {
      const toolArgs = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (toolArgs) {
        const parsed = JSON.parse(toolArgs);
        designParams = parsed.designParams;
      } else {
        throw new Error("No tool call arguments found");
      }
    } catch (parseError) {
      console.error("Tool parse error:", parseError);

      // Fallback: try to parse JSON from content
      try {
        const content = data?.choices?.[0]?.message?.content;
        const jsonMatch = typeof content === "string" ? content.match(/\{[\s\S]*\}/) : null;
        if (jsonMatch) designParams = JSON.parse(jsonMatch[0]);
      } catch (fallbackErr) {
        console.error("Fallback parse error:", fallbackErr);
      }

      if (!designParams) {
        // Fallback design parameters
        designParams = {
          colors: {
            primary: "#6366F1",
            secondary: "#818CF8",
            accent: "#F59E0B",
            background: "#0F172A",
            text: "#F8FAFC",
          },
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter",
            headingWeight: "700",
            headingStyle: "normal",
            letterSpacing: "normal",
            lineHeight: "normal",
          },
          composition: {
            layout: "centered",
            whitespace: "balanced",
            contrast: "moderate",
            movement: "gentle",
          },
          effects: {
            shadows: "subtle",
            gradients: "soft",
            textures: "smooth",
            overlays: "none",
          },
          mood: {
            description: `Design parameters for ${emotion} emotion`,
            keywords: [emotion, "creative", "engaging"],
            inspirations: ["Modern advertising", "Brand campaigns"],
          },
        };
      }
    }

    console.log("Generated design parameters:", designParams);
    console.log('Generated design parameters:', designParams);

    return new Response(JSON.stringify({ designParams, emotion, intensity }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-emotion-design:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
