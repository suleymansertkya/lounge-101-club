import { OyuncuHesabi, Gonderi, OyunKaydi, CantaEsyasi, CantaKategorisi } from './types';

// 1. Profil İstatistiklerini Hesapla (1 Hediye = 10 Puan)
export function profilOzetiniGetir(oyuncu: OyuncuHesabi) {
  const hediyePuani = oyuncu.alinanHediyeler * 10;
  
  return {
    isim: oyuncu.isim,
    cinsiyet: oyuncu.cinsiyet,
    fotograf: oyuncu.profilFotografiURL ? "Yüklendi" : "Yok",
    toplamOyun: oyuncu.oyunGecmisi.length,
    takipci: oyuncu.takipciSayisi,
    begeniler: oyuncu.alinanBegeniSayisi,
    hediyePuani: hediyePuani
  };
}

// 2. YENİ: Çantayı Resimdeki Sekmelere Göre Gruplayan Motor
export function cantaSekmeleriniGetir(oyuncu: OyuncuHesabi) {
  // Resimdeki 4 ana sekmeyi hazırlıyoruz
  const sekmeler: Record<CantaKategorisi, CantaEsyasi[]> = {
    'Öğe': [],
    'Dekorasyon': [],
    'Fan Rozeti': [],
    'Kutu Bonusu': []
  };

  // Oyuncunun çantasındaki eşyaları ilgili sekmelere dağıtıyoruz
  oyuncu.canta.forEach(esya => {
    if (sekmeler[esya.kategori]) {
      sekmeler[esya.kategori].push(esya);
    }
  });

  return sekmeler;
}

// 3. Profile Yeni Gönderi (Post) Ekleme
export function gonderiPaylas(oyuncu: OyuncuHesabi, mesaj: string): OyuncuHesabi {
  const yeniGonderi: Gonderi = {
    id: `POST_${Date.now()}`,
    icerik: mesaj,
    tarih: new Date(),
    begeniSayisi: 0
  };
  
  const guncelOyuncu = { ...oyuncu };
  guncelOyuncu.gonderiler.push(yeniGonderi);
  return guncelOyuncu;
}

// 4. Son 30 Günlük Oyun Kayıtlarını Filtreleme
export function sonOtuzGunlukOyunlariGetir(oyuncu: OyuncuHesabi): OyunKaydi[] {
  const otuzGunOnce = new Date();
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30); // Bugünden 30 gün geriye git
  return oyuncu.oyunGecmisi.filter(kayit => kayit.tarih >= otuzGunOnce);
}