module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const body = req.body || {};
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Anthropic status:', response.status);
    console.log('Anthropic response:', JSON.stringify(data));
    return res.status(response.status).json(data);

  } catch (err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
