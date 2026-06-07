const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ClickDown API', version: '1.0.0' });
});

// TikTok video çöz
app.get('/api/tiktok', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL gerekli' });
  }
  
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await axios.get(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    
    const data = response.data;
    const videoMatch = data.html.match(/src="([^"]+)"/);
    
    res.json({
      success: true,
      platform: 'tiktok',
      originalUrl: url,
      videoUrl: videoMatch ? videoMatch[1] : null,
      thumbnailUrl: data.thumbnail_url,
      title: data.title,
      author: data.author_name
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Instagram post/reel çöz
app.get('/api/instagram', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL gerekli' });
  }
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html'
      },
      timeout: 15000
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    const videoUrl = $('meta[property="og:video"]').attr('content');
    const imageUrl = $('meta[property="og:image"]').attr('content');
    const title = $('meta[property="og:title"]').attr('content');
    
    const mediaUrl = videoUrl || imageUrl;
    
    if (!mediaUrl) {
      return res.status(404).json({ success: false, error: 'Medya bulunamadı' });
    }
    
    res.json({
      success: true,
      platform: 'instagram',
      originalUrl: url,
      videoUrl: mediaUrl,
      thumbnailUrl: imageUrl,
      title: title,
      type: videoUrl ? 'video' : 'image'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API çalışıyor: port ${PORT}`);
});
