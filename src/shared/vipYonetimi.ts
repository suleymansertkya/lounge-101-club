// src/shared/vipYonetimi.ts içindeki fonksiyonu güncelle:

import { OyuncuHesabi, VIPAvantajlari } from './types';

export function getVIPAvantajlari(seviye: number): VIPAvantajlari {
  switch (seviye) {
    case 1:
      // VIP 1 Alanlar: Rakip taşlarını GÖREBİLİR (true)
      return { hediyeMasrafIndirimi: 10, turnuvaIndirimi: 9.5, gunlukBegeniSiniri: 5, iflasDestegiHakki: 1, xpBonusu: 5, rakipTasSayisiGorme: true };
    case 9:
      // VIP 9 Alanlar: Rakip taşlarını GÖREBİLİR (true)
      return { hediyeMasrafIndirimi: 6, turnuvaIndirimi: 6, gunlukBegeniSiniri: 45, iflasDestegiHakki: 4, xpBonusu: 45, rakipTasSayisiGorme: true };
    default:
      // VIP Olmayan Standart Oyuncular (Seviye 0): Rakip taşlarını GÖREMEZ (false)
      return { hediyeMasrafIndirimi: 0, turnuvaIndirimi: 0, gunlukBegeniSiniri: 0, iflasDestegiHakki: 0, xpBonusu: 0, rakipTasSayisiGorme: false };
  }
}

export function vipDurumuKontrolEt(oyuncu: OyuncuHesabi): boolean {
  if (!oyuncu.vipBitisTarihi) return false;
  
  const simdi = new Date();
  if (simdi > oyuncu.vipBitisTarihi) {
    console.log(`⚠️ ${oyuncu.isim} adlı oyuncunun VIP süresi dolmuştur! Özel yetenekler kapatıldı.`);
    return false;
  }
  return true;
}