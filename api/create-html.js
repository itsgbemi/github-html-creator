export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { repo, path, html } = req.body;
  const token = process.env.GITHUB_PAT;

  if (!token) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    // Ensure filename ends with .html
    const filename = path.endsWith('.html') ? path : `${path}.html`;
    
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'HTML file created via rich-text editor',
        content: Buffer.from(html).toString('base64'),
      }),
    });

    const data = await response.json();
    res.status(response.status).json({
      success: true,
      url: data.content?.html_url || `https://github.com/${repo}/blob/main/${filename}`,
      download_url: data.content?.download_url || ''
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create HTML file',
      details: error.message 
    });
  }
};
