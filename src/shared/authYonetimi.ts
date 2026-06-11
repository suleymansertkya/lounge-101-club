import { OyuncuHesabi, GirisYontemi, AuthBilgi } from './types';

// Gerçek senaryoda burası PostgreSQL "auth_users" tablosu olacak
const MOCK_DB_AUTH_TABLE: AuthBilgi[] = [];
// Burası da "players" tablosu olacak
const MOCK_DB_PLAYER_TABLE: OyuncuHesabi[] = [];

export function oyunGirisiniYonet(
  hariciId: string, 
  yontem: GirisYontemi, 
  kullaniciAdi?: string
): { oyuncu: OyuncuHesabi | null, mesaj: string } {
  
  // 1. ADIM: PostgreSQL sorgusu simülasyonu (SELECT * FROM auth_users WHERE hariciUfId = hariciId)
  const mevcutAuth = MOCK_DB_AUTH_TABLE.find(a => a.hariciUfId === hariciId && a.yontem === yontem);

  if (mevcutAuth) {
    // KULLANICI ZATEN VAR: Veritabanından oyuncu profilini çek (SELECT * FROM players WHERE id = oyuncuId)
    const oyuncuProfili = MOCK_DB_PLAYER_TABLE.find(p => p.id === mevcutAuth.oyuncuId);
    if (oyuncuProfili) {
      mevcutAuth.sonGirisTarihi = new Date(); // Son giriş tarihini UPDATE et
      return {
        oyuncu: oyuncuProfili,
        mesaj: `🔐 [PostgreSQL Başarılı] Eski kullanıcı doğrulandı! Hoş geldin ${oyuncuProfili.isim}. Verileriniz ve ${oyuncuProfili.cipBakiyesi} çipiniz güvenle yüklendi.`
      };
    }
  }

  // 2. ADIM: KULLANICI İLK DEFA GİRİYOR (YENI KAYIT - INSERT INTO)
  const yeniOyuncuId = `PLAYER_${Math.floor(1000 + Math.random() * 9000)}`;
  const isim = kullaniciAdi || (yontem === 'Misafir' ? `Misafir_${yeniOyuncuId.split('_')[1]}` : `Oyuncu_${yeniOyuncuId.split('_')[1]}`);

  // PostgreSQL 'players' tablosuna yeni satır ekle
  const yeniOyuncu: OyuncuHesabi = {
    id: yeniOyuncuId,
    isim: isim,
    cinsiyet: "Belirtmek İstemiyor",
    profilFotografiURL: null,
    cipBakiyesi: 50000, // 🎁 Yeni gelen herkese 50.000 Çip Başlangıç Hediyesi!
    vipSeviyesi: 0,
    vipBitisTarihi: null,
    kazandigiMacSayisi: 0,
    sehir: "Belirtilmemiş",
    rutbe: "Yeni Üye",
    canta: [],
    arkadasListesi: [],
    sonBegeniler: {},
    takipciSayisi: 0,
    alinanBegeniSayisi: 0,
    alinanHediyeler: 0,
    gonderiler: [],
    basarilar: [],
    oyunGecmisi: []
  };

  // PostgreSQL 'auth_users' tablosuna ilişki satırını ekle
  const yeniAuth: AuthBilgi = {
    id: `AUTH_${Date.now()}`,
    oyuncuId: yeniOyuncuId,
    yontem: yontem,
    hariciUfId: hariciId,
    kayitTarihi: new Date(),
    sonGirisTarihi: new Date()
  };

  // Veritabanına kaydet (MOCK)
  MOCK_DB_AUTH_TABLE.push(yeniAuth);
  MOCK_DB_PLAYER_TABLE.push(yeniOyuncu);

  return {
    oyuncu: yeniOyuncu,
    mesaj: `✨ [PostgreSQL Kayıt Başarılı] ${yontem} ile ilk giriş yapıldı! Yeni hesap oluşturuldu: ${yeniOyuncu.isim}. 50.000 Çip hoş geldin bonusu hesabınıza tanımlandı.`
  };
}