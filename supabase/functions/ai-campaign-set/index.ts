import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Channel configurations for campaign variations
const channelFormats = [
  { id: "hero", name: "Hero Creative", width: 1080, height: 1080, description: "Main campaign visual", platform: "Universal" },
  { id: "facebook-feed", name: "Facebook Feed", width: 1200, height: 628, description: "Landscape for Facebook", platform: "Facebook" },
  { id: "instagram-story", name: "Instagram Story", width: 1080, height: 1920, description: "Full-screen vertical", platform: "Instagram" },
  { id: "instagram-post", name: "Instagram Post", width: 1080, height: 1080, description: "Square format", platform: "Instagram" },
  { id: "twitter-post", name: "Twitter/X Post", width: 1200, height: 675, description: "Twitter timeline", platform: "Twitter" },
  { id: "linkedin-post", name: "LinkedIn Post", width: 1200, height: 627, description: "Professional network", platform: "LinkedIn" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", width: 1280, height: 720, description: "Video thumbnail", platform: "YouTube" },
  { id: "email-banner", name: "Email Banner", width: 600, height: 200, description: "Email header", platform: "Email" },
  { id: "web-banner", name: "Web Banner", width: 728, height: 90, description: "Leaderboard ad", platform: "Display" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { canvasState, campaignName, productDescription, selectedChannels } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Filter channels if specific ones were requested
    const channelsToGenerate = selectedChannels && selectedChannels.length > 0 
      ? channelFormats.filter(c => selectedChannels.includes(c.id))
      : channelFormats;

    // Extract current design elements from canvas state
    const currentDesign = canvasState || {};

    // Generate variations for each channel
    const campaignVariations = await Promise.all(
      channelsToGenerate.map(async (channel) => {
        const prompt = `You are a professional advertising creative designer. Adapt the following campaign for ${channel.name} (${channel.platform}).

Campaign: ${campaignName || "Marketing Campaign"}
Product: ${productDescription || "Product promotion"}
Target Size: ${channel.width}x${channel.height}
Channel: ${channel.name} - ${channel.description}

Requirements:
1. Optimize text placement for this specific format
2. Adjust font sizes proportionally to the canvas size
3. Keep brand consistency with the original design
4. Ensure CTAs are prominent and clickable
5. Consider platform-specific best practices

Generate a fabric.js compatible JSON canvas layout. Include:
- Background (full canvas coverage)
- Headline text (prominent, readable)
- Subheadline or tagline
- CTA button or text
- Decorative elements if space allows

Respond with ONLY valid JSON:
{
  "objects": [
    { "type": "rect", "left": 0, "top": 0, "width": ${channel.width}, "height": ${channel.height}, "fill": "#1A1A2E", "selectable": false },
    { "type": "i-text", "left": ${Math.floor(channel.width * 0.05)}, "top": ${Math.floor(channel.height * 0.3)}, "text": "HEADLINE", "fontSize": ${Math.floor(channel.height * 0.08)}, "fontWeight": "700", "fill": "#FFFFFF", "fontFamily": "Inter" }
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
                { role: "system", content: "You are a multi-platform advertising expert. Respond only with valid JSON." },
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
              ...channel,
              canvas_data: canvasData,
              generated: true
            };
          }
        } catch (e) {
          console.error(`Error generating ${channel.name}:`, e);
        }

        // Fallback template
        const scaleFactor = Math.min(channel.width, channel.height) / 1080;
        return {
          ...channel,
          canvas_data: {
            objects: [
              { type: "rect", left: 0, top: 0, width: channel.width, height: channel.height, fill: "#1A1A2E", selectable: false },
              { type: "i-text", left: channel.width * 0.1, top: channel.height * 0.35, text: campaignName?.toUpperCase() || "CAMPAIGN", fontSize: Math.floor(48 * scaleFactor), fontWeight: "700", fill: "#FFFFFF", fontFamily: "Inter" },
              { type: "i-text", left: channel.width * 0.1, top: channel.height * 0.5, text: productDescription || "Shop Now", fontSize: Math.floor(24 * scaleFactor), fontWeight: "400", fill: "#D4AF37", fontFamily: "Inter" },
              { type: "rect", left: channel.width * 0.1, top: channel.height * 0.65, width: Math.floor(150 * scaleFactor), height: Math.floor(45 * scaleFactor), fill: "#D4AF37", rx: 4, ry: 4 },
              { type: "i-text", left: channel.width * 0.1 + 20 * scaleFactor, top: channel.height * 0.65 + 12 * scaleFactor, text: "LEARN MORE", fontSize: Math.floor(14 * scaleFactor), fontWeight: "600", fill: "#1A1A2E", fontFamily: "Inter" },
            ]
          },
          generated: false
        };
      })
    );

    return new Response(JSON.stringify({
      campaignName: campaignName || "Marketing Campaign",
      hero: campaignVariations.find(v => v.id === "hero"),
      variations: campaignVariations.filter(v => v.id !== "hero"),
      allChannels: channelFormats,
      message: `Generated ${campaignVariations.length} channel variations`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-campaign-set function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
