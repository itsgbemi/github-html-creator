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

    // Extract just the inner content (remove the outer article tag if present)
    let contentBody = content;
    if (content.startsWith('<article class="content-editable">') && content.endsWith('</article>')) {
      contentBody = content
        .replace('<article class="content-editable">', '')
        .replace('</article>', '');
    }

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
${metaTags}
</head>
<body>
  <article class="content-editable">
${contentBody}
  </article>
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
        content: Buffer.from(fullHtml).toString('base64')
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'GitHub API error',
        details: data.message || 'Unknown error'
      });
    }

    res.status(200).json({
      url: data.content?.html_url,
      downloadUrl: data.content?.download_url
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create file',
      details: error.message 
    });
  }
};
