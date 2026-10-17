export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { image, mask } = req.body;
    if (!image ||!mask) return res.status(400).json({ error: 'image/mask missing' });

    const HF_KEY = process.env.HF_KEY;
    if (!HF_KEY) return res.status(500).json({ error: 'HF_KEY missing in Vercel' });

    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    }

    const imageBlob = dataURLtoBlob(image);
    const maskBlob = dataURLtoBlob(mask);

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('mask', maskBlob, 'mask.png');

    const hfRes = await fetch('https://api-inference.huggingface.co/models/Smirnov75/LaMa', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_KEY}` },
      body: formData,
    });

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      console.log('HF Error:', txt);
      // Fallback to another model if LaMa fails
      return res.status(500).json({ error: 'HF says: ' + txt.slice(0,200) });
    }

    const arrayBuffer = await hfRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.status(200).json({ result: `data:image/png;base64,${base64}` });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'fetch failed: ' + e.message });
  }
}
