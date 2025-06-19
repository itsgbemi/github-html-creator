export default async (req, res) => {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Only POST allowed' });
}

const { repo, path, content } = req.body;
const token = process.env.GITHUB_PAT;

if (!token) {
return res.status(500).json({ error: 'GitHub token missing' });
}

try {
const filename = path.endsWith('.html') ? path : `${path}.html`;

const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${filename.split('/').pop()}</title>
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
content: Buffer.from(fullHtml).toString('base64')
})
});

const data = await response.json();
res.status(response.status).json({
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
