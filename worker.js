/**
 * Cloudflare Worker - MiniMax API Proxy
 * 
 * Setup:
 * 1. Create a Worker at dash.cloudflare.com
 * 2. Add a secret: MINIMAX_API_KEY = your API key
 * 3. Deploy this script
 * 4. Update frontend to call this worker URL
 */

const API_BASE = 'https://model.imfan.top/v1/chat/completions';
const MODEL = 'MiniMax-M2.7-highspeed';

export default {
  async fetch(request, env, ctx) {
    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // CORS headers for browser requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await request.json();
      
      // Validate and forward request
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MINIMAX_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: body.messages || [],
          max_tokens: body.max_tokens || 2000,
          temperature: body.temperature || 0.7
        })
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: { message: error.message || 'Internal error' }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
