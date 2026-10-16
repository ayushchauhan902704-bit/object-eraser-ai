export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const contentType = req.headers['content-type'];

    const clipdropRes = await fetch('https://clipdrop-api.co/cleanup/v1', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLIPDROP_KEY,
        'Content-Type': contentType,
      },
      body: body,
    });

    if (!clipdropRes.ok) {
      const text = await clipdropRes.text();
      return res.status(500).send(text);
    }

    const buffer = Buffer.from(await clipdropRes.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (e) {
    res.status(500).send(e.message);
  }
}
