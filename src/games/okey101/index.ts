import { 
  desteOlustur, 
  desteKaristir, 
  taslariDagit, 
  okeyBelirle, 
  botIcinAtilacakTasSec, 
  tasAt, 
  tasCek, 
  elPuaniniHesapla 
} from './oyunMotoru';
import { Oyuncu } from './types';

console.log("=================================================");
console.log("♣️ ♦️ LOUNGE 101 CLUB ANA OYUN MOTORU AKTIF ♥️ ♠️");
console.log("=================================================");

// 1. Oyuncuları ve Masayı Kur
let oyuncular: Oyuncu[] = [
  { id: "1", isim: "Suleyman (VIP)", el: [], vipSeviyesi: 2 },
  { id: "2", isim: "Ahmet (BOT)", el: [], vipSeviyesi: 0 },
  { id: "3", isim: "Mehmet (BOT)", el: [], vipSeviyesi: 0 },
  { id: "4", isim: "Zeynep (BOT)", el: [], vipSeviyesi: 1 }
];

let deste = desteKaristir(desteOlustur());
const dagitim = taslariDagit(deste, oyuncular);
let kalanDeste = dagitim.kalanDeste;
oyuncular = dagitim.oyuncular;

const oyunOkeyi = okeyBelirle(kalanDeste);
console.log(`🃟 Yere Açılan Gösterge: [${oyunOkeyi.gosterge.renk.toUpperCase()} ${oyunOkeyi.gosterge.deger}]`);
console.log(`⭐ BU ELİN OKEYİ: [${oyunOkeyi.okey.renk.toUpperCase()} ${oyunOkeyi.okey.deger}]`);
console.log("=================================================\n");

// 2. TUR DÖNGÜSÜ (Örnek olarak 1 tam tur döndürüyoruz)
let aktifOyuncuIndeks = 0; // Oyuna Süleyman (22 taşla) başlıyor

for (let hamle = 1; hamle <= 4; hamle++) {
  let mevcutOyuncu = oyuncular[aktifOyuncuIndeks];
  console.log(`👉 [HAMLE ${hamle}] Sıra Kimde: ${mevcutOyuncu.isim}`);

  // Eğer oyuncunun 21 taşı varsa (yani sırası yeni geldiyse) önce yerden taş çeker
  if (mevcutOyuncu.el.length === 21) {
    const cekmeIslemi = tasCek(kalanDeste, mevcutOyuncu);
    kalanDeste = cekmeIslemi.kalanDeste;
    mevcutOyuncu = cekmeIslemi.oyuncu;
  }

  // Oyuncunun el açma puan durumunu kontrol et
  const elPuani = elPuaniniHesapla(mevcutOyuncu.el);
console.log(`📊 ${mevcutOyuncu.isim} Istaka Per Toplamı: ${elPuani} Puan ${elPuani >= 101 ? "(101'i Geçti! El Açabilir 🎉)" : "(Elin açılması için yetersiz)"}`);
  // Oyuncu elindeki en işe yaramaz taşı seçer ve yana atar
  const atilacakTas = botIcinAtilacakTasSec(mevcutOyuncu);
  const atmaIslemi = tasAt(mevcutOyuncu, atilacakTas.id);
  mevcutOyuncu = atmaIslemi.oyuncu;

  // Değişiklikleri ana oyuncular listesine geri kaydet
  oyuncular[aktifOyuncuIndeks] = mevcutOyuncu;

  console.log(`📉 ${mevcutOyuncu.isim} Kalan Taş: ${mevcutOyuncu.el.length}\n-----------------------------------------`);

  // Sırayı bir sonraki oyuncuya geçir (4 kişiden sonra tekrar 0'a döner)
  aktifOyuncuIndeks = (aktifOyuncuIndeks + 1) % 4;
}

console.log("\n=================================================");
console.log("🏁 1 TUR TAMAMLANDI - OYUN AKIŞI KUSURSUZ!");
console.log("=================================================");