// src/shared/index.ts
import { oyunGirisiniYonet } from './authYonetimi';
import { cipSatinAl, vipSatinAl, MAGAZE_PAKETLERI, VIP_MARKET } from './cuzdanYonetimi';
import { profilOzetiniGetir, cantaSekmeleriniGetir, gonderiPaylas, sonOtuzGunlukOyunlariGetir } from './profilYonetimi';
import { arkadasEkle, begeniGonder, cipTransferiYap } from './sosyalYonetim';
import { getVIPAvantajlari } from './vipYonetimi';
import { odayaBaglan, paketGonder } from './sohbetSunucusu'; // YENİ SOHBET SİSTEMİ İMPORTLARI
import { OyuncuHesabi } from './types';

console.log("=================================================================");
console.log("🔥 LOUNGE 101 CLUB MASTER SERVER (TÜM SİSTEMLER BİRLEŞTİ) 🔥");
console.log("=================================================================\n");

// -----------------------------------------------------------------
// ADIM 1: GÜVENLİ GİRİŞ (AUTH) SİSTEMİ
// -----------------------------------------------------------------
console.log("🔐 [1. ADIM: AUTH SİSTEMİ]");
const girisSuleyman = oyunGirisiniYonet("google_secure_suleyman123", "Google", "Süleyman");
console.log(girisSuleyman.mesaj);

const girisAhmet = oyunGirisiniYonet("device_ahmet_xyz", "Misafir");
console.log(girisAhmet.mesaj);

let suleyman = girisSuleyman.oyuncu!;
let ahmet = girisAhmet.oyuncu!;

// Oyuncu detaylarını dolduruyoruz
suleyman.sehir = "İzmir";
suleyman.cinsiyet = "Erkek";
suleyman.rutbe = "Yönetici";
suleyman.profilFotografiURL = "https://lounge101.com/avatars/suleyman.jpg";

// Resimdeki çanta içeriğini enjekte ediyoruz
suleyman.canta = [
  { id: "C1", isim: "Yarışma Masası Bileti", kategori: "Öğe", adet: 28, aciklama: "Yarışma masasına başvuruda kullanılabilir." },
  { id: "C2", isim: "İsim Değiştirme Kartı", kategori: "Öğe", adet: 5, aciklama: "Kullanıcı adınızı değiştirmenizi sağlar." },
  { id: "C3", isim: "VIP Elmas Yüzük", kategori: "Dekorasyon", adet: 14, aciklama: "Profilinize parlak bir görünüm katar." },
  { id: "C4", isim: "Enerji İksiri", kategori: "Kutu Bonusu", adet: 14, aciklama: "Turnuvalarda %10 XP bonusu sağlar." }
];

suleyman.oyunGecmisi = [
  { oyunTuru: "Tavla", sonuc: "Galibiyet",  tarih: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }, // 40 gün önce (30 gün filtresine takılacak)
  { oyunTuru: "101 Okey", sonuc: "Galibiyet", tarih: new Date() } // Bugün
];

// -----------------------------------------------------------------
// ADIM 2: MAĞAZA VE EKONOMİ KATMANI
// -----------------------------------------------------------------
console.log("\n🛒 [2. ADIM: MAĞAZA SİSTEMİ]");
const cipSonuc = cipSatinAl(suleyman, "P8");
suleyman = cipSonuc.guncelOyuncu;
console.log(cipSonuc.mesaj);

const vipSonuc = vipSatinAl(suleyman, "VIP1");
suleyman = vipSonuc.guncelOyuncu;
console.log(vipSonuc.mesaj);

// -----------------------------------------------------------------
// ADIM 3: SOSYAL AĞ VE GÜNLÜK ÖDÜLLER
// -----------------------------------------------------------------
console.log("\n👥 [3. ADIM: SOSYAL ETKİLEŞİM]");
const arkadasSonuc = arkadasEkle(suleyman, ahmet.id);
suleyman = arkadasSonuc.guncelOyuncu;
console.log(`- ${suleyman.isim} -> ${arkadasSonuc.mesaj}`);

// Günlük Beğeni Ödülü (2500 Çip)
let begeniIslemi = begeniGonder(suleyman, ahmet);
suleyman = begeniIslemi.guncelGonderen;
ahmet = begeniIslemi.guncelAlan;
console.log(`- ${begeniIslemi.mesaj} (Ahmet Güncel: ${ahmet.cipBakiyesi} Çip)`);

// 24 Saatlik Engel Kontrolü
let ikinciBegeni = begeniGonder(suleyman, ahmet);
console.log(`- Tekrar Beğenme Denemesi: ${ikinciBegeni.mesaj}`);

// -----------------------------------------------------------------
// ADIM 4: YENİ SOHBET ODALARI, KANAL BÖLÜMLEME VE KÜFÜR FİLTRESİ
// -----------------------------------------------------------------
console.log("\n🎙️ [4. ADIM: CANLI SOHBET & NETWORKING]");

// Küresel Kanal Girişi (Kanal 1)
const suleymanKanal1 = odayaBaglan(suleyman, "Kanal 1", "Küresel");
console.log(suleymanKanal1.mesaj);

// Küfür Filtresi Testi
const kotuMesaj = "Selam lan salak, okey masası açın da siktir olup gidelim.";
const filtrelenmisPaket = paketGonder(suleyman, suleymanKanal1.odaAdi, kotuMesaj, 'metin');
console.log(`   └─ [FİLTRE AKTİF] ${filtrelenmisPaket.isim}: ${filtrelenmisPaket.icerik}`);

// Şehir Güvenlik Kontrolü (İzmirli Süleyman İzmir odasına giriyor)
const suleymanSehir = odayaBaglan(suleyman, "İzmir", "Şehir");
console.log(suleymanSehir.mesaj);

// İstanbullu Ahmet İzmir odasına sızmaya çalışıyor
const ahmetSizmaDenemesi = odayaBaglan(ahmet, "İzmir", "Şehir");
console.log(ahmetSizmaDenemesi.mesaj);

// Masa İçi Sesli Sohbet Testi (Base64 Ses Dataları Taşıma)
const masaBaglantisi = odayaBaglan(suleyman, "Masa_101_Oda_4", "Masa");
console.log(masaBaglantisi.mesaj);

const sesVerisi = "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const sesPaketi = paketGonder(suleyman, masaBaglantisi.odaAdi, sesVerisi, 'ses');
console.log(`   └─ [SES PAKETİ GÖNDERİLDİ]: ${sesPaketi.icerik}`);

// -----------------------------------------------------------------
// ADIM 5: GELİŞMİŞ PROFİL PANELİ VE SEKMELİ ÇANTA (UI RAPORU)
// -----------------------------------------------------------------
console.log("\n📱 [5. ADIM: PROFİL PANELİ & ÇANTA SEKMELERİ]");
const ozet = profilOzetiniGetir(suleyman);
const vipEtkileri = getVIPAvantajlari(suleyman.vipSeviyesi);

console.log(`- Oyuncu: ${ozet.isim} | Cinsiyet: ${ozet.cinsiyet} | Şehir: ${suleyman.sehir}`);
console.log(`- Profil Statüsü: <${suleyman.rutbe}> | Toplam Çip: ${suleyman.cipBakiyesi}`);
console.log(`- Maç İstatistikleri: Toplam ${ozet.toplamOyun} Maç (Son 30 günde: ${sonOtuzGunlukOyunlariGetir(suleyman).length})`);
console.log(`- Sosyal Güç: ${ozet.takipci} Takipçi | Hediye Puanı: ${ozet.hediyePuani}`);
console.log(`- VIP Radarı (Rakip Taş Görme): ${vipEtkileri.rakipTasSayisiGorme ? "AÇIK 👁️" : "KAPALI ❌"}`);

// Çanta Görünümü (Gönderdiğin Resimdeki Sol Menülü UI Yapısı)
console.log("\n🎒 [ÇANTA SEKMELERİ] (GÖNDERDİĞİN RESİMDEKİ ARAYÜZ DÜZENİ):");
const cantaSekmeleri = cantaSekmeleriniGetir(suleyman);

for (const [sekmeAdi, esyalar] of Object.entries(cantaSekmeleri)) {
  console.log(`  📂 SEKME: [ ${sekmeAdi.toUpperCase()} ]`);
  if (esyalar.length === 0) {
    console.log("     (Bu kategori boş)");
  } else {
    esyalar.forEach(esya => {
      console.log(`     🔸 ${esya.isim} [x${esya.adet}]`);
      console.log(`        └─ İpucu/Açıklama: ${esya.aciklama}`);
    });
  }
}

console.log("\n=================================================================");
console.log("🚀 SİMÜLASYON BAŞARIYLA TAMAMLANDI - TÜM SİSTEMLER KORUNDU 🚀");
console.log("=================================================================");