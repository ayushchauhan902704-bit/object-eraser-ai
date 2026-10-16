export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({error:'Only POST'});

  try {
    const { image, mask } = req.body;
    if (!image) return res.status(400).json({error:'image missing'});

    const cleanImage = image.includes(',')? image.split(',')[1] : image;
    const cleanMask = mask.includes(',')? mask.split(',')[1] : mask;

    const hfRes = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: "remove object, clean background, seamless, high quality",
        image: cleanImage,
        mask_image: cleanMask
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
