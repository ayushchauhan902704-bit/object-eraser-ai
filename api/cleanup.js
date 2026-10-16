export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'no'});

  try {
    const { image, mask } = req.body; // base64

    if (!image) return res.status(400).json({error:'image missing'});

    // HuggingFace Inpainting Model - FREE
    const hfRes = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `remove object, clean background, seamless`,
        image: image,
        mask_image: mask
      })
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return res.status(500).json({error: errText});
    }

    const buffer = Buffer.from(await hfRes.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);

  } catch (e) {
    return res.status(500).json({error: e.message});
  }
}
