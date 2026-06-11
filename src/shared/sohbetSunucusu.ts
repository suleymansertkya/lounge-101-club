import { OyuncuHesabi, SohbetPaketi, MesajTuru } from './types';

// 1. Argo ve Küfür Filtresi Listesi (Yasaklı Kelimeler)
const YASAKLI_KELIMELER = ['salak', 'lan', 'kufur1', 'argo2', 'siktir', 'pic']; 

export function icerikFiltrele(metin: string): string {
  let temizMetin = metin;
  YASAKLI_KELIMELER.forEach(kelime => {
    // Büyük/küçük harf duyarsız şekilde yasaklı kelimeleri bul ve *** ile değiştir
    const regex = new RegExp(kelime, 'gi');
    temizMetin = temizTemizle(temizMetin, regex, kelime.length);
  });
  return temizMetin;
}

function temizTemizle(metin: string, regex: RegExp, uzunluk: number): string {
  const yildiz = '*'.repeat(uzunluk);
  return metin.replace(regex, yildiz);
}

// 2. Canlı Odaya Giriş Kontrolü (Oda ve Yetki Yönetimi)
export function odayaBaglan(oyuncu: OyuncuHesabi, hedefOda: string, odaTuru: 'Küresel' | 'Şehir' | 'Masa' | 'Klan'): { basarili: boolean, odaAdi: string, mesaj: string } {
  
  if (odaTuru === 'Şehir') {
    // Şehir Kontrolü: Oyuncu profilindeki şehir ile girmek istediği oda eşleşmeli
    if (hedefOda !== oyuncu.sehir) {
      return { basarili: false, odaAdi: '', mesaj: `❌ ERİŞİM ENGELLENDİ! Sizin şehriniz [${oyuncu.sehir}]. [${hedefOda}] şehrinin sohbet odasına giremezsiniz!` };
    }
  }

  // Küresel Kanallar, Masalar ve Klanlar için dinamik oda isimleri üretiyoruz
  return { 
    basarili: true, 
    odaAdi: `${odaTuru}_${hedefOda}`, 
    mesaj: `🔌 [Socket.io] ${oyuncu.isim}, başarılı bir şekilde [${odaTuru} - ${hedefOda}] odasına bağlandı (Oda ID: ${odaTuru}_${hedefOda}).` 
  };
}

// 3. Mesaj / Ses Paketi Gönderme ve Dağıtma Motoru
export function paketGonder(
  oyuncu: OyuncuHesabi, 
  odaAdi: string, 
  veri: string, 
  tur: MesajTuru
): SohbetPaketi {
  
  // Eğer metin mesajı ise küfür filtresinden geçir, ses ise ham datayı koru
  const nihaiIcerik = tur === 'metin' ? icerikFiltrele(veri) : `🔊 [Sesli Mesaj Paketi / Base64 Data Stream: ${veri.substring(0, 15)}...]`;

  return {
    id: `MSG_${Date.now()}`,
    oyuncuId: oyuncu.id,
    isim: oyuncu.isim,
    rutbe: oyuncu.rutbe,
    sehir: oyuncu.sehir,
    klanAdi: "Göktürkler", // Örnek klan verisi
    mesajTuru: tur,
    icerik: nihaiIcerik,
    tarih: new Date()
  };
}