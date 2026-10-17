export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { image, mask } = req.body;
    const HF_KEY = process.env.HF_KEY?.trim();
    if (!HF_KEY) return res.status(500).json({ error: 'HF_KEY missing in Vercel' });

    function dataURLtoBlob(dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1] || 'image/png';
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

    let hfRes;
    let retries = 3;
    while (retries > 0) {
      hfRes = await fetch('https://api-inference.huggingface.co/models/Smirnov75/LaMa', {
        method: 'POST',
        headers: { Authorization: `Bearer ${HF_KEY}` },
        body: formData,
      });
      if (hfRes.status === 503) {
        await new Promise(r => setTimeout(r, 5000));
        retries--;
        continue;
      }
      break;
    }

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      if (txt.includes('loading') || txt.includes('Load failed')) {
        return res.status(503).json({ error: 'AI model abhi load ho raha hai, 20 sec baad fir se try kar bhai!' });
      }
      return res.status(500).json({ error: txt.slice(0, 300) });
    }

    const arrayBuffer = await hfRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.status(200).json({ result: `data:image/png;base64,${base64}` });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
