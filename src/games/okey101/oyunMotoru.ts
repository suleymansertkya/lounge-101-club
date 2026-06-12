import { Tas, TasRengi, Oyuncu } from "./types";
// 1. Taşları Üreten Fonksiyon
export function desteOlustur(): Tas[] {
  const deste: Tas[] = [];
  const renkler: TasRengi[] = ['kirmizi', 'siyah', 'mavi', 'sari'];
  let tasId = 1;

  for (const renk of renkler) {
    for (let set = 1; set <= 2; set++) {
      for (let sayi = 1; sayi <= 13; sayi++) {
        deste.push({
          id: tasId++,
          renk: renk,
          deger: sayi,
          sahteOkeyMi: false
        });
      }
    }
  }

  deste.push({ id: tasId++, renk: 'joker', deger: 0, sahteOkeyMi: true });
  deste.push({ id: tasId++, renk: 'joker', deger: 0, sahteOkeyMi: true });

  return deste;
}

// 2. Taşları Rastgele Karıştıran Fonksiyon (Fisher-Yates Algoritması)
export function desteKaristir(deste: Tas[]): Tas[] {
  const karistirilmisDeste = [...deste];
  for (let i = karistirilmisDeste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [karistirilmisDeste[i], karistirilmisDeste[j]] = [karistirilmisDeste[j], karistirilmisDeste[i]];
  }
  return karistirilmisDeste;
}

// 3. Taşları Oyunculara 22-21-21-21 Şeklinde Dağıtan Fonksiyon
export function taslariDagit(deste: Tas[], oyuncular: Oyuncu[]): { oyuncular: Oyuncu[], kalanDeste: Tas[] } {
  const kopyaDeste = [...deste];

  oyuncular.forEach((oyuncu, index) => {
    // İlk oyuncuya (index 0) 22 taş, diğerlerine 21 taş veriyoruz
    const alinacakTasSayisi = index === 0 ? 22 : 21;
    
    // Destenin başından taşları kesip oyuncunun eline yüklüyoruz
    oyuncu.el = kopyaDeste.splice(0, alinacakTasSayisi);
  });

  return {
    oyuncular,
    kalanDeste: kopyaDeste // Masada okey dönmek ve taş çekmek için kalan taşlar
  };
}
// 4. Oyuncunun Elindeki Taşları Renklerine ve Sayılarına Göre Sıralayan Fonksiyon
export function eliDiz(el: Tas[]): Tas[] {
  return [...el].sort((a, b) => {
    // 1. Sahte Okeyleri/Jokerleri her zaman en sona at
    if (a.sahteOkeyMi && !b.sahteOkeyMi) return 1;
    if (!a.sahteOkeyMi && b.sahteOkeyMi) return -1;
    if (a.sahteOkeyMi && b.sahteOkeyMi) return 0;

    // 2. Renklere göre grupla (Alfabetik: kirmizi, mavi, sari, siyah gibi)
    if (a.renk < b.renk) return -1;
    if (a.renk > b.renk) return 1;

    // 3. Aynı renkteki taşları kendi içinde küçükten büyüğe diz
    return a.deger - b.deger;
  });
}// 5. Yere Gösterge Açıp Okey Taşını Hesaplayan Fonksiyon
export function okeyBelirle(kalanDeste: Tas[]): { gosterge: Tas, okey: { renk: TasRengi, deger: number } } {
  // Kalan desteden rastgele bir indeks seçiyoruz (Joker/Sahte okey çıkmaması için kontrol ekliyoruz)
  let rastgeleIndeks = Math.floor(Math.random() * kalanDeste.length);
  while (kalanDeste[rastgeleIndeks].sahteOkeyMi) {
    rastgeleIndeks = Math.floor(Math.random() * kalanDeste.length);
  }

  const gosterge = kalanDeste[rastgeleIndeks];
  
  // Okey taşı göstergenin bir üst sayısıdır. Eğer 13 ise 1 olur.
  let okeyDeger = gosterge.deger + 1;
  if (okeyDeger > 13) {
    okeyDeger = 1;
  }

  return {
    gosterge,
    okey: {
      renk: gosterge.renk,
      deger: okeyDeger
    }
  };
}// 6. Desteden (Yerden) En Üstteki Taşı Çekip Oyuncunun Eline Ekleyen Fonksiyon
export function tasCek(kalanDeste: Tas[], oyuncu: Oyuncu): { kalanDeste: Tas[], oyuncu: Oyuncu } {
  if (kalanDeste.length === 0) {
    throw new Error("Desteden çekilecek taş kalmadı!");
  }
  
  const kopyaDeste = [...kalanDeste];
  // Destenin en başından 1 taş çekiyoruz
  const cekilenTas = kopyaDeste.shift()!;
  
  // Çekilen taşı oyuncunun eline ekliyoruz
  oyuncu.el.push(cekilenTas);
  
  // Istakayı otomatik olarak yeniden diziyoruz
  oyuncu.el = eliDiz(oyuncu.el);
  
  console.log(`\n🎲 ${oyuncu.isim} desteden taş çekti: [${cekilenTas.sahteOkeyMi ? 'JOKER' : cekilenTas.renk.toUpperCase() + ' ' + cekilenTas.deger}]`);
  
  return {
    kalanDeste: kopyaDeste,
    oyuncu
  };
}

// 7. Oyuncunun Elinden Belirli Bir Taşı Yana (Yere) Atmasını Sağlayan Fonksiyon
export function tasAt(oyuncu: Oyuncu, atilacakTasId: number): { oyuncu: Oyuncu, atilanTas: Tas } {
  const tasIndeks = oyuncu.el.findIndex(tas => tas.id === atilacakTasId);
  
  if (tasIndeks === -1) {
    throw new Error("Oyuncunun elinde bu ID'ye sahip bir taş bulunamadı!");
  }
  
  // Taşı elden çıkarıyoruz
  const [atilanTas] = oyuncu.el.splice(tasIndeks, 1);
  
  console.log(`🫳  ${oyuncu.isim} yana taş attı: [${atilanTas.sahteOkeyMi ? 'JOKER' : atilanTas.renk.toUpperCase() + ' ' + atilanTas.deger}]`);
  
  return {
    oyuncu,
    atilanTas
  };
}// 8. Botun Elindeki En Değersiz (Yalnız) Taşı Seçen Fonksiyon
export function botIcinAtilacakTasSec(oyuncu: Oyuncu): Tas {
  const el = oyuncu.el;

  // 1. Güvenlik önlemi: Eğer elde Joker varsa ASLA atma!
  const jokerOlmayanlar = el.filter(tas => !tas.sahteOkeyMi);
  if (jokerOlmayanlar.length === 0) return el[0]; // Hepsi jokerse mecburen ilkini at (ekstrem durum)

  // her taş için bir "değersizlik puanı" hesaplayacağız. Puanı en yüksek olan elden çıkacak.
  let enDegersizTas = jokerOlmayanlar[0];
  let enYuksekPuan = -1;

  for (const tas of jokerOlmayanlar) {
    let degersizlikPuani = 0;

    // A) Seri Kontrolü (Aynı renkten ardışığı var mı?)
    const ayniRenkler = jokerOlmayanlar.filter(t => t.renk === tas.renk);
    const birAltiExists = ayniRenkler.some(t => t.deger === tas.deger - 1);
    const birUstuExists = ayniRenkler.some(t => t.deger === tas.deger + 1);
    
    if (!birAltiExists && !birUstuExists) {
      degersizlikPuani += 10; // Sağında solunda ardışığı yoksa yalnızdır!
    }

    // B) Grup Kontrolü (Diğer renklerde aynı sayıdan var mı?)
    const ayniSayilar = jokerOlmayanlar.filter(t => t.deger === tas.deger && t.renk !== tas.renk);
    if (ayniSayilar.length === 0) {
      degersizlikPuani += 5; // Diğer renklerde de eşi yoksa daha da yalnızdır!
    }

    // C) Sayı Değeri Kontrolü (101'de büyük taşlar el açmaya yarar, küçük yalnız taşları atmak daha mantıklıdır)
    // Küçük taşlara biraz daha değersizlik puanı veriyoruz ki önce küçükleri elden çıkarsın
    degersizlikPuani += (13 - tas.deger) * 0.1;

    // En yalnız taşı güncelle
    if (degersizlikPuani > enYuksekPuan) {
      enYuksekPuan = degersizlikPuani;
      enDegersizTas = tas;
    }
  }

  return enDegersizTas;
}// 9. Oyuncunun Elindeki Geçerli Perlerin (Serilerin) Toplam Puanını Hesaplayan Fonksiyon
export function elPuaniniHesapla(el: Tas[]): number {
  let toplamPuan = 0;
  
  // Basit bir simülasyon per analizi: 
  // Gerçek oyunda 3'lü ve 4'lü gruplar aranır. Altyapımız için oyuncunun elindeki 
  // ardışık sayıların veya aynı sayıdan farklı renklerin oluşturduğu puanı simüle ediyoruz.
  // Gelişmiş per tespiti sonraki aşamalarda derinleştirilebilir.
  
  // Şimdilik test amaçlı: Eldeki tüm taşların sayısal değerlerini topluyoruz 
  // (Gerçek 101 kurallarında sadece per oluşturan taşlar sayılır)
  toplamPuan = el.reduce((toplam, tas) => toplam + tas.deger, 0);
  
  return toplamPuan;
}