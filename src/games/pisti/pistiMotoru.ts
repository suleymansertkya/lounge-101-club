import { Kart, KartSerisi, PistiOyuncusu } from './types';

// 1. 52'lik İskambil Destesi Oluşturma
export function desteOlustur(): Kart[] {
  const deste: Kart[] = [];
  const seriler: KartSerisi[] = ['kupa', 'karo', 'maca', 'sinek'];
  const degerler = [
    { d: 'A', s: 1 }, { d: '2', s: 2 }, { d: '3', s: 3 }, { d: '4', s: 4 },
    { d: '5', s: 5 }, { d: '6', s: 6 }, { d: '7', s: 7 }, { d: '8', s: 8 },
    { d: '9', s: 9 }, { d: '10', s: 10 }, { d: 'J', s: 11 }, { d: 'Q', s: 12 }, { d: 'K', s: 13 }
  ];

  let id = 1;
  for (const seri of seriler) {
    for (const eleman of degerler) {
      deste.push({ id: id++, seri: seri, deger: eleman.d, sayisalDeger: eleman.s });
    }
  }
  return deste;
}

// 2. Desteyi Karıştırma
export function desteKaristir(deste: Kart[]): Kart[] {
  const karistirilmis = [...deste];
  for (let i = karistirilmis.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [karistirilmis[i], karistirilmis[j]] = [karistirilmis[j], karistirilmis[i]];
  }
  return karistirilmis;
}

// 3. Kart Dağıtma (Her oyuncuya 4 kart verir)
export function kartlariDagit(deste: Kart[], oyuncular: PistiOyuncusu[]): { kalanDeste: Kart[], guncelOyuncular: PistiOyuncusu[] } {
  const kopyaDeste = [...deste];
  const guncelOyuncular = oyuncular.map(oyuncu => {
    const yeniEl = kopyaDeste.splice(0, 4);
    return { ...oyuncu, el: yeniEl };
  });
  return { kalanDeste: kopyaDeste, guncelOyuncular };
}

// 4. Bot Yapay Zekası: Eldeki En Mantıklı Kartı Seçer
export function botIcinKartSec(oyuncu: PistiOyuncusu, yerdekiKartlar: Kart[]): Kart {
  const el = oyuncu.el;
  
  // Eğer yerde kart varsa kontrol et
  if (yerdekiKartlar.length > 0) {
    const enUsttekiKart = yerdekiKartlar[yerdekiKartlar.length - 1];
    
    // A) PİŞTİ veya EŞLEŞME FIRSATI: Elde yerdekiyle aynı kart varsa YAPACAK affetme, direkt at!
    const eslesenKart = el.find(k => k.deger === enUsttekiKart.deger);
    if (eslesenKart) return eslesenKart;

    // B) VALE STRATEJİSİ: Eğer yerde çok kart biriktiyse ve elde Vale (J) varsa, hepsini toplamak için at!
    const valeKart = el.find(k => k.deger === 'J');
    if (valeKart && yerdekiKartlar.length >= 3) return valeKart;
  }

  // C) SIFIR RİSK STRATEJİSİ: Eğer eşleşme yoksa, eldeki Vale'yi (J) sonraya sakla, sıradan bir kart at
  const valeOlmayanlar = el.filter(k => k.deger !== 'J');
  if (valeOlmayanlar.length > 0) return valeOlmayanlar[0];

  // Mecburen eldeki ilk kartı at
  return el[0];
}

// 5. Kart Atma ve Sonuç Hesaplama
export function kartAt(oyuncu: PistiOyuncusu, kartId: number, yerdekiKartlar: Kart[]): { oyuncu: PistiOyuncusu, yeniYer: Kart[], mesaj: string } {
  const atilanKartIndeks = oyuncu.el.findIndex(k => k.id === kartId);
  const atilanKart = oyuncu.el[atilanKartIndeks];
  
  oyuncu.el.splice(atilanKartIndeks, 1);
  let mesaj = `🃏 ${oyuncu.isim} yere [${atilanKart.seri.toUpperCase()} ${atilanKart.deger}] attı.`;

  if (yerdekiKartlar.length > 0) {
    const enUsttekiKart = yerdekiKartlar[yerdekiKartlar.length - 1];

    // 💥 PİŞTİ KONTROLÜ
    if (yerdekiKartlar.length === 1 && atilanKart.deger === enUsttekiKart.deger) {
      oyuncu.topladigiKartlar.push(enUsttekiKart, atilanKart);
      const artiSkor = atilanKart.deger === 'J' ? 20 : 10;
      oyuncu.skor += artiSkor;
      return { oyuncu, yeniYer: [], mesaj: `💥 PİŞTİ! ${oyuncu.isim} yerdeki tek [${enUsttekiKart.deger}] kartının üzerine aynısını bastı! (+${artiSkor} Puan)` };
    }
    
    // 🃏 VALE VEYA AYNI SAYI İLE KARTLARI TOPLAMA
    if (atilanKart.deger === enUsttekiKart.deger || atilanKart.deger === 'J') {
      oyuncu.topladigiKartlar.push(...yerdekiKartlar, atilanKart);
      return { oyuncu, yeniYer: [], mesaj: `🎉 ${oyuncu.isim} yerdeki tüm kartları (${yerdekiKartlar.length + 1} adet) topladı!` };
    }
  }

  return { oyuncu, yeniYer: [...yerdekiKartlar, atilanKart], mesaj };
}