import { desteOlustur, desteKaristir, kartlariDagit, botIcinKartSec, kartAt } from './pistiMotoru';
import { PistiOyuncusu, Kart } from './types';

console.log("=================================================");
console.log("♣️ ♦️ LOUNGE 101 CLUB PİŞTİ MASASI BAŞLADI ♥️ ♠️");
console.log("=================================================");

// 1. Masayı ve 4 Oyuncuyu Kur
let oyuncular: PistiOyuncusu[] = [
  { id: "1", isim: "Suleyman", el: [], topladigiKartlar: [], skor: 0 },
  { id: "2", isim: "Ahmet (BOT)", el: [], topladigiKartlar: [], skor: 0 },
  { id: "3", isim: "Mehmet (BOT)", el: [], topladigiKartlar: [], skor: 0 },
  { id: "4", isim: "Zeynep (BOT)", el: [], topladigiKartlar: [], skor: 0 }
];

// 2. Desteyi Hazırla ve Yere İlk 4 Kartı Aç
let deste = desteKaristir(desteOlustur());
let yerdekiKartlar: Kart[] = deste.splice(0, 4);

console.log(`🎴 Oyun Başladı! Yere 4 kart açıldı. En üstteki kart: [${yerdekiKartlar[3].seri.toUpperCase()} ${yerdekiKartlar[3].deger}]`);
console.log(`📦 Destede Kalan Kart Sayısı: ${deste.length}\n-----------------------------------------`);

// 3. ANA OYUN DÖNGÜSÜ (Deste bitene kadar döner)
let turSayisi = 1;

while (deste.length > 0 || oyuncular[0].el.length > 0) {
  
  // Eğer herkesin eli bittiyse ve destede kart kaldıysa, yeni kartları dağıt
  if (oyuncular[0].el.length === 0 && deste.length > 0) {
    console.log(`\n📦 El bitti, desteden yeni kartlar dağıtılıyor... (Tur: ${turSayisi++})`);
    const dagitim = kartlariDagit(deste, oyuncular);
    deste = dagitim.kalanDeste;
    oyuncular = dagitim.guncelOyuncular;
  }

  // 4 Oyuncu sırayla hamle yapar
  for (let i = 0; i < oyuncular.length; i++) {
    let mevcutOyuncu = oyuncular[i];
    
    if (mevcutOyuncu.el.length === 0) continue; // Eğer eli boşsa pas geç (Oyun sonu durumu)

    // Yapay zeka veya oyuncu hamle kartını seçer
    const secilenKart = botIcinKartSec(mevcutOyuncu, yerdekiKartlar);
    
    // Kartı yere at ve sonuçları işle
    const hamle = kartAt(mevcutOyuncu, secilenKart.id, yerdekiKartlar);
    oyuncular[i] = hamle.oyuncu;
    yerdekiKartlar = hamle.yeniYer;

    console.log(hamle.mesaj);
  }
}

console.log("\n=================================================");
console.log("🏁 DESTE BİTTİ - MAÇ SONUCU VE SKORLAR 🏁");
console.log("=================================================");
oyuncular.forEach(o => {
  console.log(`👤 ${o.isim} -> Toplam Skor: ${o.skor} Puan (Topladığı Kart: ${o.topladigiKartlar.length} adet)`);
});
console.log("=================================================");