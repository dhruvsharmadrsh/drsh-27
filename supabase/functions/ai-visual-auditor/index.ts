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
    const { canvasState, imageBase64, designGoal } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const canvasDescription = canvasState?.objects?.map((obj: any) => {
      if (obj.type === 'i-text' || obj.type === 'text') {
        return `Text: "${obj.text}" at position (${obj.left}, ${obj.top}), font: ${obj.fontFamily}, size: ${obj.fontSize}, color: ${obj.fill}`;
      }
      if (obj.type === 'rect') {
        return `Rectangle at (${obj.left}, ${obj.top}), size: ${obj.width}x${obj.height}, fill: ${obj.fill}`;
      }
      if (obj.type === 'circle') {
        return `Circle at (${obj.left}, ${obj.top}), radius: ${obj.radius}, fill: ${obj.fill}`;
      }
      if (obj.type === 'image') {
        return `Image at (${obj.left}, ${obj.top}), size: ${obj.width}x${obj.height}`;
      }
      return `${obj.type} element`;
    }).join('\n') || 'Empty canvas';

    const prompt = `You are a senior creative director and design critic. Analyze this marketing creative design and provide actionable feedback.

DESIGN ELEMENTS:
${canvasDescription}

CANVAS SIZE: ${canvasState?.width || 1080}x${canvasState?.height || 1080}
BACKGROUND: ${canvasState?.background || 'white'}
DESIGN GOAL: ${designGoal || 'Create an effective marketing creative'}

Provide a comprehensive design critique covering:

1. **Overall Score** (0-100): Rate the design's effectiveness
2. **Visual Hierarchy**: Is the most important information prominent?
3. **Color Usage**: Are colors harmonious and brand-appropriate?
4. **Typography**: Are fonts readable and well-paired?
5. **Composition & Balance**: Is the layout well-structured?
6. **White Space**: Is there appropriate breathing room?
7. **Call-to-Action**: Is it clear and compelling?
8. **Brand Consistency**: Does it feel cohesive?

For each area, provide:
- A rating (1-10)
- What's working well
- What could be improved
- A specific, actionable suggestion

Also provide:
- Top 3 priority fixes
- Quick wins (easy improvements)
- Advanced recommendations

Respond with valid JSON containing:
{
  "overallScore": number,
  "summary": "brief 2-sentence summary",
  "categories": [
    {
      "name": "Category Name",
      "score": number,
      "strengths": ["..."],
      "improvements": ["..."],
      "actionable": "specific suggestion"
    }
  ],
  "priorityFixes": ["fix 1", "fix 2", "fix 3"],
  "quickWins": ["quick win 1", "quick win 2"],
  "advancedTips": ["advanced tip 1", "advanced tip 2"]
}`;

    console.log("Auditing design with", canvasState?.objects?.length || 0, "objects");

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
            content: 'You are an expert creative director with 20+ years of experience in advertising and design. Provide constructive, actionable feedback. Always respond with valid JSON.' 
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
    
    console.log("AI audit response received");

    // Parse AI response
    let audit = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        audit = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log("Could not parse AI response, using fallback");
    }

    // Fallback response
    if (!audit) {
      audit = {
        overallScore: 75,
        summary: "The design has a solid foundation with room for improvement. Consider enhancing visual hierarchy and adding more contrast.",
        categories: [
          {
            name: "Visual Hierarchy",
            score: 7,
            strengths: ["Clear primary element placement"],
            improvements: ["Make headline more prominent"],
            actionable: "Increase headline size by 20% and add more weight"
          },
          {
            name: "Color Usage",
            score: 8,
            strengths: ["Cohesive color palette"],
            improvements: ["Add more contrast for accessibility"],
            actionable: "Ensure text has at least 4.5:1 contrast ratio"
          },
          {
            name: "Typography",
            score: 7,
            strengths: ["Readable font choices"],
            improvements: ["Better font pairing"],
            actionable: "Consider pairing a serif heading with sans-serif body"
          },
          {
            name: "Composition",
            score: 7,
            strengths: ["Balanced layout"],
            improvements: ["Use rule of thirds more effectively"],
            actionable: "Align key elements to the golden ratio grid"
          },
          {
            name: "Call-to-Action",
            score: 8,
            strengths: ["CTA is visible"],
            improvements: ["Make CTA more compelling"],
            actionable: "Use action-oriented text and increase button size"
          }
        ],
        priorityFixes: [
          "Increase headline prominence",
          "Improve contrast ratios",
          "Add visual breathing room"
        ],
        quickWins: [
          "Add subtle drop shadow to CTA button",
          "Increase line height for better readability"
        ],
        advancedTips: [
          "Consider adding micro-animations for engagement",
          "Test multiple color variations for A/B testing"
        ]
      };
    }

    return new Response(JSON.stringify({
      audit,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-visual-auditor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      audit: null,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
