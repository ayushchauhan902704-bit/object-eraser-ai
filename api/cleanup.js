export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({error: 'Method not allowed'});
  try {
    const { image } = req.body;
    const HF_KEY = process.env.HF_KEY;
    if (!HF_KEY) return res.status(500).json({error: 'HF_KEY missing'});

    const hfRes = await fetch("https://api-inference.huggingface.co/models/lama", {
      method: "POST",
      headers: { "Authorization": `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: image }),
    });

    if (!hfRes.ok) {
      const t = await hfRes.text();
      return res.status(500).json({error: t});
    }
    const blob = await hfRes.blob();
    const buf = await blob.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    res.status(200).json({ result: `data:image/png;base64,${b64}` });
  } catch (e) {
    res.status(500).json({error: e.message});
  }
}
