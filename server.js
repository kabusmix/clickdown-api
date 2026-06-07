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

// Instagram - YENİ YÖNTEM
app.get('/api/instagram', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL gerekli' });
  }
  
  try {
    // Sayfayı çek
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Accept': 'text/html'
      },
      timeout: 15000
    });
    
    const html = response.data;
    
    // Video URL'sini bul
    let videoUrl = null;
    let isVideo = false;
    
    // og:video meta tag
    const ogVideo = html.match(/<<meta property="og:video" content="([^"]+)"/);
    const ogVideoSecure = html.match(/<<meta property="og:video:secure_url" content="([^"]+)"/);
    
    if (ogVideo) {
      videoUrl = ogVideo[1];
      isVideo = true;
    } else if (ogVideoSecure) {
      videoUrl = ogVideoSecure[1];
      isVideo = true;
    }
    
    // Thumbnail
    const thumbnailMatch = html.match(/<<meta property="og:image" content="([^"]+)"/);
    const thumbnailUrl = thumbnailMatch ? thumbnailMatch[1] : null;
    
    // Title
    const titleMatch = html.match(/<<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Instagram Post';
    
    if (!videoUrl) {
      return res.status(404).json({ success: false, error: 'Medya bulunamadi' });
    }
    
    res.json({
      success: true,
      platform: 'instagram',
      originalUrl: url,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      title: title,
      type: isVideo ? 'video' : 'image',
      isVideo: isVideo
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API calisiyor: port ${PORT}`);
});
