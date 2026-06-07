const express = require('express');
const cors = require('cors');
const axios = require('axios');

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
      headers: { 'User-Agent': 'Mozilla/5.0' },
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
      author: data.author_name,
      type: 'video'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Instagram - EMBED API YÖNTEMİ
app.get('/api/instagram', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL gerekli' });
  }
  
  try {
    // Instagram Embed API
    const embedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    
    const embedResponse = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    
    const embedData = embedResponse.data;
    
    // Embed HTML'den media URL'sini çıkar
    const html = embedData.html || '';
    
    // Video URL'sini bul
    let videoUrl = null;
    let isVideo = false;
    
    // HTML'de video src ara
    const videoMatch = html.match(/src="([^"]+\.mp4[^"]*)"/);
    if (videoMatch) {
      videoUrl = videoMatch[1];
      isVideo = true;
    }
    
    // Eğer video yoksa, thumbnail kullan
    if (!videoUrl) {
      videoUrl = embedData.thumbnail_url;
    }
    
    if (!videoUrl) {
      return res.status(404).json({ success: false, error: 'Medya bulunamadi' });
    }
    
    res.json({
      success: true,
      platform: 'instagram',
      originalUrl: url,
      videoUrl: videoUrl,
      thumbnailUrl: embedData.thumbnail_url,
      title: embedData.title || 'Instagram Post',
      author: embedData.author_name,
      type: isVideo ? 'video' : 'image',
      isVideo: isVideo
    });
    
  } catch (error) {
    console.error('Instagram error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API calisiyor: port ${PORT}`);
});
