import { tahtayiOlustur, zarAt, hamleYap } from './tavlaMotoru';
import { TavlaOyuncusu } from './types';

console.log("=========================================");
console.log("🎲 LOUNGE 101 CLUB AKILLI TAVLA MASASI 🎲");
console.log("=========================================");

let tahta = tahtayiOlustur();
let suleyman: TavlaOyuncusu = {
  id: "1",
  isim: "Süleyman",
  renk: 'beyaz',
  kirikPullar: 1, // 1 adet kırık pul var
  toplananPullar: 0
};

// Sabit şanssız zarı simüle etmek yerine gerçek rastgele zarı atıyoruz
let zarDurumu = zarAt();
console.log(`🎲 Atılan Zarlar: [${zarDurumu.zar1}-${zarDurumu.zar2}]`);
console.log(`⚠️ Süleyman'ın Durumu: ${suleyman.kirikPullar} adet kırık pulu var.\n`);

// Eldeki tüm hamle haklarını sırayla dönüyoruz
let oynananZarlar: number[] = [];

for (const mevcutZar of zarDurumu.hamleHaklari) {
  if (oynananZarlar.includes(mevcutZar) && zarDurumu.zar1 !== zarDurumu.zar2) continue;

  console.log(`👉 Süleyman [${mevcutZar}] zarını deniyor...`);
  
  // Hamleyi oyna (Kırık varsa kaynakIndex 0 verilir)
  const kaynak = suleyman.kirikPullar > 0 ? 0 : 12; // Kırık yoksa 12. haneden yürü
  const sonuc = hamleYap(tahta, suleyman, kaynak, mevcutZar);
  
  if (sonuc.basarili) {
    tahta = sonuc.tahta;
    suleyman = sonuc.oyuncu;
    oynananZarlar.push(mevcutZar);
    console.log(sonuc.mesaj);
  } else {
    console.log(sonuc.mesaj + " (Diğer zar denenecek...)");
  }
}

console.log("=========================================");