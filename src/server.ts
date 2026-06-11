// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Yazdığımız modülleri sunucuya bağlıyoruz
import { oyunGirisiniYonet } from './shared/authYonetimi';
import { odayaBaglan, paketGonder } from './shared/sohbetSunucusu';
import { OyuncuHesabi } from './shared/types';

const app = express();
app.use(express.json()); // Gelen JSON isteklerini okuyabilmek için

const httpServer = createServer(app);
// CORS ayarlarını yaparak mobil cihazların ve web arayüzlerinin bağlanmasını sağlıyoruz
const io = new Server(httpServer, {
  cors: { origin: "*" } 
});

const PORT = 3000;

// -----------------------------------------------------------------
// 1. HTTP REST API ENDPOINTS (Giriş ve Mağaza İşlemleri)
// -----------------------------------------------------------------

// Güvenli Giriş API'si (Misafir, Google, Apple)
app.post('/api/auth/login', (req, res) => {
  const { hariciId, yontem, kullaniciAdi } = req.body;
  
  if (!hariciId || !yontem) {
    return res.status(400).json({ error: "Eksik parametre! hariciId ve yontem zorunludur." });
  }

  const sonuc = oyunGirisiniYonet(hariciId, yontem, kullaniciAdi);
  return res.json(sonuc);
});

// -----------------------------------------------------------------
// 2. SOCKET.IO REAL-TIME NETWORK (Canlı Sohbet Odaları ve Sesli Chat)
// -----------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🔌 [AĞ] Yeni bir cihaz sunucuya bağlandı. Soket ID: ${socket.id}`);

  // Kural A: Oyuncu bir odaya katılmak istediğinde
  socket.on('oda_katil', (data: { oyuncu: OyuncuHesabi, hedefOda: string, odaTuru: 'Küresel' | 'Şehir' | 'Masa' | 'Klan' }) => {
    const { oyuncu, hedefOda, odaTuru } = data;
    
    const kontrol = odayaBaglan(oyuncu, hedefOda, odaTuru);

    if (kontrol.basarili) {
      socket.join(kontrol.odaAdi); 
      console.log(`👥 [ODA] ${oyuncu.isim}, [${kontrol.odaAdi}] odasına giriş yaptı.`);
      
      socket.to(kontrol.odaAdi).emit('sistem_mesaji', { mesaj: `📢 ${oyuncu.isim} odaya katıldı.` });
      socket.emit('oda_onay', { basarili: true, odaAdi: kontrol.odaAdi, mesaj: kontrol.mesaj });
    } else {
      socket.emit('oda_onay', { basarili: false, mesaj: kontrol.mesaj });
    }
  });

  // Kural B: Oyuncu odaya Metin Mesajı attığında
  socket.on('mesaj_gonder', (data: { oyuncu: OyuncuHesabi, odaAdi: string, mesaj: string }) => {
    const { oyuncu, odaAdi, mesaj } = data;
    
    const paket = paketGonder(oyuncu, odaAdi, mesaj, 'metin');
    
    io.to(odaAdi).emit('yeni_mesaj', paket);
    console.log(`💬 [SOHBET] ${odaAdi} -> ${paket.isim}: ${paket.icerik}`);
  });

  // Kural C: Oyuncu Ses Gönderdiğinde
  socket.on('ses_gonder', (data: { oyuncu: OyuncuHesabi, odaAdi: string, sesData: string }) => {
    const { oyuncu, odaAdi, sesData } = data;
    
    const paket = paketGonder(oyuncu, odaAdi, sesData, 'ses');
    
    socket.to(odaAdi).emit('yeni_ses', paket);
    console.log(`🔊 [SES CHAT] ${oyuncu.isim} odasındakilere ${odaAdi} ses paketi gönderdi.`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ [AĞ] Bir cihazın bağlantısı koptu. Soket ID: ${socket.id}`);
  });
});

// Sunucuyu Ayağa Kaldırıyoruz
httpServer.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`🚀 LOUNGE 101 CANLI WEB SUNUCUSU ŞU AN AKTİF!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`=================================================================`);
});