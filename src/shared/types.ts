// ==========================================
// LOUNGE 101 CLUB - TÜM ORTAK VERİ TİPLERİ
// ==========================================

// 1. Mağaza Çip Paket Tipleri
export interface CipPaketi {
  id: string;
  paketAdi: string;
  cipMiktari: number;
  fiyatTL: number;
}

// 2. VIP Market Paket Tipleri
export interface VIPPaketi {
  id: string;
  seviye: number;
  sureGun: number;
  fiyatTL: number;
}

// 3. VIP Seviyelerine Göre Tanımlanan Özel Avantajlar
export interface VIPAvantajlari {
  hediyeMasrafIndirimi: number;
  turnuvaIndirimi: number;
  gunlukBegeniSiniri: number;
  iflasDestegiHakki: number;
  xpBonusu: number;
  rakipTasSayisiGorme: boolean; // VIP Alanların radar özelliği
}

// 4. Profil Cinsiyet Tipi
export type Cinsiyet = 'Erkek' | 'Kadın' | 'Belirtmek İstemiyor';

// 5. Çanta (Envanter) Kategorileri (Resimdeki sol sekmeler)
export type CantaKategorisi = 'Öğe' | 'Dekorasyon' | 'Fan Rozeti' | 'Kutu Bonusu';

// 6. Çanta İçindeki Eşyaların Detay Yapısı (Resimdeki sağ panel ve adetler)
export interface CantaEsyasi {
  id: string;
  isim: string;
  kategori: CantaKategorisi;
  adet: number;      // Resimdeki "x28", "x14" kısımları
  aciklama: string;  // Sağ paneldeki "Yarışma masasına başvuruda kullanılabilir" yazısı
}

// 7. Oyuncuların Profillerinde Paylaşacağı Gönderi (Post) Yapısı
export interface Gonderi {
  id: string;
  icerik: string;
  tarih: Date;
  begeniSayisi: number;
}

// 8. Oyuncu Başarı Rozetleri
export interface Basari {
  id: string;
  isim: string;
  kazanilmaTarihi: Date;
}

// 9. Son 30 Gün Filtresi İçin Oyun Kayıt Yapısı
export interface OyunKaydi {
  oyunTuru: '101 Okey' | 'Pişti' | 'Tavla';
  sonuc: 'Galibiyet' | 'Mağlubiyet' | 'Beraberlik';
  tarih: Date;
}

// 10. Gelişmiş Oyuncu Hesap Modeli (Her Şey Dahil Tam Sürüm)
export interface OyuncuHesabi {
  id: string;
  isim: string;
  cipBakiyesi: number;
  vipSeviyesi: number;
  vipBitisTarihi: Date | null;
  kazandigiMacSayisi: number;
  
  // Profil ve Kimlik Bilgileri
  profilFotografiURL: string | null;
  cinsiyet: Cinsiyet;
  sehir: string;
  rutbe: string;
  
  // Çanta ve Envanter
  canta: CantaEsyasi[];
  
  // Sosyal Ağ Metrikleri
  arkadasListesi: string[];
  sonBegeniler: Record<string, Date>; // 24 saatlik beğeni takibi için
  takipciSayisi: number;
  alinanBegeniSayisi: number;
  alinanHediyeler: number; // 1 Hediye = 10 Puan mantığı için
  
  // İçerik ve Geçmiş Günlükleri
  gonderiler: Gonderi[];
  basarilar: Basari[];
  oyunGecmisi: OyunKaydi[];
}

// 11. Sohbet Odaları Kanal Tipleri
export type SohbetKanali = 'Küresel' | 'Şehir' | 'Masa' | 'Klan';
// Giriş Yöntemleri
export type GirisYontemi = 'Misafir' | 'Google' | 'Apple';

// Veritabanı Giriş Log Kaydı
export interface AuthBilgi {
  id: string;
  oyuncuId: string;
  yontem: GirisYontemi;
  hariciUfId: string; // Google/Apple'dan gelen benzersiz kullanıcı ID'si
  kayitTarihi: Date;
  sonGirisTarihi: Date;
}
// Sohbet Türü (Metin veya Sesli Mesaj)
export type MesajTuru = 'metin' | 'ses';

// Gelişmiş Mesaj Paketi Yapısı
export interface SohbetPaketi {
  id: string;
  oyuncuId: string;
  isim: string;
  rutbe: string;
  sehir: string;
  klanAdi: string | null;
  mesajTuru: MesajTuru;
  icerik: string; // Metin ise yazı, Ses ise Base64 formatında ses datası
  tarih: Date;
}