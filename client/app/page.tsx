"use client";
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

interface EnvanterOgesi {
  id: number;
  ad: string;
  miktar: string;
  durum: string;
  stil: string;
  paraTuru: string;
  fiyati: string;
}

interface SistemMesaji {
  id: number;
  gonderen: string;
  icerik: string;
  hediyeMiktar: number;
  alindi: boolean;
}

interface OyuncuProfil {
  id: string;
  ad: string;
  vip: number;
  aktif: boolean;
}

interface HediyeKartOgesi {
  id: number;
  ad: string;
  emoji: string;
  maliyet: number;
  envanterAdet: number;
  etiket?: string;
  etiketRenk?: string;
}

interface SohbetGonderisi {
  id: number;
  isim: string;
  vip: number;
  metin: string;
  gorselUrl?: string;
}

export default function LoungeApp() {
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [isim, setIsim] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [seciliGorsel, setSeciliGorsel] = useState<string | null>(null);
  
  // OYUNCU EKONOMİSİ
  const [vipSeviyesi, setVipSeviyesi] = useState(0); 
  const [bakiyeCip, setBakiyeCip] = useState(34100);
  const [bakiyeElmas, setBakiyeElmas] = useState(150.0); 

  const [alinanIstakalar, setAlinanIstakalar] = useState<number[]>([1]); 
  const [kusanilanIstaka, setKusanilanIstaka] = useState<number>(1);

  // PANELERİN AÇIK/KAPALI DURUMLARI
  const [magazaAktifSekme, setMagazaAktifSekme] = useState<"çipler" | "vip">("çipler");
  const [aktifSekme, setAktifSekme] = useState<"çipler" | "ıstakalar" | "çerçeveler">("çipler");
  
  const [cantaAcik, setCantaAcik] = useState(false);
  const [vipMarketAcik, setVipMarketAcik] = useState(false);
  const [arkadaslarAcik, setArkadaslarAcik] = useState(false);
  const [gelenKutusuAcik, setGelenKutusuAcik] = useState(false);
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  const [gunlukGirisAcik, setGunlukGirisAcik] = useState(true); 
  
  // SIRALAMA EKRANI STATELERİ
  const [siralamaAcik, setSiralamaAcik] = useState(false);
  const [siralamaKategori, setSiralamaKategori] = useState<"cip" | "yildiz" | "yukleme" | "hediye" | "odalar" | "fankulup">("cip");
  const [siralamaSekme, setSiralamaSekme] = useState<"genel" | "bolge" | "sehir">("genel");

  const [hediyeCipPanelAcik, setHediyeCipPanelAcik] = useState(false);
  const [hediyeCipTargetId, setHediyeCipTargetId] = useState("");
  const [hediyeCipMiktar, setHediyeCipMiktar] = useState("");
  const [miniArkadasSecAcik, setMiniArkadasSecAcik] = useState(false);

  const [hediyePaneliAcik, setHediyePaneliAcik] = useState(false);
  const [hediyeHedefOyuncu, setHediyeHedefOyuncu] = useState<OyuncuProfil | null>(null);
  const [seciliHediyeId, setSeciliHediyeId] = useState<number>(1);
  const [hediyeSekmesi, setHediyeSekmesi] = useState<"elmas" | "klan">("elmas");
  const [hediyeAdet, setHediyeAdet] = useState<number>(1);

  const [secilenPaketIndex, setSecilenPaketIndex] = useState(0);
  const [mevcutGirisGunu, setMevcutGirisGunu] = useState(1);
  const [gunlukOdulAlindi, setGunlukOdulAlindi] = useState(false);

  const [sosyalAktifSekme, setSosyalAktifSekme] = useState<"arkadaslar" | "takipciler" | "takipEdilenler" | "ekle">("arkadaslar");
  const [arananId, setArananId] = useState("");

  const [gonderiler, setGonderiler] = useState<SohbetGonderisi[]>([
    
    { id: 1, isim: "Kral_Süleyman", vip: 8, metin: "Otomatiğe gelin, bekliyorum!", gorselUrl: "" },
    { id: 2, isim: "Okeyci_Kız", vip: 3, metin: "Tavla davetlerini bekliyorum 🎲" }
  ]);

  const [arkadasListesi] = useState<OyuncuProfil[]>([
    { id: "10923", ad: "Ahmet_1903", vip: 5, aktif: true },
    { id: "44120", ad: "Okeyci_Kral", vip: 12, aktif: false },
    { id: "88219", ad: "Aslan_Levent", vip: 0, aktif: true }
  ]);

  const [destekSayaci, setDestekSayaci] = useState(0);
  const [kalanSureYazi, setKalanSureYazi] = useState("Yükle");

  const premiumHediyeler: HediyeKartOgesi[] = [
    { id: 1, ad: "Selam", emoji: "👋", maliyet: 0, envanterAdet: 79, etiket: "Ücretsiz", etiketRenk: "bg-orange-500" },
    { id: 2, ad: "Pasta Bayrağı", emoji: "🎂", maliyet: 3, envanterAdet: 4, etiket: "Etkinlik", etiketRenk: "bg-pink-500" },
    { id: 3, ad: "Yüzük", emoji: "💍", maliyet: 5, envanterAdet: 14, etiket: "VIP", etiketRenk: "bg-yellow-500" },
    { id: 4, ad: "Fan Çubuğu", emoji: "🪄", maliyet: 1, envanterAdet: 0, etiket: "Fan Kulübü", etiketRenk: "bg-blue-500" },
    { id: 5, ad: "Çay", emoji: "🍵", maliyet: 3, envanterAdet: 0 },
    { id: 6, ad: "Yumurta", emoji: "🥚", maliyet: 3, envanterAdet: 0 },
    { id: 7, ad: "Bomba", emoji: "💣", maliyet: 3, envanterAdet: 0 },
    { id: 8, ad: "Kalp", emoji: "💖", maliyet: 3, envanterAdet: 0 },
    { id: 9, ad: "Sütlaç", emoji: "🍮", maliyet: 9, envanterAdet: 0 },
    { id: 10, ad: "Çiçek Buketi", emoji: "💐", maliyet: 29, envanterAdet: 0 },
  ];

  const haftalikOduller = [
    { gun: 1, miktar: 8000, yazi: "8.000 🪙" },
    { gun: 2, miktar: 13000, yazi: "13.000 🪙" },
    { gun: 3, miktar: 15000, yazi: "15.000 🪙" },
    { gun: 4, miktar: 16000, yazi: "16.000 🪙" },
    { gun: 5, miktar: 17500, yazi: "17.500 🪙" },
    { gun: 6, miktar: 18500, yazi: "18.500 🪙" },
    { gun: 7, miktar: 20000, yazi: "20.000 🪙" },
  ];

  const detayliSiralama = [
    { sira: 1, isim: "ŞAM", cip: "21.300.664.472", avatar: "🧔", tac: "👑" },
    { sira: 2, isim: "LİANES", cip: "15.040.123.792", avatar: "👩", tac: "🥈" },
    { sira: 3, isim: "BAMBİ", cip: "10.821.765.368", avatar: "👱‍♀️", tac: "🥉" },
    { sira: 4, isim: "ÜMİT38", cip: "9.100.269.853", avatar: "👨", tac: "" },
    { sira: 5, isim: "NeBakiynDayi", cip: "8.225.110.000", avatar: "😎", tac: "" },
    { sira: 6, isim: "ZEUS", cip: "4.688.107.199", avatar: "⚡", tac: "" },
    { sira: 7, isim: "AYTAÇ BEY", cip: "4.232.863.486", avatar: "👨‍💼", tac: "" },
  ];

  const cipPaketleri = [
    { id: 1, ad: "Mini Başlangıç Paketi", miktar: 50000, miktarYazi: "50.000 Çip", fiyat: "9,99 TL", populer: false, bg: "from-blue-900 to-indigo-950" },
    { id: 2, ad: "Bronz Kulüp Paketi", miktar: 250000, miktarYazi: "250.000 Çip", fiyat: "39,99 TL", populer: false, bg: "from-amber-950 to-amber-900" },
    { id: 3, ad: "Gümüş Lounge Paketi", miktar: 800000, miktarYazi: "800.000 Çip", fiyat: "89,99 TL", populer: false, bg: "from-gray-800 to-gray-900" },
    { id: 4, ad: "Altın Milyoner Paketi", miktar: 1410000, miktarYazi: "1.410.000 Çip", fiyat: "129,99 TL", populer: true, bg: "from-yellow-700 to-amber-950" },
    { id: 5, ad: "Platin Zengin Paketi", miktar: 2150000, miktarYazi: "2.150.000 Çip", fiyat: "199,99 TL", populer: false, bg: "from-slate-800 to-slate-950" },
    { id: 6, ad: "Elmas Lounge Paketi", miktar: 4500000, miktarYazi: "4.500.000 Çip", fiyat: "299,99 TL", populer: false, bg: "from-cyan-800 to-blue-950" },
    { id: 7, ad: "Kral Ağanın Paketi", miktar: 15500000, miktarYazi: "15.500.000 Çip", fiyat: "999,99 TL", populer: false, bg: "from-purple-900 to-fuchsia-950" },
    { id: 8, ad: "Oligark Zirve Paketi", miktar: 35000000, miktarYazi: "35.000.000 Çip", fiyat: "1.899,99 TL", populer: false, bg: "from-red-950 via-purple-950 to-black" },
  ];

  const vipPaketleri = [
    { seviye: 1, fiyat: "19,99 TL", ad: "VIP Seviye 1", bg: "bg-orange-950" },
    { seviye: 2, fiyat: "29,99 TL", ad: "VIP Seviye 2", bg: "bg-orange-900" },
    { seviye: 3, fiyat: "39,99 TL", ad: "VIP Seviye 3", bg: "bg-orange-900" },
    { seviye: 4, fiyat: "49,99 TL", ad: "VIP Seviye 4", bg: "bg-orange-900" },
    { seviye: 5, fiyat: "59,99 TL", ad: "VIP Seviye 5", bg: "bg-amber-800" },
    { seviye: 6, fiyat: "79,99 TL", ad: "VIP Seviye 6", bg: "bg-gray-800" },
    { seviye: 7, fiyat: "89,99 TL", ad: "VIP Seviye 7", bg: "bg-gray-700" },
    { seviye: 8, fiyat: "99,99 TL", ad: "VIP Seviye 8", bg: "bg-gray-700" },
    { seviye: 9, fiyat: "109,99 TL", ad: "VIP Seviye 9", bg: "bg-gray-600" },
    { seviye: 10, fiyat: "119,99 TL", ad: "VIP Seviye 10", bg: "bg-gray-600" },
    { seviye: 11, fiyat: "129,99 TL", ad: "VIP Seviye 11", bg: "bg-yellow-800" },
    { seviye: 12, fiyat: "139,99 TL", ad: "VIP Seviye 12", bg: "bg-yellow-800" },
    { seviye: 13, fiyat: "149,99 TL", ad: "VIP Seviye 13", bg: "bg-yellow-700" },
    { seviye: 14, fiyat: "159,99 TL", ad: "VIP Seviye 14", bg: "bg-yellow-700" },
    { seviye: 15, fiyat: "189,99 TL", ad: "VIP Seviye 15", bg: "bg-yellow-700" },
    { seviye: 16, fiyat: "199,99 TL", ad: "VIP Seviye 16", bg: "bg-yellow-700" },
    { seviye: 17, fiyat: "219,99 TL", ad: "VIP Seviye 17", bg: "bg-yellow-700" },
    { seviye: 18, fiyat: "249,99 TL", ad: "VIP Seviye 18", bg: "bg-yellow-600" },
    { seviye: 19, fiyat: "289,99 TL", ad: "VIP Seviye 19", bg: "bg-yellow-600" },
    { seviye: 20, fiyat: "319,99 TL", ad: "VIP Seviye 20", bg: "bg-yellow-500" },
    { seviye: 21, fiyat: "349,99 TL", ad: "VIP Seviye 21", bg: "bg-cyan-900" },
    { seviye: 22, fiyat: "399,99 TL", ad: "VIP Seviye 22", bg: "bg-cyan-800" },
    { seviye: 23, fiyat: "419,99 TL", ad: "VIP Seviye 23", bg: "bg-cyan-700" },
    { seviye: 24, fiyat: "449,99 TL", ad: "VIP Seviye 24", bg: "bg-cyan-600" },
    { seviye: 25, fiyat: "899,99 TL", ad: "VIP Seviye 25 ZİRVE", bg: "bg-gradient-to-r from-cyan-400 to-purple-600 text-white font-black" },
  ];

  const [mesajlar, setMesajlar] = useState<SistemMesaji[]>([
    { id: 1, gonderen: "Sistem", icerik: "Lounge 101 Club'a Hoş Geldiniz! VIP mağazamızı incelemeyi unutmayın.", hediyeMiktar: 0, alindi: true },
    { id: 2, gonderen: "Ahmet (Arkadaşın)", icerik: "Süleyman selam, masada elin güçlü olsun diye sana çip yolladım! 🦅", hediyeMiktar: 5000, alindi: false }
  ]);

  const tacEmojisiGetir = (seviye: number) => {
    if (seviye >= 21) return "💎✨";
    if (seviye >= 11) return "👑";
    if (seviye >= 6) return "🥈";
    if (seviye >= 1) return "🥉";
    return "";
  };

  const cerceveRengiGetir = (seviye: number) => {
    if (seviye >= 21) return "border-4 border-double border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] text-cyan-400 animate-pulse";
    if (seviye >= 11 && seviye <= 20) return "border-4 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)] text-amber-300";
    if (seviye >= 6 && seviye <= 10) return "border-2 border-gray-300 shadow-[0_0_8px_rgba(209,213,219,0.5)] text-gray-200";
    if (seviye >= 1 && seviye <= 5) return "border-2 border-amber-700 shadow-[0_0_5px_rgba(180,83,9,0.4)] text-amber-600";
    return "border border-gray-600 text-gray-400";
  };

  const bronzDurum = (vipSeviyesi >= 1 && vipSeviyesi <= 5) ? "Kuşanıldı" : (vipSeviyesi > 5 ? "Açık" : "Kilitli");
  const gumusDurum = (vipSeviyesi >= 6 && vipSeviyesi <= 10) ? "Kuşanıldı" : (vipSeviyesi > 10 ? "Açık" : "Kilitli");
  const altinDurum = (vipSeviyesi >= 11 && vipSeviyesi <= 20) ? "Kuşanıldı" : (vipSeviyesi > 20 ? "Açık" : "Kilitli");
  const elmasDurum = vipSeviyesi >= 21 ? "Kuşanıldı" : "Kilitli";

  useEffect(() => {
    const logs = localStorage.getItem("cipDestekZamanlari");
    if (!logs) {
      setDestekSayaci(0);
      setKalanSureYazi("Yükle");
      return;
    }
    const zamanlar: number[] = JSON.parse(logs);
    const simdi = Date.now();
    const aktifAlimlar = zamanlar.filter(z => simdi - z < 24 * 60 * 60 * 1000);
    setDestekSayaci(aktifAlimlar.length);

    if (aktifAlimlar.length >= 2) {
      const kalanMiliSaniye = (zamanlar[0] + 24 * 60 * 60 * 1000) - simdi;
      const kalanSaat = Math.ceil(kalanMiliSaniye / (1000 * 60 * 60));
      setKalanSureYazi(`🔒 ${kalanSaat}s`);
    } else {
      setKalanSureYazi("Yükle");
    }
  }, [bakiyeCip]);

  useEffect(() => {
    if (vipSeviyesi < vipPaketleri.length) {
      setSecilenPaketIndex(vipSeviyesi);
    }
  }, [vipSeviyesi]);

  const toggleGelenKutusu = () => {
    setGelenKutusuAcik(!gelenKutusuAcik);
    setArkadaslarAcik(false);
    setVipMarketAcik(false);
    setCantaAcik(false);
    setHediyeCipPanelAcik(false);
    setAyarlarAcik(false);
    setSiralamaAcik(false);
  };

  const toggleSiralamaPanel = () => {
    setSiralamaAcik(true);
    setGelenKutusuAcik(false);
    setArkadaslarAcik(false);
    setVipMarketAcik(false);
    setCantaAcik(false);
    setHediyeCipPanelAcik(false);
  };

  const hediyeCipGonderAksiyonu = () => {
    if (hediyeCipTargetId.trim() === "" || hediyeCipMiktar.trim() === "") {
      alert("⚠️ Lütfen Oyuncu ID ve Çip Miktarını eksiksiz girin!");
      return;
    }
    const miktar = parseInt(hediyeCipMiktar);
    if (isNaN(miktar) || miktar <= 0) {
      alert("⚠️ Geçersiz çip miktarı!");
      return;
    }
    if (bakiyeCip >= miktar) {
      setBakiyeCip(prev => prev - miktar);
      alert(`🪙 ID: ${hediyeCipTargetId} numaralı oyuncuya ${miktar.toLocaleString()} Çip gönderildi.`);
      setHediyeCipPanelAcik(false);
      setHediyeCipTargetId("");
      setHediyeCipMiktar("");
    } else {
      alert("❌ Bakiyenizde yeterli miktarda çip bulunmuyor!");
    }
  };

  const ucretsizCipDestegiAl = () => {
    const logs = localStorage.getItem("cipDestekZamanlari");
    let zamanlar: number[] = logs ? JSON.parse(logs) : [];
    const simdi = Date.now();
    zamanlar = zamanlar.filter(z => simdi - z < 24 * 60 * 60 * 1000);

    if (zamanlar.length >= 2) {
      alert("⚠️ Günlük limit doldu!");
      return;
    }
    zamanlar.push(simdi);
    localStorage.setItem("cipDestekZamanlari", JSON.stringify(zamanlar));
    setBakiyeCip((prev) => prev + 10000);
    setDestekSayaci(zamanlar.length);
    alert("🪙 +10.000 Çip tanımlandı!");
  };

  const istakaSatinAlVeyaKusan = (id: number, fiyati: string, paraTuru: "CIP" | "TL") => {
    if (alinanIstakalar.includes(id)) {
      setKusanilanIstaka(id); 
      return;
    }
    if (paraTuru === "CIP") {
      const ucret = parseInt(fiyati.replace(/\D/g, ''));
      if (bakiyeCip >= ucret) {
        setBakiyeCip((prev) => prev - ucret);
        setAlinanIstakalar((prev) => [...prev, id]);
        setKusanilanIstaka(id);
        alert("🎯 Istaka kuşanıldı!");
      }
    } else {
      setAlinanIstakalar((prev) => [...prev, id]);
      setKusanilanIstaka(id);
      alert(`💳 Ödeme Onaylandı!`);
    }
  };

  const siraliVipSatinAl = (hedef: number, fiyat: string) => {
    if (hedef === vipSeviyesi + 1) {
      setVipSeviyesi(hedef);
      alert(`💳 Yeni Rütbeniz: V${hedef}. Ödenen: ${fiyat}`);
    }
  };

  const odulAl = (milyonMiktar: number) => {
    if (gunlukOdulAlindi) return;
    setBakiyeCip(prev => prev + milyonMiktar);
    setGunlukOdulAlindi(true);
  };

  const arkadastanCipAl = (id: number, miktar: number) => {
    setBakiyeCip(prev => prev + miktar);
    setMesajlar(prev => prev.map(m => m.id === id ? { ...m, alindi: true } : m));
  };

  const mesajSil = (id: number) => {
    setMesajlar(prev => prev.filter(m => m.id !== id));
  };

  const premiumHediyeGonderAksiyonu = () => {
    if (!hediyeHedefOyuncu) return;
    const hediye = premiumHediyeler.find(h => h.id === seciliHediyeId);
    if (!hediye) return;
    
    const toplamMaliyet = hediye.maliyet * hediyeAdet;

    if (hediye.envanterAdet > 0) {
      alert(`🎁 Envanterinden ${hediyeAdet} adet "${hediye.emoji} ${hediye.ad}" kullanılarak gönderildi!`);
      setHediyePaneliAcik(false);
      setHediyeAdet(1);
    } else if (bakiyeElmas >= toplamMaliyet || hediye.maliyet === 0) {
      setBakiyeElmas(prev => prev - toplamMaliyet);
      alert(`💎 ✨ Başarıyla ${hediyeHedefOyuncu.ad} oyuncusuna ${hediyeAdet} adet "${hediye.emoji} ${hediye.ad}" gönderildi!`);
      setHediyePaneliAcik(false);
      setHediyeAdet(1);
    } else {
      alert("❌ Yetersiz Elmas! İşlem için " + toplamMaliyet + " Elmas gerekiyor.");
    }
  };

  const idIleOyuncuAraVeIstekAt = () => {
    if (arananId.trim() === "") return;
    alert(`✉️ ID: ${arananId} oyuncuya istek iletildi.`);
    setArananId("");
  };

  const yeniGonderiPaylas = () => {
    if (mesaj.trim() === "") return;
    const yeni: SohbetGonderisi = {
      id: Date.now(),
      isim: isim || "Süleyman",
      vip: vipSeviyesi,
      metin: mesaj,
      gorselUrl: seciliGorsel || undefined
    };
    setGonderiler([yeni, ...gonderiler]);
    setMesaj("");
    setSeciliGorsel(null);
  };

  const cipSatinAl = (milyonMiktar: number, fiyat: string) => {
    setBakiyeCip((prev) => prev + milyonMiktar);
    alert(`💳 ${fiyat} onaylandı.`);
  };

  useEffect(() => {
    const kayitliIsim = localStorage.getItem("oyuncuIsmi");
    if (kayitliIsim) {
      setIsim(kayitliIsim);
      setGirisYapildi(true);
    }
  }, []);

  const girisYapAction = (yontem: string) => {
    const yeniIsim = yontem === "Misafir" ? "Misafir_" + Math.floor(Math.random()*1000) : "Süleyman";
    localStorage.setItem("oyuncuIsmi", yeniIsim);
    setIsim(yeniIsim);
    setGirisYapildi(true);
  };

  if (!girisYapildi) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a1128] text-white">
        <h1 className="text-4xl font-bold mb-10 text-yellow-500 tracking-widest">LOUNGE 101 CLUB</h1>
        <div className="flex flex-col gap-4 w-72">
          <button onClick={() => girisYapAction("Google")} className="bg-white text-black p-3 rounded-lg font-bold hover:bg-gray-200">Google ile Giriş</button>
          <button onClick={() => girisYapAction("Facebook")} className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">Facebook ile Giriş</button>
          <button onClick={() => girisYapAction("iOS")} className="bg-black text-white border border-white p-3 rounded-lg font-bold hover:bg-gray-800">iOS ile Giriş</button>
          <button onClick={() => girisYapAction("Misafir")} className="bg-amber-600 p-3 rounded-lg font-bold hover:bg-amber-500">Misafir Girişi</button>
        </div>
      </div>
    );
  }

  const aktifSecilenPaket = vipPaketleri[secilenPaketIndex] || vipPaketleri[0];
  const isSatinAlinabilir = aktifSecilenPaket.seviye === vipSeviyesi + 1;
  const isZatenAlinmis = aktifSecilenPaket.seviye <= vipSeviyesi;

  const envanter: Record<"çipler" | "ıstakalar" | "çerçeveler", EnvanterOgesi[]> = {
    çipler: [
      { id: 1, ad: "Mevcut Çip Bakiyeniz", miktar: `${bakiyeCip.toLocaleString()} 🪙`, durum: "Aktif", stil: "text-yellow-400 font-bold", paraTuru: "SABIT", fiyati: "0" },
      { id: 2, ad: "🪙 Ücretsiz Çip Desteği", miktar: "+10.000 Çip", durum: kalanSureYazi, stil: "text-green-400 font-medium", paraTuru: "Hile", fiyati: "0" }
    ],
    ıstakalar: [
      { id: 1, ad: "🪵 Ahşap Klasik Istaka", miktar: "Süresiz", fiyati: "0", paraTuru: "CIP", stil: "text-gray-400", durum: "Kuşan" },
      { id: 2, ad: "🦅 1903 Kara Kartal Istakası", miktar: "Efsanevi Parıltı", fiyati: "149,99 TL", paraTuru: "TL", stil: "text-white font-extrabold bg-gradient-to-r from-neutral-900 to-gray-600 px-2 py-0.5 rounded border border-gray-400 animate-pulse", durum: "Satın Al" },
      { id: 3, ad: "🦁 Aslan Kükreyişi Istakası", miktar: "Alevli Efekt", fiyati: "149,99 TL", paraTuru: "TL", stil: "text-yellow-400 font-bold", durum: "Satın Al" },
      { id: 4, ad: "🌟 Kanarya Kanadı Istakası", miktar: "Neon Işıklı", fiyati: "149,99 TL", paraTuru: "TL", stil: "text-blue-400 font-bold", durum: "Satın Al" },
      { id: 5, ad: "🌊 Karadeniz Fırtınası Istakası", miktar: "Dalgalı Bordo Mavi", fiyati: "149,99 TL", paraTuru: "TL", stil: "text-cyan-400 font-bold", durum: "Satın Al" },
      { id: 6, ad: "🟡🔴 1925 Göztepe İsyan Istakası", miktar: "Sarı Kırmızı Işıltı", fiyati: "129,99 TL", paraTuru: "TL", stil: "text-amber-500 font-extrabold drop-shadow-[0_2px_4px_rgba(220,38,38,0.7)]", durum: "Satın Al" },
    ],
    çerçeveler: [
      { id: 1, ad: "🥉 Bronz Taç Çerçevesi", miktar: "VIP 1 - 5", durum: bronzDurum, stil: "text-orange-500 font-medium", paraTuru: "SABIT", fiyati: "0" },
      { id: 2, ad: "🥈 Gümüş Taç Çerçevesi", miktar: "VIP 6 - 10", durum: gumusDurum, stil: "text-gray-300 font-medium", paraTuru: "SABIT", fiyati: "0" },
      { id: 3, ad: "👑 Kral Altın Tacı", miktar: "VIP 11 - 20", durum: altinDurum, stil: "text-amber-400 font-bold", paraTuru: "SABIT", fiyati: "0" },
      { id: 4, ad: "💎✨ Efsanevi Elmas Taç", miktar: "VIP 21+ (Sonsuz)", durum: elmasDurum, stil: "text-cyan-400 font-extrabold", paraTuru: "SABIT", fiyati: "0" }
    ]
  };

  return (
    <div className="relative w-full h-screen text-white p-3 overflow-hidden flex flex-col justify-between select-none font-sans">
      
      {/* ======================================================== */}
      {/* ARKA PLAN VE CSS ANİMASYONLARI                           */}
      {/* ======================================================== */}
      
      {/* Koyu, Soyut ve Modern Dijital Lounge Arka Planı */}
      <div 
        className="absolute inset-0 z-[-2]" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      ></div>
      {/* Şık Karartma ve Bulanıklık Katmanı */}
      <div className="absolute inset-0 z-[-1] bg-black/60 backdrop-blur-md"></div>

      {/* İÇ İÇE CSS ANİMASYONLARI (MERKEZ HEYKEL İÇİN) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sculpture-levitate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes sculpture-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.4)); }
          50% { filter: drop-shadow(0 0 40px rgba(255, 215, 0, 0.8)); }
        }
        @keyframes orbit-1 {
          0% { transform: rotate(0deg) translateX(160px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(160px) rotate(-360deg); }
        }
        @keyframes orbit-2 {
          0% { transform: rotate(120deg) translateX(160px) rotate(-120deg); }
          100% { transform: rotate(480deg) translateX(160px) rotate(-480deg); }
        }
        @keyframes orbit-3 {
          0% { transform: rotate(240deg) translateX(160px) rotate(-240deg); }
          100% { transform: rotate(600deg) translateX(160px) rotate(-600deg); }
        }
      `}} />

      {/* ÜST BAR PANELİ */}
      <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-2 px-4 rounded-xl border border-white/10 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold bg-slate-800 relative ${cerceveRengiGetir(vipSeviyesi)}`}>
            {isim[0]?.toUpperCase()}
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-black px-1 rounded border border-black shadow">V{vipSeviyesi}</span>
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-1.5 drop-shadow-md">{isim} {vipSeviyesi > 0 && <span>{tacEmojisiGetir(vipSeviyesi)}</span>}</div>
            <div className="flex items-center gap-2 text-xs mt-0.5">
              <span className="text-yellow-400 font-bold bg-black/50 px-2 py-0.5 rounded border border-yellow-600/50 shadow-sm">{bakiyeCip.toLocaleString()} 🪙</span>
              <span className="text-cyan-400 font-bold bg-black/50 px-2 py-0.5 rounded border border-cyan-600/50 shadow-sm">💎 {bakiyeElmas.toFixed(1)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button onClick={() => setGunlukGirisAcik(true)} className="bg-gradient-to-r from-red-600 to-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-500 hover:brightness-110 shadow-md">📅 Ödüller</button>
          <button onClick={toggleGelenKutusu} className="bg-black/40 border border-white/10 hover:bg-black/60 p-2 rounded-lg relative text-xs cursor-pointer shadow-md">
            ✉️ {mesajlar.filter(m=>!m.alindi).length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>}
          </button>
          <button onClick={() => setAyarlarAcik(!ayarlarAcik)} className="bg-black/40 border border-white/10 hover:bg-black/60 p-2 rounded-lg text-xs shadow-md">⚙️</button>
        </div>
      </div>

      {/* ANA OYUN VE DASHBOARD */}
      <div className="flex-1 flex justify-between gap-4 my-3 items-center w-full relative h-[85%]">
        
        {/* ======================================================== */}
        {/* SOL: DAR SIRALAMA ŞERİDİ                                 */}
        {/* ======================================================== */}
        <div 
          onClick={toggleSiralamaPanel} 
          className="w-[85px] flex flex-col items-center cursor-pointer hover:scale-105 transition-all z-10 h-[95%] mt-auto mb-auto bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden py-2"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 w-[90%] py-1.5 rounded-md text-center shadow-md mb-3 border border-blue-400/50">
            <span className="text-[9px] font-black tracking-widest text-white drop-shadow-md">SIRA</span>
          </div>
          
          <div className="flex-1 flex flex-col items-center gap-3.5 w-full mt-2">
            {detayliSiralama.slice(0, 3).map((s) => (
              <div key={s.sira} className="relative group">
                <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-400 text-gray-900 text-[9px] font-black flex items-center justify-center border border-gray-500 z-20 shadow-sm">{s.sira}</span>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md border-2 relative overflow-hidden bg-slate-800 ${s.sira === 1 ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]" : s.sira === 2 ? "border-gray-300 shadow-[0_0_10px_rgba(209,213,219,0.5)]" : s.sira === 3 ? "border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)]" : "border-gray-500"}`}>
                  {s.avatar}
                </div>
                {s.sira === 1 && <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm drop-shadow-md z-30 animate-pulse">👑</span>}
              </div>
            ))}
          </div>
          
          <div className="mt-auto border-t border-white/20 w-[80%] pt-2 flex flex-col items-center opacity-90 pb-1">
               <span className="text-[10px] font-black text-yellow-400 drop-shadow">50+</span>
               <div className="w-8 h-8 rounded-full border-2 border-yellow-500/50 bg-gray-800 mt-1 flex items-center justify-center text-xs shadow-md">👤</div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ORTA: BELİRGİN KRALİYET HEYKELİ                          */}
        {/* ======================================================== */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          
          {/* Devasa Mavi/Altın Işık Hüzmesi */}
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-600/20 to-yellow-600/10 rounded-full filter blur-[150px] animate-pulse"></div>

          {/* Merkez Heykel Animasyon Grubu */}
          <div className="relative flex flex-col items-center justify-center" style={{ animation: "sculpture-levitate 6s ease-in-out infinite" }}>
            
            {/* LÜKS OKEY KRALİYET HEYKELİ (Çok Net ve Işıltılı) */}
            <img 
              src="https://cdn-icons-png.flaticon.com/512/5406/5406806.png" 
              alt="Lounge Kraliyet Heykeli"
              className="w-64 h-64 object-contain"
              style={{ animation: "sculpture-glow 4s ease-in-out infinite" }}
            />
            
            {/* Kaide/Platform efekti */}
            <div className="w-48 h-8 bg-white/5 rounded-[100%] mt-8 filter blur-[2px] border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]"></div>

            {/* Etrafında Dönen Okey Taşı */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2">
              <div style={{ animation: "orbit-1 10s linear infinite" }} className="absolute text-5xl drop-shadow-[0_0_20px_rgba(250,204,21,1)]">📿</div>
            </div>
            {/* Etrafında Dönen İskambil Kartı */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2">
              <div style={{ animation: "orbit-2 10s linear infinite" }} className="absolute text-5xl drop-shadow-[0_0_20px_rgba(59,130,246,1)]">🃏</div>
            </div>
            {/* Etrafında Dönen Zar */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2">
              <div style={{ animation: "orbit-3 10s linear infinite" }} className="absolute text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,1)]">🎲</div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* SAĞ: GRID MENÜ MASALARI (CAM EFEKTLİ LÜKS YAPI)          */}
        {/* ======================================================== */}
        <div className="w-[480px] grid grid-cols-3 gap-2.5 content-center z-10 h-full">
          <button onClick={() => alert("🚀 101 Okey Otomatik Eşleşme masasına bağlanılıyor...")} className="col-span-3 bg-gradient-to-r from-orange-500/90 via-amber-500/90 to-yellow-500/90 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center group border border-yellow-400/50 shadow-xl hover:brightness-110 transition-all">
            <div className="text-left"><span className="text-[10px] block font-black text-orange-950 uppercase tracking-widest">101 OKEY</span><h3 className="text-lg font-black text-white tracking-wide mt-0.5 drop-shadow-md">Otomatik Eşleşme</h3></div>
            <span className="text-4xl drop-shadow-lg">📿</span>
          </button>
          <button onClick={() => alert("🚀 Pişti Salonu Açılıyor...")} className="bg-gradient-to-b from-blue-600/90 to-indigo-900/90 backdrop-blur-sm border border-blue-400/40 p-3 rounded-xl flex flex-col justify-between items-center text-center h-28 shadow-lg hover:brightness-105 active:scale-95 transition-all">
            <span className="text-2xl block drop-shadow-md">🃏</span><span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-md">Pişti</span><span className="text-[8px] text-blue-100 uppercase tracking-widest block bg-blue-950/80 px-1.5 py-0.5 rounded shadow">Yarışma</span>
          </button>
          <button onClick={() => alert("🚀 Tavla Salonu Açılıyor...")} className="bg-gradient-to-b from-emerald-600/90 to-teal-900/90 backdrop-blur-sm border border-emerald-400/40 p-3 rounded-xl flex flex-col justify-between items-center text-center h-28 shadow-lg hover:brightness-105 active:scale-95 transition-all">
            <span className="text-2xl block drop-shadow-md">🎲</span><span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-md">Tavla</span><span className="text-[8px] text-emerald-100 uppercase tracking-widest block bg-emerald-950/80 px-1.5 py-0.5 rounded shadow">Masa Aç</span>
          </button>
          <button onClick={() => alert("🎖️ Lig rütbeleri")} className="bg-gradient-to-b from-purple-600/90 to-purple-950/90 backdrop-blur-sm border border-purple-400/40 p-3 rounded-xl flex flex-col justify-between items-center text-center h-28 shadow-lg hover:brightness-105 active:scale-95 transition-all">
            <span className="text-2xl block drop-shadow-md">🎖️</span><span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-md">Ligler</span><span className="text-[8px] text-purple-100 uppercase tracking-widest block bg-purple-950/80 px-1.5 py-0.5 rounded shadow">Efsane</span>
          </button>
          
          <div className="col-span-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-xl p-2.5 flex flex-col justify-between h-36 shadow-xl">
            <span className="text-[9px] text-gray-300 font-bold block border-b border-white/20 pb-1 drop-shadow">🎙️ SOHBET ODASI VE GÖNDERİLER</span>
            <div className="flex-1 overflow-y-auto space-y-1.5 my-1 pr-1 text-[11px]">
              {gonderiler.map((g) => (
                <div key={g.id} className="bg-black/40 p-1.5 rounded border border-white/10 shadow-sm">
                  <div className="flex items-center gap-1 font-bold text-amber-400"><span>{g.isim}</span>{g.vip > 0 && <span className="text-[8px] bg-amber-500 text-black px-0.5 rounded font-black">V{g.vip}</span>}</div>
                  <p className="text-gray-100 mt-0.5">{g.metin}</p>
                  {g.gorselUrl && <img src={g.gorselUrl} alt="Gönderi" className="mt-1 rounded border border-gray-600 max-h-14 object-cover w-full shadow" />}
                </div>
              ))}
            </div>
            <div className="flex gap-1 border-t border-white/20 pt-1.5">
              <input type="text" className="flex-1 p-1 bg-black/40 border border-gray-500 rounded text-[11px] text-white outline-none focus:border-orange-500 placeholder-gray-400" placeholder="Yaz veya Görsel URL At..." value={mesaj} onChange={(e) => { setMesaj(e.target.value); if(e.target.value.startsWith("http")) setSeciliGorsel(e.target.value); }} onKeyDown={(e)=>e.key==='Enter' && yeniGonderiPaylas()}/>
              <button onClick={yeniGonderiPaylas} className="bg-orange-600 px-2 text-[10px] font-black rounded shadow hover:bg-orange-500">At</button>
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-2 h-36">
            <button onClick={()=>alert("🏰 Klan")} className="flex-1 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 backdrop-blur-md border border-cyan-500/40 rounded-xl flex flex-col items-center justify-center p-1 text-[11px] font-black uppercase hover:border-cyan-400 transition-all shadow-lg">
              <span className="drop-shadow-md">🏰</span><span className="text-[9px] text-cyan-200 mt-0.5">Klan</span>
            </button>
            <button onClick={()=>alert("🪙 Çip Diyarı")} className="flex-1 bg-gradient-to-r from-pink-900/60 to-fuchsia-900/60 backdrop-blur-md border border-pink-500/40 rounded-xl flex flex-col items-center justify-center p-1 text-[11px] font-black uppercase hover:border-pink-400 transition-all shadow-lg">
              <span className="drop-shadow-md">🎰</span><span className="text-[9px] text-pink-200 mt-0.5">Diyar</span>
            </button>
          </div>
        </div>

      </div>

      {/* EN ALT MENÜ BAR PANELİ */}
      <div className="w-full bg-black/60 backdrop-blur-lg p-2.5 rounded-xl border border-white/10 flex justify-between items-center shadow-2xl z-10">
        <div className="text-[10px] text-gray-400 font-medium tracking-wide drop-shadow">LOUNGE 101 CLUB v2.0</div>
        <div className="flex gap-2">
          <button onClick={() => { setCantaAcik(!cantaAcik); setVipMarketAcik(false); setArkadaslarAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-black/60 border border-white/20 px-4 py-2 rounded-xl text-xs font-black text-gray-200 hover:bg-black/80 transition-all shadow-md">💼 Çanta</button>
          <button onClick={() => { setHediyeCipPanelAcik(!hediyeCipPanelAcik); setVipMarketAcik(false); setCantaAcik(false); setArkadaslarAcik(false); setSiralamaAcik(false); }} className="bg-gradient-to-r from-amber-500 to-yellow-600 border border-yellow-400/40 text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:brightness-110">🪙 Hediye Çip</button>
          <button onClick={() => alert("📋 Günlük Görevler listesi")} className="bg-black/60 border border-white/20 px-4 py-2 rounded-xl text-xs font-black text-gray-200 hover:bg-black/80 transition-all shadow-md">📋 Görevler</button>
          <button onClick={() => { setArkadaslarAcik(!arkadaslarAcik); setVipMarketAcik(false); setCantaAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-black text-xs border border-teal-300/40 shadow-lg hover:brightness-110">👥 Arkadaşlarım</button>
          <button onClick={() => { setVipMarketAcik(!vipMarketAcik); setCantaAcik(false); setArkadaslarAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-white px-5 py-2 rounded-xl font-black text-xs border border-white/30 shadow-lg hover:brightness-110">🛒 Mağaza</button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: LÜKS BEYAZ/MAVİ TAM EKRAN LİDERLİK TABLOSU         */}
      {/* ======================================================== */}
      {siralamaAcik && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[80] backdrop-blur-md">
          <div className="w-[850px] h-[520px] bg-blue-50 rounded-3xl flex overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-fade-in relative border border-white">
            
            <button onClick={() => setSiralamaAcik(false)} className="absolute top-4 right-4 text-blue-900 hover:bg-white/50 font-black text-lg z-50 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center border border-blue-200 shadow-sm transition-all">✕</button>

            {/* SOL KATEGORİ MENÜSÜ */}
            <div className="w-48 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col py-6 shadow-xl z-20">
              <h2 className="text-center font-black text-yellow-300 tracking-widest mb-6 drop-shadow-md">LİDERLİK</h2>
              <div className="flex flex-col">
                {[
                  { id: "cip", ad: "🏆 Çip Sıralaması" },
                  { id: "yildiz", ad: "⭐ Yıldızlar" },
                  { id: "yukleme", ad: "💎 Yükleme" },
                  { id: "hediye", ad: "🎁 Hediye" },
                  { id: "odalar", ad: "🎙️ Odalar" },
                  { id: "fankulup", ad: "🪄 Fan Kulübü" }
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => setSiralamaKategori(s.id as any)}
                    className={`py-3.5 px-4 text-left text-xs font-bold transition-all border-l-4 ${siralamaKategori === s.id ? "bg-white/20 border-yellow-400 text-white shadow-inner" : "border-transparent text-blue-100 hover:bg-white/10"}`}
                  >
                    {s.ad}
                  </button>
                ))}
              </div>
            </div>

            {/* SAĞ İÇERİK ALANI */}
            <div className="flex-1 flex flex-col relative bg-blue-50">
              
              <div className="flex justify-center gap-2 p-3 bg-white shadow-sm z-10">
                {["genel", "bolge", "sehir"].map((sekme) => (
                  <button 
                    key={sekme}
                    onClick={() => setSiralamaSekme(sekme as any)}
                    className={`px-8 py-2.5 rounded-t-xl rounded-b-sm text-xs font-black uppercase tracking-wider transition-all ${siralamaSekme === sekme ? "bg-yellow-400 text-blue-900 shadow-md" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}
                  >
                    {sekme === "genel" ? "Genel" : sekme === "bolge" ? "Bölge" : "Şehir"}
                  </button>
                ))}
              </div>

              {/* KRALİYET PODYUMU */}
              <div className="h-56 flex justify-center items-end gap-10 pb-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blue-50 relative border-b border-blue-200 shadow-sm">
                <div className="flex flex-col items-center mb-4 cursor-pointer hover:-translate-y-2 transition-transform z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center text-3xl shadow-lg relative z-10">{detayliSiralama[1].avatar}</div>
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-black px-3 py-0.5 rounded-full z-20 shadow-sm">2</span>
                  </div>
                  <span className="font-bold text-blue-900 mt-3 text-xs">{detayliSiralama[1].isim}</span>
                  <span className="text-yellow-600 font-black text-[10px] bg-yellow-100 px-2 py-0.5 rounded-full mt-1 border border-yellow-300">🪙 {detayliSiralama[1].cip}</span>
                </div>

                <div className="flex flex-col items-center cursor-pointer hover:-translate-y-2 transition-transform z-20">
                  <div className="relative">
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl drop-shadow-md z-30">👑</span>
                    <div className="w-24 h-24 rounded-full bg-white border-[5px] border-yellow-400 flex items-center justify-center text-5xl shadow-[0_10px_25px_rgba(250,204,21,0.5)] relative z-10">{detayliSiralama[0].avatar}</div>
                    <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-white border border-yellow-600 text-xs font-black px-4 py-0.5 rounded-full z-20 shadow-md">1</span>
                  </div>
                  <span className="font-black text-blue-950 mt-4 text-sm">{detayliSiralama[0].isim}</span>
                  <span className="text-yellow-600 font-black text-xs bg-yellow-100 px-3 py-0.5 rounded-full mt-1 border border-yellow-300 shadow-sm">🪙 {detayliSiralama[0].cip}</span>
                </div>

                <div className="flex flex-col items-center mb-6 cursor-pointer hover:-translate-y-2 transition-transform z-10">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-white border-4 border-amber-600 flex items-center justify-center text-2xl shadow-lg relative z-10">{detayliSiralama[2].avatar}</div>
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-100 text-amber-800 border border-amber-400 text-[10px] font-black px-3 py-0.5 rounded-full z-20 shadow-sm">3</span>
                  </div>
                  <span className="font-bold text-blue-900 mt-3 text-[11px]">{detayliSiralama[2].isim}</span>
                  <span className="text-yellow-600 font-black text-[10px] bg-yellow-100 px-2 py-0.5 rounded-full mt-1 border border-yellow-300">🪙 {detayliSiralama[2].cip}</span>
                </div>
              </div>

              {/* LİSTE ALANI */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white">
                {detayliSiralama.slice(3).map((s) => (
                  <div key={s.sira} className="flex justify-between items-center p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100 transition-colors cursor-pointer shadow-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-blue-900 text-base w-6 text-center">{s.sira}</span>
                      <div className="w-9 h-9 rounded-full bg-white border border-blue-200 flex items-center justify-center text-lg shadow-inner">{s.avatar}</div>
                      <span className="font-bold text-blue-950 text-xs">{s.isim}</span>
                    </div>
                    <span className="text-yellow-600 font-black text-xs flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">🪙 {s.cip}</span>
                  </div>
                ))}
              </div>

              {/* KENDİ SIRALAMAN */}
              <div className="h-16 bg-white border-t border-blue-200 flex justify-between items-center px-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
                <div className="flex items-center gap-3">
                  <span className="font-black text-green-600 text-lg w-8">50+</span>
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center font-black text-blue-900 shadow-sm">{isim[0]?.toUpperCase() || "S"}</div>
                  <span className="font-bold text-blue-950">{isim || "Süleyman"}</span>
                </div>
                <span className="text-yellow-600 font-black text-sm bg-yellow-50 px-3 py-1 rounded-xl border border-yellow-300 shadow-sm">🪙 {bakiyeCip.toLocaleString()}</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DİĞER MODALLAR (Z-INDEX 70) */}
      {hediyePaneliAcik && hediyeHedefOyuncu && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="w-[600px] bg-slate-50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)] animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 flex justify-between items-center text-white relative">
              <div className="flex items-center gap-2"><span className="text-xl">✨</span><h3 className="font-bold text-base tracking-wide drop-shadow-md">Hediye gönder</h3></div>
              <button onClick={() => setHediyePaneliAcik(false)} className="bg-white/20 hover:bg-white/30 rounded-full w-7 h-7 flex items-center justify-center font-black">✕</button>
            </div>
            <div className="flex bg-gray-200 text-gray-500 font-bold text-xs">
              <button onClick={() => setHediyeSekmesi("elmas")} className={`px-5 py-2.5 rounded-tr-2xl transition-all ${hediyeSekmesi === "elmas" ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md" : "hover:bg-gray-300"}`}>💎 Elmas Ödülü</button>
              <button onClick={() => setHediyeSekmesi("klan")} className={`px-5 py-2.5 rounded-tr-2xl transition-all ${hediyeSekmesi === "klan" ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md" : "hover:bg-gray-300"}`}>🛡️ Klan Çipi Ödülü</button>
              <div className="ml-auto px-4 py-2 flex items-center gap-1.5 bg-white/50 text-indigo-900 rounded-bl-xl font-black"><span className="text-cyan-500 text-lg">💎</span> {bakiyeElmas.toFixed(1)}</div>
            </div>
            <div className="p-4 bg-blue-50/50">
              <div className="grid grid-cols-5 gap-3">
                {premiumHediyeler.map((h) => {
                  const secili = seciliHediyeId === h.id;
                  return (
                    <button key={h.id} onClick={() => setSeciliHediyeId(h.id)} className={`bg-white rounded-xl overflow-hidden flex flex-col items-center justify-between text-center h-28 relative shadow-sm transition-all border-b-4 ${secili ? "border-amber-400 ring-2 ring-amber-300 scale-105" : "border-blue-100 hover:border-blue-200"}`}>
                      {h.etiket && <span className={`absolute -right-2 top-2 text-[8px] font-extrabold text-white px-2 py-0.5 rounded shadow rotate-12 ${h.etiketRenk || "bg-red-500"}`}>{h.etiket}</span>}
                      <span className="text-3xl block mt-2 drop-shadow-sm">{h.emoji}</span>
                      <span className="text-[10px] block text-gray-700 font-bold px-0.5 mt-1 leading-tight">{h.ad}</span>
                      <div className="w-full mt-auto">
                        {h.envanterAdet > 0 ? (
                          <div className="bg-amber-400 text-white text-[9px] font-black py-1 w-full text-center tracking-wide">Envanter: {h.envanterAdet}</div>
                        ) : (
                          <div className="bg-blue-50 text-indigo-600 text-[10px] font-black py-1 w-full flex items-center justify-center gap-1"><span className="text-[10px]">💎</span> {h.maliyet}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white p-3 flex justify-between items-center border-t border-gray-200">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-lg shadow-inner">👤</div><span className="font-bold text-gray-800 text-sm">{hediyeHedefOyuncu.ad}</span></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-orange-200 rounded-full bg-orange-50/50">
                  <button onClick={() => setHediyeAdet(Math.max(1, hediyeAdet - 1))} className="px-2.5 text-orange-500 font-bold hover:bg-orange-100 rounded-l-full">-</button>
                  <span className="px-3 font-bold text-gray-700 text-xs w-8 text-center">{hediyeAdet}</span>
                  <button onClick={() => setHediyeAdet(hediyeAdet + 1)} className="px-2.5 text-orange-500 font-bold hover:bg-orange-100 rounded-r-full">+</button>
                </div>
                <button onClick={premiumHediyeGonderAksiyonu} className="bg-gradient-to-b from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-white font-black py-2 px-6 rounded-full text-sm shadow-md transition-all active:scale-95">Hediye gönder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gelenKutusuAcik && (
        <div className="absolute top-16 right-4 w-80 bg-slate-900 border border-gray-800 rounded-xl p-4 shadow-2xl z-[70] animate-fade-in">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3"><h3 className="font-black text-xs text-yellow-500">✉️ GELEN KUTUSU</h3><button onClick={() => setGelenKutusuAcik(false)} className="text-gray-500 text-xs hover:text-white">✕</button></div>
          <div className="space-y-2 h-52 overflow-y-auto pr-1">
            {mesajlar.length === 0 ? <p className="text-xs text-gray-500 text-center pt-10">Kutu boş.</p> : mesajlar.map((m) => (
              <div key={m.id} className="bg-black/40 p-2 rounded-lg border border-gray-800 text-xs">
                <div className="flex justify-between font-bold text-amber-400 mb-0.5"><span>{m.gonderen}</span>{m.hediyeMiktar > 0 && <span className="text-green-400">+{m.hediyeMiktar.toLocaleString()} 🪙</span>}</div>
                <p className="text-gray-300 text-[11px] leading-relaxed mb-2">{m.icerik}</p>
                <div className="flex justify-end gap-1.5 border-t border-gray-900/60 pt-1.5">
                  {m.hediyeMiktar > 0 && !m.alindi && <button onClick={() => arkadastanCipAl(m.id, m.hediyeMiktar)} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-black hover:bg-green-500">Al</button>}
                  <button onClick={() => mesajSil(m.id)} className="bg-red-950/60 text-red-400 px-2 py-1 rounded text-[10px] border border-red-900/40 hover:bg-red-900/40">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {arkadaslarAcik && (
        <div className="absolute bottom-16 right-4 w-96 bg-slate-950/95 border-2 border-teal-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[70]">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
            <div><h3 className="font-black text-sm text-teal-400">👥 KULÜP SOSYAL MERKEZİ</h3><p className="text-[10px] text-gray-500">Arkadaş Listesi: <span className="text-teal-400 font-bold">{arkadasListesi.length} / 100</span></p></div>
            <button onClick={() => setArkadaslarAcik(false)} className="text-gray-500 text-sm font-bold">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {[{ id: "arkadaslar", yazi: "Arkadaşlar" }, { id: "ekle", yazi: "➕ Ekle" }].map((s) => (
              <button key={s.id} onClick={() => setSosyalAktifSekme(s.id as any)} className={`text-[10px] font-bold py-1.5 rounded transition-all whitespace-nowrap ${sosyalAktifSekme === s.id ? "bg-teal-600 text-white shadow" : "bg-black/40 text-gray-400"}`}>{s.yazi}</button>
            ))}
          </div>
          <div className="h-44 overflow-y-auto space-y-1.5 text-xs">
            {sosyalAktifSekme === "arkadaslar" && (
              arkadasListesi.map((a) => (
                <div key={a.id} className="bg-black/40 p-2 rounded-xl border border-gray-800 flex justify-between items-center">
                  <div><div className="flex items-center gap-1.5 font-bold"><span className={a.aktif ? "text-green-400" : "text-gray-500"}>●</span><span>{a.ad}</span></div><span className="text-[9px] text-gray-500 block">ID: {a.id}</span></div>
                  <button onClick={() => { setHediyeHedefOyuncu(a); setHediyePaneliAcik(true); }} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-[10px] px-2.5 py-1 rounded-md shadow hover:brightness-110">🎁 Hediye Gönder</button>
                </div>
              ))
            )}
            {sosyalAktifSekme === "ekle" && (
              <div className="space-y-3 pt-1">
                <div className="flex gap-1.5 pt-2">
                  <input type="text" maxLength={7} className="flex-1 p-2 bg-black border border-gray-800 rounded-lg text-white text-xs" placeholder="Oyuncu ID Ara..." value={arananId} onChange={(e) => setArananId(e.target.value.replace(/\D/g, ''))}/>
                  <button onClick={idIleOyuncuAraVeIstekAt} className="bg-teal-600 px-3 py-2 text-white font-bold rounded-lg">Bul</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hediyeCipPanelAcik && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="w-96 bg-slate-900 border border-yellow-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(234,179,8,0.25)] relative">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-4">
              <div><h3 className="text-sm font-black text-yellow-400 tracking-wide">🪙 HEDİYE ÇİP TRANSFERİ</h3><p className="text-[10px] text-gray-400">Bakiye: <span className="text-yellow-500 font-bold">{bakiyeCip.toLocaleString()} 🪙</span></p></div>
              <button onClick={() => setHediyeCipPanelAcik(false)} className="text-gray-500 hover:text-white font-bold text-sm">✕</button>
            </div>
            <div className="space-y-3.5 text-xs relative">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase">👤 Alıcı Oyuncu ID</label>
                  <button onClick={() => setMiniArkadasSecAcik(!miniArkadasSecAcik)} className="text-[10px] bg-teal-950 text-teal-400 font-black border border-teal-900 px-2 py-0.5 rounded">{miniArkadasSecAcik ? "✕ Kapat" : "👥 Arkadaş Seç"}</button>
                </div>
                {miniArkadasSecAcik && (
                  <div className="absolute left-0 right-0 top-12 bg-slate-950 border border-gray-800 rounded-xl p-2 max-h-40 overflow-y-auto z-50 space-y-1 shadow-2xl">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Hızlı Seçmek İçin Tıkla:</p>
                    {arkadasListesi.map((a) => (
                      <button key={a.id} onClick={() => { setHediyeCipTargetId(a.id); setMiniArkadasSecAcik(false); }} className="w-full text-left bg-black/40 p-1.5 rounded border border-gray-800 text-[11px] flex justify-between"><span className="font-bold text-gray-300">{a.ad}</span><span className="text-teal-400 font-mono">ID: {a.id}</span></button>
                    ))}
                  </div>
                )}
                <input type="text" maxLength={7} className="w-full p-2.5 bg-black border border-gray-800 rounded-xl text-white font-mono text-xs focus:border-yellow-500 outline-none" placeholder="Gönderilecek Oyuncu ID gir..." value={hediyeCipTargetId} onChange={(e) => setHediyeCipTargetId(e.target.value.replace(/\D/g, ''))}/>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">🪙 Çip Miktarı</label>
                <input type="text" className="w-full p-2.5 bg-black border border-gray-800 rounded-xl text-yellow-400 font-bold text-xs focus:border-yellow-500 outline-none" placeholder="Örn: 5000" value={hediyeCipMiktar} onChange={(e) => setHediyeCipMiktar(e.target.value.replace(/\D/g, ''))}/>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button onClick={() => setHediyeCipPanelAcik(false)} className="w-1/3 bg-gray-800 hover:bg-gray-700 font-bold py-2 rounded-xl text-xs text-gray-300">İptal</button>
                <button onClick={hediyeCipGonderAksiyonu} className="w-2/3 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-black py-2 rounded-xl text-xs shadow hover:brightness-110">Güvenli Gönder 🪙</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {vipMarketAcik && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-[580px] bg-slate-950/95 border border-yellow-500/50 rounded-2xl p-5 shadow-2xl z-[70]">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
            <div className="flex gap-4">
              <button onClick={() => setMagazaAktifSekme("çipler")} className={`text-sm font-black px-4 py-1.5 rounded-lg border transition-all ${magazaAktifSekme === "çipler" ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black border-yellow-400 shadow-md" : "bg-black/50 text-gray-400 border-gray-800"}`}>🪙 ÇİP SATIN AL</button>
              <button onClick={() => setMagazaAktifSekme("vip")} className={`text-sm font-black px-4 py-1.5 rounded-lg border transition-all ${magazaAktifSekme === "vip" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md" : "bg-black/50 text-gray-400 border-gray-800"}`}>🏆 VIP PREMİUM</button>
            </div>
            <button onClick={() => setVipMarketAcik(false)} className="text-gray-500 font-bold text-base">✕</button>
          </div>
          {magazaAktifSekme === "çipler" && (
            <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto">
              {cipPaketleri.map((p) => (
                <div key={p.id} className={`bg-gradient-to-b ${p.bg} border border-gray-800 rounded-xl p-2.5 flex justify-between items-center shadow`}>
                  <div><h4 className="text-[10px] text-gray-400 font-bold">{p.ad}</h4><div className="text-sm font-black text-yellow-400 mt-0.5">{p.miktarYazi}</div></div>
                  <button onClick={() => cipSatinAl(p.miktar, p.fiyat)} className="bg-white text-black font-black text-[10px] px-3 py-1 rounded-md">{p.fiyat}</button>
                </div>
              ))}
            </div>
          )}
          {magazaAktifSekme === "vip" && (
            <div>
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 whitespace-nowrap px-1">
                {vipPaketleri.map((paket, i) => (
                  <button key={i} onClick={() => setSecilenPaketIndex(i)} className={`w-10 h-10 rounded-full text-[10px] font-black border-2 transition-all flex flex-col items-center justify-center relative ${paket.bg} ${secilenPaketIndex === i ? "ring-2 ring-yellow-400 scale-105" : ""} ${paket.seviye <= vipSeviyesi ? "border-green-500" : "border-gray-700"}`}><span>V{paket.seviye}</span></button>
                ))}
              </div>
              <div className="bg-black/50 p-4 rounded-xl border border-gray-800/80 flex items-center justify-between h-16 text-xs">
                <div><h3 className="font-black text-white">{aktifSecilenPaket.ad} {tacEmojisiGetir(aktifSecilenPaket.seviye)}</h3><p className="text-[10px] text-gray-400">Durum: {isZatenAlinmis ? "Sahipsiniz" : isSatinAlinabilir ? "🔓 Satın Alınabilir" : "🔒 Kilitli"}</p></div>
                <button disabled={!isSatinAlinabilir} onClick={() => siraliVipSatinAl(aktifSecilenPaket.seviye, aktifSecilenPaket.fiyat || "0")} className={`px-4 py-2 rounded-lg font-black text-xs ${isZatenAlinmis ? "bg-green-800 text-white" : isSatinAlinabilir ? "bg-yellow-500 text-black hover:brightness-110" : "bg-gray-800 text-gray-500"}`}>{isZatenAlinmis ? "Satın Alındı" : isSatinAlinabilir ? `${aktifSecilenPaket.fiyat} Satın Al` : "Kilitli"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {cantaAcik && (
        <div className="absolute bottom-16 right-4 w-96 bg-gray-900/95 border border-purple-500 rounded-2xl p-4 shadow-2xl z-[70]">
          <div className="flex justify-between items-center border-b border-purple-900 pb-2 mb-3"><h2 className="text-base font-bold text-purple-400">🎒 ENVANTER</h2><button onClick={() => setCantaAcik(false)} className="text-gray-400 hover:text-white">✕</button></div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(["çipler", "ıstakalar", "çerçeveler"] as const).map((sekme) => (
              <button key={sekme} onClick={() => setAktifSekme(sekme)} className={`p-1.5 text-xs font-bold rounded-lg capitalize ${aktifSekme === sekme ? "bg-purple-600 text-white shadow-md" : "bg-black/40 text-gray-400"}`}>{sekme}</button>
            ))}
          </div>
          <div className="h-52 overflow-y-auto space-y-2 pr-1">
            {envanter[aktifSekme].map((item, idx) => {
              const isIstakaSekmesi = aktifSekme === "ıstakalar";
              const zatenSatinAlinmis = isIstakaSekmesi ? alinanIstakalar.includes(item.id) : false;
              const suAnKusanilmis = isIstakaSekmesi ? kusanilanIstaka === item.id : false;
              let butonYazisi1 = item.durum;
              if (isIstakaSekmesi) {
                if (suAnKusanilmis) butonYazisi1 = "Kuşanıldı";
                else if (zatenSatinAlinmis) butonYazisi1 = "Kuşan";
                else butonYazisi1 = `${item.fiyati}`;
              }
              return (
                <div key={idx} className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-gray-800 text-xs">
                  <div className="flex flex-col flex-1 pr-2"><span className={`font-semibold text-xs ${item.stil || "text-white"}`}>{item.ad}</span><span className="text-[10px] text-gray-500">{item.id === 2 && aktifSekme === "çipler" ? "Özellik: Günlük Hak" : `Özellik: ${item.miktar}`}</span></div>
                  <button disabled={butonYazisi1.startsWith("🔒")} onClick={() => { if (item.paraTuru === "Hile") ucretsizCipDestegiAl(); else if (isIstakaSekmesi) istakaSatinAlVeyaKusan(item.id, item.fiyati || "0", item.paraTuru as "CIP" | "TL"); }} className={`px-3 py-1 rounded-md text-[11px] font-bold border transition-all whitespace-nowrap ${suAnKusanilmis || item.durum === "Aktif" ? "bg-green-950/60 text-green-400 border-green-800" : zatenSatinAlinmis || item.durum === "Açık" ? "bg-blue-950/60 text-blue-400 border-blue-800 hover:bg-blue-900" : item.durum === "Yükle" ? "bg-green-600 text-white border-green-400 hover:bg-green-500" : butonYazisi1.startsWith("🔒") ? "bg-red-950/40 text-red-400 border-red-900/50 cursor-not-allowed font-medium text-[11px]" : item.paraTuru === "TL" ? "bg-amber-600 text-black border-amber-400 hover:bg-amber-500" : "bg-purple-950/60 text-purple-300 border-purple-900 hover:bg-purple-900"}`}>{butonYazisi1}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ayarlarAcik && (
        <div className="absolute top-16 right-4 w-52 bg-slate-900 border border-gray-800 rounded-xl p-3 shadow-2xl z-[70] text-xs animate-fade-in">
          <h3 className="font-bold border-b border-gray-800 pb-1.5 mb-2 text-gray-400">⚙️ AYARLAR PANELİ</h3>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-red-950/60 text-red-400 py-1.5 rounded border border-red-900/30 font-bold hover:bg-red-900/30">Oturumu Kapat (Çıkış)</button>
        </div>
      )}

    </div>
  );
}