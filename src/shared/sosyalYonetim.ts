import { OyuncuHesabi, SohbetKanali } from './types';
import { getVIPAvantajlari } from './vipYonetimi';

// 1. Kanallara Göre Sohbet Mesajı Gönderme
export function mesajGonder(oyuncu: OyuncuHesabi, kanal: SohbetKanali, mesaj: string): string {
  const konumEtiketi = kanal === 'Şehir' ? `[${oyuncu.sehir}] ` : '';
  const rutbeEtiketi = `<${oyuncu.rutbe}>`;
  return `💬 [${kanal}] ${konumEtiketi}${rutbeEtiketi} ${oyuncu.isim}: ${mesaj}`;
}

// 2. Arkadaş Ekleme
export function arkadasEkle(oyuncu: OyuncuHesabi, yeniArkadasId: string): { guncelOyuncu: OyuncuHesabi, mesaj: string } {
  if (oyuncu.arkadasListesi.includes(yeniArkadasId)) {
    return { guncelOyuncu: oyuncu, mesaj: "⚠️ Bu oyuncu zaten arkadaş listenizde!" };
  }
  
  const yeniHesap = { ...oyuncu };
  yeniHesap.arkadasListesi.push(yeniArkadasId);
  return { guncelOyuncu: yeniHesap, mesaj: "✅ Arkadaş başarıyla eklendi!" };
}

// 3. Arkadaşa Çip Hediyesi Gönderme (VIP Vergi İndirimi Dahil!)
export function cipTransferiYap(gonderen: OyuncuHesabi, alan: OyuncuHesabi, miktar: number): { guncelGonderen: OyuncuHesabi, guncelAlan: OyuncuHesabi, mesaj: string, basarili: boolean } {
  if (gonderen.cipBakiyesi < miktar) {
    return { guncelGonderen: gonderen, guncelAlan: alan, mesaj: "❌ Yetersiz bakiye! Çip gönderilemedi.", basarili: false };
  }

  // Standart sistem kesintisi %15 olsun. VIP'ler bu kesintiyi düşürür.
  const vipAvantaji = getVIPAvantajlari(gonderen.vipSeviyesi);
  const gercekKesintiOrani = Math.max(0, 15 - vipAvantaji.hediyeMasrafIndirimi); // Örn: VIP 1 isen %15 - %10 = %5 kesinti!
  
  const kesintiMiktari = (miktar * gercekKesintiOrani) / 100;
  const karsiTarafaGecen = miktar - kesintiMiktari;

  const yeniGonderen = { ...gonderen, cipBakiyesi: gonderen.cipBakiyesi - miktar };
  const yeniAlan = { ...alan, cipBakiyesi: alan.cipBakiyesi + karsiTarafaGecen };

  return { 
    guncelGonderen: yeniGonderen, 
    guncelAlan: yeniAlan, 
    mesaj: `🎁 Çip Transferi Başarılı! Sistem %${gercekKesintiOrani} vergi kesti. Karşı tarafa ${karsiTarafaGecen} Çip ulaştı.`, 
    basarili: true 
  };
}

// 4. Günlük Beğeni Gönderme (24 Saatte Bir 2500 Çip Kazandırır)
export function begeniGonder(gonderen: OyuncuHesabi, alan: OyuncuHesabi): { guncelGonderen: OyuncuHesabi, guncelAlan: OyuncuHesabi, mesaj: string } {
  const simdi = new Date();
  const sonBegeniZamani = gonderen.sonBegeniler[alan.id];

  // 24 saat kontrolü
  if (sonBegeniZamani) {
    const farkSaat = (simdi.getTime() - sonBegeniZamani.getTime()) / (1000 * 60 * 60);
    if (farkSaat < 24) {
      const kalanSaat = Math.ceil(24 - farkSaat);
      return { guncelGonderen: gonderen, guncelAlan: alan, mesaj: `⏳ Bu arkadaşınıza tekrar beğeni göndermek için ${kalanSaat} saat beklemelisiniz.` };
    }
  }

  // 24 saat geçmişse veya ilk defa gönderiliyorsa
  const yeniGonderen = { ...gonderen };
  yeniGonderen.sonBegeniler[alan.id] = simdi; // Zamanı güncelle
  
  const yeniAlan = { ...alan, cipBakiyesi: alan.cipBakiyesi + 2500 }; // 2500 Çip hediye et (Sistemden üretilir)

  return {
    guncelGonderen: yeniGonderen,
    guncelAlan: yeniAlan,
    mesaj: `❤️ Harika! ${gonderen.isim}, ${alan.isim} adlı arkadaşını beğendi ve ona 2500 Çip kazandırdı!`
  };
}