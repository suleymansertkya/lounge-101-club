import { Hane, PulRengi, ZarDurumu, TavlaOyuncusu } from './types';

// 1. Standart Tavla Dizilişini Hazırla
export function tahtayiOlustur(): Hane[] {
  const tahta: Hane[] = [];
  for (let i = 1; i <= 24; i++) {
    tahta.push({ index: i, pulRengi: null, pulSayisi: 0 });
  }

  // Geleneksel Diziliş
  tahta[0] = { index: 1, pulRengi: 'beyaz', pulSayisi: 2 };
  tahta[23] = { index: 24, pulRengi: 'siyah', pulSayisi: 2 };
  tahta[5] = { index: 6, pulRengi: 'siyah', pulSayisi: 5 };
  tahta[18] = { index: 19, pulRengi: 'beyaz', pulSayisi: 5 };
  tahta[7] = { index: 8, pulRengi: 'siyah', pulSayisi: 3 };
  tahta[16] = { index: 17, pulRengi: 'beyaz', pulSayisi: 3 };
  tahta[11] = { index: 12, pulRengi: 'beyaz', pulSayisi: 5 };
  tahta[12] = { index: 13, pulRengi: 'siyah', pulSayisi: 5 };

  return tahta;
}

// 2. Zar Atma Algoritması
export function zarAt(): ZarDurumu {
  const z1 = Math.floor(Math.random() * 6) + 1;
  const z2 = Math.floor(Math.random() * 6) + 1;
  
  let haklar: number[] = [];
  if (z1 === z2) {
    haklar = [z1, z1, z1, z1]; // Çift gelirse 4 hak
  } else {
    haklar = [z1, z2];
  }
  return { zar1: z1, zar2: z2, hamleHaklari: haklar };
}

// 3. Gelişmiş Hamle Yapma Fonksiyonu (Kırık Kontrolü Dahil)
export function hamleYap(
  tahta: Hane[], 
  oyuncu: TavlaOyuncusu, 
  kaynakIndex: number, 
  zar: number
): { tahta: Hane[], oyuncu: TavlaOyuncusu, basarili: boolean, mesaj: string } {
  
  const kopyaTahta = [...tahta];
  const renk = oyuncu.renk;
  let hedefIndex = 0;

  // --- KURAL 1: KIRIK PUL KONTROLÜ ---
  if (oyuncu.kirikPullar > 0) {
    // Beyaz kırıklar 24'lük taraftan (Siyahın evinden) içeri girer, Siyah kırıklar 1'lik taraftan girer
    hedefIndex = renk === 'beyaz' ? zar : 25 - zar;
    const hedefHane = kopyaTahta[hedefIndex - 1];

    // Girmek istediği yerde rakip kapısı var mı?
    if (hedefHane.pulSayisi >= 2 && hedefHane.pulRengi !== renk) {
      return { tahta, oyuncu, basarili: false, mesaj: `❌ Kırık girilemedi! Hane ${hedefIndex} rakip kapısı.` };
    }

    oyuncu.kirikPullar--; // Kırık pul başarıyla girdi
    
    // Taş Kırma Durumu (İçeri girerken rakibin tek taşını kırma)
    if (hedefHane.pulSayisi === 1 && hedefHane.pulRengi !== renk) {
      hedefHane.pulRengi = renk;
      hedefHane.pulSayisi = 1;
      return { tahta: kopyaTahta, oyuncu, basarili: true, mesaj: `💥 KIRIK GİRDİ VE VURDU! ${oyuncu.isim} kırık pulunu Hane ${hedefIndex}'den içeri soktu ve oradaki tek rakip pulu kırdı!` };
    }

    // Normal Giriş
    hedefHane.pulRengi = renk;
    hedefHane.pulSayisi++;
    return { tahta: kopyaTahta, oyuncu, basarili: true, mesaj: `🎲 Kırık Başarıyla Girdi: ${oyuncu.isim} kırık pulunu Hane ${hedefIndex}'den içeri soktu.` };
  }

  // --- NORMAL HAMLE AKIŞI ---
  hedefIndex = renk === 'beyaz' ? kaynakIndex + zar : kaynakIndex - zar;

  if (hedefIndex < 1 || hedefIndex > 24) {
    return { tahta, oyuncu, basarili: false, mesaj: "Geçersiz hamle: Tahta dışına çıkılamaz!" };
  }

  const kaynakHane = kopyaTahta[kaynakIndex - 1];
  const hedefHane = kopyaTahta[hedefIndex - 1];

  if (kaynakHane.pulSayisi === 0 || kaynakHane.pulRengi !== renk) {
    return { tahta, oyuncu, basarili: false, mesaj: "Geçersiz hamle: Seçilen hanede pulunuz yok!" };
  }

  if (hedefHane.pulSayisi >= 2 && hedefHane.pulRengi !== renk) {
    return { tahta, oyuncu, basarili: false, mesaj: `❌ Hamle yapılamaz! Hane ${hedefIndex} rakibin kapısı!` };
  }

  // Kaynaktan taşı al
  kaynakHane.pulSayisi--;
  if (kaynakHane.pulSayisi === 0) kaynakHane.pulRengi = null;

  // Hedefte rakibin tek taşı varsa KIRMA
  if (hedefHane.pulSayisi === 1 && hedefHane.pulRengi !== renk) {
    hedefHane.pulRengi = renk;
    hedefHane.pulSayisi = 1;
    return { tahta: kopyaTahta, oyuncu, basarili: true, mesaj: `💥 KIRILDI! ${oyuncu.isim} Hane ${hedefIndex}'deki tek rakip pulu kırdı!` };
  }

  // Normal İlerleme veya Kapı Alma
  hedefHane.pulRengi = renk;
  hedefHane.pulSayisi++;
  
  const aksiyonMesajı = hedefHane.pulSayisi >= 2 
    ? `🛡️ ${oyuncu.isim} Hane ${hedefIndex}'de KAPI ALDI!` 
    : `🎲 ${oyuncu.isim} pulunu Hane ${kaynakIndex}'den ${hedefIndex}'e yürüttü.`;

  return { tahta: kopyaTahta, oyuncu, basarili: true, mesaj: aksiyonMesajı };
}