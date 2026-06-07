const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ClickDown API', version: '2.0.0' });
});

// TikTok - tikwm.com API (çalışıyor!)
app.get('/api/tiktok', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL gerekli' });
  }
  
  try {
    // tikwm.com API'si - watermark olmadan
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    const data = response.data;
    
    if (!data || !data.data) {
      throw new Error('Video bulunamadi');
    }
    
    const videoData = data.data;
    
    res.json({
      success: true,
      platform: 'tiktok',
      originalUrl: url,
      videoUrl: videoData.play, // watermark olmayan video
      thumbnailUrl: videoData.cover,
      title: videoData.title,
      author: videoData.author?.nickname,
      duration: videoData.duration,
      type: 'video',
      isVideo: true
    });
    
  } catch (error) {
    console.error('TikTok error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Instagram - Alternatif yöntem (thumbnail + bilgi)
app.get('/api/instagram', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL gerekli' });
  }
  
  try {
    // Instagram sayfasını çek
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Accept': 'text/html'
      },
      timeout: 15000
    });
    
    const html = response.data;
    
    // Meta tag'lerden bilgi al
    const titleMatch = html.match(/<<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<<meta property="og:image" content="([^"]+)"/);
    const videoMatch = html.match(/<<meta property="og:video" content="([^"]+)"/);
    
    const title = titleMatch ? titleMatch[1] : 'Instagram Post';
    const imageUrl = imageMatch ? imageMatch[1] : null;
    const videoUrl = videoMatch ? videoMatch[1] : null;
    
    // Eğer video URL'si varsa
    if (videoUrl) {
      res.json({
        success: true,
        platform: 'instagram',
        originalUrl: url,
        videoUrl: videoUrl,
        thumbnailUrl: imageUrl,
        title: title,
        type: 'video',
        isVideo: true
      });
    } else {
      // Sadece resim varsa
      res.json({
        success: true,
        platform: 'instagram',
        originalUrl: url,
        videoUrl: imageUrl, // resim URL'si
        thumbnailUrl: imageUrl,
        title: title,
        type: 'image',
        isVideo: false
      });
    }
    
  } catch (error) {
    console.error('Instagram error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API calisiyor: port ${PORT}`);
});
