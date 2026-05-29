module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const body = req.body || {};
    let messages = body.messages || [];
    let finalData = null;
    let iterations = 0;

    while (iterations < 8) {
      iterations++;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: body.model || 'claude-haiku-4-5-20251001',
          max_tokens: body.max_tokens || 1000,
          messages,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      if (data.stop_reason === 'tool_use') {
        // Add assistant turn with tool_use blocks
        messages = [...messages, { role: 'assistant', content: data.content }];

        // Build tool_result blocks
        const toolResults = data.content
          .filter(b => b.type === 'tool_use')
          .map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: b.content || JSON.stringify(b.input || {}),
          }));

        messages = [...messages, { role: 'user', content: toolResults }];
      } else {
        finalData = data;
        break;
      }
    }

    if (!finalData) {
      finalData = {
        content: [{ type: 'text', text: '{"error":"Analysis timed out — try again"}' }],
      };
    }

    return res.status(200).json(finalData);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
};
