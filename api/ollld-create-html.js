export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { 
    repo, 
    path, 
    content,
    title = '',
    description = '',
    keywords = '',
    author = '',
    viewport = 'width=device-width, initial-scale=1.0'
  } = req.body;
  
  const token = process.env.GITHUB_PAT;

  if (!token) {
    return res.status(500).json({ error: 'GitHub token missing' });
  }

  try {
    const filename = path.endsWith('.html') ? path : `${path}.html`;

    const metaTags = [
      title ? `<title>${title}</title>` : '',
      description ? `<meta name="description" content="${description}">` : '',
      keywords ? `<meta name="keywords" content="${keywords}">` : '',
      author ? `<meta name="author" content="${author}">` : '',
      `<meta name="viewport" content="${viewport}">`,
      '<meta charset="UTF-8">'
    ].filter(tag => tag).join('\n    ');

    // Preserve all inline styles and formatting
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
${metaTags}
<style>
/* Base styles to ensure consistent rendering */
body {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  color: #24292e;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
h1, h2, h3, h4, h5, h6 {
  margin: 1em 0 0.5em;
  line-height: 1.2;
}
p {
  margin: 0 0 1em;
}
ul, ol {
  padding-left: 2em;
  margin: 0 0 1em;
}
hr {
  margin: 1em 0;
}
</style>
</head>
<body>
${content}
</body>
</html>`;

    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Created via HTML Creator',
        content: Buffer.from(fullHtml).toString('base64'),
        // Optional: Set branch if needed
        // branch: 'main' 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('GitHub API error:', data);
      return res.status(response.status).json({ 
        error: 'GitHub API error',
        details: data.message || 'Unknown error',
        validation_errors: data.errors // Include validation errors if present
      });
    }

    res.status(200).json({
      url: data.content?.html_url,
      downloadUrl: data.content?.download_url,
      commit: data.commit // Include commit information
    });

  } catch (error) {
    console.error('Failed to create file:', error);
    res.status(500).json({ 
      error: 'Failed to create file',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
