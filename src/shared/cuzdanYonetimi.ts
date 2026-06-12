import { OyuncuHesabi, CipPaketi, VIPPaketi } from './types';

// 1. Süleyman'ın Belirlediği Çip Paketleri (Dokunmadık!)
export const MAGAZE_PAKETLERI: CipPaketi[] = [
  { id: "P1", paketAdi: "Başlangıç Paketi",   cipMiktari: 50000,    fiyatTL: 10 },
  { id: "P2", paketAdi: "Bronz Set",          cipMiktari: 230000,   fiyatTL: 25 },
  { id: "P3", paketAdi: "Gümüş Paket",        cipMiktari: 750000,   fiyatTL: 75 },
  { id: "P4", paketAdi: "Altın Kombin",       cipMiktari: 1400000,  fiyatTL: 115 },
  { id: "P5", paketAdi: "Platin Avantaj",     cipMiktari: 2000000,  fiyatTL: 160 },
  { id: "P6", paketAdi: "Süper VIP Fırsat",   cipMiktari: 4500000,  fiyatTL: 300 },
  { id: "P7", paketAdi: "Zengin Paketi",      cipMiktari: 15000000, fiyatTL: 950 },
  { id: "P8", paketAdi: "Süleyman ELITE",     cipMiktari: 35000000, fiyatTL: 1900 }
];

// 2. YENİ: VIP Paketleri (Ayrı Sekme)
export const VIP_MARKET: VIPPaketi[] = [
  { id: "VIP1", seviye: 1, sureGun: 30, fiyatTL: 50 },
  { id: "VIP9", seviye: 9, sureGun: 365, fiyatTL: 1933 }
];

// 3. Masaya Oturma (Eski Kod)
export function masayaOturt(oyuncu: OyuncuHesabi, girisUcreti: number): { guncelOyuncu: OyuncuHesabi, basarili: boolean, mesaj: string } {
  if (oyuncu.cipBakiyesi < girisUcreti) {
    return { guncelOyuncu: oyuncu, basarili: false, mesaj: `❌ YETERSİZ ÇİP! Mevcut: ${oyuncu.cipBakiyesi} Çip.` };
  }
  const yeniHesap = { ...oyuncu, cipBakiyesi: oyuncu.cipBakiyesi - girisUcreti };
  return { guncelOyuncu: yeniHesap, basarili: true, mesaj: `🎰 Masaya oturuldu. Kalan: ${yeniHesap.cipBakiyesi} Çip.` };
}

// 4. Çip Satın Alma (Eski Kod)
export function cipSatinAl(oyuncu: OyuncuHesabi, paketId: string): { guncelOyuncu: OyuncuHesabi, mesaj: string } {
  const paket = MAGAZE_PAKETLERI.find(p => p.id === paketId);
  if (!paket) return { guncelOyuncu: oyuncu, mesaj: "❌ Geçersiz paket seçimi!" };

  const yeniHesap = { ...oyuncu };
  yeniHesap.cipBakiyesi += paket.cipMiktari;
  
  return {
    guncelOyuncu: yeniHesap,
    mesaj: `💳 ${paket.fiyatTL} TL tahsil edildi. ${paket.cipMiktari} Çip yüklendi! Bakiye: ${yeniHesap.cipBakiyesi} Çip.`
  };
}

// 5. YENİ: VIP Satın Alma
export function vipSatinAl(oyuncu: OyuncuHesabi, paketId: string): { guncelOyuncu: OyuncuHesabi, mesaj: string } {
  const paket = VIP_MARKET.find(p => p.id === paketId);
  if (!paket) return { guncelOyuncu: oyuncu, mesaj: "Geçersiz VIP Paketi!" };

  const yeniHesap = { ...oyuncu };
  yeniHesap.vipSeviyesi = paket.seviye;
  
  const bitis = new Date();
  bitis.setDate(bitis.getDate() + paket.sureGun);
  yeniHesap.vipBitisTarihi = bitis;

  return {
    guncelOyuncu: yeniHesap,
    mesaj: `👑 TEBRİKLER! ${paket.sureGun} günlük VIP ${paket.seviye} oldunuz! Bitiş: ${bitis.toLocaleDateString()}`
  };
}