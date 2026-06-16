"use client";
import { useState, useEffect, useRef } from 'react';
import type { DragEvent, MouseEvent } from 'react';
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
  profilGizli?: boolean;
}

interface GelenBegeni extends OyuncuProfil {
  miktar: number;
  zaman: string;
  alindi: boolean;
}

interface HediyeCipGecmisKaydi {
  id: number;
  oyuncuId: string;
  oyuncuAd: string;
  miktar: number;
  tarih: string;
}

interface LiderlikOyuncusu extends OyuncuProfil {
  avatar: string;
  tac?: string;
  bolge: string;
  sehir: string;
  skorlar: Record<"okey" | "pisti" | "tavla", number>;
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

type GirisYontemi = "Google" | "Facebook" | "iOS" | "Misafir" | "Web";
type CihazModu = "web" | "mobile" | "facebook";

interface BekleyenOdeme {
  tur: "kampanya" | "cip" | "elmas" | "vip" | "istaka" | "istakaHediye";
  baslik: string;
  aciklama: string;
  fiyat: string;
  miktar?: number;
  elmas?: number;
  vipSeviye?: number;
  istakaId?: number;
  hediyeHedefId?: string;
}

interface UygulamaBildirimi {
  baslik: string;
  metin: string;
  tur: "odul" | "basari" | "bilgi";
}

type OdemeAdimi = "bilgi" | "dogrulama";

interface KartFormu {
  adSoyad: string;
  kartNo: string;
  sonKullanma: string;
  cvv: string;
  telefon: string;
}

// ============================================================
// TİP TANIMLARI — Pişti ve Tavla oyun state'leri için
// ============================================================
interface PistiKart {
  id: number;
  seri: 'kupa' | 'karo' | 'maca' | 'sinek';
  deger: string;
  sayisalDeger: number;
}

interface PistiDurumu {
  deste: PistiKart[];
  yer: PistiKart[];
  oyuncuEl: PistiKart[];
  botEl: PistiKart[];
  oyuncuSkor: number;
  botSkor: number;
  oyuncuToplanan: number;
  botToplanan: number;
  sira: 'oyuncu' | 'bot';
  mesaj: string;
  bitti: boolean;
  berabere?: boolean;
  kazananIndex?: number;
}

interface TavlaHane { index: number; renk: 'beyaz' | 'siyah' | null; sayi: number; }
interface TavlaDurumu {
  tahta: TavlaHane[];
  zar1: number; zar2: number;
  hamleHaklari: number[];
  oyuncuKirik: number; botKirik: number;
  oyuncuToplanan: number; botToplanan: number;
  sira: 'oyuncu' | 'bot';
  mesaj: string;
  bitti: boolean;
  seciliHane: number | null;
}

// Istaka görsel temaları (id, çanta'daki id ile eşleşir)
type IstakaTema = {
  arkaPlan: string;
  kenarlık: string;
  tasBg: string;
  tasMetin: string;
  efekt: string;
  isim: string;
  takim: string;
  logo: string;
  renkA: string;
  renkB: string;
  renkC?: string;
  metinRenk: string;
};

const ISTAKA_TEMALAR: Record<number, IstakaTema> = {
  1: { arkaPlan: 'from-amber-800 to-amber-950', kenarlık: 'border-amber-600', tasBg: 'bg-amber-50', tasMetin: 'text-amber-900', efekt: '', isim: '🪵 Ahşap', takim: 'Klasik Ahşap', logo: '101', renkA: '#8b4a18', renkB: '#2b1205', renkC: '#c89145', metinRenk: '#f8e3b0' },
  2: { arkaPlan: 'from-neutral-950 via-black to-zinc-800', kenarlık: 'border-white', tasBg: 'bg-gray-100', tasMetin: 'text-gray-900', efekt: 'shadow-[0_0_18px_rgba(255,255,255,0.35)]', isim: '🦅 Kara Kartal', takim: 'BEŞİKTAŞ', logo: 'BJK', renkA: '#050505', renkB: '#ffffff', renkC: '#d71920', metinRenk: '#ffffff' },
  3: { arkaPlan: 'from-red-800 via-yellow-600 to-red-900', kenarlık: 'border-yellow-300', tasBg: 'bg-yellow-50', tasMetin: 'text-yellow-900', efekt: 'shadow-[0_0_18px_rgba(251,191,36,0.55)]', isim: '🦁 Aslan', takim: 'GALATASARAY', logo: 'GS', renkA: '#A90432', renkB: '#FDB912', renkC: '#5f071d', metinRenk: '#fff3bf' },
  4: { arkaPlan: 'from-blue-950 via-blue-800 to-yellow-400', kenarlık: 'border-yellow-300', tasBg: 'bg-blue-50', tasMetin: 'text-blue-900', efekt: 'shadow-[0_0_18px_rgba(250,204,21,0.45)]', isim: '🌟 Kanarya', takim: 'FENERBAHÇE', logo: 'FB', renkA: '#002D72', renkB: '#FFED00', renkC: '#061a40', metinRenk: '#fff7a8' },
  5: { arkaPlan: 'from-cyan-800 via-blue-900 to-red-900', kenarlık: 'border-cyan-300', tasBg: 'bg-cyan-50', tasMetin: 'text-cyan-900', efekt: 'shadow-[0_0_18px_rgba(34,211,238,0.45)]', isim: '🌊 Karadeniz', takim: 'TRABZONSPOR', logo: 'TS', renkA: '#7A003C', renkB: '#00A3E0', renkC: '#2b0822', metinRenk: '#d8f6ff' },
  6: { arkaPlan: 'from-yellow-500 via-red-700 to-yellow-600', kenarlık: 'border-amber-300', tasBg: 'bg-amber-50', tasMetin: 'text-red-900', efekt: 'shadow-[0_0_18px_rgba(220,38,38,0.5)]', isim: '🟡🔴 Göztepe', takim: 'GÖZTEPE', logo: 'GÖZ', renkA: '#FFD100', renkB: '#D50032', renkC: '#680014', metinRenk: '#fff7c2' },
};

const FUTBOL_TAKIMLARI = [
  { id: 1, ad: "Beşiktaş",   emoji: "🦅", sembol: "BJK", renkA: "#000000", renkB: "#FFFFFF", fiyat: 0,      sahip: true  },
  { id: 2, ad: "Galatasaray",emoji: "🦁", sembol: "GS",  renkA: "#E30A17", renkB: "#F7A800", fiyat: 50000,  sahip: false },
  { id: 3, ad: "Fenerbahçe", emoji: "🌟", sembol: "FB",  renkA: "#0A2342", renkB: "#FFDD00", fiyat: 50000,  sahip: false },
  { id: 4, ad: "Trabzonspor",emoji: "🌊", sembol: "TS",  renkA: "#892CA0", renkB: "#8B0000", fiyat: 40000,  sahip: false },
  { id: 5, ad: "Başakşehir", emoji: "🏙️", sembol: "BAŞ", renkA: "#FF6600", renkB: "#001A5E", fiyat: 30000,  sahip: false },
  { id: 6, ad: "Bursaspor",  emoji: "🐊", sembol: "BUR", renkA: "#006400", renkB: "#FFFFFF", fiyat: 25000,  sahip: false },
];

// Okey el analiz fonksiyonları
function seriDiz(el: {id:number;renk:string;deger:number;okeyMi:boolean}[]) {
  // Her renk için ayrı grupla, ardışık serileri bul
  const renkler = ['kirmizi','siyah','mavi','sari'];
  const gruplar: {id:number;renk:string;deger:number;okeyMi:boolean}[][] = [];
  const kullanildi = new Set<number>();
  
  for (const renk of renkler) {
    const ayniRenk = el.filter(t => t.renk === renk && !t.okeyMi).sort((a,b) => a.deger - b.deger);
    let grup: typeof el = [];
    for (let i = 0; i < ayniRenk.length; i++) {
      if (grup.length === 0) { grup.push(ayniRenk[i]); continue; }
      if (ayniRenk[i].deger === grup[grup.length-1].deger + 1) {
        grup.push(ayniRenk[i]);
      } else {
        if (grup.length >= 3) gruplar.push([...grup]);
        grup = [ayniRenk[i]];
      }
    }
    if (grup.length >= 3) gruplar.push([...grup]);
  }
  gruplar.forEach(g => g.forEach(t => kullanildi.add(t.id)));
  
  // Jokerler ve kullanılmayanlar
  const jokerler = el.filter(t => t.okeyMi);
  const tekler = el.filter(t => !kullanildi.has(t.id) && !t.okeyMi);
  return { gruplar, tekler, jokerler };
}

function ciftDiz(el: {id:number;renk:string;deger:number;okeyMi:boolean}[]) {
  // 101 Okey çift dizimi: aynı sayı + aynı renkten 2 taş bir çift olur.
  // Örnek: kırmızı 2 + kırmızı 2 = geçerli çift.
  // Farklı renklerde aynı sayı artık çift sayılmaz.
  const gruplar: {id:number;renk:string;deger:number;okeyMi:boolean}[][] = [];
  const kullanildi = new Set<number>();
  const renkler = ['kirmizi', 'siyah', 'mavi', 'sari'];

  for (const renk of renkler) {
    for (let d = 1; d <= 13; d++) {
      const ayniTaslar = el
        .filter(t => t.renk === renk && t.deger === d && !t.okeyMi && !kullanildi.has(t.id))
        .sort((a, b) => a.id - b.id);

      while (ayniTaslar.length >= 2) {
        const grup = ayniTaslar.splice(0, 2);
        gruplar.push(grup);
        grup.forEach(t => kullanildi.add(t.id));
      }
    }
  }

  const jokerler = el.filter(t => t.okeyMi);
  const tekler = el.filter(t => !kullanildi.has(t.id) && !t.okeyMi);
  return { gruplar, tekler, jokerler };
}

function elPuanHesapla(gruplar: {deger:number}[][], jokerler: {deger:number}[]) {
  let puan = 0;
  gruplar.forEach(g => g.forEach(t => puan += t.deger));
  jokerler.forEach(() => puan += 25); // joker sabit 25
  return puan;
}

function okeyElAcmaAnalizi(el: OkeyTas[]) {
  const seri = seriDiz(el as any);
  const cift = ciftDiz(el as any);
  const seriPuan = elPuanHesapla(seri.gruplar as any, seri.jokerler as any);
  const ciftPuan = elPuanHesapla(cift.gruplar as any, cift.jokerler as any);
  const mod = ciftPuan > seriPuan ? 'çift' : 'seri';
  const secilen = mod === 'çift' ? cift : seri;
  const puan = Math.max(seriPuan, ciftPuan);
  return { puan, acabilir: puan >= 101, mod, gruplar: secilen.gruplar as OkeyTas[][], jokerler: secilen.jokerler as OkeyTas[], tekler: secilen.tekler as OkeyTas[] };
}

// ============================================================
// OKEY OYUN TİPLERİ VE MOTORU
// ============================================================
type TasRengi = 'kirmizi' | 'siyah' | 'mavi' | 'sari' | 'joker';
interface OkeyTas { id: number; renk: TasRengi; deger: number; okeyMi: boolean; }
interface OkeyOyuncu { isim: string; el: OkeyTas[]; bot: boolean; acildi?: boolean; acikPuan?: number; acilanGruplar?: OkeyTas[][]; }
interface OkeyDurum {
  oyuncular: OkeyOyuncu[];
  kalanDeste: OkeyTas[];
  gosterge: OkeyTas | null;
  okeyRenk: TasRengi; okeyDeger: number;
  aktifOyuncu: number; // 0 = sen
  atilanTas: OkeyTas | null;
  atilanTasGecmisi: { oyuncuIdx: number; tas: OkeyTas }[]; // son atılan taşlar
  oyuncuTasCektiMi?: boolean;
  mesaj: string;
  bitti: boolean;
  berabere?: boolean;
  kazananIndex?: number;
  minAcmaPuani?: number;
  katlamali?: boolean;
}


function okeyDesteOlustur(): OkeyTas[] {
  const deste: OkeyTas[] = [];
  const renkler: TasRengi[] = ['kirmizi','siyah','mavi','sari'];
  let id = 1;
  for (const renk of renkler) for (let s=1; s<=2; s++) for (let d=1; d<=13; d++) deste.push({id:id++,renk,deger:d,okeyMi:false});
  deste.push({id:id++,renk:'joker',deger:0,okeyMi:true});
  deste.push({id:id++,renk:'joker',deger:0,okeyMi:true});
  for (let i=deste.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deste[i],deste[j]]=[deste[j],deste[i]];}
  return deste;
}

function yeniOkeyOyunu(oyuncuIsim: string): OkeyDurum {
  const deste = okeyDesteOlustur();
  // Gösterge belirle
  let gIdx = Math.floor(Math.random() * deste.length);
  while (deste[gIdx].okeyMi) gIdx = Math.floor(Math.random() * deste.length);
  const gosterge = deste[gIdx];
  const okeyDeger = gosterge.deger === 13 ? 1 : gosterge.deger + 1;
  // Taşları dağıt: 4 oyuncu — ilk oyuncuya 22, diğerlerine 21
  const oyuncular: OkeyOyuncu[] = [
    { isim: oyuncuIsim, el: [], bot: false, acildi: false, acikPuan: 0 },
    { isim: 'Ahmet', el: [], bot: true, acildi: false, acikPuan: 0 },
    { isim: 'Mehmet', el: [], bot: true, acildi: false, acikPuan: 0 },
    { isim: 'Zeynep', el: [], bot: true, acildi: false, acikPuan: 0 },
  ];
  const dagitim = [...deste];
  oyuncular.forEach((o, i) => { o.el = dagitim.splice(0, i===0 ? 22 : 21); });
  return { oyuncular, kalanDeste: dagitim, gosterge, okeyRenk: gosterge.renk, okeyDeger, aktifOyuncu: 0, atilanTas: null, atilanTasGecmisi: [], oyuncuTasCektiMi: true, mesaj: 'İlk elde fazla taş sende. Önce bir taş at.', bitti: false, minAcmaPuani: 101, katlamali: false };
}

const TAS_RENK_STIL: Record<TasRengi, string> = {
  kirmizi: 'text-red-600 border-red-300',
  siyah:   'text-gray-900 border-gray-400',
  mavi:    'text-blue-600 border-blue-300',
  sari:    'text-yellow-500 border-yellow-300',
  joker:   'text-purple-600 border-purple-300',
};

type OyunSonucTuru = 'Okey' | 'Pişti' | 'Tavla';

const OYUN_RUTBELERI = [
  { ad: 'Er', minPuan: 0, minOyun: 0, ikon: '🎖️', renk: 'from-slate-400 to-slate-600' },
  { ad: 'Onbaşı', minPuan: 300, minOyun: 10, ikon: '🥉', renk: 'from-orange-400 to-amber-700' },
  { ad: 'Çavuş', minPuan: 750, minOyun: 25, ikon: '🥈', renk: 'from-zinc-300 to-zinc-600' },
  { ad: 'Usta I', minPuan: 1400, minOyun: 50, ikon: '🏅', renk: 'from-yellow-400 to-orange-600' },
  { ad: 'Usta II', minPuan: 2400, minOyun: 90, ikon: '👑', renk: 'from-yellow-300 via-orange-500 to-red-600' },
  { ad: 'Kral', minPuan: 3800, minOyun: 150, ikon: '💎', renk: 'from-cyan-300 via-blue-500 to-purple-700' },
  { ad: 'Efsane', minPuan: 5500, minOyun: 250, ikon: '🔥', renk: 'from-fuchsia-400 via-red-500 to-yellow-400' },
];

function oyunRutbesiGetir(puan: number, oyunSayisi: number) {
  return [...OYUN_RUTBELERI].reverse().find(r => puan >= r.minPuan && oyunSayisi >= r.minOyun) || OYUN_RUTBELERI[0];
}

function sonrakiRutbeGetir(puan: number, oyunSayisi: number) {
  const aktifIndex = OYUN_RUTBELERI.findIndex(r => r.ad === oyunRutbesiGetir(puan, oyunSayisi).ad);
  return OYUN_RUTBELERI[Math.min(aktifIndex + 1, OYUN_RUTBELERI.length - 1)];
}

function rutbeYuzdesiGetir(puan: number, oyunSayisi: number) {
  const aktif = oyunRutbesiGetir(puan, oyunSayisi);
  const siradaki = sonrakiRutbeGetir(puan, oyunSayisi);
  if (aktif.ad === siradaki.ad) return 100;
  const puanAraligi = Math.max(1, siradaki.minPuan - aktif.minPuan);
  const oyunAraligi = Math.max(1, siradaki.minOyun - aktif.minOyun);
  const puanYuzde = ((puan - aktif.minPuan) / puanAraligi) * 100;
  const oyunYuzde = ((oyunSayisi - aktif.minOyun) / oyunAraligi) * 100;
  return Math.max(0, Math.min(100, Math.floor(Math.min(puanYuzde, oyunYuzde))));
}

// ============================================================
function pistiDesteOlustur(): PistiKart[] {
  const deste: PistiKart[] = [];
  const seriler = ['kupa','karo','maca','sinek'] as const;
  const degerler = [
    {d:'A',s:1},{d:'2',s:2},{d:'3',s:3},{d:'4',s:4},{d:'5',s:5},{d:'6',s:6},
    {d:'7',s:7},{d:'8',s:8},{d:'9',s:9},{d:'10',s:10},{d:'J',s:11},{d:'Q',s:12},{d:'K',s:13}
  ];
  let id = 1;
  for (const seri of seriler) for (const e of degerler) deste.push({id:id++,seri,deger:e.d,sayisalDeger:e.s});
  for (let i = deste.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [deste[i],deste[j]]=[deste[j],deste[i]]; }
  return deste;
}

function yeniPistiOyunu(): PistiDurumu {
  const deste = pistiDesteOlustur();
  const yer = deste.splice(0,4);
  const oyuncuEl = deste.splice(0,4);
  const botEl = deste.splice(0,4);
  return { deste, yer, oyuncuEl, botEl, oyuncuSkor:0, botSkor:0, oyuncuToplanan:0, botToplanan:0, sira:'oyuncu', mesaj:'Kartını seç ve at!', bitti:false };
}

function kartSeriSembol(seri: string) {
  if (seri==='kupa') return { s:'♥', c:'text-red-500' };
  if (seri==='karo') return { s:'♦', c:'text-red-500' };
  if (seri==='maca') return { s:'♠', c:'text-gray-900' };
  return { s:'♣', c:'text-gray-900' };
}

function yeniTavlaOyunu(): TavlaDurumu {
  const tahta: TavlaHane[] = Array.from({length:24},(_,i)=>({index:i+1,renk:null,sayi:0}));
  tahta[0]  = {index:1, renk:'beyaz',sayi:2};
  tahta[23] = {index:24,renk:'siyah',sayi:2};
  tahta[5]  = {index:6, renk:'siyah',sayi:5};
  tahta[18] = {index:19,renk:'beyaz',sayi:5};
  tahta[7]  = {index:8, renk:'siyah',sayi:3};
  tahta[16] = {index:17,renk:'beyaz',sayi:3};
  tahta[11] = {index:12,renk:'beyaz',sayi:5};
  tahta[12] = {index:13,renk:'siyah',sayi:5};
  const z1=Math.floor(Math.random()*6)+1, z2=Math.floor(Math.random()*6)+1;
  const haklar = z1===z2 ? [z1,z1,z1,z1] : [z1,z2];
  return { tahta, zar1:z1, zar2:z2, hamleHaklari:haklar, oyuncuKirik:0, botKirik:0, oyuncuToplanan:0, botToplanan:0, sira:'oyuncu', mesaj:'Zar attın! Haneni seç.', bitti:false, seciliHane:null };
}

function HaftalikOdulGorseli({ tur }: { tur: "cip" | "elmas" }) {
  if (tur === "elmas") {
    return <ElmasSimgesi boyut="xl" />;
  }

  return (
    <div className="relative h-28 w-28">
      <div className="absolute bottom-1 left-1/2 h-5 w-24 -translate-x-1/2 rounded-[50%] bg-amber-900/20 blur-sm"></div>
      <div className="absolute bottom-4 left-2 h-9 w-24 rounded-[50%] border-2 border-amber-300 bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-600 shadow-[0_10px_20px_rgba(217,119,6,0.35)]"></div>
      <div className="absolute bottom-8 left-1 h-9 w-24 rounded-[50%] border-2 border-yellow-200 bg-gradient-to-b from-yellow-100 via-yellow-400 to-orange-500"></div>
      <div className="absolute bottom-12 left-4 h-9 w-24 rounded-[50%] border-2 border-yellow-100 bg-gradient-to-b from-yellow-50 via-amber-300 to-orange-500 shadow-[0_8px_18px_rgba(251,191,36,0.4)]"></div>
      <div className="absolute left-1/2 top-3 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border-[5px] border-yellow-100 bg-gradient-to-br from-yellow-100 via-amber-300 to-orange-600 shadow-[inset_0_4px_10px_rgba(255,255,255,0.7),0_12px_22px_rgba(180,83,9,0.35)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-700/30 bg-amber-500/35 text-lg font-black text-amber-950 shadow-inner">101</div>
      </div>
      <div className="absolute left-[65px] top-7 h-5 w-2 rotate-12 rounded-full bg-white/70 blur-[1px]"></div>
    </div>
  );
}

function ElmasSimgesi({ boyut = "md", className = "" }: { boyut?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const boyutlar = {
    xs: "h-4 w-4",
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-10 w-10",
    xl: "h-28 w-28",
  };

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center align-middle ${boyutlar[boyut]} ${className}`} aria-hidden="true">
      <span className="absolute left-1/2 top-[16%] h-[68%] w-[68%] -translate-x-1/2 rotate-45 rounded-[18%] border-2 border-cyan-100 bg-gradient-to-br from-sky-200 via-cyan-400 to-blue-700 shadow-[0_10px_24px_rgba(14,165,233,0.38)]"></span>
      <span className="absolute left-1/2 top-[12%] h-[31%] w-[68%] -translate-x-1/2 rotate-45 rounded-t-lg border-l-2 border-t-2 border-white/70 bg-white/35"></span>
      <span className="absolute left-1/2 top-[39%] h-[25%] w-[25%] -translate-x-1/2 rotate-45 rounded bg-white/30"></span>
      <span className="absolute inset-x-[14%] bottom-[5%] h-[12%] rounded-full bg-cyan-900/20 blur-sm"></span>
    </span>
  );
}

function CipSimgesi({ boyut = "sm", className = "" }: { boyut?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const boyutlar = {
    xs: "h-4 w-4 text-[5px] border",
    sm: "h-5 w-5 text-[6px] border",
    md: "h-7 w-7 text-[8px] border-2",
    lg: "h-10 w-10 text-[11px] border-2",
    xl: "h-16 w-16 text-[17px] border-[3px]",
  };

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-yellow-100 bg-gradient-to-br from-yellow-100 via-amber-300 to-orange-600 align-middle shadow-[inset_0_2px_5px_rgba(255,255,255,0.75),0_2px_5px_rgba(180,83,9,0.28)] ${boyutlar[boyut]} ${className}`}>
      <span className="absolute inset-[18%] rounded-full border border-amber-800/30 bg-amber-500/35 shadow-inner"></span>
      <span className="relative font-black leading-none text-amber-950">101</span>
      <span className="absolute right-[22%] top-[18%] h-[22%] w-[8%] rotate-12 rounded-full bg-white/75 blur-[1px]"></span>
    </span>
  );
}

export default function LoungeApp() {
  const [cihazModu, setCihazModu] = useState<CihazModu>("web");
  const [acilisYukleniyor, setAcilisYukleniyor] = useState(true);
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [girisYontemi, setGirisYontemi] = useState<GirisYontemi>("Web");
  const [oyunSecimAcik, setOyunSecimAcik] = useState(false);
  const [hazirTik, setHazirTik] = useState(false);
  const [oyunBekleme, setOyunBekleme] = useState(false);
  const [aktifOyun, setAktifOyun] = useState("");
  const [masaListeOyunu, setMasaListeOyunu] = useState<'101 Okey' | 'Pişti' | 'Tavla' | null>(null);
  const [otomatikOkeyAcik, setOtomatikOkeyAcik] = useState(false);
  const [isim, setIsim] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [seciliGorsel, setSeciliGorsel] = useState<string | null>(null);

  // --- PİŞTİ OYUN STATE ---
  const [pistiAcik, setPistiAcik] = useState(false);
  const [pistiDurum, setPistiDurum] = useState<PistiDurumu | null>(null);

  // --- OKEY OYUN STATE ---
  const [okeyAcik, setOkeyAcik] = useState(false);
  const [okeyDurum, setOkeyDurum] = useState<OkeyDurum | null>(null);
  const [okeyDizMod, setOkeyDizMod] = useState<'serbest' | 'seri' | 'cift'>('serbest');
  const [okeySuruklenenTas, setOkeySuruklenenTas] = useState<number | null>(null);
  const [okeySecilenTaslar, setOkeySecilenTaslar] = useState<number[]>([]);
  const [okeyTimer, setOkeyTimer] = useState<number>(15); // geri sayım
  const [okeyTimerAktif, setOkeyTimerAktif] = useState<boolean>(false);
  const [okeySohbetAcik, setOkeySohbetAcik] = useState<boolean>(false);
  const [genelKanalMenuAcik, setGenelKanalMenuAcik] = useState<boolean>(false);
  const [okeySohbetSekme, setOkeySohbetSekme] = useState<'kanal1' | 'kanal2' | 'kanal3' | 'kanal4' | 'kanal5' | 'kanal6' | 'vip' | 'sehir' | 'oyun' | 'ozel'>('kanal1');
  const [okeySohbetMetni, setOkeySohbetMetni] = useState<string>('');
  const [okeyOzelSohbetKisi, setOkeyOzelSohbetKisi] = useState<string | null>(null);
  const [okeySohbetMesajlari, setOkeySohbetMesajlari] = useState<Record<string, {id:number; isim:string; metin:string; zaman:string}[]>>({
    kanal1: [{ id: 1, isim: 'Sistem', metin: 'Kanal 1 sohbetine hoş geldin.', zaman: 'şimdi' }],
    kanal2: [],
    kanal3: [],
    kanal4: [],
    kanal5: [],
    kanal6: [],
    sehir: [{ id: 6, isim: 'İzmirli_Efe', metin: 'Şehir sohbetine hoş geldin.', zaman: 'şimdi' }],
    vip: [{ id: 4, isim: 'VIP Lounge', metin: 'VIP kanala hoş geldin. Burada sadece VIP oyuncular konuşabilir.', zaman: 'şimdi' }],
    oyun: [{ id: 2, isim: 'Sistem', metin: 'Oyun içi konuşmalar burada görünür.', zaman: 'şimdi' }],
    ozel: [{ id: 3, isim: 'Ahmet', metin: 'Özel mesaj kutusu hazır.', zaman: 'şimdi' }],
  });
  const [okeyProfilAcik, setOkeyProfilAcik] = useState<boolean>(false);
  const [okeyProfilIndex, setOkeyProfilIndex] = useState<number>(0);
  const [lobiSohbetAcik, setLobiSohbetAcik] = useState<boolean>(false);
  const [lobiSohbetSekme, setLobiSohbetSekme] = useState<'genel' | 'sehir' | 'ozel' | 'masa'>('genel');
  const [sohbetSesAcik, setSohbetSesAcik] = useState<boolean>(true);
  const [sohbetDuyuruAcik, setSohbetDuyuruAcik] = useState<boolean>(true);
  const [seciliArkadasProfil, setSeciliArkadasProfil] = useState<OyuncuProfil | null>(null);
  const [profilAcilisKaynak, setProfilAcilisKaynak] = useState<"liste" | "arama">("liste");
  const [digerProfilSekme, setDigerProfilSekme] = useState<'profil' | 'gonderiler' | 'basarilar'>('profil');
  const [digerProfilBasariKategori, setDigerProfilBasariKategori] = useState<string>('Otomatik Eşleşme');
  const [arkadasIstekleri, setArkadasIstekleri] = useState<string[]>([]);
  const [begeniPaneliAcik, setBegeniPaneliAcik] = useState<boolean>(false);
  const [arkadasBegeniZamanlari, setArkadasBegeniZamanlari] = useState<Record<string, number>>({});
  const [begeniKayitlariYuklendi, setBegeniKayitlariYuklendi] = useState<boolean>(false);
  const [ekonomiYuklendi, setEkonomiYuklendi] = useState<boolean>(false);
  const [gelenBegeniler, setGelenBegeniler] = useState<GelenBegeni[]>([
    { id: "90314", ad: "Mavi_İnci", vip: 7, aktif: true, miktar: 2000, zaman: "Bugün", alindi: false },
    { id: "60218", ad: "Kartal_34", vip: 3, aktif: true, miktar: 2000, zaman: "Bugün", alindi: false },
    { id: "77402", ad: "SessizUsta", vip: 0, aktif: false, miktar: 2000, zaman: "Dün", alindi: false },
    { id: "31880", ad: "BeyazMasa", vip: 9, aktif: true, miktar: 2000, zaman: "Bugün", alindi: false },
  ]);

  // --- PROFİL / AVATAR STATE ---
  const [profilModalAcik, setProfilModalAcik] = useState<boolean>(false);
  const [avatarSecimAcik, setAvatarSecimAcik] = useState<boolean>(false);
  const [profilAvatar, setProfilAvatar] = useState<string>('👤');
  const profilAvatarSecenekleri = ['👨🏻', '👩🏻', '🧔🏻', '👱🏻‍♀️', '👨🏽‍💼', '👩🏻‍🎤', '🧕🏻', '👨🏻‍🎮', '👩🏻‍💻', '😎', '🦁', '🦅'];
  const [profilSekme, setProfilSekme] = useState<'profil' | 'gonderiler' | 'basarilar'>('profil');
  const [profilDuzenleme, setProfilDuzenleme] = useState<'isim' | 'konum' | 'avatar' | null>(null);
  const [profilIsimTaslak, setProfilIsimTaslak] = useState<string>(isim || 'Süleyman');
  const [profilCinsiyet, setProfilCinsiyet] = useState<'Erkek' | 'Kız'>('Erkek');
  const [profilUlke, setProfilUlke] = useState<string>('Türkiye');
  const [profilBolge, setProfilBolge] = useState<string>('Ege Bölgesi');
  const [profilSehir, setProfilSehir] = useState<string>('İzmir');
  const [profilKonumGizlilik, setProfilKonumGizlilik] = useState<'Herkes' | 'Çevrem' | 'Sadece ben'>('Herkes');
  const TURKIYE_BOLGELERI: Record<string, string[]> = {
    'Ege Bölgesi': ['İzmir', 'Aydın', 'Muğla', 'Manisa', 'Denizli', 'Uşak', 'Kütahya', 'Afyonkarahisar'],
    'Marmara Bölgesi': ['İstanbul', 'Bursa', 'Kocaeli', 'Sakarya', 'Tekirdağ', 'Edirne', 'Kırklareli', 'Balıkesir', 'Çanakkale', 'Yalova', 'Bilecik'],
    'Akdeniz Bölgesi': ['Antalya', 'Mersin', 'Adana', 'Hatay', 'Osmaniye', 'Kahramanmaraş', 'Isparta', 'Burdur'],
    'İç Anadolu Bölgesi': ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Kırıkkale', 'Kırşehir', 'Nevşehir', 'Niğde', 'Aksaray', 'Karaman', 'Yozgat', 'Çankırı'],
    'Karadeniz Bölgesi': ['Trabzon', 'Samsun', 'Ordu', 'Giresun', 'Rize', 'Artvin', 'Sinop', 'Kastamonu', 'Bartın', 'Zonguldak', 'Karabük', 'Düzce', 'Bolu', 'Amasya', 'Tokat', 'Çorum', 'Gümüşhane', 'Bayburt'],
    'Doğu Anadolu Bölgesi': ['Erzurum', 'Erzincan', 'Kars', 'Ağrı', 'Iğdır', 'Ardahan', 'Van', 'Muş', 'Bitlis', 'Bingöl', 'Elazığ', 'Malatya', 'Tunceli', 'Hakkâri'],
    'Güneydoğu Anadolu Bölgesi': ['Diyarbakır', 'Gaziantep', 'Şanlıurfa', 'Mardin', 'Batman', 'Siirt', 'Şırnak', 'Adıyaman', 'Kilis'],
  };
  const profilBolgeDegistir = (bolge: string) => {
    setProfilBolge(bolge);
    setProfilSehir(TURKIYE_BOLGELERI[bolge]?.[0] || 'İzmir');
  };
  const [profilPostMetni, setProfilPostMetni] = useState<string>('');
  const [profilPostGorsel, setProfilPostGorsel] = useState<string | null>(null);
  const [profilGonderiler, setProfilGonderiler] = useState<{id:number; metin:string; gorsel?:string; tarih:string}[]>([]);
  const profilBasariKategorileri = ['Otomatik Eşleşme', 'Masa Aç', 'Pişti', 'Tavla'];
  const profilBasariKayitlari: Record<string, string[]> = {
    'Otomatik Eşleşme': ['9/6/2026  Otomatik eşleşme masasında oyunu elden bitirdi', '8/6/2026  Otomatik eşleşme masalarında 3 kez galibiyet alındı', '7/6/2026  Otomatik eşleşme masasında 125.000 çip kazanıldı'],
    'Masa Aç': ['10/6/2026  Ustalar masasında oyun kazandı', '6/6/2026  Kendi açtığı masada 5 kez galibiyet aldı'],
    'Pişti': ['5/6/2026  Pişti masasında seri galibiyet aldı', '3/6/2026  Vale ile masayı topladı'],
    'Tavla': ['4/6/2026  Tavlada mars yaptı', '2/6/2026  Tavla masasında 75.000 çip kazandı'],
  };
  const [profilBasariKategori, setProfilBasariKategori] = useState<string>('Otomatik Eşleşme');

  const kendiProfiliniAc = () => {
    setOkeyProfilAcik(false);
    setSeciliArkadasProfil(null);
    setAvatarSecimAcik(false);
    setProfilDuzenleme(null);
    setProfilSekme('profil');
    setProfilModalAcik(true);
  };

  const oyunProfiliniAc = (idx: number) => {
    if (idx === 0) {
      kendiProfiliniAc();
      return;
    }
    setOkeyProfilIndex(idx);
    setOkeyProfilAcik(true);
  };

  const okeyIstakaRef = useRef<HTMLDivElement | null>(null);
  const bildirimZamanlayiciRef = useRef<number | null>(null);
  const [okeyTasPozisyonlari, setOkeyTasPozisyonlari] = useState<Record<number, { x: number; y: number }>>({});
  const [okeyAktifSurukleme, setOkeyAktifSurukleme] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);

  // --- TAVLA OYUN STATE ---
  const [tavlaAcik, setTavlaAcik] = useState(false);
  const [tavlaDurum, setTavlaDurum] = useState<TavlaDurumu | null>(null);
  const [tavlaTakimSecimAcik, setTavlaTakimSecimAcik] = useState(false);
  const [seciliTakim, setSeciliTakim] = useState(FUTBOL_TAKIMLARI[0]);
  const [sahipOlunanTakimlar, setSahipOlunanTakimlar] = useState<number[]>([1]);

  useEffect(() => {
    const cihazOlceginiGuncelle = () => {
      const userAgent = navigator.userAgent || "";
      const facebookTarayici = /FBAN|FBAV|FB_IAB|Instagram|Messenger/i.test(userAgent);
      const dokunmatik = window.matchMedia?.("(pointer: coarse)").matches ?? false;
      const darEkran = window.innerWidth <= 820;
      const mod: CihazModu = facebookTarayici ? "facebook" : (darEkran || dokunmatik ? "mobile" : "web");
      setCihazModu(mod);
      document.documentElement.dataset.device = mod;
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    };

    cihazOlceginiGuncelle();
    const yuklemeTimer = window.setTimeout(() => setAcilisYukleniyor(false), 1450);
    window.addEventListener("resize", cihazOlceginiGuncelle);
    window.addEventListener("orientationchange", cihazOlceginiGuncelle);

    return () => {
      window.clearTimeout(yuklemeTimer);
      window.removeEventListener("resize", cihazOlceginiGuncelle);
      window.removeEventListener("orientationchange", cihazOlceginiGuncelle);
    };
  }, []);

  // --- MASA AÇ FONKSİYONU ---
  const masaAc = (oyunTuru: string) => {
    if (oyunTuru === '101 Okey' || oyunTuru === 'Pişti' || oyunTuru === 'Tavla') {
      setMasaListeOyunu(oyunTuru as '101 Okey' | 'Pişti' | 'Tavla');
      setOyunSecimAcik(false);
      return;
    }
    setAktifOyun(oyunTuru);
    setOyunSecimAcik(false);
    setOyunBekleme(true);
    setHazirTik(false);
  };


  const otomatikOkeyBaslat = (ucret: number) => {
    if (bakiyeCip < ucret) {
      bildirimGoster("Yetersiz çip", `Bu otomatik eşleşme için ${ucret.toLocaleString()} çip gerekiyor.`, "bilgi");
      return;
    }
    setBakiyeCip(prev => prev - ucret);
    setOtomatikOkeyAcik(false);
    setOkeyAcik(true);
    setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu'));
    setOkeyDizMod('serbest');
  };

  // --- PİŞTİ: Kart At ---
  const pistiKartAt = (kartId: number) => {
    if (!pistiDurum || pistiDurum.sira !== 'oyuncu' || pistiDurum.bitti) return;
    const d = { ...pistiDurum, oyuncuEl: [...pistiDurum.oyuncuEl], yer: [...pistiDurum.yer], deste: [...pistiDurum.deste], botEl: [...pistiDurum.botEl] };
    const kartIdx = d.oyuncuEl.findIndex(k => k.id === kartId);
    if (kartIdx === -1) return;
    const [kart] = d.oyuncuEl.splice(kartIdx, 1);
    let mesajStr = '';
    if (d.yer.length > 0 && d.yer[d.yer.length-1].deger === kart.deger) {
      if (d.yer.length === 1) {
        mesajStr = `💥 PİŞTİ! +${kart.deger === 'J' ? 20 : 10} puan!`;
        d.oyuncuSkor += kart.deger === 'J' ? 20 : 10;
      } else {
        mesajStr = `🎉 ${d.yer.length+1} kart toplandı!`;
      }
      d.oyuncuToplanan += d.yer.length + 1;
      d.yer = [];
    } else if (kart.deger === 'J') {
      mesajStr = `🃏 Vale! ${d.yer.length} kart toplandı!`;
      d.oyuncuToplanan += d.yer.length + 1;
      d.yer = [];
    } else {
      d.yer.push(kart);
      mesajStr = `Attın: ${kart.deger}`;
    }
    d.sira = 'bot';
    d.mesaj = mesajStr;
    // Kart bitmişse dağıt
    if (d.oyuncuEl.length === 0 && d.deste.length >= 8) {
      d.oyuncuEl = d.deste.splice(0,4);
      d.botEl = d.deste.splice(0,4);
    }
    // Oyun sonu kontrolü (deste + eller bitti)
    if (d.oyuncuEl.length === 0 && d.botEl.length === 0 && d.deste.length === 0) {
      d.bitti = true;
      d.sira = 'oyuncu';
      d.mesaj = `🏁 Oyun bitti! Sen: ${d.oyuncuSkor} | Bot: ${d.botSkor}`;
      setPistiDurum({...d});
      return;
    }
    setPistiDurum({...d});
    // Bot hamlesi
    setTimeout(() => {
      setPistiDurum(prev => {
        if (!prev || prev.sira !== 'bot' || prev.bitti) return prev;
        const bd = { ...prev, botEl: [...prev.botEl], yer: [...prev.yer], deste: [...prev.deste], oyuncuEl: [...prev.oyuncuEl] };
        // Bot eli boşsa dağıt
        if (bd.botEl.length === 0 && bd.deste.length >= 8) {
          bd.oyuncuEl = bd.deste.splice(0,4);
          bd.botEl = bd.deste.splice(0,4);
        }
        // Bot eli hâlâ boşsa oyun bitti
        if (bd.botEl.length === 0) {
          bd.bitti = true;
          bd.sira = 'oyuncu';
          bd.mesaj = `🏁 Oyun bitti! Sen: ${bd.oyuncuSkor} | Bot: ${bd.botSkor}`;
          return bd;
        }
        // Bot stratejisi
        let secilenIdx = 0;
        const ustKart = bd.yer[bd.yer.length-1];
        if (ustKart) {
          const esIdx = bd.botEl.findIndex(k => k.deger === ustKart.deger);
          if (esIdx !== -1) { secilenIdx = esIdx; }
          else { const vIdx = bd.botEl.findIndex(k => k.deger === 'J'); if (vIdx !== -1) secilenIdx = vIdx; }
        }
        const [botKart] = bd.botEl.splice(secilenIdx, 1);
        let bMesaj = '';
        if (bd.yer.length > 0 && bd.yer[bd.yer.length-1].deger === botKart.deger) {
          if (bd.yer.length === 1) { bMesaj = `🤖 Bot PİŞTİ! +${botKart.deger==='J'?20:10} puan`; bd.botSkor += botKart.deger==='J'?20:10; }
          else bMesaj = `🤖 Bot ${bd.yer.length+1} kart topladı!`;
          bd.botToplanan += bd.yer.length+1; bd.yer = [];
        } else if (botKart.deger === 'J') {
          bMesaj = `🤖 Vale! ${bd.yer.length} kart topladı!`; bd.botToplanan += bd.yer.length+1; bd.yer = [];
        } else { bd.yer.push(botKart); bMesaj = `🤖 Bot attı: ${botKart.deger}`; }
        bd.sira = 'oyuncu'; bd.mesaj = bMesaj;
        // Kart dağıtımı
        if (bd.oyuncuEl.length === 0 && bd.deste.length >= 8) {
          bd.oyuncuEl = bd.deste.splice(0,4); bd.botEl = bd.deste.splice(0,4);
        }
        // Oyun sonu
        if (bd.oyuncuEl.length === 0 && bd.botEl.length === 0 && bd.deste.length === 0) {
          bd.bitti = true; bd.sira = 'oyuncu';
          bd.mesaj = `🏁 Oyun bitti! Sen: ${bd.oyuncuSkor} | Bot: ${bd.botSkor}`;
        }
        return bd;
      });
    }, 900);
  };

  // --- TAVLA: Zar At ---
  const tavlaZarAt = () => {
    setTavlaDurum(prev => {
      if (!prev || prev.sira !== 'oyuncu') return prev;
      const z1=Math.floor(Math.random()*6)+1, z2=Math.floor(Math.random()*6)+1;
      const haklar = z1===z2 ? [z1,z1,z1,z1] : [z1,z2];
      return { ...prev, zar1:z1, zar2:z2, hamleHaklari:haklar, mesaj:`🎲 Zarlar: ${z1}-${z2}. Haneni seç.`, seciliHane:null };
    });
  };

  // --- TAVLA: Hane Seç ve Hamle Yap ---
  const tavlaHaneClick = (haneIdx: number) => {
    setTavlaDurum(prev => {
      if (!prev || prev.sira !== 'oyuncu' || prev.hamleHaklari.length === 0) return prev;
      const d = { ...prev, tahta: prev.tahta.map(h=>({...h})) };
      if (d.seciliHane === null) {
        // Kaynak seç (sadece oyuncunun beyaz taşları)
        const hane = d.tahta[haneIdx];
        if (hane.renk === 'beyaz' && hane.sayi > 0) { return { ...d, seciliHane: haneIdx }; }
        return d;
      }
      // Hedef seç → hamle yap
      const zar = d.hamleHaklari[0];
      const kaynak = d.tahta[d.seciliHane];
      const hedefIdx = d.seciliHane + zar; // beyaz ileri gider
      if (hedefIdx >= 24) {
        // Eve taş toplama
        kaynak.sayi--; if (kaynak.sayi===0) kaynak.renk=null;
        d.oyuncuToplanan++;
        d.hamleHaklari = d.hamleHaklari.slice(1);
        d.mesaj = `✅ Taş eve toplandı! (${d.oyuncuToplanan}/15)`;
        d.seciliHane = null;
        if (d.oyuncuToplanan >= 15) { d.bitti = true; d.mesaj = '🏆 Tebrikler! Tavlayı kazandın!'; }
        return d;
      }
      const hedef = d.tahta[hedefIdx];
      if (hedef.renk === 'siyah' && hedef.sayi >= 2) {
        return { ...d, mesaj:'❌ O hane kapalı! Başka yer seç.', seciliHane:null };
      }
      // Vurma
      if (hedef.renk === 'siyah' && hedef.sayi === 1) {
        hedef.renk = null; hedef.sayi = 0; d.botKirik++;
        d.mesaj = `💥 Rakip taş kırıldı!`;
      }
      kaynak.sayi--; if (kaynak.sayi===0) kaynak.renk=null;
      hedef.renk = 'beyaz'; hedef.sayi++;
      d.hamleHaklari = d.hamleHaklari.slice(1);
      d.mesaj = d.mesaj || `✅ Hamle yapıldı.`;
      d.seciliHane = null;
      // Bot sırası
      if (d.hamleHaklari.length === 0) {
        d.sira = 'bot';
        d.mesaj = '🤖 Bot düşünüyor...';
      }
      return d;
    });
    // Eğer sıra bota geçtiyse bot hamlesi
    setTimeout(() => {
      setTavlaDurum(prev => {
        if (!prev || prev.sira !== 'bot') return prev;
        const bd = { ...prev, tahta: prev.tahta.map(h=>({...h})) };
        const bz1=Math.floor(Math.random()*6)+1, bz2=Math.floor(Math.random()*6)+1;
        const bHaklar = bz1===bz2 ? [bz1,bz1,bz1,bz1] : [bz1,bz2];
        // Bot en basit hamleyi yapar (siyah taşı en ileri taşır)
        for (const zar of bHaklar) {
          const siyahlar = bd.tahta.filter(h => h.renk==='siyah' && h.sayi>0).sort((a,b)=>b.index-a.index);
          for (const sh of siyahlar) {
            const hIdx = sh.index - 1;
            const hedefIdx = hIdx - zar;
            if (hedefIdx < 0) { sh.sayi--; if(sh.sayi===0) sh.renk=null; bd.botToplanan++; break; }
            const hedef = bd.tahta[hedefIdx];
            if (hedef.renk==='beyaz' && hedef.sayi>=2) continue;
            if (hedef.renk==='beyaz' && hedef.sayi===1) { hedef.renk=null; hedef.sayi=0; bd.oyuncuKirik++; }
            sh.sayi--; if(sh.sayi===0) sh.renk=null;
            hedef.renk='siyah'; hedef.sayi++; break;
          }
        }
        bd.sira = 'oyuncu';
        bd.zar1 = bz1; bd.zar2 = bz2;
        bd.hamleHaklari = [bz1, bz2];
        bd.mesaj = `🤖 Bot oynadı. Sıra sende! Yeni zarlar: ${bz1}-${bz2}`;
        if (bd.botToplanan >= 15) { bd.bitti = true; bd.mesaj = '😞 Bot kazandı! Yeniden dene.'; }
        return bd;
      });
    }, 1200);
  };



  // --- OKEY: Eldeki taşları gerçek ıstakada yer değiştirir ---
  const okeyTasYerDegistir = (kaynakTasId: number, hedefTasId: number) => {
    if (kaynakTasId === hedefTasId) return;
    setOkeyDizMod('serbest');
    setOkeyDurum(prev => {
      if (!prev || prev.bitti) return prev;
      const d = { ...prev, oyuncular: prev.oyuncular.map(o => ({...o, el:[...o.el]})) };
      const el = d.oyuncular[0].el;
      const kaynakIdx = el.findIndex(t => t.id === kaynakTasId);
      const hedefIdx = el.findIndex(t => t.id === hedefTasId);
      if (kaynakIdx === -1 || hedefIdx === -1) return prev;
      const [tas] = el.splice(kaynakIdx, 1);
      el.splice(hedefIdx, 0, tas);
      d.mesaj = 'Taşı ıstakada istediğin yere aldın.';
      return d;
    });
  };

  // --- OKEY: Seri / çift diz butonu eldeki sıralamayı da değiştirir ---
  const okeyEliDiz = (mod: 'seri' | 'cift') => {
    setOkeyDurum(prev => {
      if (!prev) return prev;
      const d = { ...prev, oyuncular: prev.oyuncular.map(o => ({...o, el:[...o.el]})) };
      const analiz = mod === 'seri' ? seriDiz(d.oyuncular[0].el) : ciftDiz(d.oyuncular[0].el);
      d.oyuncular[0].el = [...analiz.gruplar.flat(), ...analiz.jokerler, ...analiz.tekler] as OkeyTas[];
      d.mesaj = mod === 'seri' ? 'Seri dizildi. İstersen taşları sürükleyerek yine değiştirebilirsin.' : 'Çift dizildi. İstersen taşları sürükleyerek yine değiştirebilirsin.';
      return d;
    });
    setOkeyDizMod(mod);
    setOkeyTasPozisyonlari({});
  };

  // --- OKEY: El Aç ---
  const okeyElAc = () => {
    setOkeyDurum(prev => {
      if (!prev || prev.bitti) return prev;
      const d = { ...prev, oyuncular: prev.oyuncular.map(o => ({...o, el:[...o.el]})) };
      const analiz = okeyElAcmaAnalizi(d.oyuncular[0].el);
      if (!analiz.acabilir) {
        d.mesaj = `El açmak için en az 101 puan gerekiyor. Şu an: ${analiz.puan}`;
        return d;
      }
      d.oyuncular[0].acildi = true;
      d.oyuncular[0].acikPuan = analiz.puan;
      d.oyuncular[0].acilanGruplar = analiz.gruplar;
      d.mesaj = `✅ ${d.oyuncular[0].isim} ${analiz.puan} puanla el açtı.`;
      return d;
    });
  };

  // --- OKEY: Taş At ---
  const okeyTasAt = (tasId: number) => {
    setOkeyDurum(prev => {
      if (!prev || prev.aktifOyuncu !== 0 || prev.bitti) return prev;
      if (!prev.oyuncuTasCektiMi && prev.oyuncular[0].el.length <= 21) {
        return { ...prev, mesaj: 'Önce desteden taş çek veya yerdeki taşı al.' };
      }
      const d = { ...prev, oyuncular: prev.oyuncular.map(o => ({...o, el:[...o.el]})) };
      const el = d.oyuncular[0].el;
      const idx = el.findIndex(t => t.id === tasId);
      if (idx === -1) return prev;
      const [atilanTas] = el.splice(idx, 1);
      d.atilanTas = atilanTas;
      d.atilanTasGecmisi = [...(d.atilanTasGecmisi || []).slice(-11), { oyuncuIdx: 0, tas: atilanTas }];
      if (el.length === 0) {
        const analiz = okeyElAcmaAnalizi([atilanTas, ...el]);
        if (d.oyuncular[0].acildi || analiz.acabilir) {
          d.oyuncular[0].acildi = true;
          d.oyuncular[0].acikPuan = Math.max(d.oyuncular[0].acikPuan || 0, analiz.puan);
          d.oyuncular[0].acilanGruplar = d.oyuncular[0].acilanGruplar || analiz.gruplar;
          d.bitti = true;
          d.kazananIndex = 0;
          d.mesaj = '🏆 Okey! Taşların bitti, eli kazandın.';
          return d;
        }
        d.mesaj = 'El bitirmek için önce 101 açmalısın.';
        el.push(atilanTas);
        d.atilanTas = null;
        return d;
      }
      d.oyuncuTasCektiMi = false;
      d.aktifOyuncu = 3;
      d.mesaj = `${atilanTas.okeyMi ? 'JOKER' : atilanTas.renk+' '+atilanTas.deger} attın. Bot sırası...`;
      return d;
    });
    setOkeyTimerAktif(false);
    setOkeyTimer(15);
    const botSirasi = [3, 2, 1];
    const botOyna = (siraIndex: number) => {
      const botIdx = botSirasi[siraIndex];
      setTimeout(() => {
        setOkeyDurum(prev => {
          if (!prev || prev.bitti) return prev;
          if (prev.kalanDeste.length === 0) return { ...prev, bitti: true, berabere: true, kazananIndex: -1, mesaj: '🏁 Deste bitti. Kimse açamadı; girişler iade.' };
          const d = { ...prev, oyuncular: prev.oyuncular.map(o => ({...o, el:[...o.el]})), kalanDeste: [...prev.kalanDeste] };
          if (d.oyuncular[botIdx].el.length > 0) {
            const cekilen = d.kalanDeste.shift()!;
            d.oyuncular[botIdx].el.push(cekilen);
            const botAnaliz = okeyElAcmaAnalizi(d.oyuncular[botIdx].el);
            if (!d.oyuncular[botIdx].acildi && botAnaliz.acabilir) {
              d.oyuncular[botIdx].acildi = true;
              d.oyuncular[botIdx].acikPuan = botAnaliz.puan;
              d.oyuncular[botIdx].acilanGruplar = botAnaliz.gruplar;
              d.mesaj = `${d.oyuncular[botIdx].isim} ${botAnaliz.puan} puanla el açtı.`;
            }
            const elBot = d.oyuncular[botIdx].el;
            const atIdx = elBot.findIndex(t => !t.okeyMi);
            if (atIdx !== -1) {
              const [botAtilanTas] = elBot.splice(atIdx, 1);
              d.atilanTas = botAtilanTas;
              d.atilanTasGecmisi = [...(d.atilanTasGecmisi || []).slice(-11), { oyuncuIdx: botIdx, tas: botAtilanTas }];
              if (elBot.length === 0) {
                if (d.oyuncular[botIdx].acildi || okeyElAcmaAnalizi([botAtilanTas, ...elBot]).acabilir) {
                  d.oyuncular[botIdx].acildi = true;
                  d.bitti = true;
                  d.kazananIndex = botIdx;
                  d.mesaj = `${d.oyuncular[botIdx].isim} okey yaptı. El bitti.`;
                  return d;
                }
              }
            }
          }
          const sonrakiBot = botSirasi[siraIndex + 1];
          if (sonrakiBot === undefined) {
            d.aktifOyuncu = 0;
            d.oyuncuTasCektiMi = false;
            d.mesaj = 'Sıra sende! Desteden çek veya yerdekini al.';
          } else {
            d.aktifOyuncu = sonrakiBot;
          }
          return d;
        });
        if (siraIndex < botSirasi.length - 1) botOyna(siraIndex + 1);
        else { setOkeyTimer(15); setOkeyTimerAktif(true); }
      }, 2000);
    };
    botOyna(0);
  };

  // --- OKEY: Desteden Taş Çek ---
  const okeyTasCek = () => {
    setOkeyDurum(prev => {
      if (!prev || prev.aktifOyuncu !== 0 || prev.bitti) return prev;
      if (prev.oyuncuTasCektiMi || prev.oyuncular[0].el.length >= 22) {
        return { ...prev, mesaj: 'Önce elinden bir taş atmalısın.' };
      }
      if (prev.kalanDeste.length === 0) return { ...prev, bitti: true, berabere: true, kazananIndex: -1, mesaj: '🏁 Deste bitti. Kimse açamadı; girişler iade.' };
      const d = { ...prev, kalanDeste: [...prev.kalanDeste], oyuncular: prev.oyuncular.map(o=>({...o,el:[...o.el]})) };
      const [cekilen] = d.kalanDeste.splice(0, 1);
      d.oyuncular[0].el.push(cekilen);
      d.oyuncuTasCektiMi = true;
      d.mesaj = `${cekilen.okeyMi ? '🎉 JOKER çektin!' : `${cekilen.renk} ${cekilen.deger} çektin.`} Şimdi bir taş at.`;
      return d;
    });
  };

  // --- OKEY: Yerdeki Taşı Al ---
  const okeyYerdekiniAl = () => {
    setOkeyDurum(prev => {
      if (!prev || prev.aktifOyuncu !== 0 || !prev.atilanTas || prev.bitti) return prev;
      if (prev.oyuncuTasCektiMi || prev.oyuncular[0].el.length >= 22) {
        return { ...prev, mesaj: 'Önce elinden bir taş atmalısın.' };
      }
      const d = { ...prev, oyuncular: prev.oyuncular.map(o=>({...o,el:[...o.el]})) };
      const yerdekiTas = d.atilanTas;
      if (!yerdekiTas) return prev;
      d.oyuncular[0].el.push(yerdekiTas);
      d.atilanTas = null;
      d.oyuncuTasCektiMi = true;
      d.mesaj = 'Yerdeki taşı aldın. Şimdi bir taş at.';
      return d;
    });
  };

  // OYUNCU EKONOMİSİ
  const [vipSeviyesi, setVipSeviyesi] = useState(0); 
  const [vipBitisTarihi, setVipBitisTarihi] = useState<number | null>(null);
  const [bakiyeCip, setBakiyeCip] = useState(34100);
  const [bakiyeElmas, setBakiyeElmas] = useState(10.0); 
  const [oyunRutbePuani, setOyunRutbePuani] = useState(0);
  const [oyunSayisi, setOyunSayisi] = useState(0);
  const [sonucPaneli, setSonucPaneli] = useState<null | { tur: OyunSonucTuru; kazandi: boolean; berabere?: boolean; cip: number; puan: number; rakipler: {isim:string; puan:number; cip:number}[] }>(null);
  const [sonucGosterildiKey, setSonucGosterildiKey] = useState<string>('');

  const [alinanIstakalar, setAlinanIstakalar] = useState<number[]>([1]); 
  const [kusanilanIstaka, setKusanilanIstaka] = useState<number>(1);

  // PANELERİN AÇIK/KAPALI DURUMLARI
  const [magazaAktifSekme, setMagazaAktifSekme] = useState<"çipler" | "vip" | "elmas" | "oge" | "puan" | "klan" | "nostalji">("çipler");
  const [aktifSekme, setAktifSekme] = useState<"çipler" | "ıstakalar" | "çerçeveler">("çipler");
  
  const [cantaAcik, setCantaAcik] = useState(false);
  const [vipMarketAcik, setVipMarketAcik] = useState(false);
  const [arkadaslarAcik, setArkadaslarAcik] = useState(false);
  const [gelenKutusuAcik, setGelenKutusuAcik] = useState(false);
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  const [gunlukGirisAcik, setGunlukGirisAcik] = useState(false); 
  
  // SIRALAMA EKRANI STATELERİ
  const [siralamaAcik, setSiralamaAcik] = useState(false);
  const [siralamaKategori, setSiralamaKategori] = useState<"okey" | "pisti" | "tavla">("okey");
  const [siralamaSekme, setSiralamaSekme] = useState<"genel" | "bolge" | "sehir">("genel");

  const [hediyeCipPanelAcik, setHediyeCipPanelAcik] = useState(false);
  const [hediyeCipTargetId, setHediyeCipTargetId] = useState("");
  const [hediyeCipMiktar, setHediyeCipMiktar] = useState("");
  const [miniArkadasSecAcik, setMiniArkadasSecAcik] = useState(false);
  const [hediyeCipGecmisAcik, setHediyeCipGecmisAcik] = useState(false);
  const [hediyeCipArkadasSekmesi, setHediyeCipArkadasSekmesi] = useState<"arkadaslar" | "klan">("arkadaslar");
  const [hediyeCipGecmisi, setHediyeCipGecmisi] = useState<HediyeCipGecmisKaydi[]>([]);

  const [hediyePaneliAcik, setHediyePaneliAcik] = useState(false);
  const [hediyeHedefOyuncu, setHediyeHedefOyuncu] = useState<OyuncuProfil | null>(null);
  const [seciliHediyeId, setSeciliHediyeId] = useState<number>(1);
  const [hediyeSekmesi, setHediyeSekmesi] = useState<"elmas" | "klan">("elmas");
  const [hediyeAdet, setHediyeAdet] = useState<number>(1);

  const [secilenPaketIndex, setSecilenPaketIndex] = useState(0);
  const [magazaPuanBakiyesi, setMagazaPuanBakiyesi] = useState(2712);
  const [dekorasyonJetonu, setDekorasyonJetonu] = useState(660);
  const [alinanDekorlar, setAlinanDekorlar] = useState<number[]>([]);
  const [aktifDekorId, setAktifDekorId] = useState<number | null>(null);
  const [seciliPuanUrunId, setSeciliPuanUrunId] = useState("puan-cip");
  const [seciliDekorId, setSeciliDekorId] = useState(2);
  const [mevcutGirisGunu, setMevcutGirisGunu] = useState(1);
  const [gunlukOdulAlindi, setGunlukOdulAlindi] = useState(false);
  const [kampanyaAcik, setKampanyaAcik] = useState(false);
  const [bekleyenOdeme, setBekleyenOdeme] = useState<BekleyenOdeme | null>(null);
  const [seciliOdemeYontemi, setSeciliOdemeYontemi] = useState("");
  const [odemeAdimi, setOdemeAdimi] = useState<OdemeAdimi>("bilgi");
  const [kartFormu, setKartFormu] = useState<KartFormu>({ adSoyad: "", kartNo: "", sonKullanma: "", cvv: "", telefon: "" });
  const [odemeDogrulamaKodu, setOdemeDogrulamaKodu] = useState("");
  const [odemeKodGirisi, setOdemeKodGirisi] = useState("");
  const [odemeHatasi, setOdemeHatasi] = useState("");
  const [odemeIsleniyor, setOdemeIsleniyor] = useState(false);
  const [uygulamaBildirimi, setUygulamaBildirimi] = useState<UygulamaBildirimi | null>(null);

  const [sosyalAktifSekme, setSosyalAktifSekme] = useState<"arkadaslar" | "takipciler" | "takipEdilenler" | "ekle">("arkadaslar");
  const [arananId, setArananId] = useState("");

  const [gonderiler, setGonderiler] = useState<SohbetGonderisi[]>([
    
    { id: 1, isim: "Kral_Süleyman", vip: 8, metin: "Otomatiğe gelin, bekliyorum!", gorselUrl: "" },
    { id: 2, isim: "Okeyci_Kız", vip: 3, metin: "Tavla davetlerini bekliyorum 🎲" }
  ]);

  const lobiSohbetIcerik = {
    genel: gonderiler,
    sehir: [
      { id: 501, isim: "İzmirli_Efe", vip: 6, metin: "İzmir masasına gelen var mı?" },
      { id: 502, isim: "Kordon", vip: 2, metin: "Şehir kanalındayım 👋" },
    ],
    ozel: [
      { id: 503, isim: "ELİZ", vip: 4, metin: "Özel mesaj kutun hazır." },
      { id: 504, isim: "Ova", vip: 7, metin: "Size nasıl yardımcı olabilirim?" },
    ],
    masa: [
      { id: 505, isim: "Masa", vip: 0, metin: "Masa sohbeti oyun içinde de görünür." },
      { id: 506, isim: "Ahmet", vip: 3, metin: "Taş bekliyorum." },
    ],
  } as Record<typeof lobiSohbetSekme, SohbetGonderisi[]>;

  const [arkadasListesi, setArkadasListesi] = useState<OyuncuProfil[]>([
    { id: "10923", ad: "Ahmet_1903", vip: 5, aktif: true },
    { id: "44120", ad: "Okeyci_Kral", vip: 12, aktif: false },
    { id: "88219", ad: "Aslan_Levent", vip: 0, aktif: true },
    { id: "55120", ad: "Ova", vip: 30, aktif: true },
    { id: "88431", ad: "ELİZ", vip: 4, aktif: false },
    { id: "12077", ad: "Murat.kurnz", vip: 0, aktif: true },
    { id: "77001", ad: "Hayalet", vip: 2, aktif: false },
    { id: "34190", ad: "Kolpaçino", vip: 0, aktif: true }
  ]);
  const [takipcilerListesi] = useState<OyuncuProfil[]>([
    { id: "90314", ad: "Mavi_İnci", vip: 7, aktif: true },
    { id: "60218", ad: "Kartal_34", vip: 3, aktif: true },
    { id: "77402", ad: "SessizUsta", vip: 0, aktif: false },
    { id: "31880", ad: "BeyazMasa", vip: 9, aktif: true },
    { id: "58011", ad: "ZarifOyuncu", vip: 2, aktif: false }
  ]);
  const [takipEdilenListesi, setTakipEdilenListesi] = useState<OyuncuProfil[]>([
    { id: "70845", ad: "Şampiyon_101", vip: 18, aktif: true },
    { id: "11902", ad: "Anadolu", vip: 6, aktif: false },
    { id: "44071", ad: "KralMasa", vip: 11, aktif: true },
    { id: "82144", ad: "OkeyKeyfi", vip: 1, aktif: true }
  ]);

  const sosyalListeler = {
    arkadaslar: arkadasListesi,
    takipciler: takipcilerListesi,
    takipEdilenler: takipEdilenListesi,
  } satisfies Record<"arkadaslar" | "takipciler" | "takipEdilenler", OyuncuProfil[]>;
  const oyuncuAramaHavuzu: OyuncuProfil[] = [
    ...arkadasListesi,
    ...takipcilerListesi,
    ...takipEdilenListesi,
    { id: "99001", ad: "Gizli Profil", vip: 0, aktif: false, profilGizli: true },
    { id: "45210", ad: "MasaUstası", vip: 8, aktif: true },
    { id: "67124", ad: "SeriSeven", vip: 4, aktif: false },
  ];

  const sosyalSekmeBilgileri = {
    arkadaslar: { baslik: "Arkadaş listem", sayac: `${sosyalListeler.arkadaslar.length}/101`, bosMesaj: "Henüz arkadaşın yok." },
    takipciler: { baslik: "Takipçilerim", sayac: `${sosyalListeler.takipciler.length}`, bosMesaj: "Henüz takipçin yok." },
    takipEdilenler: { baslik: "Takip ettiklerim", sayac: `${sosyalListeler.takipEdilenler.length}`, bosMesaj: "Henüz takip ettiğin oyuncu yok." },
    ekle: { baslik: "Arkadaş ekle", sayac: "ID ile ara", bosMesaj: "" },
  };
  const aktifSosyalListe = sosyalAktifSekme === "ekle" ? [] : sosyalListeler[sosyalAktifSekme];
  const aktifSosyalSekmeBilgisi = sosyalSekmeBilgileri[sosyalAktifSekme];
  const gunlukBegeniSuresiMs = 24 * 60 * 60 * 1000;
  const toplanmamisBegeniler = gelenBegeniler.filter((begeni) => !begeni.alindi);
  const toplanmamisBegeniToplami = toplanmamisBegeniler.reduce((toplam, begeni) => toplam + begeni.miktar, 0);

  const arkadasBugunBegenildiMi = (oyuncuId: string) => {
    const sonBegeni = arkadasBegeniZamanlari[oyuncuId];
    return !!sonBegeni && Date.now() - sonBegeni < gunlukBegeniSuresiMs;
  };

  const begeniKalanSureYazi = (oyuncuId: string) => {
    const sonBegeni = arkadasBegeniZamanlari[oyuncuId];
    if (!sonBegeni) return "";
    const kalanMs = Math.max(0, gunlukBegeniSuresiMs - (Date.now() - sonBegeni));
    const saat = Math.floor(kalanMs / (60 * 60 * 1000));
    const dakika = Math.ceil((kalanMs % (60 * 60 * 1000)) / (60 * 1000));
    return `${saat} saat ${dakika} dakika`;
  };

  const arkadasiBegen = (event: MouseEvent<HTMLButtonElement>, oyuncu: OyuncuProfil) => {
    event.stopPropagation();
    if (arkadasBugunBegenildiMi(oyuncu.id)) {
      bildirimGoster("Beğeni hakkı kullanıldı", `${oyuncu.ad} için tekrar beğenmek için ${begeniKalanSureYazi(oyuncu.id)} bekle.`, "bilgi");
      return;
    }
    setArkadasBegeniZamanlari((onceki) => ({ ...onceki, [oyuncu.id]: Date.now() }));
    bildirimGoster("Beğeni gönderildi", `${oyuncu.ad} oyuncusuna 2.000 çip beğeni ödülü gönderildi.`, "basari");
  };

  const arkadasliktanCikar = (event: MouseEvent<HTMLButtonElement>, oyuncu: OyuncuProfil) => {
    event.stopPropagation();
    setArkadasListesi((onceki) => onceki.filter((arkadas) => arkadas.id !== oyuncu.id));
    bildirimGoster("Arkadaş kaldırıldı", `${oyuncu.ad} arkadaş listenden çıkarıldı.`, "bilgi");
  };

  const takiptenCik = (event: MouseEvent<HTMLButtonElement>, oyuncu: OyuncuProfil) => {
    event.stopPropagation();
    setTakipEdilenListesi((onceki) => onceki.filter((takip) => takip.id !== oyuncu.id));
    bildirimGoster("Takipten çıkıldı", `${oyuncu.ad} takip edilenlerden çıkarıldı.`, "bilgi");
  };

  const tumBegenileriTopla = () => {
    if (toplanmamisBegeniToplami <= 0) {
      bildirimGoster("Beğeni ödülü yok", "Toplanacak beğeni ödülü bulunmuyor.", "bilgi");
      return;
    }
    setBakiyeCip((onceki) => onceki + toplanmamisBegeniToplami);
    setGelenBegeniler((onceki) => onceki.map((begeni) => ({ ...begeni, alindi: true })));
    bildirimGoster("Beğeni ödülleri toplandı", `+${toplanmamisBegeniToplami.toLocaleString()} çip bakiyene eklendi.`, "basari");
  };

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

  const klanCipiHediyeleri: HediyeKartOgesi[] = [
    { id: 1, ad: "Selam", emoji: "👋", maliyet: 0, envanterAdet: 79, etiket: "Ücretsiz", etiketRenk: "bg-orange-500" },
    { id: 2, ad: "Pasta", emoji: "🎂", maliyet: 3, envanterAdet: 4, etiket: "Etkinlik", etiketRenk: "bg-pink-500" },
    { id: 3, ad: "Yüzük", emoji: "💍", maliyet: 5, envanterAdet: 14, etiket: "VIP", etiketRenk: "bg-yellow-500" },
    { id: 10, ad: "Çiçek", emoji: "💐", maliyet: 29, envanterAdet: 0 },
    { id: 11, ad: "Gül", emoji: "🌹", maliyet: 9, envanterAdet: 0 },
    { id: 8, ad: "Kalp", emoji: "💖", maliyet: 3, envanterAdet: 0 },
  ];

  const aktifHediyeListesi = hediyeSekmesi === "klan" ? klanCipiHediyeleri : premiumHediyeler;

  const bildirimGoster = (baslik: string, metin: string, tur: UygulamaBildirimi["tur"] = "bilgi") => {
    if (bildirimZamanlayiciRef.current) {
      window.clearTimeout(bildirimZamanlayiciRef.current);
    }
    setUygulamaBildirimi({ baslik, metin, tur });
    bildirimZamanlayiciRef.current = window.setTimeout(() => {
      setUygulamaBildirimi(null);
      bildirimZamanlayiciRef.current = null;
    }, 4500);
  };

  const bugunAnahtari = () => {
    const tarih = new Date();
    const ay = String(tarih.getMonth() + 1).padStart(2, "0");
    const gun = String(tarih.getDate()).padStart(2, "0");
    return `${tarih.getFullYear()}-${ay}-${gun}`;
  };

  const gunlukGirisGorunenGun = (bugun: string) => {
    const kayitliGun = Math.min(7, Math.max(1, Number(localStorage.getItem("gunlukGirisGunu") || "1")));
    const sonOdul = localStorage.getItem("gunlukGirisSonOdul");
    if (sonOdul !== bugun) return kayitliGun;

    const sonAlinanGun = Number(localStorage.getItem("gunlukGirisSonAlinanGun") || "0");
    if (sonAlinanGun >= 1 && sonAlinanGun <= 7) return sonAlinanGun;
    return kayitliGun === 1 ? 7 : kayitliGun - 1;
  };

  const haftalikOduller = [
    { gun: 1, tur: "cip" as const, miktar: 5000, yazi: "5.000" },
    { gun: 2, tur: "elmas" as const, miktar: 2, yazi: "2" },
    { gun: 3, tur: "cip" as const, miktar: 7000, yazi: "7.000" },
    { gun: 4, tur: "cip" as const, miktar: 10000, yazi: "10.000" },
    { gun: 5, tur: "elmas" as const, miktar: 3, yazi: "3" },
    { gun: 6, tur: "cip" as const, miktar: 12000, yazi: "12.000" },
    { gun: 7, tur: "cip" as const, miktar: 15000, yazi: "15.000" },
  ];

  const puanUrunuAl = (urun: typeof puanMagazaUrunleri[number]) => {
    if (magazaPuanBakiyesi < urun.puan) {
      bildirimGoster("Yetersiz puan", `${urun.ad} için ${urun.puan} puan gerekiyor.`, "bilgi");
      return;
    }

    if (urun.tur === "cip") {
      const bugun = bugunAnahtari();
      if (localStorage.getItem("puanCipDonusumGunu") === bugun) {
        bildirimGoster("Puan mağazası", "Çip dönüşümü bugün zaten yapıldı.", "bilgi");
        return;
      }
      setBakiyeCip((prev) => prev + urun.miktar);
      localStorage.setItem("puanCipDonusumGunu", bugun);
    }

    if (urun.tur === "dekor" && urun.dekorId) {
      setAlinanDekorlar((prev) => prev.includes(urun.dekorId!) ? prev : [...prev, urun.dekorId!]);
      setAktifDekorId(urun.dekorId);
    }

    setMagazaPuanBakiyesi((prev) => prev - urun.puan);
    bildirimGoster("Puan mağazası", `${urun.ad} hesabına eklendi.`, "odul");
  };

  const dekorSatinAlVeyaKusan = (dekor: typeof dekorasyonUrunleri[number]) => {
    const sahip = alinanDekorlar.includes(dekor.id);
    if (sahip) {
      setAktifDekorId(dekor.id);
      bildirimGoster("Dekor kuşanıldı", `${dekor.ad} profilinde aktif edildi.`, "basari");
      return;
    }

    if (dekorasyonJetonu < dekor.fiyat) {
      bildirimGoster("Yetersiz dekor jetonu", `${dekor.ad} için ${dekor.fiyat} dekor jetonu gerekiyor.`, "bilgi");
      return;
    }

    setDekorasyonJetonu((prev) => prev - dekor.fiyat);
    setAlinanDekorlar((prev) => [...prev, dekor.id]);
    setAktifDekorId(dekor.id);
    bildirimGoster("Dekor satın alındı", `${dekor.ad} profiline eklendi.`, "odul");
  };

  const detayliSiralama = [
    { sira: 1, isim: "ŞAM", cip: "21.300.664.472", avatar: "🧔", tac: "👑" },
    { sira: 2, isim: "LİANES", cip: "15.040.123.792", avatar: "👩", tac: "🥈" },
    { sira: 3, isim: "BAMBİ", cip: "10.821.765.368", avatar: "👱‍♀️", tac: "🥉" },
    { sira: 4, isim: "ÜMİT38", cip: "9.100.269.853", avatar: "👨", tac: "" },
    { sira: 5, isim: "NeBakiynDayi", cip: "8.225.110.000", avatar: "😎", tac: "" },
    { sira: 6, isim: "ZEUS", cip: "4.688.107.199", avatar: "⚡", tac: "" },
    { sira: 7, isim: "AYTAÇ BEY", cip: "4.232.863.486", avatar: "👨‍💼", tac: "" },
  ];

  const liderlikOyunculari: LiderlikOyuncusu[] = [
    { id: "91001", ad: "ŞAM", vip: 24, aktif: true, avatar: "🧔", tac: "👑", bolge: "Marmara Bölgesi", sehir: "İstanbul", skorlar: { okey: 21300664472, pisti: 7340501200, tavla: 8920322400 } },
    { id: "91002", ad: "LİANES", vip: 18, aktif: true, avatar: "👩", tac: "🥈", bolge: "Ege Bölgesi", sehir: "İzmir", skorlar: { okey: 15040123792, pisti: 11620351020, tavla: 6204012200 } },
    { id: "91003", ad: "BAMBİ", vip: 16, aktif: false, avatar: "👱‍♀️", tac: "🥉", bolge: "İç Anadolu Bölgesi", sehir: "Ankara", skorlar: { okey: 10821765368, pisti: 6804035000, tavla: 12144801200 } },
    { id: "91004", ad: "ÜMİT38", vip: 9, aktif: true, avatar: "👨", bolge: "Ege Bölgesi", sehir: "İzmir", skorlar: { okey: 9100269853, pisti: 5420900330, tavla: 7102654200 } },
    { id: "91005", ad: "NeBakiynDayi", vip: 13, aktif: true, avatar: "😎", bolge: "Akdeniz Bölgesi", sehir: "Antalya", skorlar: { okey: 8225110000, pisti: 4700250010, tavla: 5800460100 } },
    { id: "91006", ad: "ZEUS", vip: 21, aktif: false, avatar: "⚡", bolge: "Ege Bölgesi", sehir: "Aydın", skorlar: { okey: 4688107199, pisti: 13034500200, tavla: 9301488900 } },
    { id: "91007", ad: "AYTAÇ BEY", vip: 11, aktif: true, avatar: "👨‍💼", bolge: "Ege Bölgesi", sehir: "İzmir", skorlar: { okey: 4232863486, pisti: 3610480200, tavla: 4583301200 } },
    { id: "91008", ad: "Mavi_İnci", vip: 7, aktif: true, avatar: "👩🏻", bolge: "Ege Bölgesi", sehir: "İzmir", skorlar: { okey: 3900125000, pisti: 2980022100, tavla: 2444120200 } },
    { id: "91009", ad: "Kartal_34", vip: 3, aktif: true, avatar: "👑", bolge: "Marmara Bölgesi", sehir: "İstanbul", skorlar: { okey: 3500188000, pisti: 8120012400, tavla: 3380011100 } },
    { id: "91010", ad: "SessizUsta", vip: 0, aktif: false, avatar: "👨🏻", bolge: "Karadeniz Bölgesi", sehir: "Trabzon", skorlar: { okey: 3022001000, pisti: 2204401000, tavla: 10220200000 } },
    { id: "91011", ad: "BeyazMasa", vip: 9, aktif: true, avatar: "🧔🏻", bolge: "Ege Bölgesi", sehir: "İzmir", skorlar: { okey: 2822200000, pisti: 4014400000, tavla: 3800022400 } },
    { id: "91012", ad: "ZarifOyuncu", vip: 2, aktif: false, avatar: "👤", bolge: "Akdeniz Bölgesi", sehir: "Mersin", skorlar: { okey: 1911055000, pisti: 1954044000, tavla: 2200444000 } },
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

  const elmasPaketleri = [
    { id: 1, ad: "Başlangıç Elması", miktar: 10, miktarYazi: "10 Elmas", fiyat: "19,99 TL", etiket: "" },
    { id: 2, ad: "Kulüp Elması", miktar: 25, miktarYazi: "25 Elmas", fiyat: "39,99 TL", etiket: "" },
    { id: 3, ad: "Parlak Paket", miktar: 60, miktarYazi: "60 Elmas", fiyat: "89,99 TL", etiket: "Avantajlı" },
    { id: 4, ad: "Lounge Elmas", miktar: 120, miktarYazi: "120 Elmas", fiyat: "149,99 TL", etiket: "Popüler" },
    { id: 5, ad: "Kraliyet Paketi", miktar: 260, miktarYazi: "260 Elmas", fiyat: "299,99 TL", etiket: "Lounge" },
    { id: 6, ad: "Zirve Elmas", miktar: 600, miktarYazi: "600 Elmas", fiyat: "599,99 TL", etiket: "Büyük Paket" },
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

  const puanMagazaUrunleri = [
    { id: "puan-cip", ad: "12.000 Çip", kisa: "12.000 Çip", puan: 50, tur: "cip" as const, miktar: 12000, ikon: "cip", aciklama: "Puanlarınla 12.000 çip dönüştürebilirsin. Her gün sadece 1 defa yapılır." },
    { id: "puan-cerceve", ad: "Özel profil çerçevesi", kisa: "Profil çerçevesi", puan: 200, tur: "dekor" as const, dekorId: 2, ikon: "cerceve", aciklama: "Profilinde parlayan özel çerçeve görünür." },
    { id: "puan-balon", ad: "Özel sohbet baloncuğu", kisa: "Sohbet baloncuğu", puan: 300, tur: "ozel" as const, ikon: "balon", aciklama: "Sohbet mesajlarında özel konuşma balonu stili açılır." },
    { id: "puan-masa", ad: "Turnuva masa stili", kisa: "Masa stili", puan: 500, tur: "ozel" as const, ikon: "masa", aciklama: "Turnuva odalarında kullanılacak masa görünümü." },
    { id: "puan-lobi", ad: "Turnuva lobi stili", kisa: "Lobi stili", puan: 800, tur: "ozel" as const, ikon: "lobi", aciklama: "Lobide özel sahne ve ışık efekti." },
    { id: "puan-acma", ad: "Turnuva el açma efekti", kisa: "El açma efekti", puan: 1000, tur: "ozel" as const, ikon: "efekt", aciklama: "101 el açarken özel animasyon efekti oynatır." },
  ];

  const dekorasyonUrunleri = [
    { id: 1, ad: "Kurban Bayramı profil çerçevesi", fiyat: 120, tur: "Profil Çerçevesi", ikon: "🌿", renk: "from-emerald-200 via-green-100 to-yellow-100", cerceve: "ring-4 ring-emerald-300 shadow-[0_0_28px_rgba(52,211,153,0.85)]", aciklama: "Profil fotoğrafının etrafında yeşil bayram süsleri döner." },
    { id: 2, ad: "2026 Ramazan profil çerçevesi", fiyat: 180, tur: "Profil Çerçevesi", ikon: "🌙", renk: "from-yellow-200 via-sky-100 to-cyan-100", cerceve: "ring-4 ring-yellow-300 shadow-[0_0_32px_rgba(250,204,21,0.9)] animate-pulse", aciklama: "Profilinde hilal ışığı ve altın parıltı efekti görünür." },
    { id: 3, ad: "3. yıl dönümü dinamik profil çerçevesi", fiyat: 240, tur: "Profil Çerçevesi", ikon: "🎉", renk: "from-fuchsia-200 via-orange-100 to-yellow-100", cerceve: "ring-4 ring-fuchsia-300 shadow-[0_0_34px_rgba(217,70,239,0.85)] animate-pulse", aciklama: "Yıl dönümü renkleriyle hareketli profil çerçevesi." },
    { id: 4, ad: "Sosyal oyuncu profil çerçevesi", fiyat: 160, tur: "Profil Çerçevesi", ikon: "💬", renk: "from-blue-100 via-white to-violet-100", cerceve: "ring-4 ring-sky-300 shadow-[0_0_28px_rgba(56,189,248,0.85)]", aciklama: "Arkadaş listesinde profilini daha belirgin gösterir." },
    { id: 5, ad: "2025 Yeni Yıl profil çerçevesi", fiyat: 220, tur: "Profil Çerçevesi", ikon: "❄️", renk: "from-cyan-100 via-white to-blue-200", cerceve: "ring-4 ring-cyan-200 shadow-[0_0_32px_rgba(103,232,249,0.9)] animate-pulse", aciklama: "Kış parıltısı ve yeni yıl ışıkları profiline eklenir." },
    { id: 6, ad: "2023 Cumhuriyet bayramı profil çerçevesi", fiyat: 200, tur: "Profil Çerçevesi", ikon: "🇹🇷", renk: "from-red-100 via-white to-red-200", cerceve: "ring-4 ring-red-400 shadow-[0_0_30px_rgba(248,113,113,0.9)]", aciklama: "Kırmızı beyaz profil çerçevesi ve ince parıltı efekti." },
    { id: 7, ad: "Sohbet odası profil çerçevesi", fiyat: 260, tur: "Sohbet Çerçevesi", ikon: "🎙️", renk: "from-indigo-100 via-sky-100 to-white", cerceve: "ring-4 ring-indigo-300 shadow-[0_0_30px_rgba(129,140,248,0.9)] animate-pulse", aciklama: "Sohbet odasında profilin özel çerçeveyle görünür." },
    { id: 8, ad: "14 Şubat profil çerçevesi", fiyat: 280, tur: "Profil Çerçevesi", ikon: "💖", renk: "from-rose-100 via-pink-100 to-white", cerceve: "ring-4 ring-rose-300 shadow-[0_0_32px_rgba(251,113,133,0.9)] animate-pulse", aciklama: "Profil fotoğrafında pembe kalp parıltıları görünür." },
    { id: 9, ad: "Lounge 101 özel neon çerçevesi", fiyat: 360, tur: "Profil Çerçevesi", ikon: "✨", renk: "from-cyan-100 via-violet-100 to-amber-100", cerceve: "ring-4 ring-cyan-300 shadow-[0_0_36px_rgba(103,232,249,0.95)] animate-pulse", aciklama: "Lounge 101'e özel neon profil çerçevesi." },
  ];

  const seciliPuanUrun = puanMagazaUrunleri.find((urun) => urun.id === seciliPuanUrunId) || puanMagazaUrunleri[0];
  const seciliDekor = dekorasyonUrunleri.find((urun) => urun.id === seciliDekorId) || dekorasyonUrunleri[0];
  const aktifProfilDekoru = dekorasyonUrunleri.find((urun) => urun.id === aktifDekorId) || null;

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

  useEffect(() => {
    if (!vipBitisTarihi) return;
    const kontrolEt = () => {
      if (vipBitisTarihi <= Date.now()) {
        setVipSeviyesi(0);
        setVipBitisTarihi(null);
        setSecilenPaketIndex(0);
      }
    };
    kontrolEt();
    const timer = window.setInterval(kontrolEt, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [vipBitisTarihi]);

  // Kalıcı ekonomi/envanter
  useEffect(() => {
    try {
      const kayitliCip = localStorage.getItem("bakiyeCip");
      const kayitliElmas = localStorage.getItem("bakiyeElmas");
      const kayitliVip = localStorage.getItem("vipSeviyesi");
      const kayitliVipBitis = localStorage.getItem("vipBitisTarihi");
      const kayitliIstakalar = localStorage.getItem("alinanIstakalar");
      const kayitliKusanilan = localStorage.getItem("kusanilanIstaka");
      const kayitliBegeniZamanlari = localStorage.getItem("arkadasBegeniZamanlari");
      const kayitliGelenBegeniler = localStorage.getItem("gelenBegeniler");
      if (kayitliCip) setBakiyeCip(Number(kayitliCip));
      if (kayitliElmas) setBakiyeElmas(Number(kayitliElmas));
      const vipBitis = kayitliVipBitis ? Number(kayitliVipBitis) : null;
      if (kayitliVip && vipBitis && vipBitis > Date.now()) {
        setVipSeviyesi(Number(kayitliVip));
        setVipBitisTarihi(vipBitis);
      } else if (kayitliVip) {
        setVipSeviyesi(0);
        setVipBitisTarihi(null);
        localStorage.removeItem("vipSeviyesi");
        localStorage.removeItem("vipBitisTarihi");
      }
      if (kayitliIstakalar) setAlinanIstakalar(JSON.parse(kayitliIstakalar));
      if (kayitliKusanilan) setKusanilanIstaka(Number(kayitliKusanilan));
      if (kayitliBegeniZamanlari) setArkadasBegeniZamanlari(JSON.parse(kayitliBegeniZamanlari));
      if (kayitliGelenBegeniler) setGelenBegeniler(JSON.parse(kayitliGelenBegeniler));
      if (localStorage.getItem("gunlukOdulSistemVersiyon") !== "panel-v1") {
        localStorage.removeItem("gunlukGirisSonOdul");
        localStorage.removeItem("gunlukGirisSonAlinanGun");
        localStorage.setItem("gunlukGirisGunu", "1");
        localStorage.setItem("gunlukOdulSistemVersiyon", "panel-v1");
      }
    } catch {} finally {
      setEkonomiYuklendi(true);
      setBegeniKayitlariYuklendi(true);
    }
  }, []);

  useEffect(() => {
    if (!girisYapildi || !ekonomiYuklendi) return;
    try {
      const bugun = bugunAnahtari();
      const sonOdul = localStorage.getItem("gunlukGirisSonOdul");
      setMevcutGirisGunu(gunlukGirisGorunenGun(bugun));
      setGunlukOdulAlindi(sonOdul === bugun);
    } catch {}
  }, [girisYapildi, ekonomiYuklendi]);

  useEffect(() => {
    if (!girisYapildi) return;
    const kontrolEt = () => {
      const bugun = bugunAnahtari();
      const sonOdul = localStorage.getItem("gunlukGirisSonOdul");
      if (sonOdul !== bugun) {
        setGunlukOdulAlindi(false);
        setMevcutGirisGunu(gunlukGirisGorunenGun(bugun));
      }
    };
    kontrolEt();
    const timer = window.setInterval(kontrolEt, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [girisYapildi]);

  useEffect(() => { if (!ekonomiYuklendi) return; try { localStorage.setItem("bakiyeCip", String(bakiyeCip)); } catch {} }, [bakiyeCip, ekonomiYuklendi]);
  useEffect(() => { if (!ekonomiYuklendi) return; try { localStorage.setItem("bakiyeElmas", String(bakiyeElmas)); } catch {} }, [bakiyeElmas, ekonomiYuklendi]);
  useEffect(() => { if (!ekonomiYuklendi) return; try { localStorage.setItem("vipSeviyesi", String(vipSeviyesi)); } catch {} }, [vipSeviyesi, ekonomiYuklendi]);
  useEffect(() => {
    if (!ekonomiYuklendi) return;
    try {
      if (vipBitisTarihi) localStorage.setItem("vipBitisTarihi", String(vipBitisTarihi));
      else localStorage.removeItem("vipBitisTarihi");
    } catch {}
  }, [vipBitisTarihi, ekonomiYuklendi]);
  useEffect(() => { if (!ekonomiYuklendi) return; try { localStorage.setItem("alinanIstakalar", JSON.stringify(alinanIstakalar)); } catch {} }, [alinanIstakalar, ekonomiYuklendi]);
  useEffect(() => { if (!ekonomiYuklendi) return; try { localStorage.setItem("kusanilanIstaka", String(kusanilanIstaka)); } catch {} }, [kusanilanIstaka, ekonomiYuklendi]);
  useEffect(() => {
    if (!begeniKayitlariYuklendi) return;
    try { localStorage.setItem("arkadasBegeniZamanlari", JSON.stringify(arkadasBegeniZamanlari)); } catch {}
  }, [arkadasBegeniZamanlari, begeniKayitlariYuklendi]);
  useEffect(() => {
    if (!begeniKayitlariYuklendi) return;
    try { localStorage.setItem("gelenBegeniler", JSON.stringify(gelenBegeniler)); } catch {}
  }, [gelenBegeniler, begeniKayitlariYuklendi]);

  useEffect(() => {
    setOkeyTasPozisyonlari({});
    setOkeyAktifSurukleme(null);
  }, [okeyDurum?.oyuncular?.[0]?.el.map(t => t.id).join(',')]);

  const toggleGelenKutusu = () => {
    setGelenKutusuAcik(!gelenKutusuAcik);
    setArkadaslarAcik(false);
    setBegeniPaneliAcik(false);
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
    setBegeniPaneliAcik(false);
    setVipMarketAcik(false);
    setCantaAcik(false);
    setHediyeCipPanelAcik(false);
  };

  const hediyeCipGonderAksiyonu = () => {
    const hedefId = hediyeCipTargetId.trim();
    const hedefOyuncu = oyuncuAramaHavuzu.find((oyuncu) => oyuncu.id === hedefId);

    if (hedefId === "" || hediyeCipMiktar.trim() === "") {
      bildirimGoster("Eksik bilgi", "Oyuncu ID ve çip miktarını eksiksiz gir.", "bilgi");
      return;
    }
    if (!hedefOyuncu) {
      bildirimGoster("Oyuncu bulunamadı", "Lütfen kayıtlı oyuncu ID gir veya arkadaş listesinden seç.", "bilgi");
      return;
    }
    const miktar = parseInt(hediyeCipMiktar);
    if (isNaN(miktar) || miktar <= 0) {
      bildirimGoster("Geçersiz miktar", "Geçerli bir çip miktarı gir.", "bilgi");
      return;
    }
    if (bakiyeCip >= miktar) {
      const saat = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      setBakiyeCip(prev => prev - miktar);
      setHediyeCipGecmisi((onceki) => [
        { id: Date.now(), oyuncuId: hedefId, oyuncuAd: hedefOyuncu.ad, miktar, tarih: `Bugün ${saat}` },
        ...onceki,
      ].slice(0, 12));
      bildirimGoster("Çip gönderildi", `${hedefOyuncu.ad} oyuncusuna ${miktar.toLocaleString()} çip gönderildi.`, "basari");
      setHediyeCipPanelAcik(false);
      setMiniArkadasSecAcik(false);
      setHediyeCipGecmisAcik(false);
      setHediyeCipTargetId("");
      setHediyeCipMiktar("");
    } else {
      bildirimGoster("Yetersiz çip", "Bakiyende yeterli çip bulunmuyor.", "bilgi");
    }
  };

  const ucretsizCipDestegiAl = () => {
    const logs = localStorage.getItem("cipDestekZamanlari");
    let zamanlar: number[] = logs ? JSON.parse(logs) : [];
    const simdi = Date.now();
    zamanlar = zamanlar.filter(z => simdi - z < 24 * 60 * 60 * 1000);

    if (zamanlar.length >= 2) {
      bildirimGoster("Günlük limit doldu", "Ücretsiz çip desteği hakkın bugün doldu.", "bilgi");
      return;
    }
    zamanlar.push(simdi);
    localStorage.setItem("cipDestekZamanlari", JSON.stringify(zamanlar));
    setBakiyeCip((prev) => prev + 10000);
    setDestekSayaci(zamanlar.length);
    bildirimGoster("Ücretsiz çip", "+10.000 çip bakiyene eklendi.", "basari");
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
        bildirimGoster("Istaka kuşanıldı", "Satın alınan ıstaka masada kullanılmaya hazır.", "basari");
      }
    } else {
      const tema = ISTAKA_TEMALAR[id];
      odemeBaslat({
        tur: "istaka",
        baslik: "Istaka Satın Al",
        aciklama: tema ? `${tema.takim} Istakası` : "Özel Istaka",
        fiyat: fiyati,
        istakaId: id,
      });
    }
  };


  const istakaHediyeEt = (id: number, fiyati: string, paraTuru: "CIP" | "TL") => {
    const hedefId = prompt("Istaka hediye edilecek oyuncu ID'sini yaz:");
    if (!hedefId) return;
    if (paraTuru === "CIP") {
      const ucret = parseInt(fiyati.replace(/\D/g, ''));
      if (bakiyeCip < ucret) { bildirimGoster("Yetersiz çip", "Hediye için yeterli çip yok.", "bilgi"); return; }
      setBakiyeCip(prev => prev - ucret);
      bildirimGoster("Hediye gönderildi", `${hedefId} ID oyuncuya ıstaka hediyesi gönderildi.`, "basari");
      return;
    }
    const tema = ISTAKA_TEMALAR[id];
    odemeBaslat({
      tur: "istakaHediye",
      baslik: "Istaka Hediyesi",
      aciklama: `${hedefId} ID oyuncuya ${tema ? tema.takim : "özel"} ıstaka`,
      fiyat: fiyati,
      istakaId: id,
      hediyeHedefId: hedefId,
    });
  };

  const odemePlatformuYazi = () => {
    if (girisYontemi === "iOS") return "iOS";
    if (girisYontemi === "Google") return "Play Store";
    if (girisYontemi === "Facebook") return "Facebook";
    return "Web";
  };

  const odemeYontemleriGetir = () => {
    if (girisYontemi === "iOS") return ["iOS kayıtlı kart", "Mobil ödeme"];
    if (girisYontemi === "Google") return ["Play Store kartı", "Mobil ödeme"];
    if (girisYontemi === "Facebook") return ["Kredi kartı"];
    return ["Kredi kartı"];
  };

  const kartNumarasiFormatla = (deger: string) => deger.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const sonKullanmaFormatla = (deger: string) => {
    const temiz = deger.replace(/\D/g, "").slice(0, 4);
    return temiz.length > 2 ? `${temiz.slice(0, 2)}/${temiz.slice(2)}` : temiz;
  };
  const seciliYontemMobilMi = seciliOdemeYontemi.toLocaleLowerCase("tr-TR").includes("mobil");

  const odemeYontemiSec = (yontem: string) => {
    setSeciliOdemeYontemi(yontem);
    setOdemeAdimi("bilgi");
    setOdemeDogrulamaKodu("");
    setOdemeKodGirisi("");
    setOdemeHatasi("");
  };

  const odemeBaslat = (odeme: BekleyenOdeme) => {
    const yontemler = odemeYontemleriGetir();
    setSeciliOdemeYontemi(yontemler[0] || "Kredi kartı");
    setOdemeAdimi("bilgi");
    setKartFormu({ adSoyad: "", kartNo: "", sonKullanma: "", cvv: "", telefon: "" });
    setOdemeDogrulamaKodu("");
    setOdemeKodGirisi("");
    setOdemeHatasi("");
    setOdemeIsleniyor(false);
    setBekleyenOdeme(odeme);
  };

  const odemeBilgileriGecerliMi = () => {
    const telefonRakam = kartFormu.telefon.replace(/\D/g, "");
    if (telefonRakam.length < 10) {
      setOdemeHatasi("Doğrulama kodu için telefon numarası gir.");
      return false;
    }
    if (seciliYontemMobilMi) return true;

    const kartNo = kartFormu.kartNo.replace(/\D/g, "");
    const sonKullanma = kartFormu.sonKullanma.replace(/\D/g, "");
    const cvv = kartFormu.cvv.replace(/\D/g, "");
    if (!kartFormu.adSoyad.trim()) {
      setOdemeHatasi("Kart üzerindeki ad soyad eksik.");
      return false;
    }
    if (kartNo.length !== 16) {
      setOdemeHatasi("Kart numarası 16 haneli olmalı.");
      return false;
    }
    if (sonKullanma.length !== 4) {
      setOdemeHatasi("Son kullanma tarihi AA/YY formatında olmalı.");
      return false;
    }
    if (cvv.length !== 3) {
      setOdemeHatasi("CVV 3 haneli olmalı.");
      return false;
    }
    return true;
  };

  const dogrulamaKoduGonder = () => {
    if (!bekleyenOdeme) return;
    if (!odemeBilgileriGecerliMi()) return;
    const kod = String(Math.floor(100000 + Math.random() * 900000));
    setOdemeDogrulamaKodu(kod);
    setOdemeKodGirisi("");
    setOdemeAdimi("dogrulama");
    setOdemeHatasi("");
    bildirimGoster("Doğrulama kodu gönderildi", `Test kodu: ${kod}`, "bilgi");
  };

  const siparisPayloadOlustur = (odeme: BekleyenOdeme) => {
    if (odeme.tur === "vip") {
      return {
        kind: "vip",
        productId: `vip_${odeme.vipSeviye}`,
        productName: odeme.baslik,
        price: odeme.fiyat,
        vipLevel: odeme.vipSeviye,
      };
    }
    if (odeme.tur === "istaka" || odeme.tur === "istakaHediye") {
      return {
        kind: odeme.tur === "istaka" ? "cue" : "cueGift",
        productId: `cue_${odeme.istakaId}`,
        productName: odeme.aciklama,
        price: odeme.fiyat,
        cueId: odeme.istakaId,
        giftTargetId: odeme.hediyeHedefId,
      };
    }
    if (odeme.tur === "elmas") {
      return {
        kind: "diamonds",
        productId: `diamonds_${odeme.elmas || 0}`,
        productName: odeme.aciklama,
        price: odeme.fiyat,
        diamonds: odeme.elmas,
      };
    }
    return {
      kind: "chips",
      productId: `chips_${odeme.miktar || 0}`,
      productName: odeme.aciklama,
      price: odeme.fiyat,
      chips: odeme.miktar,
    };
  };

  const odemeSonucunuUygula = (entitlement: any) => {
    if (!entitlement) return;
    if (entitlement.kind === "vip" && entitlement.vipLevel) {
      const hedef = Number(entitlement.vipLevel);
      const otuzGunMs = 30 * 24 * 60 * 60 * 1000;
      const baslangic = vipBitisTarihi && vipBitisTarihi > Date.now() ? vipBitisTarihi : Date.now();
      setVipSeviyesi(hedef);
      setVipBitisTarihi(baslangic + otuzGunMs);
      setSecilenPaketIndex(Math.min(hedef, vipPaketleri.length - 1));
      bildirimGoster("Ödeme onaylandı", `VIP ${hedef} aktif edildi. Süre: 1 ay.`, "basari");
      return;
    }
    if (entitlement.kind === "cue" && entitlement.cueId) {
      const cueId = Number(entitlement.cueId);
      setAlinanIstakalar((prev) => prev.includes(cueId) ? prev : [...prev, cueId]);
      setKusanilanIstaka(cueId);
      bildirimGoster("Ödeme onaylandı", "Istaka satın alındı ve kuşanıldı.", "basari");
      return;
    }
    if (entitlement.kind === "cueGift") {
      bildirimGoster("Hediye gönderildi", `${entitlement.giftTargetId || "Oyuncu"} ID oyuncuya ıstaka hediyesi gönderildi.`, "basari");
      return;
    }
    if (entitlement.kind === "chips" && entitlement.chips) {
      const chips = Number(entitlement.chips);
      setBakiyeCip((prev) => prev + chips);
      bildirimGoster("Ödeme onaylandı", `+${chips.toLocaleString()} çip hesabına eklendi.`, "basari");
      return;
    }
    if (entitlement.kind === "diamonds" && entitlement.diamonds) {
      const diamonds = Number(entitlement.diamonds);
      setBakiyeElmas((prev) => prev + diamonds);
      bildirimGoster("Ödeme onaylandı", `+${diamonds.toLocaleString()} elmas hesabına eklendi.`, "basari");
    }
  };

  const odemeSaglayiciOnayiniBekle = async (odeme: BekleyenOdeme) => {
    const payload = siparisPayloadOlustur(odeme);
    const createResponse = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        userId: "96798511",
        provider: "mock",
      }),
    });

    if (!createResponse.ok) {
      throw new Error("Siparis olusturulamadi.");
    }

    const created = await createResponse.json();

    await fetch("/api/payments/dev-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: created.orderId }),
    });

    for (let i = 0; i < 6; i += 1) {
      const statusResponse = await fetch(`/api/payments/status/${created.orderId}`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.status === "paid") return statusData.entitlement;
        if (statusData.status === "failed") throw new Error("Odeme basarisiz oldu.");
      }
      if (i < 5) {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
    }

    throw new Error("Odeme onayi zamaninda gelmedi.");
  };

  const odemeOnayla = async () => {
    if (!bekleyenOdeme) return;
    if (odemeIsleniyor) return;
    if (odemeAdimi !== "dogrulama") {
      dogrulamaKoduGonder();
      return;
    }
    if (odemeKodGirisi.trim() !== odemeDogrulamaKodu) {
      setOdemeHatasi("Doğrulama kodu hatalı.");
      return;
    }

    try {
      setOdemeIsleniyor(true);
      setOdemeHatasi("");
      const entitlement = await odemeSaglayiciOnayiniBekle(bekleyenOdeme);
      odemeSonucunuUygula(entitlement);
      setOdemeAdimi("bilgi");
      setOdemeDogrulamaKodu("");
      setOdemeKodGirisi("");
      setOdemeHatasi("");
      setBekleyenOdeme(null);
    } catch {
      setOdemeHatasi("Ödeme sağlayıcı onayı alınamadı. Sipariş tamamlanmadı.");
    } finally {
      setOdemeIsleniyor(false);
    }
  };

  const siraliVipSatinAl = (hedef: number, fiyat: string) => {
    if (hedef === vipSeviyesi + 1) {
      odemeBaslat({
        tur: "vip",
        baslik: `VIP ${hedef}`,
        aciklama: "1 Aylık VIP üyelik",
        fiyat,
        vipSeviye: hedef,
      });
    }
  };

  const gunlukOdulAl = () => {
    if (gunlukOdulAlindi) {
      bildirimGoster("Günlük ödül", "Bugünkü ödül zaten alındı.", "bilgi");
      return;
    }
    const odul = haftalikOduller.find((item) => item.gun === mevcutGirisGunu) || haftalikOduller[0];
    if (odul.tur === "cip") {
      setBakiyeCip((prev) => prev + odul.miktar);
    } else {
      setBakiyeElmas((prev) => prev + odul.miktar);
    }
    const bugun = bugunAnahtari();
    const siradakiGun = odul.gun >= 7 ? 1 : odul.gun + 1;
    localStorage.setItem("gunlukGirisSonOdul", bugun);
    localStorage.setItem("gunlukGirisGunu", String(siradakiGun));
    localStorage.setItem("gunlukGirisSonAlinanGun", String(odul.gun));
    setGunlukOdulAlindi(true);
    bildirimGoster("Günlük ödül alındı", `${odul.gun}. gün ödülün hesabına eklendi: ${odul.yazi} ${odul.tur === "cip" ? "çip" : "elmas"}`, "odul");
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
    const hediye = aktifHediyeListesi.find(h => h.id === seciliHediyeId);
    if (!hediye) return;
    
    const toplamMaliyet = hediye.maliyet * hediyeAdet;

    if (hediye.envanterAdet > 0) {
      bildirimGoster("Hediye gönderildi", `Envanterinden ${hediyeAdet} adet ${hediye.ad} gönderildi.`, "basari");
      setHediyePaneliAcik(false);
      setHediyeAdet(1);
    } else if (bakiyeElmas >= toplamMaliyet || hediye.maliyet === 0) {
      setBakiyeElmas(prev => prev - toplamMaliyet);
      bildirimGoster("Hediye gönderildi", `${hediyeHedefOyuncu.ad} oyuncusuna ${hediyeAdet} adet ${hediye.ad} gönderildi.`, "basari");
      setHediyePaneliAcik(false);
      setHediyeAdet(1);
    } else {
      bildirimGoster("Yetersiz elmas", `İşlem için ${toplamMaliyet} elmas gerekiyor.`, "bilgi");
    }
  };

  const idIleOyuncuAraVeIstekAt = () => {
    const temizId = arananId.trim();
    if (temizId === "") return;
    const bulunanOyuncu = oyuncuAramaHavuzu.find((oyuncu) => oyuncu.id === temizId);
    if (!bulunanOyuncu) {
      bildirimGoster("Oyuncu bulunamadı", "Bu ID ile kayıtlı oyuncu bulunamadı.", "bilgi");
      setArananId("");
      return;
    }
    setProfilAcilisKaynak("arama");
    setDigerProfilSekme("profil");
    setDigerProfilBasariKategori("Otomatik Eşleşme");
    setSeciliArkadasProfil(bulunanOyuncu);
    setArananId("");
  };

  const idKopyala = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      bildirimGoster("ID kopyalandı", `ID: ${id}`, "basari");
    } catch {
      bildirimGoster("ID", id, "bilgi");
    }
  };

  const profilUzerindenArkadasEkle = (oyuncu: OyuncuProfil) => {
    if (arkadasListesi.some((arkadas) => arkadas.id === oyuncu.id)) {
      bildirimGoster("Zaten arkadaş", `${oyuncu.ad} zaten arkadaş listende.`, "bilgi");
      return;
    }
    if (arkadasIstekleri.includes(oyuncu.id)) {
      bildirimGoster("İstek gönderildi", `${oyuncu.ad} için arkadaşlık isteği zaten gönderildi.`, "bilgi");
      return;
    }
    setArkadasIstekleri((onceki) => [...onceki, oyuncu.id]);
    bildirimGoster("İstek gönderildi", `${oyuncu.ad} oyuncusuna arkadaşlık isteği gönderildi.`, "basari");
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
    odemeBaslat({
      tur: "cip",
      baslik: "Çip Paketi",
      aciklama: `${milyonMiktar.toLocaleString()} Çip`,
      fiyat,
      miktar: milyonMiktar,
    });
  };

  const elmasSatinAl = (elmasMiktar: number, fiyat: string) => {
    odemeBaslat({
      tur: "elmas",
      baslik: "Elmas Paketi",
      aciklama: `${elmasMiktar.toLocaleString()} Elmas`,
      fiyat,
      elmas: elmasMiktar,
    });
  };

  const kampanyaCipSatinAl = () => {
    setKampanyaAcik(false);
    odemeBaslat({
      tur: "kampanya",
      baslik: "Günlük İndirim Paketi",
      aciklama: "100.000 Çip",
      fiyat: "10 TL",
      miktar: 100000,
    });
  };


  const elmasDonustur = () => {
    if (bakiyeCip < 50000) {
      bildirimGoster("Yetersiz çip", "1 elmas için 50.000 çip gerekiyor.", "bilgi");
      return;
    }
    setBakiyeCip(prev => prev - 50000);
    setBakiyeElmas(prev => prev + 1);
    bildirimGoster("Elmas alındı", "50.000 çip karşılığında 1 elmas aldın.", "basari");
  };

  const oyunSonucunuAc = (tur: OyunSonucTuru, kazandi = true, berabere = false) => {
    const baslangicDostu = bakiyeCip < 100000;
    const cip = tur === 'Okey' ? (baslangicDostu ? 32000 : 26654) : tur === 'Pişti' ? (baslangicDostu ? 12000 : 8200) : (baslangicDostu ? 18000 : 14500);
    const puan = berabere ? 0 : (kazandi ? (tur === 'Okey' ? 35 : tur === 'Pişti' ? 20 : 25) : 5);
    setOyunSayisi(prev => prev + 1);
    if (kazandi && !berabere) {
      setBakiyeCip(prev => prev + cip);
    }
    setOyunRutbePuani(prev => prev + puan);
    setSonucPaneli({
      tur,
      kazandi,
      berabere,
      cip: berabere ? 0 : (kazandi ? cip : 0),
      puan: berabere ? 0 : (kazandi ? puan : 1),
      rakipler: berabere ? [
        { isim: 'iPhone14,5', puan: 0, cip: 0 },
        { isim: 'Ahmet Beg..', puan: 0, cip: 0 },
        { isim: '24116RACCG', puan: 0, cip: 0 },
      ] : [
        { isim: 'iPhone14,5', puan: 34, cip: kazandi ? 0 : cip },
        { isim: 'Ahmet Beg..', puan: 44, cip: kazandi ? 0 : 0 },
        { isim: '24116RACCG', puan: 404, cip: kazandi ? 0 : 0 },
      ]
    });
  };

  useEffect(() => {
    if (pistiDurum?.bitti) {
      const key = `pisti-${pistiDurum.oyuncuSkor}-${pistiDurum.botSkor}-${pistiDurum.oyuncuToplanan}-${pistiDurum.botToplanan}`;
      if (sonucGosterildiKey !== key) {
        setSonucGosterildiKey(key);
        oyunSonucunuAc('Pişti', pistiDurum.oyuncuSkor >= pistiDurum.botSkor);
      }
    }
  }, [pistiDurum?.bitti]);

  useEffect(() => {
    if (tavlaDurum?.bitti) {
      const key = `tavla-${tavlaDurum.oyuncuToplanan}-${tavlaDurum.botToplanan}-${tavlaDurum.mesaj}`;
      if (sonucGosterildiKey !== key) {
        setSonucGosterildiKey(key);
        oyunSonucunuAc('Tavla', tavlaDurum.oyuncuToplanan >= 15);
      }
    }
  }, [tavlaDurum?.bitti]);

  useEffect(() => {
    if (okeyDurum?.bitti) {
      const winnerIndex = typeof okeyDurum.kazananIndex === 'number' ? okeyDurum.kazananIndex : okeyDurum.oyuncular.findIndex(o => o.el.length === 0);
      const berabere = !!okeyDurum.berabere || winnerIndex === -1;
      const key = `okey-${winnerIndex}-${berabere}-${okeyDurum.mesaj}-${okeyDurum.kalanDeste.length}`;
      if (sonucGosterildiKey !== key) {
        setSonucGosterildiKey(key);
        oyunSonucunuAc('Okey', winnerIndex === 0, berabere);
      }
    }
  }, [okeyDurum?.bitti]);

  useEffect(() => {
    const kayitliIsim = localStorage.getItem("oyuncuIsmi");
    const kayitliYontem = localStorage.getItem("girisYontemi");
    if (kayitliYontem === "Google" || kayitliYontem === "Facebook" || kayitliYontem === "iOS" || kayitliYontem === "Misafir" || kayitliYontem === "Web") {
      setGirisYontemi(kayitliYontem);
    }
    if (kayitliIsim) {
      setIsim(kayitliIsim);
      setGirisYapildi(true);
    }
  }, []);

  useEffect(() => {
    if (!girisYapildi) return;
    setKampanyaAcik(true);
  }, [girisYapildi]);

  const girisYapAction = (yontem: GirisYontemi) => {
    const yeniIsim = yontem === "Misafir" ? "Misafir_" + Math.floor(Math.random()*1000) : "Süleyman";
    localStorage.setItem("oyuncuIsmi", yeniIsim);
    localStorage.setItem("girisYontemi", yontem);
    setGirisYontemi(yontem);
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
  const vipKalanGun = vipBitisTarihi ? Math.max(0, Math.ceil((vipBitisTarihi - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
  const vipBitisYazi = vipBitisTarihi ? new Date(vipBitisTarihi).toLocaleDateString("tr-TR") : "Yok";
  const aktifOyunRutbesi = oyunRutbesiGetir(oyunRutbePuani, oyunSayisi);
  const siradakiOyunRutbesi = sonrakiRutbeGetir(oyunRutbePuani, oyunSayisi);
  const oyunRutbeYuzdesi = rutbeYuzdesiGetir(oyunRutbePuani, oyunSayisi);

  const envanter: Record<"çipler" | "ıstakalar" | "çerçeveler", EnvanterOgesi[]> = {
    çipler: [
      { id: 1, ad: "Mevcut Çip Bakiyeniz", miktar: bakiyeCip.toLocaleString(), durum: "Aktif", stil: "text-yellow-400 font-bold", paraTuru: "SABIT", fiyati: "0" },
      { id: 2, ad: "Ücretsiz Çip Desteği", miktar: "+10.000 Çip", durum: kalanSureYazi, stil: "text-green-400 font-medium", paraTuru: "Hile", fiyati: "0" }
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
  const seciliProfilGizli = !!seciliArkadasProfil?.profilGizli;
  const seciliProfilArkadasMi = !!seciliArkadasProfil && (arkadasListesi.some((arkadas) => arkadas.id === seciliArkadasProfil.id) || (profilAcilisKaynak === "liste" && sosyalAktifSekme === "arkadaslar"));
  const seciliProfilOzelIcerikKilitli = seciliProfilGizli && !seciliProfilArkadasMi;
  const seciliProfilIstekGonderildi = !!seciliArkadasProfil && arkadasIstekleri.includes(seciliArkadasProfil.id);
  const seciliProfilAramadan = profilAcilisKaynak === "arama";
  const seciliProfilOyunSayisi = seciliArkadasProfil ? 420 + seciliArkadasProfil.vip * 87 : 0;
  const seciliProfilGalibiyet = seciliArkadasProfil ? Math.min(91, 24 + seciliArkadasProfil.vip * 3) : 0;
  const seciliProfilTakipci = seciliArkadasProfil ? 1 + seciliArkadasProfil.vip * 2 : 0;
  const seciliProfilPaylasimlari = seciliArkadasProfil ? [
    { id: 1, metin: "Bugün kahvemi aldım, sakin bir akşam modundayım.", tarih: "Bugün", gorsel: "from-amber-200 via-orange-200 to-sky-200", ikon: "☕" },
    { id: 2, metin: "Yeni profil fotoğrafı denemesi. Nasıl olmuş?", tarih: "Dün", gorsel: "from-fuchsia-200 via-rose-200 to-yellow-100", ikon: "📸" },
    { id: 3, metin: "Lounge köşemde kısa bir mola.", tarih: "3 gün önce", gorsel: "from-cyan-200 via-blue-200 to-indigo-200", ikon: "🌆" },
  ] : [];
  const seciliProfilBasariGecmisi: Record<string, string[]> = seciliArkadasProfil ? {
    'Otomatik Eşleşme': [
      `15/6/2026  ${seciliArkadasProfil.ad} otomatik eşleşmede 101 Okey galibiyeti aldı.`,
      `12/6/2026  Otomatik eşleşmede ${seciliArkadasProfil.vip + 4} per açarak oyunu bitirdi.`,
      `7/6/2026  Otomatik eşleşmede ${(45000 + seciliArkadasProfil.vip * 3000).toLocaleString()} çip kazandı.`,
    ],
    'Masa Aç': [
      `14/6/2026  ${seciliArkadasProfil.ad} kendi açtığı masada oyunu kazandı.`,
      `10/6/2026  Özel masada 4 oyunculu seri tamamlandı.`,
      `3/6/2026  Masa sahibi olarak ${(30000 + seciliArkadasProfil.vip * 2500).toLocaleString()} çip topladı.`,
    ],
    'Pişti': [
      `13/6/2026  Pişti masasında 2 kez üst üste galibiyet aldı.`,
      `9/6/2026  Vale ile masayı topladı.`,
      `2/6/2026  Pişti oyunundan ${(18000 + seciliArkadasProfil.vip * 1200).toLocaleString()} çip kazandı.`,
    ],
    'Tavla': [
      `11/6/2026  Tavlada mars yaptı.`,
      `6/6/2026  Tavla masasında seri zar avantajı yakaladı.`,
      `1/6/2026  Tavla oyunundan ${(22000 + seciliArkadasProfil.vip * 1500).toLocaleString()} çip kazandı.`,
    ],
  } : {};
  const seciliProfilAktifBasariGecmisi = seciliProfilBasariGecmisi[digerProfilBasariKategori] || [];
  const aktifLiderlikListesi = liderlikOyunculari
    .filter((oyuncu) => {
      if (siralamaSekme === "sehir") return oyuncu.sehir === profilSehir;
      if (siralamaSekme === "bolge") return oyuncu.bolge === profilBolge;
      return true;
    })
    .sort((a, b) => b.skorlar[siralamaKategori] - a.skorlar[siralamaKategori])
    .map((oyuncu, index) => ({ ...oyuncu, sira: index + 1, skor: oyuncu.skorlar[siralamaKategori] }));
  const liderlikProfilAc = (oyuncu: LiderlikOyuncusu) => {
    setProfilAcilisKaynak("arama");
    setDigerProfilSekme("profil");
    setDigerProfilBasariKategori("Otomatik Eşleşme");
    setSiralamaAcik(false);
    setSeciliArkadasProfil(oyuncu);
  };
  const aktifLiderlikBaslik = siralamaSekme === "sehir" ? profilSehir : siralamaSekme === "bolge" ? profilBolge : "Genel";
  const hediyeCipArkadaslari = hediyeCipArkadasSekmesi === "arkadaslar"
    ? arkadasListesi
    : [...takipcilerListesi, ...takipEdilenListesi].slice(0, 10);
  const hediyeCipSeciliOyuncu = oyuncuAramaHavuzu.find((oyuncu) => oyuncu.id === hediyeCipTargetId.trim());
  const hediyeCipMasraf = 0;
  const gunlukIndirimPaketi = {
    cip: 100000,
    cipYazi: "100.000",
    fiyat: "10 TL",
    normalFiyat: "19,99 TL",
    indirimOrani: 50,
  };

  return (
    <div
      data-device={cihazModu}
      className="lounge-shell relative w-full h-[var(--app-height,100svh)] text-white p-3 overflow-hidden flex flex-col justify-between select-none font-sans"
    >
      {acilisYukleniyor && (
        <div className="fixed inset-0 z-[10000] overflow-hidden bg-slate-950 text-white">
          <img
            src="/loading-okey-lounge.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/70"></div>
          <div className="absolute inset-x-0 bottom-[max(36px,env(safe-area-inset-bottom))] z-10 mx-auto flex w-[min(720px,84vw)] flex-col items-center gap-4 px-2">
            <div className="rounded-full border border-white/20 bg-black/38 px-5 py-2 text-base font-black tracking-wide text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-sm md:text-xl">
              Oyun yükleniyor
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border border-white/15 bg-black/45 shadow-[0_10px_26px_rgba(0,0,0,0.45)]">
              <div className="loading-progress h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-yellow-300"></div>
            </div>
          </div>
        </div>
      )}
      {uygulamaBildirimi && (
        <div className="fixed left-1/2 top-5 z-[9900] w-[min(520px,92vw)] -translate-x-1/2 rounded-2xl border border-white/25 bg-slate-950/90 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner ${uygulamaBildirimi.tur === "odul" ? "bg-gradient-to-br from-yellow-300 to-orange-500" : uygulamaBildirimi.tur === "basari" ? "bg-gradient-to-br from-emerald-300 to-teal-600" : "bg-gradient-to-br from-sky-300 to-blue-600"}`}>
              {uygulamaBildirimi.tur === "odul" ? "🎁" : uygulamaBildirimi.tur === "basari" ? "✓" : "i"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-white">{uygulamaBildirimi.baslik}</div>
              <div className="text-xs font-bold text-white/70">{uygulamaBildirimi.metin}</div>
            </div>
            <button onClick={() => setUygulamaBildirimi(null)} className="h-8 w-8 rounded-full bg-white/10 text-lg font-black text-white/80 hover:bg-white/20">×</button>
          </div>
        </div>
      )}

      {kampanyaAcik && (
        <div
          className="daily-deal-modal fixed inset-0 z-[9500] flex items-center justify-center overflow-hidden bg-black/72 p-4 backdrop-blur-[3px]"
          onClick={() => setKampanyaAcik(false)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(253,186,116,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)]"></div>
          <div
            className="daily-deal-card relative h-[min(650px,88vh)] w-[min(1180px,96vw)] overflow-hidden rounded-[34px] border border-white/25 bg-gradient-to-br from-[#101428] via-[#17264b] to-[#07111f] shadow-[0_42px_110px_rgba(0,0,0,0.72)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_38%_44%,rgba(255,246,196,0.2),transparent_26%),radial-gradient(circle_at_72%_28%,rgba(236,72,153,0.2),transparent_20%),radial-gradient(circle_at_22%_78%,rgba(34,211,238,0.16),transparent_28%)]"></div>
            <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-yellow-300/18 blur-3xl"></div>
            <div className="absolute -right-20 bottom-[-90px] h-96 w-96 rounded-full bg-cyan-300/18 blur-3xl"></div>
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent"></div>

            <button
              type="button"
              onClick={() => setKampanyaAcik(false)}
              className="absolute right-7 top-6 z-30 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/55 bg-black/25 text-5xl font-light leading-none text-white shadow-[0_0_26px_rgba(255,255,255,0.25)] hover:bg-white/15"
              aria-label="Kapat"
            >
              ×
            </button>

            <div className="daily-deal-layout relative z-10 grid h-full grid-cols-[0.95fr_1.25fr_0.8fr] items-center gap-2 px-12 py-10 text-white">
              <section className="daily-deal-copy self-start pt-8">
                <div className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-300/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-cyan-100 shadow">
                  Sadece Bugün
                </div>
                <h2 className="mt-5 font-serif text-[clamp(46px,5vw,82px)] font-black leading-[0.92] text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.7)]">
                  Günlük<br />İndirim Paketi
                </h2>
                <p className="mt-5 max-w-sm text-xl font-bold leading-snug text-sky-100/90">
                  Her girişte önerilen başlangıç paketi. Yüksek çip, net fiyat, gerçek indirim.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3 text-sm font-black text-white/78">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><CipSimgesi boyut="sm" /> {gunlukIndirimPaketi.cipYazi} Çip</span>
                  <span className="rounded-full bg-white/10 px-3 py-2">Günde 1 kez</span>
                  <span className="rounded-full bg-pink-500/90 px-3 py-2">%{gunlukIndirimPaketi.indirimOrani} indirim</span>
                </div>
              </section>

              <section className="daily-deal-visual relative flex h-full items-center justify-center">
                <div className="absolute top-12 z-20 rotate-[-7deg] rounded-full border-4 border-yellow-100 bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-2 text-3xl font-black text-white shadow-[0_16px_30px_rgba(236,72,153,0.45)]">
                  %{gunlukIndirimPaketi.indirimOrani}
                </div>

                <div className="relative h-[420px] w-[540px] max-w-full">
                  <div className="absolute left-8 top-40 h-40 w-[420px] rotate-[-8deg] rounded-[34px] bg-gradient-to-br from-pink-300 via-fuchsia-500 to-purple-900 shadow-[0_30px_70px_rgba(0,0,0,0.52)]"></div>
                  <div className="absolute left-[330px] top-[250px] h-24 w-48 rotate-[12deg] rounded-[20px] bg-gradient-to-br from-emerald-200 to-teal-500 shadow-2xl"></div>
                  <div className="absolute left-[354px] top-[268px] z-20 rotate-[12deg] text-center text-white drop-shadow">
                    <div className="text-sm font-black line-through opacity-70">{gunlukIndirimPaketi.normalFiyat}</div>
                    <div className="text-5xl font-black">{gunlukIndirimPaketi.fiyat}</div>
                  </div>

                  <div className="absolute left-[74px] top-[112px] h-[232px] w-[320px] rotate-[-6deg] rounded-[32px] bg-gradient-to-br from-blue-300 via-blue-500 to-indigo-900 shadow-[0_35px_74px_rgba(0,0,0,0.62)]">
                    <div className="absolute inset-x-0 top-0 h-20 rounded-t-[32px] bg-gradient-to-br from-sky-200 via-blue-400 to-indigo-500"></div>
                    <div className="absolute left-1/2 top-0 h-full w-11 -translate-x-1/2 bg-gradient-to-b from-fuchsia-100 via-pink-400 to-purple-800"></div>
                    <div className="absolute -left-9 top-28 h-20 w-[385px] rounded-[24px] bg-gradient-to-r from-sky-200 via-blue-500 to-indigo-900 shadow-xl"></div>
                    <div className="absolute left-5 top-4 text-5xl opacity-25">✦ ✦ ✦</div>
                    {Array.from({ length: 24 }).map((_, index) => (
                      <span
                        key={index}
                        className="absolute flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow-100 bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500 text-[12px] font-black text-yellow-900 shadow-[0_8px_14px_rgba(0,0,0,0.25)]"
                        style={{
                          left: `${34 + (index % 8) * 30 + (index % 3) * 7}px`,
                          top: `${-28 + Math.floor(index / 8) * 36 + (index % 2) * 8}px`,
                          transform: `rotate(${(index % 5) * 11 - 18}deg)`,
                          zIndex: 8 + index,
                        }}
                      >
                        101
                      </span>
                    ))}
                  </div>

                  <div className="absolute right-10 top-[352px] z-20 rotate-[13deg] rounded-[22px] border-4 border-yellow-100 bg-gradient-to-r from-yellow-50 to-amber-200 px-7 py-4 text-center text-amber-900 shadow-2xl">
                    <div className="text-4xl font-black">{gunlukIndirimPaketi.cipYazi}</div>
                    <div className="text-lg font-black">Çip</div>
                  </div>
                </div>
              </section>

              <section className="daily-deal-summary self-end pb-8">
                <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
                  <div className="text-sm font-black uppercase text-yellow-200">Paket İçeriği</div>
                  <div className="mt-3 space-y-2 text-sm font-bold text-white/85">
                    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"><span>Çip</span><span className="text-yellow-200">{gunlukIndirimPaketi.cipYazi}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"><span>Normal</span><span className="line-through opacity-70">{gunlukIndirimPaketi.normalFiyat}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"><span>Bugün</span><span className="text-emerald-200">{gunlukIndirimPaketi.fiyat}</span></div>
                  </div>
                  <button onClick={kampanyaCipSatinAl} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-500 py-4 text-xl font-black text-white shadow-[0_18px_30px_rgba(249,115,22,0.35)] hover:brightness-110 active:scale-95">
                    {gunlukIndirimPaketi.fiyat} ile Al
                  </button>
                  <button onClick={() => setKampanyaAcik(false)} className="mt-3 w-full rounded-2xl bg-white/10 py-3 text-sm font-black text-white/75 hover:bg-white/15">Sonra Bak</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {false && kampanyaAcik && (
        <div className="fixed inset-0 z-[9500] flex items-center justify-center overflow-hidden bg-black/72 p-4 backdrop-blur-[2px]" onClick={() => setKampanyaAcik(false)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,214,102,0.18),transparent_28%),radial-gradient(circle_at_78%_38%,rgba(79,172,254,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)]"></div>
          <div className="relative z-10 w-[min(390px,92vw)] max-h-[calc(100svh-28px)] overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-[#15101f] via-[#1f2144] to-[#0c1327] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.7)] md:hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_24%_24%,rgba(255,246,196,0.24),transparent_26%),radial-gradient(circle_at_76%_30%,rgba(255,64,129,0.2),transparent_24%),radial-gradient(circle_at_30%_86%,rgba(34,211,238,0.16),transparent_30%)]"></div>
            <button onClick={() => setKampanyaAcik(false)} className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/30 text-3xl font-light leading-none text-white shadow-[0_0_18px_rgba(255,255,255,0.2)]">×</button>
            <div className="relative z-10">
              <div className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-300/15 px-3 py-1 text-[11px] font-black uppercase text-cyan-100 shadow">
                Sadece Bugün
              </div>
              <h2 className="mt-4 font-serif text-[40px] font-black leading-[0.92] text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)]">
                Günlük<br />İndirim
              </h2>
              <p className="mt-3 max-w-[260px] text-sm font-bold leading-snug text-sky-100/88">
                100.000 çiplik başlangıç paketi bugün 10 TL.
              </p>

              <div className="relative mx-auto mt-4 h-40 w-full max-w-[310px]">
                <div className="absolute left-1/2 top-10 h-24 w-44 -translate-x-1/2 rotate-[-7deg] rounded-[24px] bg-gradient-to-br from-blue-300 via-blue-500 to-indigo-800 shadow-[0_22px_42px_rgba(0,0,0,0.48)]">
                  <div className="absolute inset-x-0 top-0 h-9 rounded-t-[24px] bg-gradient-to-br from-sky-200 via-blue-400 to-indigo-500"></div>
                  <div className="absolute left-1/2 top-0 h-full w-6 -translate-x-1/2 bg-gradient-to-b from-fuchsia-200 via-pink-400 to-purple-700"></div>
                  <div className="absolute -left-5 top-12 h-9 w-[215px] rounded-[16px] bg-gradient-to-r from-sky-200 via-blue-500 to-indigo-900 shadow-lg"></div>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute flex h-8 w-8 items-center justify-center rounded-full border border-yellow-100 bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500 text-[10px] font-black text-yellow-900 shadow"
                      style={{
                        left: `${12 + (i % 6) * 25}px`,
                        top: `${-22 + Math.floor(i / 6) * 26 + (i % 2) * 5}px`,
                        transform: `rotate(${(i % 5) * 10 - 18}deg)`,
                        zIndex: 8 + i,
                      }}
                    >
                      101
                    </span>
                  ))}
                </div>
                <div className="absolute right-3 top-3 rotate-[8deg] rounded-2xl bg-pink-500 px-4 py-1.5 text-lg font-black text-white shadow-lg">%50</div>
                <div className="absolute bottom-2 left-3 rounded-2xl border border-yellow-100/70 bg-white/90 px-4 py-3 text-center text-amber-900 shadow-xl">
                  <div className="text-2xl font-black">100.000</div>
                  <div className="text-xs font-black">Çip</div>
                </div>
                <div className="absolute bottom-1 right-4 rotate-[-5deg] rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-400 px-5 py-3 text-center text-emerald-950 shadow-xl">
                  <div className="text-[10px] font-black line-through opacity-60">19,99 TL</div>
                  <div className="text-2xl font-black">10 TL</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-white/85">
                <div className="rounded-2xl bg-white/10 px-3 py-3"><div className="text-white/55">Paket</div><div className="mt-1 flex items-center gap-1.5 text-yellow-200"><CipSimgesi boyut="xs" /> 100.000 Çip</div></div>
                <div className="rounded-2xl bg-white/10 px-3 py-3"><div className="text-white/55">Hak</div><div className="mt-1 text-cyan-100">Günde 1 kez</div></div>
              </div>
              <button onClick={kampanyaCipSatinAl} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-500 py-3.5 text-lg font-black text-white shadow-[0_16px_28px_rgba(249,115,22,0.35)] active:scale-95">
                10 TL ile Al
              </button>
              <button onClick={() => setKampanyaAcik(false)} className="mt-2 w-full rounded-2xl bg-white/10 py-3 text-xs font-black text-white/75">Sonra Bak</button>
            </div>
          </div>

          <div className="relative hidden h-[min(640px,88vh)] w-[min(1180px,96vw)] overflow-hidden rounded-[34px] border border-white/20 bg-gradient-to-br from-[#15101f] via-[#1f2144] to-[#0c1327] shadow-[0_40px_100px_rgba(0,0,0,0.7)] md:block" onClick={(e)=>e.stopPropagation()}>
            <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_42%_42%,rgba(255,246,196,0.22),transparent_26%),radial-gradient(circle_at_68%_22%,rgba(255,64,129,0.18),transparent_20%),radial-gradient(circle_at_22%_75%,rgba(34,211,238,0.14),transparent_28%)]"></div>
            <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl"></div>
            <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"></div>
            <button onClick={() => setKampanyaAcik(false)} className="absolute right-8 top-7 z-20 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/50 bg-black/30 text-5xl font-light leading-none text-white shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:bg-white/15">×</button>

            <div className="relative z-10 grid h-full grid-cols-[0.92fr_1.25fr_0.78fr] items-center gap-3 px-12 py-10">
              <div className="self-start pt-8">
                <div className="inline-flex rounded-full border border-cyan-200/40 bg-cyan-300/15 px-4 py-1.5 text-xs font-black uppercase text-cyan-100 shadow">
                  Sadece Bugün
                </div>
                <h2 className="mt-5 font-serif text-[clamp(42px,5vw,78px)] font-black leading-[0.95] text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)]">
                  Günlük<br />İndirim Paketi
                </h2>
                <p className="mt-5 max-w-sm text-xl font-bold leading-snug text-sky-100/90">
                  Her gün yenilenen özel teklif. Başlangıç için yüksek çip, düşük fiyat.
                </p>
                <div className="mt-7 flex items-center gap-3 text-sm font-black text-white/75">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><CipSimgesi boyut="sm" /> 100.000 Çip</span>
                  <span className="rounded-full bg-white/10 px-3 py-2">Günde 1 kez</span>
                </div>
              </div>

              <div className="relative flex h-full items-center justify-center">
                <div className="absolute top-14 rounded-full bg-pink-500 px-5 py-2 text-2xl font-black text-white shadow-[0_12px_28px_rgba(236,72,153,0.45)] rotate-[-8deg]">%50</div>
                <div className="relative h-[390px] w-[520px] max-w-full">
                  <div className="absolute left-10 top-32 h-40 w-[410px] rotate-[-8deg] rounded-[32px] bg-gradient-to-br from-pink-300 via-fuchsia-400 to-purple-800 shadow-[0_28px_60px_rgba(0,0,0,0.5)]"></div>
                  <div className="absolute left-72 top-52 h-24 w-44 rotate-[12deg] rounded-[18px] bg-gradient-to-br from-emerald-300 to-teal-500 shadow-2xl"></div>
                  <div className="absolute left-80 top-[228px] rotate-[12deg] text-center text-white drop-shadow">
                    <div className="text-xs font-black line-through opacity-70">19,99 TL</div>
                    <div className="text-4xl font-black">10 TL</div>
                  </div>
                  <button onClick={kampanyaCipSatinAl} className="absolute left-[300px] top-[286px] z-20 rotate-[12deg] rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-400 px-8 py-3 text-xl font-black text-emerald-950 shadow-[0_14px_24px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95">
                    Hemen Al
                  </button>

                  <div className="absolute left-[72px] top-[95px] h-56 w-[310px] rotate-[-6deg] rounded-[30px] bg-gradient-to-br from-blue-300 via-blue-500 to-indigo-800 shadow-[0_35px_70px_rgba(0,0,0,0.6)]">
                    <div className="absolute inset-x-0 top-0 h-20 rounded-t-[30px] bg-gradient-to-br from-sky-200 via-blue-400 to-indigo-500"></div>
                    <div className="absolute left-1/2 top-0 h-full w-10 -translate-x-1/2 bg-gradient-to-b from-fuchsia-200 via-pink-400 to-purple-700"></div>
                    <div className="absolute -left-8 top-28 h-20 w-[370px] rounded-[24px] bg-gradient-to-r from-sky-200 via-blue-500 to-indigo-900 shadow-xl"></div>
                    <div className="absolute left-5 top-4 text-5xl opacity-30">✦ ✦ ✦</div>
                    {Array.from({ length: 22 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow-100 bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500 text-xl font-black text-yellow-900 shadow-[0_7px_12px_rgba(0,0,0,0.25)]"
                        style={{
                          left: `${38 + (i % 8) * 29 + (i % 3) * 7}px`,
                          top: `${-28 + Math.floor(i / 8) * 35 + (i % 2) * 8}px`,
                          transform: `rotate(${(i % 5) * 11 - 18}deg)`,
                          zIndex: 8 + i,
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <div className="absolute right-10 top-[336px] rotate-[14deg] rounded-[22px] border-4 border-yellow-100 bg-gradient-to-r from-yellow-50 to-amber-200 px-7 py-5 text-center text-amber-900 shadow-2xl">
                    <div className="text-4xl font-black">100.000</div>
                    <div className="text-lg font-black">Çip</div>
                  </div>
                </div>
              </div>

              <div className="self-end pb-8">
                <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
                  <div className="text-sm font-black uppercase text-yellow-200">Paket İçeriği</div>
                  <div className="mt-3 space-y-2 text-sm font-bold text-white/85">
                    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"><span>Çip</span><span className="text-yellow-200">100.000</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"><span>Fiyat</span><span className="text-emerald-200">10 TL</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"><span>Hak</span><span>Günde 1</span></div>
                  </div>
                  <button onClick={kampanyaCipSatinAl} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-500 py-4 text-xl font-black text-white shadow-[0_18px_30px_rgba(249,115,22,0.35)] hover:brightness-110 active:scale-95">
                    10 TL ile Al
                  </button>
                  <button onClick={() => setKampanyaAcik(false)} className="mt-3 w-full rounded-2xl bg-white/10 py-3 text-sm font-black text-white/75 hover:bg-white/15">Sonra Bak</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bekleyenOdeme && (
        <div className="fixed inset-0 z-[9600] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBekleyenOdeme(null)}>
          <div className="w-[620px] max-w-[95vw] max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-b from-white via-sky-50 to-blue-100 border-4 border-sky-200 shadow-[0_0_70px_rgba(56,189,248,0.45)] text-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide opacity-80">{odemeAdimi === "bilgi" ? "Güvenli Ödeme" : "Doğrulama"}</div>
                <div className="text-xl font-black">{bekleyenOdeme.baslik}</div>
              </div>
              <button onClick={() => setBekleyenOdeme(null)} className="w-9 h-9 rounded-full bg-white/25 text-2xl leading-none hover:bg-white/40">×</button>
            </div>
            <div className="max-h-[calc(92vh-76px)] overflow-y-auto p-5">
              <div className="rounded-2xl bg-white border border-sky-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-blue-700">{bekleyenOdeme.aciklama}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">{odemePlatformuYazi()} üzerinden ödeme</div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 px-4 py-2 text-xl font-black text-white shadow">{bekleyenOdeme.fiyat}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Ödeme yöntemi</div>
                <div className="grid grid-cols-2 gap-2">
                  {odemeYontemleriGetir().map((yontem) => (
                    <button
                      key={yontem}
                      onClick={() => odemeYontemiSec(yontem)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${seciliOdemeYontemi === yontem ? "bg-blue-600 text-white border-blue-400 shadow-lg ring-2 ring-blue-200" : "bg-white text-blue-800 border-sky-200 hover:bg-sky-50"}`}
                    >
                      {yontem}
                    </button>
                  ))}
                </div>
              </div>

              {odemeAdimi === "bilgi" ? (
                <div className="mt-4 rounded-3xl border border-sky-200 bg-white/85 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-800">{seciliYontemMobilMi ? "Mobil ödeme bilgileri" : "Kart bilgileri"}</div>
                      <div className="text-[11px] font-bold text-slate-500">Bilgiler satın alma tamamlanınca saklanmaz.</div>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">3D doğrulama</div>
                  </div>

                  {!seciliYontemMobilMi && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="col-span-2 text-xs font-black text-slate-600">
                        Kart üzerindeki ad soyad
                        <input value={kartFormu.adSoyad} onChange={(e) => setKartFormu((onceki) => ({ ...onceki, adSoyad: e.target.value }))} className="mt-1 w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" placeholder="Ad Soyad" />
                      </label>
                      <label className="col-span-2 text-xs font-black text-slate-600">
                        Kart numarası
                        <input value={kartFormu.kartNo} onChange={(e) => setKartFormu((onceki) => ({ ...onceki, kartNo: kartNumarasiFormatla(e.target.value) }))} className="mt-1 w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" />
                      </label>
                      <label className="text-xs font-black text-slate-600">
                        Son kullanma
                        <input value={kartFormu.sonKullanma} onChange={(e) => setKartFormu((onceki) => ({ ...onceki, sonKullanma: sonKullanmaFormatla(e.target.value) }))} className="mt-1 w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" placeholder="AA/YY" inputMode="numeric" autoComplete="cc-exp" />
                      </label>
                      <label className="text-xs font-black text-slate-600">
                        CVV
                        <input value={kartFormu.cvv} onChange={(e) => setKartFormu((onceki) => ({ ...onceki, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))} className="mt-1 w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                      </label>
                    </div>
                  )}

                  <label className="mt-3 block text-xs font-black text-slate-600">
                    Doğrulama kodu gönderilecek telefon
                    <input value={kartFormu.telefon} onChange={(e) => setKartFormu((onceki) => ({ ...onceki, telefon: e.target.value.replace(/[^\d+]/g, "").slice(0, 14) }))} className="mt-1 w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" placeholder="05xxxxxxxxx" inputMode="tel" autoComplete="tel" />
                  </label>
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                  <div className="text-sm font-black text-emerald-800">Doğrulama kodu gönderildi</div>
                  <div className="mt-1 text-xs font-bold text-emerald-700">Telefonuna gelen 6 haneli kodu gir. Test ekranında kod bildirim olarak gösterilir.</div>
                  <input value={odemeKodGirisi} onChange={(e) => setOdemeKodGirisi(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-3 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.4em] text-slate-900 outline-none focus:border-emerald-500" placeholder="000000" inputMode="numeric" />
                  <button onClick={dogrulamaKoduGonder} className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-black text-emerald-700 border border-emerald-200 hover:bg-emerald-100">Kodu tekrar gönder</button>
                </div>
              )}

              {odemeHatasi && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{odemeHatasi}</div>
              )}

              <div className="mt-5 flex gap-3">
                <button disabled={odemeIsleniyor} onClick={() => setBekleyenOdeme(null)} className="flex-1 rounded-2xl bg-slate-200 text-slate-700 py-3 font-black disabled:opacity-50">Vazgeç</button>
                <button disabled={odemeIsleniyor} onClick={odemeOnayla} className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 font-black shadow hover:brightness-110 active:scale-95 disabled:opacity-60">
                  {odemeIsleniyor ? "İşlem Tamamlanıyor" : odemeAdimi === "bilgi" ? "Doğrulama Kodu Gönder" : "Onayla ve Satın Al"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gunlukGirisAcik && (
        <div className="fixed inset-0 z-[9550] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="weekly-reward-modal w-[1120px] max-w-[96vw] rounded-[34px] overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-950 border-4 border-white/20 shadow-[0_0_90px_rgba(129,140,248,0.5)] text-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="relative min-h-24 bg-gradient-to-r from-indigo-700 via-fuchsia-600 to-amber-400 flex items-center justify-between px-7 text-white overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_35%,white,transparent_18%),radial-gradient(circle_at_72%_25%,white,transparent_14%)]"></div>
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 border border-white/40 text-3xl font-black shadow-inner">7</div>
                <div>
                  <div className="text-4xl font-black drop-shadow-[0_3px_0_rgba(31,41,55,0.35)]">Haftalık Giriş Ödülleri</div>
                  <div className="text-xs font-black opacity-85">Her gün giriş yap, sıradaki ödülü al.</div>
                </div>
              </div>
              <button onClick={() => setGunlukGirisAcik(false)} className="relative z-10 w-11 h-11 rounded-full bg-white/25 hover:bg-white/40 text-4xl leading-none">×</button>
            </div>

            <div className="relative p-6">
              <div className="weekly-reward-grid grid grid-cols-7 gap-3">
                {haftalikOduller.map((odul) => {
                  const bugun = odul.gun === mevcutGirisGunu;
                  const alindi = gunlukOdulAlindi ? odul.gun <= mevcutGirisGunu : odul.gun < mevcutGirisGunu;
                  const kilitli = !alindi && !bugun;
                  return (
                    <button
                      key={odul.gun}
                      type="button"
                      disabled={!bugun || gunlukOdulAlindi}
                      onClick={bugun && !gunlukOdulAlindi ? gunlukOdulAl : undefined}
                      className={`relative flex min-h-[336px] flex-col overflow-hidden rounded-[26px] border-2 p-3 text-center shadow-xl transition-all ${
                        alindi
                          ? "border-indigo-300 bg-gradient-to-b from-violet-100 via-indigo-100 to-white"
                          : bugun
                            ? "border-yellow-300 bg-gradient-to-b from-yellow-100 via-amber-200 to-orange-300 shadow-[0_0_30px_rgba(250,204,21,0.7)] hover:scale-[1.02]"
                            : "border-white/20 bg-gradient-to-b from-slate-200/90 via-indigo-100/90 to-violet-100/90 opacity-85"
                      }`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.9),transparent_22%),radial-gradient(circle_at_50%_88%,rgba(99,102,241,0.18),transparent_28%)]"></div>
                      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/35"></div>
                      <div className="absolute -left-8 bottom-8 h-20 w-20 rounded-full bg-fuchsia-300/20"></div>
                      <div className={`relative z-10 h-12 text-left text-4xl font-black tracking-tight ${alindi ? "text-indigo-700" : bugun ? "text-orange-700" : "text-slate-500"}`}>
                        {String(odul.gun).padStart(2, "0")}
                        <span className="ml-1 align-middle text-sm uppercase tracking-normal text-slate-600">Gün</span>
                      </div>

                      <div className="relative z-10 mt-4 flex h-32 items-center justify-center rounded-[28px] bg-white/75 border border-white shadow-inner">
                        <HaftalikOdulGorseli tur={odul.tur} />
                      </div>

                      <div className="relative z-10 mt-4 h-16">
                        <div className={`text-3xl font-black leading-8 ${odul.tur === "cip" ? "text-amber-700" : "text-cyan-700"}`}>{odul.yazi}</div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{odul.tur === "cip" ? "Çip" : "Elmas"}</div>
                      </div>

                      <div className="relative z-10 mt-auto flex h-14 items-center justify-center">
                        {alindi && (
                          <div className="-rotate-6 rounded-full border-2 border-indigo-400/60 bg-white/85 px-4 py-2 text-xs font-black uppercase text-indigo-600 shadow">
                            Ödül Alındı
                          </div>
                        )}

                        {bugun && !gunlukOdulAlindi && (
                          <div className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-3 py-3 text-sm font-black text-white shadow-lg">
                            Ödülü Al
                          </div>
                        )}

                        {kilitli && (
                          <div className="w-full rounded-2xl bg-white/60 px-3 py-3 text-xs font-black text-slate-500">
                            {odul.gun === mevcutGirisGunu + 1 || (mevcutGirisGunu === 7 && odul.gun === 1) ? "Sıradaki ödül" : "Sonraki gün"}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-6 h-11">
                <div className="absolute left-10 right-10 top-5 h-2 rounded-full bg-lime-300/75 shadow-[0_0_22px_rgba(190,242,100,0.9)]"></div>
                <div className="relative grid grid-cols-7">
                  {haftalikOduller.map((odul) => {
                    const alindi = gunlukOdulAlindi ? odul.gun <= mevcutGirisGunu : odul.gun < mevcutGirisGunu;
                    const bugun = odul.gun === mevcutGirisGunu;
                    return (
                      <div key={odul.gun} className="flex justify-center">
                        <div className={`h-11 w-11 rounded-full border-2 shadow-lg ${alindi ? "border-lime-200 bg-gradient-to-b from-lime-200 to-emerald-400" : bugun ? "border-yellow-200 bg-gradient-to-b from-yellow-200 to-orange-400" : "border-white/30 bg-indigo-800"}`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {sonucPaneli && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-[min(980px,94vw)] overflow-hidden rounded-[34px] border-2 border-yellow-300/70 bg-gradient-to-b from-orange-200/95 via-amber-100/95 to-black/80 shadow-[0_0_60px_rgba(255,183,77,0.55)]">
            <button onClick={() => setSonucPaneli(null)} className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-white/25 border border-white/40 text-white font-black hover:bg-white/40">×</button>
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.9),transparent_28%),radial-gradient(circle_at_20%_40%,rgba(255,114,114,.45),transparent_22%),radial-gradient(circle_at_80%_45%,rgba(255,193,7,.45),transparent_24%)]"></div>
            <div className="relative px-8 pt-8 pb-7">
              <div className="text-center text-6xl md:text-7xl font-black italic text-white drop-shadow-[0_5px_0_rgba(150,30,20,.65)]">
                {sonucPaneli.berabere ? 'Kimse Açamadı' : sonucPaneli.kazandi ? 'Galibiyet' : 'Mağlubiyet'}
              </div>
              <div className="mt-6 grid md:grid-cols-[260px_1fr] gap-7 items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-56 h-56 rounded-full bg-gradient-to-br ${aktifOyunRutbesi.renk} border-[8px] border-white/55 shadow-[0_0_45px_rgba(255,215,0,.7)] flex flex-col items-center justify-center text-white`}>
                    <div className="text-7xl">{aktifOyunRutbesi.ikon}</div>
                    <div className="mt-2 text-2xl font-black">{aktifOyunRutbesi.ad}</div>
                    <div className="mt-1 text-sm font-black bg-black/25 px-3 py-1 rounded-full">%{oyunRutbeYuzdesi}</div>
                    <div className="mt-2 w-40 h-3 rounded-full bg-black/25 overflow-hidden border border-white/20"><div className="h-full bg-gradient-to-r from-cyan-300 to-yellow-300" style={{width: `${oyunRutbeYuzdesi}%`}}></div></div>
                    <div className="mt-2 text-[11px] font-black bg-black/20 px-3 py-1 rounded-xl">{oyunSayisi}/{siradakiOyunRutbesi.minOyun} oyun · {oyunRutbePuani}/{siradakiOyunRutbesi.minPuan} puan</div>
                  </div>
                  <div className="mt-4 text-center text-white font-black bg-black/35 px-5 py-2 rounded-2xl border border-white/20">{sonucPaneli.tur} sonucu</div>
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-2xl bg-white/45 border border-white/50 p-4 text-center text-orange-900 font-black">
                      <div className="text-sm opacity-80">Puan</div>
                      <div className="text-4xl">{sonucPaneli.puan > 0 ? '+' : ''}{sonucPaneli.puan}</div>
                    </div>
                    <div className="rounded-2xl bg-white/45 border border-white/50 p-4 text-center text-orange-900 font-black">
                      <div className="text-sm opacity-80">Çip</div>
                      <div className="flex items-center justify-center gap-2 text-4xl"><CipSimgesi boyut="lg" /> {sonucPaneli.cip.toLocaleString()}</div>
                      {sonucPaneli.berabere && <div className="text-xs mt-1">Giriş iade</div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div onClick={() => { setSonucPaneli(null); oyunProfiliniAc(0); }} className="flex items-center rounded-2xl bg-yellow-400/25 border border-yellow-200/50 px-4 py-3 text-white font-black cursor-pointer hover:bg-yellow-300/35 transition-all">
                      <div className="w-12 h-12 rounded-full bg-white/30 border border-white/40 flex items-center justify-center mr-3">🦅</div>
                      <div className="flex-1">{isim || 'Süleyman'}</div>
                      <div className="w-16 text-center">{sonucPaneli.puan}</div>
                      <div className="w-32 text-right text-yellow-200 inline-flex items-center justify-end gap-1.5"><CipSimgesi boyut="sm" /> {sonucPaneli.cip.toLocaleString()}</div>
                    </div>
                    {sonucPaneli.rakipler.map((r, i) => (
                      <div key={r.isim} onClick={() => { setSonucPaneli(null); oyunProfiliniAc(i + 1); }} className="flex items-center rounded-2xl bg-black/18 border border-white/15 px-4 py-3 text-white/90 font-bold cursor-pointer hover:bg-white/15 transition-all">
                        <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center mr-3">{i+2}</div>
                        <div className="flex-1">{r.isim}</div>
                        <button onClick={(e) => e.stopPropagation()} className="mr-4 rounded-lg bg-white/25 px-3 py-1 text-xs hover:bg-white/35">☆ Takip et</button>
                        <div className="w-16 text-center">{r.puan}</div>
                        <div className="w-32 text-right text-yellow-100 inline-flex items-center justify-end gap-1.5"><CipSimgesi boyut="sm" /> {r.cip.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center gap-5">
                    <button onClick={() => setSonucPaneli(null)} className="rounded-full bg-cyan-400 text-white font-black px-8 py-3 shadow-lg hover:brightness-110">Daha çok oyun</button>
                    <button onClick={() => { setSonucPaneli(null); if (sonucPaneli.tur === 'Okey') setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); if (sonucPaneli.tur === 'Pişti') setPistiDurum(yeniPistiOyunu()); if (sonucPaneli.tur === 'Tavla') setTavlaDurum(yeniTavlaOyunu()); }} className="rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 text-red-800 font-black px-8 py-3 shadow-lg hover:brightness-110">Bir el daha oyna</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ======================================================== */}
      {/* ARKA PLAN VE CSS ANİMASYONLARI                           */}
      {/* ======================================================== */}
      
      {/* Daha sade ve sıcak lounge arka planı: büyük pencereler, altın kolonlar ve salon zemini hissi */}
      <div className="absolute inset-0 z-[-4] bg-[linear-gradient(180deg,#bfe5ff_0%,#fff1c9_34%,#f5c36d_58%,#7b4a22_100%)]"></div>
      <div className="absolute inset-x-0 top-0 h-[58%] z-[-3] bg-[radial-gradient(circle_at_20%_22%,rgba(255,255,255,0.95),transparent_16%),radial-gradient(circle_at_48%_16%,rgba(255,245,210,0.9),transparent_20%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.75),transparent_18%)]"></div>
      <div className="absolute left-[9%] top-[6%] h-[76%] w-5 z-[-2] rounded-full bg-gradient-to-r from-yellow-900 via-yellow-200 to-yellow-800 shadow-[0_0_18px_rgba(255,224,145,0.65)]"></div>
      <div className="absolute left-[30%] top-[4%] h-[78%] w-4 z-[-2] rounded-full bg-gradient-to-r from-yellow-900 via-yellow-200 to-yellow-800 shadow-[0_0_18px_rgba(255,224,145,0.55)]"></div>
      <div className="absolute right-[22%] top-[4%] h-[78%] w-4 z-[-2] rounded-full bg-gradient-to-r from-yellow-900 via-yellow-200 to-yellow-800 shadow-[0_0_18px_rgba(255,224,145,0.55)]"></div>
      <div className="absolute inset-x-0 bottom-0 h-[34%] z-[-2] bg-[linear-gradient(135deg,rgba(255,255,255,0.72)_0_10%,rgba(190,142,74,0.35)_10%_12%,transparent_12%_22%),linear-gradient(45deg,rgba(255,255,255,0.38)_0_10%,rgba(126,82,35,0.28)_10%_12%,transparent_12%_22%)] bg-[length:150px_150px]"></div>
      <div className="absolute inset-0 z-[-1] bg-gradient-to-r from-black/20 via-white/5 to-black/18"></div>

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
      <div className="lounge-topbar flex justify-between items-center bg-black/40 backdrop-blur-md p-2 px-4 rounded-xl border border-white/10 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setProfilModalAcik(true)} className={`w-14 h-14 rounded-full flex items-center justify-center font-bold bg-slate-800 relative overflow-visible hover:scale-105 transition-transform ${aktifProfilDekoru?.cerceve || cerceveRengiGetir(vipSeviyesi)}`}>
            {profilAvatar.startsWith('data:') ? (
              <img src={profilAvatar} alt="profil" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-2xl">{profilAvatar}</span>
            )}
            {aktifProfilDekoru && <span className="pointer-events-none absolute -right-2 -top-2 text-xl drop-shadow">{aktifProfilDekoru.ikon}</span>}
            {vipSeviyesi > 0 && (
              <span className="absolute -top-2 -right-5 px-2 py-1 rounded-tl-xl rounded-br-xl bg-gradient-to-b from-red-500 via-orange-500 to-yellow-400 text-white text-[10px] font-black border-2 border-yellow-200 shadow-[0_0_12px_rgba(251,191,36,0.75)] rotate-[-5deg]">👑 VIP{vipSeviyesi}</span>
            )}
          </button>
          <div>
            <div className="font-bold text-sm flex items-center gap-1.5 drop-shadow-md">{isim} {vipSeviyesi > 0 && <span>{tacEmojisiGetir(vipSeviyesi)}</span>}</div>
            <div className="flex items-center gap-2 text-xs mt-0.5">
              <button onClick={() => { setMagazaAktifSekme('çipler'); setVipMarketAcik(true); setCantaAcik(false); setArkadaslarAcik(false); setGelenKutusuAcik(false); }} className="inline-flex items-center gap-1.5 text-yellow-400 font-bold bg-black/50 px-2 py-0.5 rounded border border-yellow-600/50 shadow-sm hover:bg-yellow-950/70"><CipSimgesi boyut="xs" /> {bakiyeCip.toLocaleString()}</button>
              <button onClick={elmasDonustur} title="50.000 çip = 1 elmas" className="inline-flex items-center gap-1.5 text-cyan-300 font-bold bg-black/50 px-2 py-0.5 rounded border border-cyan-600/50 shadow-sm hover:bg-cyan-950/70"><ElmasSimgesi boyut="xs" /> {bakiyeElmas.toFixed(1)}</button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button
            onClick={() => {
              setKampanyaAcik(true);
              setVipMarketAcik(false);
              setCantaAcik(false);
              setArkadaslarAcik(false);
              setBegeniPaneliAcik(false);
              setHediyeCipPanelAcik(false);
              setSiralamaAcik(false);
            }}
            className="discount-top-button relative overflow-hidden rounded-xl border border-cyan-200/50 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(236,72,153,0.35)] hover:brightness-110 active:scale-95"
          >
            <span className="absolute right-1 top-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black leading-none">%{gunlukIndirimPaketi.indirimOrani}</span>
            <span className="relative pr-6">Günün Teklifi</span>
          </button>
          <button onClick={() => { setGunlukGirisAcik(true); setVipMarketAcik(false); setCantaAcik(false); setArkadaslarAcik(false); setBegeniPaneliAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-gradient-to-r from-red-600 to-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-500 hover:brightness-110 shadow-md">📅 Ödüller</button>
          <button onClick={toggleGelenKutusu} className="bg-black/40 border border-white/10 hover:bg-black/60 p-2 rounded-lg relative text-xs cursor-pointer shadow-md">
            ✉️ {mesajlar.filter(m=>!m.alindi).length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>}
          </button>
          <button onClick={() => setAyarlarAcik(!ayarlarAcik)} className="bg-black/40 border border-white/10 hover:bg-black/60 p-2 rounded-lg text-xs shadow-md">⚙️</button>
        </div>
      </div>

      {/* KENDİ PROFİL PANELİ — profil, gönderiler, başarılar ve düzenleme ekranları */}
      {profilModalAcik && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/65 backdrop-blur-sm" onClick={() => { setProfilModalAcik(false); setAvatarSecimAcik(false); setProfilDuzenleme(null); }}>
          <div className="profile-modal w-[960px] max-w-[95vw] max-h-[92vh] rounded-[24px] overflow-hidden bg-gradient-to-b from-blue-50 via-white to-sky-100 border-4 border-sky-200 shadow-[0_0_80px_rgba(96,165,250,0.65)] relative" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 bg-gradient-to-r from-sky-400 via-blue-300 to-sky-300 flex items-center text-white font-black text-2xl relative">
              <button onClick={() => setProfilSekme('profil')} className={`px-10 h-full flex items-center gap-2 rounded-br-[26px] transition ${profilSekme === 'profil' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg' : 'text-blue-900/70 hover:bg-white/20'}`}>👤 Profil</button>
              <button onClick={() => setProfilSekme('gonderiler')} className={`px-10 h-full flex items-center gap-2 transition ${profilSekme === 'gonderiler' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg rounded-b-[22px]' : 'text-blue-900/70 hover:bg-white/20'}`}>▦ Gönderiler</button>
              <button onClick={() => setProfilSekme('basarilar')} className={`px-10 h-full flex items-center gap-2 transition ${profilSekme === 'basarilar' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg rounded-b-[22px]' : 'text-blue-900/70 hover:bg-white/20'}`}>🏅 Başarılarım</button>
              <button onClick={() => { setProfilModalAcik(false); setAvatarSecimAcik(false); setProfilDuzenleme(null); }} className="absolute right-4 top-3 w-11 h-11 rounded-full bg-white/35 hover:bg-white/55 text-white text-4xl leading-none border border-white/50">×</button>
            </div>

            {profilSekme === 'profil' && (
              <div className="p-6 grid grid-cols-[240px_1fr] gap-7">
                <div className="flex flex-col items-center relative">
                  <div className="absolute -left-8 top-6 h-52 w-10 rounded-full bg-gradient-to-b from-yellow-200 via-white to-slate-300 border border-white/70 shadow-xl flex items-center justify-center text-3xl rotate-[-8deg]">🎣</div>
                  <div className={`relative w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center overflow-visible ${aktifProfilDekoru?.cerceve || ""}`}>
                    {aktifProfilDekoru && <span className="pointer-events-none absolute -right-3 -top-3 z-20 text-4xl drop-shadow">{aktifProfilDekoru.ikon}</span>}
                    {profilAvatar.startsWith('data:') ? <img src={profilAvatar} alt="profil" className="w-full h-full object-cover" /> : <span className="text-6xl">{profilAvatar}</span>}
                    {vipSeviyesi > 0 && <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-red-500 to-yellow-400 text-white text-xs font-black px-2 py-1 rounded-tl-xl border border-yellow-100">VIP{vipSeviyesi}</div>}
                  </div>
                  <button onClick={() => setProfilDuzenleme('avatar')} className="mt-4 rounded-xl bg-gradient-to-b from-sky-300 to-blue-500 text-white font-black px-8 py-2 shadow-lg hover:brightness-110">Değiştir</button>
                </div>

                <div>
                  <div className="text-blue-700 font-black text-sm mb-3 flex items-center gap-2">ID: 96798511 <button onClick={() => idKopyala('96798511')} className="rounded-md bg-sky-100 border border-sky-200 px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-sky-200" title="ID kopyala">📋</button></div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><span className="text-2xl">{profilCinsiyet === 'Erkek' ? '♂️' : '♀️'}</span><span className="font-black text-blue-800">{isim || profilIsimTaslak}</span><button onClick={() => { setProfilIsimTaslak(isim || profilIsimTaslak); setProfilDuzenleme('isim'); }} className="ml-auto rounded-lg bg-white/70 px-2 py-1 text-sky-600 font-black">✎</button></div>
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><CipSimgesi boyut="md" /><span className="font-black text-blue-800">{bakiyeCip.toLocaleString()}</span><button onClick={() => { setProfilModalAcik(false); setMagazaAktifSekme('çipler'); setVipMarketAcik(true); setCantaAcik(false); setArkadaslarAcik(false); setGelenKutusuAcik(false); }} className="ml-auto rounded-lg bg-white/70 px-2 py-1 text-sky-600 font-black hover:bg-yellow-100">＋</button></div>
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><span className="text-2xl">📍</span><span className="font-black text-blue-800">{profilKonumGizlilik === 'Sadece ben' ? 'Gizli' : profilSehir}</span><button onClick={() => setProfilDuzenleme('konum')} className="ml-auto rounded-lg bg-white/70 px-2 py-1 text-sky-600 font-black">✎</button></div>
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><ElmasSimgesi boyut="md" /><span className="font-black text-blue-800">{bakiyeElmas.toFixed(1)}</span><button onClick={elmasDonustur} title="50.000 çip = 1 elmas" className="ml-auto rounded-lg bg-white/70 px-2 py-1 text-sky-600 font-black hover:bg-cyan-100">＋</button></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Oynanan oyun</div><div className="text-2xl text-blue-800 font-black">1465</div></div>
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Galibiyet yüzdesi</div><div className="text-2xl text-blue-800 font-black">27.0%</div></div>
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Takipçilerim</div><div className="text-2xl text-blue-800 font-black">1</div></div>
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Konum</div><div className="text-sm text-blue-800 font-black">{profilKonumGizlilik}</div></div>
                  </div>
                  <div className="rounded-3xl bg-blue-100/70 border border-sky-200 h-48 flex flex-col items-center justify-center text-blue-300 font-black text-center">
                    <div className="text-5xl opacity-55">🃏 101</div>
                    <div className="mt-3">Güzel anların ve paylaşımların burada görünür.</div>
                    <button onClick={() => setProfilSekme('gonderiler')} className="mt-4 text-blue-700 underline">Gönderi paylaş</button>
                  </div>
                </div>
              </div>
            )}

            {profilSekme === 'gonderiler' && (
              <div className="p-6 grid grid-cols-[280px_1fr] gap-6">
                <div className="rounded-3xl bg-white/80 border border-sky-200 p-4 shadow-inner">
                  <div className="font-black text-blue-800 mb-3">Yeni gönderi paylaş</div>
                  <textarea value={profilPostMetni} onChange={(e) => setProfilPostMetni(e.target.value)} placeholder="Bir şeyler yaz..." className="w-full h-28 resize-none rounded-2xl bg-sky-50 border border-sky-200 p-3 text-blue-900 font-bold outline-none" />
                  {profilPostGorsel && <img src={profilPostGorsel} alt="gönderi" className="mt-3 w-full h-32 object-cover rounded-2xl border border-sky-200" />}
                  <label className="mt-3 block text-center rounded-xl bg-gradient-to-b from-sky-300 to-blue-500 text-white font-black py-2 cursor-pointer shadow">Fotoğraf ekle
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setProfilPostGorsel(String(reader.result || '')); reader.readAsDataURL(file); }} />
                  </label>
                  <button onClick={() => { if (!profilPostMetni.trim() && !profilPostGorsel) return; setProfilGonderiler(prev => [{id: Date.now(), metin: profilPostMetni || 'Fotoğraf paylaşıldı', gorsel: profilPostGorsel || undefined, tarih: new Date().toLocaleDateString('tr-TR')}, ...prev]); setProfilPostMetni(''); setProfilPostGorsel(null); }} className="mt-3 w-full rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black py-2 shadow">Paylaş</button>
                </div>
                <div className="rounded-3xl bg-blue-100/70 border border-sky-200 p-4 min-h-[430px] overflow-y-auto">
                  {profilGonderiler.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-blue-300 font-black"><div className="text-6xl opacity-40">🃏</div><div className="mt-4">Henüz gönderi paylaşılmadı.</div></div>
                  ) : profilGonderiler.map(g => (
                    <div key={g.id} className="mb-4 rounded-3xl bg-white/90 border border-sky-200 p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-2xl bg-amber-200 flex items-center justify-center overflow-hidden">{profilAvatar.startsWith('data:') ? <img src={profilAvatar} className="w-full h-full object-cover" /> : <span className="text-2xl">{profilAvatar}</span>}</div><div><div className="font-black text-blue-800">{isim || profilIsimTaslak}</div><div className="text-xs text-blue-400 font-bold">{g.tarih}</div></div></div>
                      <div className="font-bold text-blue-900 mb-3">{g.metin}</div>
                      {g.gorsel && <img src={g.gorsel} alt="paylaşım" className="w-full max-h-72 object-cover rounded-2xl border border-sky-200" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profilSekme === 'basarilar' && (
              <div className="p-6 grid grid-cols-[260px_1fr] gap-6">
                <div className="grid grid-cols-2 gap-3 content-start">
                  {profilBasariKategorileri.map((k, i) => (
                    <button key={k} onClick={() => setProfilBasariKategori(k)} className={`h-28 rounded-2xl border shadow-inner flex flex-col items-center justify-center font-black ${profilBasariKategori === k ? 'bg-gradient-to-b from-sky-200 to-blue-300 border-blue-400 text-blue-900' : 'bg-white/65 border-sky-200 text-sky-500'}`}>
                      <div className="text-4xl mb-1">{i === 0 ? '🧊' : i === 1 ? '🏠' : i === 2 ? '🃏' : '🎲'}</div>{k}
                    </button>
                  ))}
                </div>
                <div className="rounded-3xl bg-blue-100/70 border border-sky-200 p-5 min-h-[430px]">
                  <div className="flex items-center gap-4 mb-5"><div className="w-20 h-20 rounded-full bg-amber-200 border-4 border-white shadow flex items-center justify-center overflow-hidden">{profilAvatar.startsWith('data:') ? <img src={profilAvatar} className="w-full h-full object-cover" /> : <span className="text-4xl">{profilAvatar}</span>}</div><div><div className="text-xl font-black text-blue-800">{isim || profilIsimTaslak}</div><div className="text-sm font-bold text-blue-500">{profilBasariKategori} başarı geçmişi</div></div></div>
                  <div className="space-y-2">
                    {(profilBasariKayitlari[profilBasariKategori] || []).map((m, i) => <div key={i} className="rounded-xl bg-white/70 px-4 py-3 text-blue-700 font-bold border border-sky-100">{m}</div>)}
                  </div>
                </div>
              </div>
            )}

            {profilDuzenleme && (
              <div className="absolute inset-0 z-[190] flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                <div className="w-[700px] max-w-[92vw] rounded-[24px] bg-gradient-to-b from-white to-sky-100 border-4 border-sky-200 shadow-[0_0_60px_rgba(255,255,255,0.45)] overflow-hidden">
                  <div className="h-14 bg-gradient-to-r from-blue-400 to-sky-300 text-white font-black text-2xl flex items-center px-8 relative">✨ {profilDuzenleme === 'isim' ? 'Profilini tamamla' : profilDuzenleme === 'konum' ? 'Konum Seçimi' : 'Avatar Değiştir'}<button onClick={() => setProfilDuzenleme(null)} className="absolute right-4 top-2 w-10 h-10 rounded-full bg-white/30 text-white text-3xl leading-none">×</button></div>
                  {profilDuzenleme === 'isim' && <div className="p-8">
                    <div className="font-black text-sky-700 mb-2">İsim</div><input value={profilIsimTaslak} onChange={(e) => setProfilIsimTaslak(e.target.value)} className="w-full rounded-xl bg-blue-100 border border-sky-200 px-4 py-3 text-blue-900 font-black outline-none mb-8" />
                    <div className="font-black text-sky-700 mb-3">Cinsiyet</div><div className="flex w-80 rounded-full overflow-hidden border border-sky-200 mb-10"><button onClick={() => setProfilCinsiyet('Erkek')} className={`flex-1 py-3 font-black text-xl ${profilCinsiyet === 'Erkek' ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-amber-900' : 'bg-sky-300 text-white'}`}>♂ Erkek</button><button onClick={() => setProfilCinsiyet('Kız')} className={`flex-1 py-3 font-black text-xl ${profilCinsiyet === 'Kız' ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-amber-900' : 'bg-sky-300 text-white'}`}>♀ Kız</button></div>
                    <button onClick={() => { setIsim(profilIsimTaslak || isim); localStorage.setItem('oyuncuIsmi', profilIsimTaslak || isim); setProfilDuzenleme(null); }} className="mx-auto block rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black px-16 py-3 shadow">Onayla</button>
                  </div>}
                  {profilDuzenleme === 'konum' && <div className="p-8 text-center">
                    <div className="text-blue-800 font-black text-xl mb-6">Aynı şehirdeki oyuncularla eşleşmek için konumunu seç.</div>
                    <select value={profilUlke} onChange={(e)=>setProfilUlke(e.target.value)} className="w-96 max-w-full rounded-xl bg-blue-100 border border-sky-200 px-4 py-3 text-blue-800 font-black mb-5"><option>Türkiye</option></select>
                    <div className="flex gap-4 justify-center mb-8">
                      <select value={profilBolge} onChange={(e)=>profilBolgeDegistir(e.target.value)} className="w-56 rounded-xl bg-blue-100 border border-sky-200 px-4 py-3 text-blue-800 font-black shadow-inner">
                        {Object.keys(TURKIYE_BOLGELERI).map(bolge => <option key={bolge} value={bolge}>{bolge}</option>)}
                      </select>
                      <select value={profilSehir} onChange={(e)=>setProfilSehir(e.target.value)} className="w-56 rounded-xl bg-blue-100 border border-sky-200 px-4 py-3 text-blue-800 font-black shadow-inner">
                        {(TURKIYE_BOLGELERI[profilBolge] || []).map(sehir => <option key={sehir} value={sehir}>{sehir}</option>)}
                      </select>
                    </div>
                    <div className="font-black text-blue-800 mb-3">Konumunu kimler görebilir:</div><div className="flex justify-center gap-6 mb-8">{(['Herkes','Çevrem','Sadece ben'] as const).map(g => <button key={g} onClick={() => setProfilKonumGizlilik(g)} className={`px-5 py-3 rounded-xl font-black border ${profilKonumGizlilik === g ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white border-sky-200 text-blue-500'}`}>✓ {g}</button>)}</div>
                    <button onClick={() => setProfilDuzenleme(null)} className="rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black px-16 py-3 shadow">Onayla</button><div className="text-sky-600 font-bold text-sm mt-4">Konum değişikliği 4 gün sonra ücretsizdir.</div>
                  </div>}
                  {profilDuzenleme === 'avatar' && <div className="p-6">
                    <div className="grid grid-cols-6 gap-3 mb-5">{profilAvatarSecenekleri.map(a => <button key={a} onClick={() => setProfilAvatar(a)} className={`h-16 rounded-2xl bg-sky-50 border text-3xl hover:scale-105 transition ${profilAvatar === a ? 'border-orange-400 ring-2 ring-orange-300' : 'border-sky-200'}`}>{a}</button>)}</div>
                    <label className="block text-center rounded-xl bg-gradient-to-b from-sky-300 to-blue-500 text-white font-black py-3 cursor-pointer shadow mb-4">Kendi kişisel fotoğrafını yükle<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setProfilAvatar(String(reader.result || '👤')); reader.readAsDataURL(file); }} /></label>
                    <button onClick={() => setProfilDuzenleme(null)} className="mx-auto block rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black px-16 py-3 shadow">Onayla</button>
                  </div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANA OYUN VE DASHBOARD */}
      <div className="lounge-dashboard flex-1 flex justify-between gap-4 my-3 items-center w-full relative h-[85%]">
        
        {/* ======================================================== */}
        {/* SOL: DAR SIRALAMA ŞERİDİ                                 */}
        {/* ======================================================== */}
        <div 
          onClick={toggleSiralamaPanel} 
          className="lounge-rank-strip w-[74px] flex flex-col items-center cursor-pointer transition-all z-10 h-[82%] mt-auto mb-auto bg-black/25 backdrop-blur-[2px] rounded-xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.28)] overflow-hidden py-2"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 w-[88%] py-1.5 rounded-sm text-center shadow-md mb-2 border border-blue-300/50">
            <span className="text-[9px] font-black tracking-wide text-white drop-shadow-md">SIRALAMA</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 w-full mt-1">
            {detayliSiralama.slice(0, 4).map((s) => (
              <div key={s.sira} className="relative group">
                <span className={`absolute -top-1.5 -left-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center border z-20 shadow ${s.sira===1?'bg-yellow-200 border-yellow-500 text-orange-700':s.sira===2?'bg-slate-100 border-slate-400 text-slate-600':s.sira===3?'bg-orange-200 border-orange-500 text-orange-800':'bg-slate-700 border-white/30 text-white'}`}>{s.sira}</span>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-md border-2 relative overflow-hidden bg-slate-800 ${s.sira === 1 ? "border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.75)]" : s.sira === 2 ? "border-slate-200" : s.sira === 3 ? "border-orange-400" : "border-cyan-200/80"}`}>
                  {s.avatar}
                </div>
                {s.sira === 1 && <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs drop-shadow-md z-30">👑</span>}
              </div>
            ))}
          </div>
          
          <div className="mt-auto w-[80%] pt-2 flex flex-col items-center opacity-90 pb-1">
               <div className="w-9 h-9 rounded-full border-2 border-cyan-200/80 bg-white/30 mt-1 flex items-center justify-center text-xs shadow-md">4</div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* ORTA: LOBİ MASKOTU VE OKEY VİTRİNİ — sade, parlak       */}
        {/* ======================================================== */}
        <div className="lounge-hero absolute left-[230px] top-12 bottom-8 w-[360px] z-0 pointer-events-none flex flex-col justify-center items-center">
          <div className="relative w-[300px] h-[470px] rounded-[36px] bg-gradient-to-b from-white/28 via-white/12 to-transparent border border-white/35 shadow-[0_20px_70px_rgba(120,70,20,0.28)] overflow-hidden">
            <div className="absolute inset-x-8 top-6 h-24 rounded-full bg-white/35 blur-2xl"></div>
            <div className="absolute left-1/2 top-10 -translate-x-1/2 text-[82px] drop-shadow-[0_10px_22px_rgba(0,0,0,0.22)]">🃏</div>
            <div className="absolute left-1/2 top-36 -translate-x-1/2 w-[210px] h-[250px] rounded-t-[110px] rounded-b-[34px] bg-gradient-to-b from-red-400 via-red-500 to-rose-700 border-4 border-white/70 shadow-[0_16px_40px_rgba(136,19,55,0.35)] flex items-end justify-center pb-8">
              <div className="absolute -top-12 w-28 h-28 rounded-full bg-gradient-to-b from-amber-100 to-amber-300 border-4 border-white shadow-lg flex items-center justify-center text-5xl">👩🏻</div>
              <div className="text-white text-3xl font-black tracking-widest drop-shadow">101</div>
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-black border-2 border-white/60 shadow-lg">Lounge 101 Club</div>
          </div>
          <div className="mt-4 flex gap-3">
            {[1,0,1].map((n,i)=><div key={i} className="w-14 h-20 rounded-xl bg-white text-blue-700 border-2 border-white shadow-xl flex flex-col items-center justify-center font-black text-3xl">{n}<span className="text-sm text-red-500">♥</span></div>)}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SAĞ: GRID MENÜ MASALARI (CAM EFEKTLİ LÜKS YAPI)          */}
        {/* ======================================================== */}
        <div className="lounge-menu-grid w-[480px] grid grid-cols-3 gap-2.5 content-center z-10 h-full">
          <button onClick={() => setOtomatikOkeyAcik(true)} className="col-span-3 bg-gradient-to-r from-orange-500/90 via-amber-500/90 to-yellow-500/90 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center group border border-yellow-400/50 shadow-xl hover:brightness-110 transition-all">
            <div className="text-left"><span className="text-[10px] block font-black text-orange-950 uppercase tracking-widest">101 OKEY</span><h3 className="text-lg font-black text-white tracking-wide mt-0.5 drop-shadow-md">Otomatik Eşleşme</h3></div>
            <span className="text-4xl drop-shadow-lg">🀄</span>
          </button>
          <button onClick={() => masaAc("Pişti")} className="bg-gradient-to-b from-blue-600/90 to-indigo-900/90 backdrop-blur-sm border border-blue-400/40 p-3 rounded-xl flex flex-col justify-between items-center text-center h-28 shadow-lg hover:brightness-105 active:scale-95 transition-all">
            <span className="text-2xl block drop-shadow-md">🃏</span><span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-md">Pişti</span><span className="text-[8px] text-blue-100 uppercase tracking-widest block bg-blue-950/80 px-1.5 py-0.5 rounded shadow">Hızlı Oyna</span>
          </button>
          <button onClick={() => { setTavlaTakimSecimAcik(true); }} className="bg-gradient-to-b from-emerald-600/90 to-teal-900/90 backdrop-blur-sm border border-emerald-400/40 p-3 rounded-xl flex flex-col justify-between items-center text-center h-28 shadow-lg hover:brightness-105 active:scale-95 transition-all">
            <span className="text-2xl block drop-shadow-md">🎲</span><span className="text-xs font-black uppercase tracking-wider block text-white drop-shadow-md">Tavla</span><span className="text-[8px] text-emerald-100 uppercase tracking-widest block bg-emerald-950/80 px-1.5 py-0.5 rounded shadow">Hızlı Oyna</span>
          </button>
          {/* LİGLER BUTONUNUN OLDUĞU YERİ ŞU ŞEKİLDE GÜNCELLE: */}
<button 
  onClick={() => setOyunSecimAcik(true)} 
  className="bg-gradient-to-b from-purple-600/90 to-purple-950/90 backdrop-blur-sm border border-purple-400/40 p-3 rounded-xl flex flex-col justify-between items-center text-center h-28 shadow-lg hover:brightness-105 active:scale-95 transition-all"
>
  <span className="text-2xl block drop-shadow-md">🎮</span>
  <span className="text-[10px] font-black uppercase tracking-wider block text-white drop-shadow-md">MASA AÇ</span>
  <span className="text-[8px] text-purple-100 uppercase tracking-widest block bg-purple-950/80 px-1.5 py-0.5 rounded shadow">YENİ OYUN</span>
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
            <button onClick={()=>bildirimGoster("Klan", "Klan ekranı hazırlanıyor.", "bilgi")} className="flex-1 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 backdrop-blur-md border border-cyan-500/40 rounded-xl flex flex-col items-center justify-center p-1 text-[11px] font-black uppercase hover:border-cyan-400 transition-all shadow-lg">
              <span className="drop-shadow-md">🏰</span><span className="text-[9px] text-cyan-200 mt-0.5">Klan</span>
            </button>
            <button onClick={()=>bildirimGoster("Çip Diyarı", "Çip diyarı ekranı hazırlanıyor.", "bilgi")} className="flex-1 bg-gradient-to-r from-pink-900/60 to-fuchsia-900/60 backdrop-blur-md border border-pink-500/40 rounded-xl flex flex-col items-center justify-center p-1 text-[11px] font-black uppercase hover:border-pink-400 transition-all shadow-lg">
              <span className="drop-shadow-md">🎰</span><span className="text-[9px] text-pink-200 mt-0.5">Diyar</span>
            </button>
          </div>
        </div>

      </div>

      {/* LOBİ CANLI SOHBET AKIŞI — küçük, kibar ve tıklayınca sohbeti açar */}
      <button onClick={() => setLobiSohbetAcik(true)} className="lounge-chat-preview absolute left-7 bottom-[72px] z-30 w-[230px] text-left group">
        <div className="rounded-md bg-black/42 backdrop-blur-[1px] border-l-2 border-blue-400 px-2.5 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.22)] group-hover:bg-black/56 transition-all">
          {(gonderiler.length ? gonderiler.slice(0, 2) : [
            { id: 991, isim: 'Melis', vip: 0, metin: '[Çıkartmalar]' },
            { id: 992, isim: 'Polat', vip: 0, metin: '[Çıkartmalar]' }
          ]).map((g) => (
            <div key={g.id} className="text-[11px] leading-4 font-black drop-shadow truncate">
              <span className="text-emerald-300">{g.isim}:</span> <span className="text-white/90">{g.metin}</span>
            </div>
          ))}
        </div>
      </button>

      {lobiSohbetAcik && (
        <div className="lounge-chat-modal absolute inset-0 z-[95] bg-black/45 backdrop-blur-sm flex items-center justify-start pl-10" onClick={() => setLobiSohbetAcik(false)}>
          <div className="lounge-chat-card w-[500px] h-[540px] max-h-[86vh] rounded-3xl overflow-hidden bg-gradient-to-b from-blue-300/95 to-sky-100/95 border-2 border-white/70 shadow-[0_22px_70px_rgba(0,0,0,0.35)] flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <div className="h-12 shrink-0 bg-gradient-to-r from-blue-500 to-sky-400 flex items-center justify-between px-5 text-white font-black text-lg">
              <span>💬 Sohbet Odası</span><button onClick={()=>setLobiSohbetAcik(false)} className="w-9 h-9 rounded-full bg-white/25 text-3xl leading-none">×</button>
            </div>
            <div className="flex h-11 shrink-0 bg-blue-400/60 text-white font-black text-sm">
              {[
                { id:'genel', ad:'Genel' }, { id:'sehir', ad:'Şehir' }, { id:'ozel', ad:'Özel' }, { id:'masa', ad:'Masa' }
              ].map((t)=><button key={t.id} onClick={()=>setLobiSohbetSekme(t.id as typeof lobiSohbetSekme)} className={`flex-1 ${lobiSohbetSekme===t.id?'bg-gradient-to-b from-yellow-300 to-orange-400':'hover:bg-white/20'}`}>{t.ad}</button>)}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {(lobiSohbetIcerik[lobiSohbetSekme] || []).map((g,i)=><div key={g.id} className="flex gap-3 items-start">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-blue-300 shadow flex items-center justify-center text-2xl">{i%2?'👩🏻':'👨🏻'}</div>
                <div className="flex-1">
                  <div className="font-black text-blue-800">{g.isim} {g.vip>0 && <span className="text-[10px] bg-amber-400 text-white px-1 rounded">VIP{g.vip}</span>}</div>
                  <div className="inline-block bg-white/85 border border-blue-100 rounded-2xl rounded-tl-sm px-4 py-2 text-blue-900 font-bold shadow-sm">{g.metin}</div>
                </div>
              </div>)}
            </div>
            <div className="h-16 shrink-0 bg-blue-500/70 flex items-center gap-2 px-3">
              <button onClick={()=>bildirimGoster("Sesli mesaj", "Sesli mesaj özelliği hazırlanıyor.", "bilgi")} className="text-2xl">🎙️</button><button onClick={()=>setSohbetSesAcik(v=>!v)} className="text-2xl">{sohbetSesAcik ? '🔊' : '🔇'}</button>
              <input value={mesaj} onChange={(e)=>setMesaj(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && yeniGonderiPaylas()} placeholder="Mesajınızı yazın..." className="flex-1 rounded-xl bg-blue-900/40 text-white placeholder-blue-100 px-3 py-2.5 font-bold outline-none text-sm" />
              <button onClick={yeniGonderiPaylas} className="rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black px-5 py-2.5 shadow">Gönder</button>
            </div>
          </div>
        </div>
      )}

      {/* EN ALT MENÜ BAR PANELİ */}
      <div className="lounge-bottom-nav w-full bg-black/60 backdrop-blur-lg p-2.5 rounded-xl border border-white/10 flex justify-between items-center shadow-2xl z-10">
        <div className="text-[10px] text-gray-400 font-medium tracking-wide drop-shadow">LOUNGE 101 CLUB v2.0</div>
        <div className="flex gap-2">
          <button onClick={() => { setCantaAcik(!cantaAcik); setVipMarketAcik(false); setArkadaslarAcik(false); setBegeniPaneliAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-black/60 border border-white/20 px-4 py-2 rounded-xl text-xs font-black text-gray-200 hover:bg-black/80 transition-all shadow-md">💼 Çanta</button>
          <button onClick={() => { setHediyeCipPanelAcik(!hediyeCipPanelAcik); setVipMarketAcik(false); setCantaAcik(false); setArkadaslarAcik(false); setBegeniPaneliAcik(false); setSiralamaAcik(false); }} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 border border-yellow-400/40 text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:brightness-110"><CipSimgesi boyut="xs" /> Hediye Çip</button>
          <button onClick={() => bildirimGoster("Görevler", "Günlük görevler ekranı hazırlanıyor.", "bilgi")} className="bg-black/60 border border-white/20 px-4 py-2 rounded-xl text-xs font-black text-gray-200 hover:bg-black/80 transition-all shadow-md">📋 Görevler</button>
          <button onClick={() => { setArkadaslarAcik(!arkadaslarAcik); setVipMarketAcik(false); setCantaAcik(false); setBegeniPaneliAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-black text-xs border border-teal-300/40 shadow-lg hover:brightness-110">👥 Arkadaşlarım</button>
          <button onClick={() => { setVipMarketAcik(!vipMarketAcik); setCantaAcik(false); setArkadaslarAcik(false); setBegeniPaneliAcik(false); setHediyeCipPanelAcik(false); setSiralamaAcik(false); }} className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-white px-5 py-2 rounded-xl font-black text-xs border border-white/30 shadow-lg hover:brightness-110">🛒 Mağaza</button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: LÜKS BEYAZ/MAVİ TAM EKRAN LİDERLİK TABLOSU         */}
      {/* ======================================================== */}
      {siralamaAcik && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[80] backdrop-blur-md">
          <div className="leaderboard-modal w-[850px] h-[520px] bg-blue-50 rounded-3xl flex overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-fade-in relative border border-white">
            
            <button onClick={() => setSiralamaAcik(false)} className="absolute top-4 right-4 text-blue-900 hover:bg-white/50 font-black text-lg z-50 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center border border-blue-200 shadow-sm transition-all">✕</button>

            {/* SOL KATEGORİ MENÜSÜ */}
            <div className="w-48 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col py-6 shadow-xl z-20">
              <h2 className="text-center font-black text-yellow-300 tracking-widest mb-6 drop-shadow-md">LİDERLİK</h2>
              <div className="flex flex-col">
                {[
                  { id: "okey", ad: "🃏 Okey Sıralaması" },
                  { id: "pisti", ad: "♥️ Pişti Sıralaması" },
                  { id: "tavla", ad: "🎲 Tavla Sıralaması" }
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
                <div className="absolute left-4 top-3 rounded-full bg-white/80 border border-blue-100 px-3 py-1 text-[11px] font-black text-blue-700 shadow-sm">{aktifLiderlikBaslik}</div>
                {[aktifLiderlikListesi[1], aktifLiderlikListesi[0], aktifLiderlikListesi[2]].map((s, podiumIndex) => {
                  if (!s) return null;
                  const birinci = s.sira === 1;
                  const ikinci = s.sira === 2;
                  return (
                    <button key={s.id} onClick={() => liderlikProfilAc(s)} className={`flex flex-col items-center cursor-pointer hover:-translate-y-2 transition-transform ${birinci ? 'z-20' : 'z-10'} ${ikinci ? 'mb-4' : s.sira === 3 ? 'mb-6' : ''}`}>
                      <div className="relative">
                        {birinci && <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl drop-shadow-md z-30">👑</span>}
                        <div className={`${birinci ? 'w-24 h-24 border-[5px] border-yellow-400 text-5xl shadow-[0_10px_25px_rgba(250,204,21,0.5)]' : ikinci ? 'w-16 h-16 border-4 border-gray-300 text-3xl shadow-lg' : 'w-14 h-14 border-4 border-amber-600 text-2xl shadow-lg'} rounded-full bg-white flex items-center justify-center relative z-10`}>{s.avatar}</div>
                        <span className={`absolute ${birinci ? '-bottom-3 text-xs px-4 bg-gradient-to-r from-yellow-300 to-yellow-500 text-white border-yellow-600' : '-bottom-2 text-[10px] px-3 bg-white text-gray-700 border-gray-300'} left-1/2 transform -translate-x-1/2 border font-black py-0.5 rounded-full z-20 shadow-sm`}>{s.sira}</span>
                      </div>
                      <span className={`${birinci ? 'font-black text-blue-950 mt-4 text-sm' : 'font-bold text-blue-900 mt-3 text-xs'}`}>{s.ad}</span>
                      <span className={`${birinci ? 'text-xs px-3 shadow-sm' : 'text-[10px] px-2'} inline-flex items-center gap-1 text-yellow-600 font-black bg-yellow-100 py-0.5 rounded-full mt-1 border border-yellow-300`}><CipSimgesi boyut="xs" /> {s.skor.toLocaleString('tr-TR')}</span>
                    </button>
                  );
                })}
              </div>

              {/* LİSTE ALANI */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-white">
                {aktifLiderlikListesi.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-blue-400 font-black">Bu filtrede oyuncu yok.</div>
                ) : aktifLiderlikListesi.slice(3).map((s) => (
                  <button key={s.id} onClick={() => liderlikProfilAc(s)} className="w-full flex justify-between items-center p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100 transition-colors cursor-pointer shadow-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-blue-900 text-base w-6 text-center">{s.sira}</span>
                      <div className="w-9 h-9 rounded-full bg-white border border-blue-200 flex items-center justify-center text-lg shadow-inner">{s.avatar}</div>
                      <div className="text-left"><span className="font-bold text-blue-950 text-xs block">{s.ad}</span><span className="text-[10px] text-blue-400 font-bold">{s.sehir}</span></div>
                    </div>
                    <span className="text-yellow-600 font-black text-xs flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200"><CipSimgesi boyut="xs" /> {s.skor.toLocaleString('tr-TR')}</span>
                  </button>
                ))}
              </div>

              {/* KENDİ SIRALAMAN */}
              <div className="h-16 bg-white border-t border-blue-200 flex justify-between items-center px-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
                <div className="flex items-center gap-3">
                  <span className="font-black text-green-600 text-lg w-8">50+</span>
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center font-black text-blue-900 shadow-sm">{isim[0]?.toUpperCase() || "S"}</div>
                  <span className="font-bold text-blue-950">{isim || "Süleyman"}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-yellow-600 font-black text-sm bg-yellow-50 px-3 py-1 rounded-xl border border-yellow-300 shadow-sm"><CipSimgesi boyut="sm" /> {bakiyeCip.toLocaleString()}</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DİĞER MODALLAR (Z-INDEX 70) */}
      {hediyePaneliAcik && hediyeHedefOyuncu && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[130] backdrop-blur-sm">
          <div className="w-[600px] bg-slate-50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)] animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 flex justify-between items-center text-white relative">
              <div className="flex items-center gap-2"><span className="text-xl">✨</span><h3 className="font-bold text-base tracking-wide drop-shadow-md">Hediye gönder</h3></div>
              <button onClick={() => setHediyePaneliAcik(false)} className="bg-white/20 hover:bg-white/30 rounded-full w-7 h-7 flex items-center justify-center font-black">✕</button>
            </div>
            <div className="flex bg-gray-200 text-gray-500 font-bold text-xs">
              <button onClick={() => { setHediyeSekmesi("elmas"); setSeciliHediyeId(1); }} className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-tr-2xl transition-all ${hediyeSekmesi === "elmas" ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md" : "hover:bg-gray-300"}`}><ElmasSimgesi boyut="sm" /> Elmas Ödülü</button>
              <button onClick={() => { setHediyeSekmesi("klan"); setSeciliHediyeId(1); }} className={`px-5 py-2.5 rounded-tr-2xl transition-all ${hediyeSekmesi === "klan" ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md" : "hover:bg-gray-300"}`}>🛡️ Klan Çipi Ödülü</button>
              <div className="ml-auto px-4 py-2 flex items-center gap-1.5 bg-white/50 text-indigo-900 rounded-bl-xl font-black"><ElmasSimgesi boyut="sm" /> {bakiyeElmas.toFixed(1)}</div>
            </div>
            <div className="p-4 bg-blue-50/50">
              <div className="grid grid-cols-5 gap-3">
                {aktifHediyeListesi.map((h) => {
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
                          <div className="bg-blue-50 text-indigo-600 text-[10px] font-black py-1 w-full flex items-center justify-center gap-1"><ElmasSimgesi boyut="xs" /> {h.maliyet}</div>
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
                <div className="flex justify-between font-bold text-amber-400 mb-0.5"><span>{m.gonderen}</span>{m.hediyeMiktar > 0 && <span className="inline-flex items-center gap-1 text-green-400">+{m.hediyeMiktar.toLocaleString()} <CipSimgesi boyut="xs" /></span>}</div>
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
        <div className="absolute inset-0 bg-blue-950/35 backdrop-blur-sm flex items-center justify-center z-[90]" onClick={() => setArkadaslarAcik(false)}>
          <div className="friends-modal w-[860px] h-[560px] rounded-3xl overflow-hidden bg-gradient-to-br from-blue-400 via-sky-300 to-cyan-100 border-2 border-white/60 shadow-[0_25px_80px_rgba(0,0,0,0.35)] flex" onClick={(e)=>e.stopPropagation()}>
            <div className="w-48 bg-gradient-to-b from-blue-600 to-blue-900 text-white p-5 flex flex-col gap-5">
              <div className="text-2xl font-black mb-2">👥 Arkadaşlarım</div>
              {[
                ['arkadaslar','Arkadaş listem'],['takipciler','Takipçilerim'],['takipEdilenler','Takip ettiklerim'],['ekle','Arkadaş ekle']
              ].map(([id,yazi])=><button key={id} onClick={()=>{ setSosyalAktifSekme(id as any); if (id === 'ekle') { setArananId(''); setSeciliArkadasProfil(null); } }} className={`text-left rounded-xl px-4 py-3 font-black transition ${sosyalAktifSekme===id?'bg-white/25 text-white shadow-inner':'text-blue-100/80 hover:bg-white/10'}`}>{yazi}</button>)}
              <button onClick={() => setBegeniPaneliAcik(true)} className="mt-auto rounded-2xl bg-sky-200/35 border border-white/30 py-3 text-center font-black hover:bg-white/25 active:scale-95 transition">👍 {toplanmamisBegeniler.length}/50</button>
            </div>
            <div className="flex-1 p-5 relative">
              <button onClick={() => setArkadaslarAcik(false)} className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/45 text-blue-700 text-2xl font-black">×</button>
              <div className="text-blue-900 font-black text-xl mb-4">{aktifSosyalSekmeBilgisi.baslik} <span className="text-sm text-blue-700">({aktifSosyalSekmeBilgisi.sayac})</span></div>
              {sosyalAktifSekme === 'ekle' ? (
                <div className="mt-16 max-w-md mx-auto rounded-3xl bg-white/70 p-6 border border-white shadow">
                  <div className="font-black text-blue-800 mb-3">Oyuncu ID ile arkadaş ekle</div>
                  <div className="flex gap-2"><input type="text" maxLength={7} autoComplete="off" inputMode="numeric" className="flex-1 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-blue-900 font-black outline-none" placeholder="Oyuncu ID" value={arananId} onKeyDown={(e)=>{ if (e.key === 'Enter') idIleOyuncuAraVeIstekAt(); }} onChange={(e)=>setArananId(e.target.value.replace(/\D/g,''))}/><button onClick={idIleOyuncuAraVeIstekAt} className="rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white px-5 font-black">Bul</button></div>
                </div>
              ) : (
                <div className="h-[470px] overflow-y-auto pr-2 space-y-2">
                  {aktifSosyalListe.length === 0 ? (
                    <div className="h-full rounded-3xl bg-white/45 border border-white/60 flex items-center justify-center text-blue-800 font-black">{aktifSosyalSekmeBilgisi.bosMesaj}</div>
                  ) : aktifSosyalListe.map((a, i) => {
                    const begenildi = arkadasBugunBegenildiMi(a.id);
                    return (
                      <div key={a.id} onClick={() => { setProfilAcilisKaynak("liste"); setDigerProfilSekme("profil"); setDigerProfilBasariKategori("Otomatik Eşleşme"); setSeciliArkadasProfil(a); }} className={`w-full rounded-2xl border border-white/60 px-4 py-3 flex items-center gap-4 text-left shadow hover:scale-[1.01] transition cursor-pointer ${i===1?'bg-gradient-to-r from-amber-100 to-orange-100':'bg-sky-100/85'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-sky-300 shadow flex items-center justify-center text-3xl">{i%5===0?'👩🏻':i%5===1?'👸🏻':i%5===2?'👨🏻':i%5===3?'🧔🏻':'👤'}</div>
                        <div className="flex-1"><div className="font-black text-blue-800 text-lg"><span className={a.aktif?'text-green-500':'text-gray-400'}>●</span> {a.ad} {a.vip>0 && <span className="text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded">VIP{a.vip}</span>}</div><div className="text-blue-600 font-bold text-sm">{a.aktif ? 'Çevrimiçi' : 'Son zamanda yeni gönderi paylaşmadı'}</div></div>
                        <div className="flex gap-3 text-3xl">
                          {sosyalAktifSekme === 'arkadaslar' && (
                            <button type="button" onClick={(event) => arkadasliktanCikar(event, a)} className="hover:scale-110 active:scale-95 transition" title="Arkadaşlıktan çıkar">🗑️</button>
                          )}
                          {sosyalAktifSekme === 'takipEdilenler' && (
                            <button type="button" onClick={(event) => takiptenCik(event, a)} className="hover:scale-110 active:scale-95 transition" title="Takipten çık">🚫</button>
                          )}
                          <button type="button" onClick={(event) => { event.stopPropagation(); setHediyeHedefOyuncu(a); setHediyePaneliAcik(true); setArkadaslarAcik(false); }} className="hover:scale-110 active:scale-95 transition" title="Hediye gönder">🎁</button>
                          <button type="button" onClick={(event) => arkadasiBegen(event, a)} className={`hover:scale-110 active:scale-95 transition ${begenildi ? 'opacity-55 saturate-50' : ''}`} title={begenildi ? `Tekrar beğenmek için ${begeniKalanSureYazi(a.id)} bekle` : "2.000 çip beğeni gönder"}>👍</button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); setLobiSohbetAcik(true); setLobiSohbetSekme('ozel'); setArkadaslarAcik(false); }} className="hover:scale-110 active:scale-95 transition" title="Mesaj gönder">💬</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {begeniPaneliAcik && (
        <div className="absolute inset-0 bg-blue-950/45 backdrop-blur-sm flex items-center justify-center z-[125]" onClick={() => setBegeniPaneliAcik(false)}>
          <div className="w-[520px] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-100 to-blue-50 border-2 border-white shadow-[0_25px_80px_rgba(0,0,0,0.35)]" onClick={(e)=>e.stopPropagation()}>
            <div className="h-16 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-black text-xl flex items-center px-5 relative">
              👍 Beğeni Ödülleri
              <button onClick={() => setBegeniPaneliAcik(false)} className="absolute right-4 top-3 w-10 h-10 rounded-full bg-white/30 text-2xl leading-none hover:bg-white/45">×</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl bg-white/80 border border-sky-200 p-3 text-blue-900 font-black">
                  Gelen beğeni<br/><span className="text-cyan-600 text-2xl">{toplanmamisBegeniler.length}/50</span>
                </div>
                <div className="rounded-2xl bg-white/80 border border-amber-200 p-3 text-blue-900 font-black">
                  Toplanacak<br/><span className="inline-flex items-center gap-1.5 text-amber-500 text-2xl">+{toplanmamisBegeniToplami.toLocaleString()} <CipSimgesi boyut="md" /></span>
                </div>
              </div>
              <div className="h-64 overflow-y-auto pr-1 space-y-2">
                {gelenBegeniler.length === 0 ? (
                  <div className="h-full rounded-2xl bg-white/60 border border-white flex items-center justify-center text-blue-800 font-black">Henüz beğeni ödülü yok.</div>
                ) : gelenBegeniler.map((begeni, i) => (
                  <div key={`${begeni.id}-${i}`} className={`rounded-2xl border border-white/70 px-4 py-3 flex items-center gap-3 shadow-sm ${begeni.alindi ? 'bg-gray-100/75 opacity-70' : 'bg-white/85'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border-2 border-sky-300 flex items-center justify-center text-2xl">{i%4===0?'👩🏻':i%4===1?'👸🏻':i%4===2?'👨🏻':'🧔🏻'}</div>
                    <div className="flex-1">
                      <div className="font-black text-blue-800"><span className={begeni.aktif ? 'text-green-500' : 'text-gray-400'}>●</span> {begeni.ad} {begeni.vip>0 && <span className="text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded">VIP{begeni.vip}</span>}</div>
                      <div className="text-xs text-blue-500 font-bold">{begeni.zaman} beğeni attı</div>
                    </div>
                    <div className={`font-black ${begeni.alindi ? 'text-gray-400' : 'text-amber-500'}`}>{begeni.alindi ? 'Toplandı' : <span className="inline-flex items-center gap-1">+{begeni.miktar.toLocaleString()} <CipSimgesi boyut="xs" /></span>}</div>
                  </div>
                ))}
              </div>
              <button onClick={tumBegenileriTopla} disabled={toplanmamisBegeniToplami <= 0} className={`mt-4 w-full rounded-2xl py-3 font-black text-white shadow-lg active:scale-95 transition ${toplanmamisBegeniToplami > 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:brightness-110' : 'bg-gray-400 cursor-not-allowed'}`}>
                Hepsini Topla
              </button>
            </div>
          </div>
        </div>
      )}

      {seciliArkadasProfil && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/65 backdrop-blur-sm" onClick={() => setSeciliArkadasProfil(null)}>
          <div className="profile-modal w-[960px] max-w-[95vw] max-h-[92vh] rounded-[24px] overflow-hidden bg-gradient-to-b from-blue-50 via-white to-sky-100 border-4 border-sky-200 shadow-[0_0_80px_rgba(96,165,250,0.65)] relative" onClick={(e)=>e.stopPropagation()}>
            <div className="h-16 bg-gradient-to-r from-sky-400 via-blue-300 to-sky-300 flex items-center text-white font-black text-2xl relative">
              <button onClick={() => setDigerProfilSekme('profil')} className={`px-10 h-full flex items-center gap-2 rounded-br-[26px] transition ${digerProfilSekme === 'profil' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg' : 'text-blue-900/70 hover:bg-white/20'}`}>👤 Profil</button>
              <button onClick={() => setDigerProfilSekme('gonderiler')} className={`px-10 h-full flex items-center gap-2 transition ${digerProfilSekme === 'gonderiler' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg rounded-b-[22px]' : 'text-blue-900/70 hover:bg-white/20'}`}>▦ Gönderiler</button>
              <button onClick={() => setDigerProfilSekme('basarilar')} className={`px-10 h-full flex items-center gap-2 transition ${digerProfilSekme === 'basarilar' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg rounded-b-[22px]' : 'text-blue-900/70 hover:bg-white/20'}`}>🏅 Başarılar</button>
              <button onClick={() => setSeciliArkadasProfil(null)} className="absolute right-4 top-3 w-11 h-11 rounded-full bg-white/35 hover:bg-white/55 text-white text-4xl leading-none border border-white/50">×</button>
            </div>

            {digerProfilSekme === 'profil' && (
              <div className="p-6 grid grid-cols-[240px_1fr] gap-7">
                <div className="flex flex-col items-center relative">
                  <div className="relative w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                    <span className="text-6xl">👤</span>
                    {seciliArkadasProfil.vip > 0 && <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-red-500 to-yellow-400 text-white text-xs font-black px-2 py-1 rounded-tl-xl border border-yellow-100">VIP{seciliArkadasProfil.vip}</div>}
                  </div>
                  {!seciliProfilArkadasMi && (
                    <button
                      onClick={() => profilUzerindenArkadasEkle(seciliArkadasProfil)}
                      disabled={seciliProfilIstekGonderildi}
                      className={`mt-4 rounded-full px-4 py-2 text-xs font-black shadow transition ${seciliProfilIstekGonderildi ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 active:scale-95'}`}>
                      {seciliProfilIstekGonderildi ? 'İstek gönderildi' : '+ Arkadaş Ekle'}
                    </button>
                  )}
                  {seciliProfilArkadasMi && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => { setHediyeHedefOyuncu(seciliArkadasProfil); setHediyePaneliAcik(true); setSeciliArkadasProfil(null); }} className="rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black px-4 py-2 text-xs shadow">🎁 Hediye</button>
                      <button onClick={() => { setLobiSohbetAcik(true); setLobiSohbetSekme('ozel'); setSeciliArkadasProfil(null); }} className="rounded-xl bg-gradient-to-b from-sky-300 to-blue-500 text-white font-black px-4 py-2 text-xs shadow">💬 Mesaj</button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-blue-700 font-black text-sm mb-3 flex items-center gap-2">ID: {seciliArkadasProfil.id} <button onClick={() => idKopyala(seciliArkadasProfil.id)} className="rounded-md bg-sky-100 border border-sky-200 px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-sky-200" title="ID kopyala">📋</button></div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><span className="text-2xl">👤</span><span className="font-black text-blue-800">{seciliArkadasProfil.ad}</span></div>
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><CipSimgesi boyut="md" /><span className="font-black text-blue-800">{(27000 + seciliArkadasProfil.vip*1200).toLocaleString()}</span></div>
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><span className="text-2xl">●</span><span className={`font-black ${seciliArkadasProfil.aktif ? 'text-green-500' : 'text-gray-500'}`}>{seciliArkadasProfil.aktif ? 'Çevrimiçi' : 'Çevrimdışı'}</span></div>
                    <div className="rounded-2xl bg-sky-100/85 border border-sky-200 px-4 py-3 flex items-center gap-3 shadow-sm"><ElmasSimgesi boyut="md" /><span className="font-black text-blue-800">{(seciliArkadasProfil.vip / 10).toFixed(1)}</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Oynanan oyun</div><div className="text-2xl text-blue-800 font-black">{seciliProfilOyunSayisi}</div></div>
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Galibiyet yüzdesi</div><div className="text-2xl text-blue-800 font-black">{seciliProfilGalibiyet}.0%</div></div>
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Takipçiler</div><div className="text-2xl text-blue-800 font-black">{seciliProfilTakipci}</div></div>
                    <div className="rounded-2xl bg-white/85 border border-sky-200 p-3 text-center"><div className="text-xs text-sky-700 font-black">Gizlilik</div><div className="text-sm text-blue-800 font-black">{seciliProfilGizli ? 'Arkadaşlar' : 'Herkes'}</div></div>
                  </div>
                  <div className="rounded-3xl bg-blue-100/70 border border-sky-200 h-48 flex flex-col items-center justify-center text-blue-300 font-black text-center">
                    {seciliProfilOzelIcerikKilitli ? (
                      <>
                        <div className="text-5xl opacity-70">🔒</div>
                        <div className="mt-3 text-blue-500">Son paylaşımlar yalnızca arkadaşlara görünür.</div>
                      </>
                    ) : (
                      <>
                        <div className={`w-64 h-28 rounded-3xl bg-gradient-to-br ${seciliProfilPaylasimlari[0]?.gorsel} border-4 border-white shadow-lg flex items-center justify-center text-5xl`}>{seciliProfilPaylasimlari[0]?.ikon}</div>
                        <div className="mt-3 text-blue-700">{seciliProfilPaylasimlari[0]?.metin}</div>
                        <button onClick={() => setDigerProfilSekme('gonderiler')} className="mt-4 text-blue-700 underline">Gönderileri gör</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {digerProfilSekme === 'gonderiler' && (
              <div className="p-6">
                <div className="rounded-3xl bg-blue-100/70 border border-sky-200 p-4 min-h-[430px] overflow-y-auto">
                  {seciliProfilOzelIcerikKilitli ? (
                    <div className="h-[390px] flex flex-col items-center justify-center text-blue-500 font-black text-center"><div className="text-6xl mb-4">🔒</div><div>Bu oyuncunun gönderileri yalnızca arkadaşlarına görünür.</div></div>
                  ) : seciliProfilPaylasimlari.map((g) => (
                    <div key={g.id} className="mb-4 rounded-3xl bg-white/90 border border-sky-200 p-4 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-2xl bg-amber-200 flex items-center justify-center text-2xl">👤</div><div><div className="font-black text-blue-800">{seciliArkadasProfil.ad}</div><div className="text-xs text-blue-400 font-bold">{g.tarih}</div></div></div>
                      <div className={`mb-3 h-52 rounded-3xl bg-gradient-to-br ${g.gorsel} border border-white shadow-inner flex items-center justify-center text-7xl`}>
                        <span className="drop-shadow-sm">{g.ikon}</span>
                      </div>
                      <div className="font-bold text-blue-900">{g.metin}</div>
                      <div className="mt-3 flex gap-4 text-xs font-black text-blue-500 border-t border-sky-100 pt-3"><span>♡ Beğen</span><span>💬 Yorum yaz</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {digerProfilSekme === 'basarilar' && (
              <div className="p-6 grid grid-cols-[260px_1fr] gap-6">
                <div className="grid grid-cols-2 gap-3 content-start">
                  {profilBasariKategorileri.map((k, i) => (
                    <button key={k} onClick={() => setDigerProfilBasariKategori(k)} className={`h-28 rounded-2xl border shadow-inner flex flex-col items-center justify-center font-black transition ${digerProfilBasariKategori === k ? 'bg-gradient-to-b from-sky-200 to-blue-300 border-blue-400 text-blue-900 scale-[1.02]' : 'bg-white/65 border-sky-200 text-sky-500 hover:bg-white/90'}`}>
                      <div className="text-4xl mb-1">{i === 0 ? '🧊' : i === 1 ? '🏠' : i === 2 ? '🃏' : '🎲'}</div>{k}
                    </button>
                  ))}
                </div>
                <div className="rounded-3xl bg-blue-100/70 border border-sky-200 p-5 min-h-[430px]">
                  <div className="flex items-center gap-4 mb-5"><div className="w-20 h-20 rounded-full bg-amber-200 border-4 border-white shadow flex items-center justify-center text-4xl">👤</div><div><div className="text-xl font-black text-blue-800">{seciliArkadasProfil.ad}</div><div className="text-sm font-bold text-blue-500">{digerProfilBasariKategori} - son 1 ay oyun geçmişi</div></div></div>
                  {seciliProfilOzelIcerikKilitli ? (
                    <div className="h-72 rounded-3xl bg-white/55 border border-sky-100 flex flex-col items-center justify-center text-blue-500 font-black text-center"><div className="text-6xl mb-4">🔒</div><div>Bu oyuncunun başarıları yalnızca arkadaşlarına görünür.</div></div>
                  ) : (
                    <div className="space-y-2">
                      {seciliProfilAktifBasariGecmisi.map((m, i) => <div key={i} className="rounded-xl bg-white/70 px-4 py-3 text-blue-700 font-bold border border-sky-100">{m}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hediyeCipPanelAcik && (
        <div
          className="gift-chip-modal fixed inset-0 z-[135] flex items-center justify-center bg-slate-950/70 p-3 text-blue-950 backdrop-blur-[3px]"
          onClick={() => {
            setHediyeCipPanelAcik(false);
            setMiniArkadasSecAcik(false);
            setHediyeCipGecmisAcik(false);
          }}
        >
          <div
            className="gift-chip-card relative w-[min(780px,94vw)] max-h-[min(650px,92vh)] overflow-hidden rounded-[22px] border-2 border-sky-200/90 bg-gradient-to-b from-sky-100 via-blue-50 to-white shadow-[0_24px_70px_rgba(15,23,42,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gift-chip-header flex min-h-12 items-center gap-3 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 px-4 text-white shadow-inner">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-xl font-black drop-shadow">
                <CipSimgesi boyut="sm" />
                <span>Hediye Çip</span>
              </div>
              <div className="hidden flex-1 justify-center text-sm font-black md:flex">
                Tebrikler! <span className="mx-1 text-cyan-100">{hediyeCipSeciliOyuncu?.ad || isim}</span> oyuncusu hazır
              </div>
              <button
                type="button"
                onClick={() => {
                  setHediyeCipPanelAcik(false);
                  setMiniArkadasSecAcik(false);
                  setHediyeCipGecmisAcik(false);
                }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white/70 bg-white/20 text-2xl font-black text-white shadow hover:bg-white/30"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="gift-chip-content space-y-4 p-5">
              <div className="flex items-center justify-between gap-3 border-b border-sky-200/80 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-200 to-sky-100 text-3xl shadow-lg">
                    👤
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-blue-900">{isim}</div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-lg font-black text-slate-700 shadow-sm">
                      <CipSimgesi boyut="sm" />
                      {bakiyeCip.toLocaleString("tr-TR")}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHediyeCipGecmisAcik((acik) => !acik);
                    setMiniArkadasSecAcik(false);
                  }}
                  className="rounded-xl border border-blue-300 bg-gradient-to-b from-blue-100 to-indigo-200 px-4 py-3 text-sm font-black text-blue-800 shadow hover:brightness-105"
                >
                  Hediyeler geçmişi
                </button>
              </div>

              {hediyeCipGecmisAcik && (
                <div className="gift-chip-history rounded-2xl border border-sky-200 bg-white/80 p-3 shadow-inner">
                  {hediyeCipGecmisi.length === 0 ? (
                    <div className="py-5 text-center text-sm font-bold text-sky-700">Henüz çip hediyesi gönderilmedi.</div>
                  ) : (
                    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {hediyeCipGecmisi.map((kayit) => (
                        <div key={kayit.id} className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-blue-900">
                          <span>{kayit.oyuncuAd} <span className="text-blue-400">ID:{kayit.oyuncuId}</span></span>
                          <span className="inline-flex items-center gap-1 text-amber-600">-{kayit.miktar.toLocaleString("tr-TR")} <CipSimgesi boyut="xs" /></span>
                          <span className="text-xs text-slate-500">{kayit.tarih}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {miniArkadasSecAcik ? (
                <div className="gift-chip-selector overflow-hidden rounded-[20px] border border-sky-200 bg-white/75 shadow-inner">
                  <div className="grid grid-cols-[1fr_1fr_auto] items-center bg-blue-500/20 text-center text-base font-black text-blue-900">
                    {([
                      { id: "arkadaslar", ad: "Arkadaşlarım" },
                      { id: "klan", ad: "Klan üyeleri" },
                    ] as const).map((sekme) => (
                      <button
                        key={sekme.id}
                        type="button"
                        onClick={() => setHediyeCipArkadasSekmesi(sekme.id)}
                        className={`px-5 py-3 transition ${hediyeCipArkadasSekmesi === sekme.id ? "bg-gradient-to-b from-yellow-300 to-orange-300 text-white drop-shadow" : "bg-blue-400/25 text-blue-900 hover:bg-blue-300/35"}`}
                      >
                        {sekme.ad}
                      </button>
                    ))}
                    <div className="px-5 py-3 text-sm text-white drop-shadow">Tebrikler!</div>
                  </div>
                  <div className="gift-chip-friend-list max-h-[365px] overflow-y-auto p-3">
                    {hediyeCipArkadaslari.map((arkadas, index) => (
                      <button
                        key={`${hediyeCipArkadasSekmesi}-${arkadas.id}`}
                        type="button"
                        onClick={() => {
                          setHediyeCipTargetId(arkadas.id);
                          setMiniArkadasSecAcik(false);
                          setHediyeCipGecmisAcik(false);
                        }}
                        className={`gift-friend-row mb-2 grid w-full grid-cols-[64px_1fr_auto_auto] items-center gap-3 rounded-xl border border-white/70 px-3 py-2 text-left shadow-sm transition hover:scale-[1.01] hover:brightness-105 ${index % 2 === 0 ? "bg-sky-100" : "bg-amber-100"}`}
                      >
                        <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-sky-300 bg-gradient-to-br from-white to-sky-100 text-2xl shadow">
                          {arkadas.ad.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1 text-lg font-black text-blue-900">
                            <span className="text-sky-600">♂</span>
                            {arkadas.vip > 0 && <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] text-white">VIP{arkadas.vip}</span>}
                            <span className="truncate">{arkadas.ad}</span>
                          </div>
                          <div className="font-mono text-sm font-black text-sky-500">ID:{arkadas.id}</div>
                        </div>
                        <div className="hidden text-center text-sm font-black text-amber-600 sm:block">{arkadas.aktif ? "Oyunda" : `${(index + 1) * 43} dakika önce`}</div>
                        <span className="rounded-lg bg-gradient-to-b from-emerald-300 to-emerald-600 px-7 py-2 text-center text-base font-black text-white shadow">Seç</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="gift-chip-form-grid grid grid-cols-[1fr_auto] gap-4">
                  <div className="min-w-0 space-y-4">
                    <div>
                      <label className="mb-2 block text-lg font-black text-slate-600">Lütfen oyuncunun ID numarasını yazınız</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={8}
                          className="h-12 min-w-0 flex-1 rounded-lg border border-sky-200 bg-blue-100/80 px-4 text-lg font-black text-blue-900 outline-none shadow-inner placeholder:text-blue-300 focus:border-sky-400"
                          placeholder="Lütfen ID numarasını yazınız"
                          value={hediyeCipTargetId}
                          onChange={(event) => setHediyeCipTargetId(event.target.value.replace(/\D/g, ""))}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMiniArkadasSecAcik(true);
                            setHediyeCipGecmisAcik(false);
                          }}
                          className="shrink-0 rounded-lg border border-yellow-300 bg-gradient-to-b from-yellow-200 to-orange-400 px-6 text-base font-black text-white shadow hover:brightness-105"
                        >
                          Arkadaş seç
                        </button>
                      </div>
                      {hediyeCipSeciliOyuncu && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                          ● {hediyeCipSeciliOyuncu.ad} seçildi
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-lg font-black text-slate-600">Hediye edilecek çip miktarını yazınız</label>
                      <input
                        type="text"
                        className="h-12 w-full rounded-lg border border-sky-200 bg-blue-100/80 px-4 text-lg font-black text-blue-900 outline-none shadow-inner placeholder:text-blue-300 focus:border-sky-400"
                        placeholder="Hediye edilecek çip miktarını yazınız"
                        value={hediyeCipMiktar}
                        onChange={(event) => setHediyeCipMiktar(event.target.value.replace(/\D/g, ""))}
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-lg font-black text-sky-700">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-200 text-white shadow">?</span>
                      <CipSimgesi boyut="md" />
                      <span>Çip hediye etmek için gereken masraf: {hediyeCipMasraf}</span>
                    </div>
                  </div>

                  <div className="gift-chip-side-panel flex min-w-[185px] flex-col items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-100 p-4 text-center shadow-inner">
                    <CipSimgesi boyut="xl" />
                    <div className="mt-3 text-sm font-black text-slate-500">Gönderilecek</div>
                    <div className="text-2xl font-black text-blue-900">{hediyeCipMiktar ? Number(hediyeCipMiktar).toLocaleString("tr-TR") : "0"}</div>
                    <div className="mt-2 text-xs font-bold text-slate-500">Alıcı: {hediyeCipSeciliOyuncu?.ad || "Seçilmedi"}</div>
                  </div>

                  <div className="col-span-2 flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={hediyeCipGonderAksiyonu}
                      className="min-w-[210px] rounded-xl border border-yellow-300 bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-400 px-8 py-3 text-xl font-black text-white shadow-[0_8px_0_rgba(180,83,9,0.45)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:shadow-none"
                    >
                      Hediyeyi onayla
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {false && hediyeCipPanelAcik && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="w-96 bg-slate-900 border border-yellow-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(234,179,8,0.25)] relative">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-4">
              <div><h3 className="inline-flex items-center gap-2 text-sm font-black text-yellow-400 tracking-wide"><CipSimgesi boyut="sm" /> HEDİYE ÇİP TRANSFERİ</h3><p className="text-[10px] text-gray-400">Bakiye: <span className="inline-flex items-center gap-1 text-yellow-500 font-bold">{bakiyeCip.toLocaleString()} <CipSimgesi boyut="xs" /></span></p></div>
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
                <label className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1"><CipSimgesi boyut="xs" /> Çip Miktarı</label>
                <input type="text" className="w-full p-2.5 bg-black border border-gray-800 rounded-xl text-yellow-400 font-bold text-xs focus:border-yellow-500 outline-none" placeholder="Örn: 5000" value={hediyeCipMiktar} onChange={(e) => setHediyeCipMiktar(e.target.value.replace(/\D/g, ''))}/>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button onClick={() => setHediyeCipPanelAcik(false)} className="w-1/3 bg-gray-800 hover:bg-gray-700 font-bold py-2 rounded-xl text-xs text-gray-300">İptal</button>
                <button onClick={hediyeCipGonderAksiyonu} className="w-2/3 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-black py-2 rounded-xl text-xs shadow hover:brightness-110">Güvenli Gönder <CipSimgesi boyut="xs" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {vipMarketAcik && (
        <div className="shop-modal fixed inset-0 z-[170] bg-indigo-950/95 text-white overflow-y-auto lg:overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(125,211,252,0.28),transparent_22%),radial-gradient(circle_at_18%_82%,rgba(45,212,191,0.25),transparent_28%),linear-gradient(135deg,#0f1645_0%,#211452_45%,#072e5c_100%)]"></div>
          <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_25%_20%,white_0_1px,transparent_2px),radial-gradient(circle_at_70%_42%,white_0_1px,transparent_2px)] bg-[length:48px_48px]"></div>
          <div className="absolute -right-20 bottom-[-70px] h-80 w-80 rounded-full border-[26px] border-cyan-200/20 bg-cyan-300/10 blur-[1px]"></div>
          <div className="relative z-10 flex min-h-full flex-col lg:h-full lg:flex-row">
            <aside className="w-full shrink-0 border-b border-cyan-200/25 bg-black/18 px-4 py-4 backdrop-blur-sm lg:w-[230px] lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
              <div className="mb-4 text-3xl font-black italic text-white drop-shadow-[0_0_16px_rgba(125,211,252,0.95)] lg:mb-12 lg:text-5xl">Mağaza</div>
              <div className="relative flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-6 lg:overflow-visible lg:pl-3">
                <div className="absolute left-[88px] top-3 bottom-3 hidden w-px bg-cyan-100/35 shadow-[0_0_16px_rgba(125,211,252,0.85)] lg:block"></div>
                {([
                  { id: "çipler", ad: "Çip" },
                  { id: "vip", ad: "VIP" },
                  { id: "elmas", ad: "Elmas" },
                  { id: "oge", ad: "Öğe" },
                  { id: "puan", ad: "Puan" },
                  { id: "klan", ad: "Klan" },
                  { id: "nostalji", ad: "Nostaljik Dekorasyon" },
                ] as { id: typeof magazaAktifSekme; ad: string }[]).map((kategori) => {
                  const aktif = kategori.id === magazaAktifSekme;
                  return (
                    <button
                      key={kategori.id}
                      onClick={() => {
                        setMagazaAktifSekme(kategori.id);
                      }}
                      className={`relative flex min-h-10 shrink-0 items-center rounded-xl px-4 text-left text-base font-black transition lg:min-h-12 lg:w-full lg:rounded-none lg:px-0 lg:text-2xl ${aktif ? "bg-white/10 text-white drop-shadow-[0_0_14px_rgba(125,211,252,1)] lg:bg-transparent" : "text-sky-200/85 hover:text-white"}`}
                    >
                      <span className={`absolute left-[77px] hidden h-4 w-4 rounded-full border border-cyan-100 lg:block ${aktif ? "bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,1)]" : "bg-white/35"}`}></span>
                      <span className="max-w-[150px] whitespace-nowrap leading-tight lg:whitespace-normal">{kategori.ad}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-w-0 flex-1 px-4 py-4 lg:overflow-y-auto lg:px-6 lg:py-5">
              <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-cyan-300/25 bg-blue-900/65 px-3 py-2 shadow-[0_0_24px_rgba(37,99,235,0.25)] sm:min-w-40">
                    <CipSimgesi boyut="md" />
                    <span className="truncate text-lg font-black text-cyan-100 lg:text-xl">{bakiyeCip.toLocaleString()}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-violet-300/25 bg-indigo-900/65 px-3 py-2 sm:min-w-32">
                    <span className="text-2xl">🏅</span>
                    <span className="truncate text-lg font-black text-cyan-100 lg:text-xl">{magazaPuanBakiyesi}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-cyan-300/25 bg-indigo-900/65 px-3 py-2 sm:min-w-32">
                    <ElmasSimgesi boyut="md" />
                    <span className="truncate text-lg font-black text-cyan-100 lg:text-xl">{bakiyeElmas.toFixed(1)}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-300/25 bg-indigo-900/65 px-3 py-2 sm:min-w-28">
                    <span className="text-2xl">🛡️</span>
                    <span className="truncate text-lg font-black text-cyan-100 lg:text-xl">{dekorasyonJetonu}</span>
                  </div>
                </div>
                <button onClick={() => setVipMarketAcik(false)} className="h-11 w-11 self-end rounded-full border-2 border-cyan-100/70 bg-white/10 text-3xl font-black leading-none text-white shadow-[0_0_24px_rgba(103,232,249,0.75)] hover:bg-white/20 xl:self-auto">×</button>
              </div>

              {magazaAktifSekme === "çipler" && (
                <div className="shop-product-grid grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                  {cipPaketleri.map((p, index) => {
                    const etiketler = ["", "", "Avantajlı", "Popüler", "", "Lounge", "Büyük Paket", "Zirve"];
                    const etiket = etiketler[index] || "";
                    return (
                      <button
                        key={p.id}
                        onClick={() => cipSatinAl(p.miktar, p.fiyat)}
                        className="shop-product-card group relative min-h-[230px] overflow-hidden rounded-[20px] border-[3px] border-cyan-300 bg-gradient-to-b from-sky-100 via-blue-100 to-amber-50 p-3 text-blue-900 shadow-[0_18px_34px_rgba(6,182,212,0.28)] transition hover:-translate-y-1 hover:brightness-105 active:scale-95 xl:min-h-[250px] xl:p-4"
                      >
                        <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_35%_18%,white,transparent_25%),repeating-linear-gradient(135deg,rgba(255,255,255,0.45)_0_2px,transparent_2px_9px)]"></div>
                        <div className="shop-product-amount absolute left-3 right-3 top-3 rounded-2xl border-4 border-cyan-300/60 bg-cyan-200/55 px-2 py-2 text-center text-2xl font-black text-blue-700 shadow-inner xl:text-[28px]">{p.miktarYazi.replace(" Çip", "")}</div>
                        {etiket && <div className="absolute right-3 top-[62px] rotate-[-7deg] rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-2.5 py-1 text-xs font-black text-white shadow-lg xl:text-sm">{etiket}</div>}
                        <div className="shop-product-visual relative z-10 mt-[78px] flex h-[94px] items-center justify-center xl:h-[106px]">
                          <div className="relative h-[92px] w-32 xl:h-[100px] xl:w-36">
                            {index >= 5 && <div className="absolute bottom-2 left-3 right-3 h-11 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-cyan-500 to-blue-800 shadow-lg"></div>}
                            <CipSimgesi boyut={index >= 5 ? "md" : "lg"} className="absolute left-[52px] top-1 xl:left-[52px]" />
                            <CipSimgesi boyut="md" className="absolute left-6 top-12 rotate-[-18deg]" />
                            <CipSimgesi boyut="md" className="absolute right-6 top-12 rotate-[15deg]" />
                            {index >= 4 && <CipSimgesi boyut="sm" className="absolute left-[62px] top-[66px] rotate-[-8deg]" />}
                          </div>
                        </div>
                        <div className="shop-product-price absolute left-4 right-4 bottom-4 z-20 rounded-lg border-2 border-emerald-300 bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-200 py-2 text-center text-2xl font-black text-emerald-900 shadow-[0_8px_18px_rgba(16,185,129,0.28)] xl:text-[28px]">{p.fiyat}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {magazaAktifSekme === "elmas" && (
                <div className="shop-product-grid grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                  {elmasPaketleri.map((p, index) => (
                    <button
                      key={p.id}
                      onClick={() => elmasSatinAl(p.miktar, p.fiyat)}
                      className="shop-product-card group relative min-h-[230px] overflow-hidden rounded-[20px] border-[3px] border-cyan-200 bg-gradient-to-b from-sky-100 via-cyan-100 to-blue-50 p-3 text-blue-900 shadow-[0_18px_34px_rgba(6,182,212,0.24)] transition hover:-translate-y-1 hover:brightness-105 active:scale-95 xl:min-h-[250px] xl:p-4"
                    >
                      <div className="absolute inset-0 opacity-55 bg-[radial-gradient(circle_at_30%_18%,white,transparent_25%),radial-gradient(circle_at_78%_30%,rgba(125,211,252,0.75),transparent_22%),repeating-linear-gradient(135deg,rgba(255,255,255,0.45)_0_2px,transparent_2px_9px)]"></div>
                      <div className="shop-product-amount absolute left-3 right-3 top-3 rounded-2xl border-4 border-cyan-300/60 bg-cyan-200/55 px-2 py-2 text-center text-xl font-black text-blue-700 shadow-inner xl:text-2xl">{p.miktarYazi}</div>
                      {p.etiket && <div className="absolute right-3 top-[62px] rotate-[-7deg] rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-500 px-2.5 py-1 text-xs font-black text-white shadow-lg xl:text-sm">{p.etiket}</div>}
                      <div className="shop-product-visual relative z-10 mt-[78px] flex h-[94px] items-center justify-center xl:h-[106px]">
                        <div className="relative flex h-[92px] w-32 items-center justify-center xl:h-[100px] xl:w-36">
                          <ElmasSimgesi boyut={index >= 4 ? "xl" : "lg"} className={index >= 4 ? "scale-75" : "scale-125"} />
                          {index >= 2 && <ElmasSimgesi boyut="md" className="absolute left-4 bottom-4 rotate-[-15deg]" />}
                          {index >= 3 && <ElmasSimgesi boyut="sm" className="absolute right-5 top-8 rotate-[18deg]" />}
                        </div>
                      </div>
                      <div className="relative z-10 mt-1 text-center text-xs font-black text-cyan-700/80">{p.ad}</div>
                      <div className="shop-product-price absolute left-4 right-4 bottom-4 z-20 rounded-lg border-2 border-emerald-300 bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-200 py-2 text-center text-2xl font-black text-emerald-900 shadow-[0_8px_18px_rgba(16,185,129,0.28)] xl:text-[28px]">{p.fiyat}</div>
                    </button>
                  ))}
                </div>
              )}

              {magazaAktifSekme === "vip" && (
                <div className="h-[calc(100vh-120px)] overflow-y-auto pr-2">
                  <div className="mb-5 rounded-3xl border border-yellow-300/40 bg-yellow-100/10 px-5 py-4 text-yellow-100">
                    <div className="text-2xl font-black">VIP Seviyeleri</div>
                    <div className="text-sm font-bold text-yellow-100/75">VIP paketleri 1 aylıktır. Süre bitince kapanır; yükseltme sırayla yapılır.</div>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {vipPaketleri.map((paket) => {
                      const alinabilir = paket.seviye === vipSeviyesi + 1;
                      const sahip = paket.seviye <= vipSeviyesi;
                      return (
                        <button
                          key={paket.seviye}
                          onClick={() => alinabilir ? siraliVipSatinAl(paket.seviye, paket.fiyat || "0") : bildirimGoster("VIP", sahip ? "Bu VIP seviyesi zaten geçildi." : `Önce VIP ${vipSeviyesi + 1} alınmalı.`, "bilgi")}
                          className={`relative min-h-[180px] overflow-hidden rounded-3xl border-2 p-4 text-left shadow-xl transition hover:-translate-y-1 ${sahip ? "border-emerald-300 bg-emerald-100 text-emerald-900" : alinabilir ? "border-yellow-300 bg-gradient-to-b from-yellow-100 to-orange-200 text-orange-950 shadow-[0_0_24px_rgba(250,204,21,0.45)]" : "border-cyan-300/45 bg-sky-100/85 text-blue-900"}`}
                        >
                          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40"></div>
                          <div className="relative flex items-center justify-between">
                            <span className="text-3xl font-black">VIP {paket.seviye}</span>
                            <span className="text-3xl">{tacEmojisiGetir(paket.seviye)}</span>
                          </div>
                          <div className="relative mt-5 rounded-2xl bg-white/65 px-3 py-3 text-center font-black">
                            <div className="text-xs uppercase text-slate-500">1 Aylık Paket</div>
                            <div className="text-2xl">{paket.fiyat}</div>
                          </div>
                          <div className={`relative mt-4 rounded-xl px-3 py-2 text-center text-xs font-black ${sahip ? "bg-emerald-500 text-white" : alinabilir ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white" : "bg-blue-200 text-blue-700"}`}>
                            {sahip ? "Aktif / Geçildi" : alinabilir ? "Satın Al" : "Kilitli"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {magazaAktifSekme === "puan" && (
                <div className="grid h-[calc(100vh-120px)] grid-cols-[1fr_420px] gap-7">
                  <div className="grid grid-cols-3 gap-5 content-start overflow-y-auto pr-2">
                    {puanMagazaUrunleri.map((urun) => {
                      const secili = seciliPuanUrunId === urun.id;
                      return (
                        <button
                          key={urun.id}
                          onClick={() => setSeciliPuanUrunId(urun.id)}
                          className={`relative min-h-[230px] overflow-hidden rounded-[22px] border-[3px] bg-gradient-to-b from-sky-100 via-blue-100 to-amber-50 p-4 text-blue-900 shadow-xl transition hover:-translate-y-1 ${secili ? "border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.55)]" : "border-cyan-300"}`}
                        >
                          <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_35%_18%,white,transparent_25%),repeating-linear-gradient(135deg,rgba(255,255,255,0.45)_0_2px,transparent_2px_9px)]"></div>
                          <div className="relative z-10 min-h-12 text-center text-2xl font-black leading-6 text-blue-700">{urun.ad}</div>
                          <div className="relative z-10 mt-5 flex h-20 items-center justify-center">
                            {urun.ikon === "cip" && <div className="relative h-20 w-28"><CipSimgesi boyut="xl" className="absolute left-8 top-0" /><CipSimgesi boyut="md" className="absolute left-4 top-11" /><CipSimgesi boyut="md" className="absolute right-3 top-10" /></div>}
                            {urun.ikon === "cerceve" && <div className="h-20 w-20 rounded-2xl border-[7px] border-yellow-300 bg-white/40 shadow-[0_0_18px_rgba(250,204,21,0.75)]"></div>}
                            {urun.ikon === "balon" && <div className="h-16 w-24 rounded-2xl border-4 border-sky-400 bg-white/50 shadow-lg"></div>}
                            {urun.ikon === "masa" && <div className="h-16 w-28 rounded-xl border-4 border-orange-400 bg-gradient-to-b from-blue-300 to-orange-300 shadow-lg"></div>}
                            {urun.ikon === "lobi" && <div className="h-16 w-28 rounded-xl border-4 border-violet-300 bg-gradient-to-b from-indigo-300 to-amber-200 shadow-lg"></div>}
                            {urun.ikon === "efekt" && <div className="text-5xl font-black text-orange-500 drop-shadow">101</div>}
                          </div>
                          <div className="absolute left-5 right-5 bottom-5 flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-300 bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-200 py-2 text-center text-2xl font-black text-emerald-900 shadow">
                            <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">Puan</span>{urun.puan}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-[22px] border-[3px] border-cyan-200 bg-gradient-to-b from-sky-100 via-blue-100 to-amber-50 p-6 text-center text-blue-900 shadow-xl">
                    <div className="flex h-40 items-center justify-center">
                      {seciliPuanUrun.ikon === "cip" ? <CipSimgesi boyut="xl" /> : <div className="rounded-3xl border-4 border-cyan-300 bg-white/50 px-10 py-8 text-6xl">{seciliPuanUrun.ikon === "cerceve" ? "▢" : seciliPuanUrun.ikon === "balon" ? "▭" : seciliPuanUrun.ikon === "efekt" ? "101" : "✦"}</div>}
                    </div>
                    <div className="mx-auto mt-4 w-72 rounded-2xl border-4 border-cyan-300/60 bg-cyan-200/55 px-4 py-2 text-2xl font-black text-blue-700">{seciliPuanUrun.kisa}</div>
                    <div className="mt-7 text-2xl font-black leading-9 text-blue-800">{seciliPuanUrun.aciklama}</div>
                    <button onClick={() => puanUrunuAl(seciliPuanUrun)} className="mt-8 w-full rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-200 py-3 text-2xl font-black text-emerald-900 shadow hover:brightness-105 active:scale-95">Puan ile Al</button>
                  </div>
                </div>
              )}

              {magazaAktifSekme === "nostalji" && (
                <div className="grid h-[calc(100vh-120px)] grid-cols-[1fr_420px] gap-7">
                  <div className="overflow-y-auto pr-2">
                    <div className="mb-5 flex rounded-xl border border-cyan-300/30 bg-sky-200/20">
                      {["▣", "▭", "▰", "▧", "✦"].map((ikon, index) => (
                        <button key={ikon} className={`h-12 flex-1 text-3xl font-black ${index === 0 ? "bg-gradient-to-r from-yellow-300 to-orange-400 text-white" : "text-cyan-100/75"}`}>{ikon}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      {dekorasyonUrunleri.map((dekor) => {
                        const sahip = alinanDekorlar.includes(dekor.id);
                        const aktif = aktifDekorId === dekor.id;
                        return (
                          <button
                            key={dekor.id}
                            onClick={() => setSeciliDekorId(dekor.id)}
                            className={`relative min-h-[230px] overflow-hidden rounded-[22px] border-[3px] bg-gradient-to-b from-sky-100 via-blue-100 to-amber-50 p-4 text-blue-900 shadow-xl transition hover:-translate-y-1 ${seciliDekorId === dekor.id ? "border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.55)]" : "border-cyan-300"}`}
                          >
                            <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_35%_18%,white,transparent_25%),repeating-linear-gradient(135deg,rgba(255,255,255,0.45)_0_2px,transparent_2px_9px)]"></div>
                            <div className="relative z-10 min-h-12 text-center text-xl font-black leading-6 text-blue-700">{dekor.ad}</div>
                            <div className="relative z-10 mt-5 flex h-20 items-center justify-center">
                              <div className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${dekor.renk} ${dekor.cerceve} flex items-center justify-center text-4xl`}>{dekor.ikon}</div>
                            </div>
                            <div className="absolute left-5 right-5 bottom-5 rounded-lg border-2 border-emerald-300 bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-200 py-2 text-center text-xl font-black text-emerald-900 shadow">{aktif ? "Kuşanıldı" : sahip ? "Kuşan" : "Satın al"}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-[22px] border-[3px] border-cyan-200 bg-gradient-to-b from-sky-100 via-blue-100 to-amber-50 p-6 text-center text-blue-900 shadow-xl">
                    <div className="flex h-44 items-center justify-center gap-10">
                      <div className={`h-28 w-28 rounded-3xl bg-gradient-to-br ${seciliDekor.renk} ${seciliDekor.cerceve} flex items-center justify-center text-6xl`}>{seciliDekor.ikon}</div>
                      <div className={`h-28 w-28 rounded-full bg-gradient-to-br from-amber-200 to-orange-500 ${seciliDekor.cerceve} flex items-center justify-center text-5xl`}>{profilAvatar}</div>
                    </div>
                    <div className="mx-auto mt-4 w-80 rounded-2xl border-4 border-cyan-300/60 bg-cyan-200/55 px-4 py-2 text-xl font-black text-blue-700">{seciliDekor.ad}</div>
                    <div className="mt-7 text-2xl font-black leading-9 text-blue-800">{seciliDekor.aciklama}</div>
                    <button onClick={() => dekorSatinAlVeyaKusan(seciliDekor)} className="mt-8 w-full rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-200 py-3 text-2xl font-black text-emerald-900 shadow hover:brightness-105 active:scale-95">
                      {alinanDekorlar.includes(seciliDekor.id) ? "Kuşan" : `${seciliDekor.fiyat} Jeton ile Satın Al`}
                    </button>
                  </div>
                </div>
              )}

              {["oge", "klan"].includes(magazaAktifSekme) && (
                <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-[28px] border border-cyan-300/25 bg-white/10 text-center">
                  <div>
                    <div className="text-5xl font-black">Yakında</div>
                    <div className="mt-3 text-xl font-bold text-cyan-100/80">Bu mağaza bölümü hazırlanıyor.</div>
                  </div>
                </div>
              )}
            </main>
          </div>
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
                  <div className="flex items-center gap-1">
                    <button disabled={butonYazisi1.startsWith("🔒")} onClick={() => { if (item.paraTuru === "Hile") ucretsizCipDestegiAl(); else if (isIstakaSekmesi) istakaSatinAlVeyaKusan(item.id, item.fiyati || "0", item.paraTuru as "CIP" | "TL"); }} className={`px-3 py-1 rounded-md text-[11px] font-bold border transition-all whitespace-nowrap ${suAnKusanilmis || item.durum === "Aktif" ? "bg-green-950/60 text-green-400 border-green-800" : zatenSatinAlinmis || item.durum === "Açık" ? "bg-blue-950/60 text-blue-400 border-blue-800 hover:bg-blue-900" : item.durum === "Yükle" ? "bg-green-600 text-white border-green-400 hover:bg-green-500" : butonYazisi1.startsWith("🔒") ? "bg-red-950/40 text-red-400 border-red-900/50 cursor-not-allowed font-medium text-[11px]" : item.paraTuru === "TL" ? "bg-amber-600 text-black border-amber-400 hover:bg-amber-500" : "bg-purple-950/60 text-purple-300 border-purple-900 hover:bg-purple-900"}`}>{butonYazisi1}</button>
                    {isIstakaSekmesi && item.id !== 1 && <button onClick={() => istakaHediyeEt(item.id, item.fiyati || "0", item.paraTuru as "CIP" | "TL")} className="px-2 py-1 rounded-md text-[10px] font-black border bg-pink-700 text-white border-pink-300 hover:bg-pink-600 whitespace-nowrap">🎁 Hediye</button>}
                  </div>
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


      {/* ======================================================== */}
      {/* MODAL: 101 OKEY OTOMATİK EŞLEŞME — MASA LİSTESİ DEĞİL     */}
      {/* ======================================================== */}
      {otomatikOkeyAcik && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm text-white">
          <div className="relative w-[760px] rounded-[30px] border-2 border-white/40 bg-gradient-to-b from-sky-100/95 via-white/95 to-amber-100/95 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-orange-400 via-yellow-300 to-cyan-300 opacity-80"></div>
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div>
                <h2 className="text-3xl font-black text-orange-700 drop-shadow-sm">101 Okey Otomatik Eşleşme</h2>
                <p className="text-sm font-bold text-slate-600">Giriş miktarını seç, sistem seni uygun masaya otomatik oturtsun.</p>
              </div>
              <button onClick={() => setOtomatikOkeyAcik(false)} className="w-11 h-11 rounded-full bg-white/80 text-sky-600 border-2 border-sky-200 text-2xl font-black shadow">×</button>
            </div>
            <div className="relative z-10 grid grid-cols-4 gap-4">
              {[
                {ad:'Başlangıç', ucret:10000, renk:'from-emerald-400 to-teal-600', aciklama:'Yeni başlayanlar'},
                {ad:'Orta Seviye', ucret:100000, renk:'from-sky-400 to-blue-600', aciklama:'Dengeli masalar'},
                {ad:'Usta Masası', ucret:500000, renk:'from-violet-400 to-purple-700', aciklama:'Yüksek rekabet'},
                {ad:'Yıldızlar', ucret:3000000, renk:'from-amber-300 to-orange-600', aciklama:'Büyük giriş'},
              ].map((secenek) => (
                <button
                  key={secenek.ad}
                  onClick={() => otomatikOkeyBaslat(secenek.ucret)}
                  className={`group rounded-[24px] bg-gradient-to-b ${secenek.renk} p-4 min-h-[210px] border-2 border-white/60 shadow-xl hover:-translate-y-2 hover:brightness-110 transition-all text-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.75),rgba(255,255,255,0)_55%)]"></div>
                  <div className="relative z-10 text-4xl mb-3">🀄</div>
                  <div className="relative z-10 text-xl font-black drop-shadow">{secenek.ad}</div>
                  <div className="relative z-10 mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-white/85 px-3 py-2 text-amber-700 font-black text-2xl shadow-inner"><CipSimgesi boyut="md" /> {secenek.ucret >= 1000000 ? `${secenek.ucret/1000000}M` : `${secenek.ucret/1000}K`}</div>
                  <div className="relative z-10 mt-3 text-xs font-bold text-white/95 drop-shadow">{secenek.aciklama}</div>
                  <div className="relative z-10 mt-4 rounded-full bg-black/20 px-3 py-1 text-xs font-black">Eşleşmeye gir</div>
                </button>
              ))}
            </div>
            <div className="relative z-10 mt-5 text-center text-xs font-bold text-slate-500">Not: Masa listesini görmek ve oda seçmek için sağdaki <b>Masa Aç</b> bölümünü kullan.</div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: LÜKS MASA LİSTESİ — OKEY / PİŞTİ / TAVLA            */}
      {/* ======================================================== */}
      {masaListeOyunu && (
        <div className="table-list-modal absolute inset-0 z-[100] overflow-hidden text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,244,207,0.55),rgba(177,124,54,0.18)_38%,rgba(17,26,42,0.92)_100%)]"></div>
          <div className="absolute inset-0 opacity-80 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_30%),linear-gradient(90deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_20%,rgba(255,255,255,0.08)_80%,rgba(255,255,255,0))]"></div>

          {/* Üst bar */}
          <div className="table-list-topbar relative z-10 flex items-center justify-between px-6 py-3 bg-black/22 backdrop-blur-sm border-b border-white/15">
            <div className="flex items-center gap-2 bg-black/35 rounded-xl px-4 py-2 shadow-lg">
              <CipSimgesi boyut="md" />
              <span className="font-black text-lg">{bakiyeCip.toLocaleString()}</span>
              <button onClick={() => { setVipMarketAcik(true); setMasaListeOyunu(null); }} className="ml-2 w-8 h-8 rounded-lg bg-emerald-500 text-white text-2xl leading-none shadow">+</button>
            </div>

            <div className="table-list-search flex items-center gap-3">
              <input placeholder="Oda numarası giriniz" className="w-72 rounded-xl bg-black/35 border border-white/20 px-4 py-2 text-sm font-bold outline-none placeholder:text-sky-100/70" />
              <button className="rounded-xl bg-gradient-to-b from-yellow-300 to-orange-500 text-amber-950 px-5 py-2 font-black shadow-lg">🔍 Ara</button>
            </div>

            <button onClick={() => setMasaListeOyunu(null)} className="w-11 h-11 rounded-full bg-cyan-500/90 border-2 border-cyan-200 text-2xl font-black shadow-xl">✕</button>
          </div>

          {/* Filtreler */}
          <div className="table-list-filters relative z-10 mx-auto mt-3 flex w-[88%] items-center justify-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sky-700 shadow-lg backdrop-blur">
            {['Farketmez','Katlamalı','Eşli','Yardımlı','25 sn','Farketmez'].map((f,i)=>(
              <button key={i} className="rounded-full bg-sky-100/80 px-4 py-1 text-xs font-black hover:bg-yellow-200">{f} ▾</button>
            ))}
            <button className="ml-2 rounded-full bg-sky-500 text-white px-3 py-1 font-black">↻</button>
          </div>

          <div className="table-list-cards relative z-10 mt-5 flex items-center justify-center gap-5 px-5">
            {[
              { no: 3262, el:'3 EL', ucret: masaListeOyunu === '101 Okey' ? '50' : masaListeOyunu === 'Pişti' ? '10.000' : '25.000', kat:'Katlamasız', tur:'Eşli', sure:'25sn', renk:'from-emerald-400/95 to-amber-100/95', oyuncular:['gül','Veysel ..','Mysterl..'], dolu:3 },
              { no: 3176, el:'1 EL', ucret: masaListeOyunu === '101 Okey' ? '50' : masaListeOyunu === 'Pişti' ? '20.000' : '50.000', kat:'Katlamasız', tur:'Eşli', sure:'25sn', renk:'from-green-300/95 to-yellow-100/95', oyuncular:['Nur','Fevzi Ce..','hüsocan'], dolu:3 },
              { no: 3991, el:'1 EL', ucret: masaListeOyunu === '101 Okey' ? '50' : masaListeOyunu === 'Pişti' ? '50.000' : '100.000', kat:'Katlamasız', tur:'Eşli', sure:'25sn', renk:'from-emerald-300/95 to-amber-100/95', oyuncular:['Çağrı16','arslan','Nuran S..'], dolu:3 },
              { no: 2225, el:'3 EL', ucret:'40.000', kat:'Katlamalı', tur:'Tek', sure:'15sn', renk:'from-sky-500/95 to-amber-100/95', oyuncular:['SM-A55..','Mustafa..'], dolu:2 },
            ].map((oda,idx)=>(
              <div key={oda.no} className={`table-list-card relative h-[380px] w-[250px] shrink-0 rounded-[28px] bg-gradient-to-b ${oda.renk} p-4 text-white shadow-[0_18px_35px_rgba(0,0,0,0.35)] border-2 border-white/45 overflow-hidden hover:-translate-y-2 transition-all`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.85),rgba(255,255,255,0)_55%)]"></div>
                <div className="relative z-10 flex items-center justify-between text-xs font-black drop-shadow">
                  <span>🏠{oda.no}</span>
                  <span className="rounded-lg bg-white/25 px-2 py-0.5">{masaListeOyunu}</span>
                </div>
                <div className="relative z-10 mt-4 flex items-center justify-center gap-3 text-2xl font-black drop-shadow">
                  <span>{oda.el}</span><span className="text-yellow-200">🎟 {oda.ucret}</span>
                </div>
                <div className="relative z-10 mt-2 flex items-center justify-center gap-4 text-lg font-black">
                  <span>{oda.kat}</span><span>{oda.tur}</span>
                </div>
                <div className="relative z-10 mt-2 flex items-center justify-center gap-3 text-sm font-black text-white/90">
                  <span>⏱ {oda.sure}</span><span>Yardımsız</span><span>Farketmez</span>
                </div>

                <div className="relative z-10 mt-8 mx-auto h-40 w-40 rounded-xl bg-gradient-to-br from-cyan-700 to-teal-900 border-4 border-amber-600 shadow-inner flex items-center justify-center">
                  <span className="text-4xl font-black text-yellow-200 drop-shadow">VS</span>
                  <button onClick={() => {
                    if (masaListeOyunu === '101 Okey') { setBakiyeCip(p => Math.max(0, p - parseInt(String(oda.ucret).replace(/\D/g,'')))); setOkeyAcik(true); setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); setOkeyDizMod('serbest'); }
                    if (masaListeOyunu === 'Pişti') { setPistiDurum(yeniPistiOyunu()); setPistiAcik(true); }
                    if (masaListeOyunu === 'Tavla') { setTavlaDurum(yeniTavlaOyunu()); setTavlaAcik(true); }
                    setMasaListeOyunu(null);
                  }} className="absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-sky-500 border-4 border-sky-200 text-5xl leading-none shadow-xl hover:scale-110">+</button>
                  {idx !== 2 && <button onClick={() => {
                    if (masaListeOyunu === '101 Okey') { setOkeyAcik(true); setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); setOkeyDizMod('serbest'); }
                    if (masaListeOyunu === 'Pişti') { setPistiDurum(yeniPistiOyunu()); setPistiAcik(true); }
                    if (masaListeOyunu === 'Tavla') { setTavlaDurum(yeniTavlaOyunu()); setTavlaAcik(true); }
                    setMasaListeOyunu(null);
                  }} className="absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-sky-500 border-4 border-sky-200 text-5xl leading-none shadow-xl hover:scale-110">+</button>}
                  {oda.oyuncular.map((o,i)=>(
                    <div key={o} className={`absolute ${i===0?'-top-9 left-12':i===1?'right-[-35px] bottom-8':'left-[-35px] bottom-6'} text-center`}>
                      <div className="mx-auto w-12 h-12 rounded-full bg-white border-2 border-cyan-300 shadow-lg flex items-center justify-center text-xl">{['👩','🧔','😎'][i]}</div>
                      <div className="mt-1 text-[10px] text-blue-900 font-black bg-white/70 rounded px-1">{o}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="table-list-actions relative z-10 mt-8 flex justify-center gap-5">
            <button onClick={() => {
              if (masaListeOyunu === '101 Okey') { setOkeyAcik(true); setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); setOkeyDizMod('serbest'); }
              if (masaListeOyunu === 'Pişti') { setPistiDurum(yeniPistiOyunu()); setPistiAcik(true); }
              if (masaListeOyunu === 'Tavla') { setTavlaDurum(yeniTavlaOyunu()); setTavlaAcik(true); }
              setMasaListeOyunu(null);
            }} className="rounded-2xl bg-gradient-to-b from-yellow-300 to-orange-500 px-12 py-3 text-xl font-black text-white shadow-xl border-b-4 border-orange-700">⌂ Oda oluştur</button>
            <button onClick={() => {
              if (masaListeOyunu === '101 Okey') { setOkeyAcik(true); setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); setOkeyDizMod('serbest'); }
              if (masaListeOyunu === 'Pişti') { setPistiDurum(yeniPistiOyunu()); setPistiAcik(true); }
              if (masaListeOyunu === 'Tavla') { setTavlaDurum(yeniTavlaOyunu()); setTavlaAcik(true); }
              setMasaListeOyunu(null);
            }} className="rounded-2xl bg-gradient-to-b from-emerald-300 to-teal-500 px-12 py-3 text-xl font-black text-white shadow-xl border-b-4 border-teal-700">» Hızlı giriş</button>
          </div>
        </div>
      )}

      {okeyAcik && !okeyDurum && !masaListeOyunu && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 text-white">
          <button onClick={() => setMasaListeOyunu('101 Okey')} className="rounded-2xl bg-orange-500 px-8 py-4 font-black">101 Okey masa listesine dön</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: OKEY OYUN EKRANI (4 KİŞİLİK MASA)                 */}
      {/* ======================================================== */}
      {okeyAcik && okeyDurum && (() => {
        const tema = ISTAKA_TEMALAR[kusanilanIstaka] || ISTAKA_TEMALAR[1];
        const istakaTakimZemini = `linear-gradient(90deg, ${tema.renkA} 0%, ${tema.renkA} 34%, ${tema.renkB} 34%, ${tema.renkB} 66%, ${tema.renkC || tema.renkA} 66%, ${tema.renkC || tema.renkA} 100%)`;
        const istakaParlakZemin = `radial-gradient(circle at 16% 10%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.16) 105px, transparent 235px), radial-gradient(circle at 84% 8%, rgba(255,255,255,0.38) 0px, rgba(255,255,255,0.10) 95px, transparent 230px), linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.10) 23%, rgba(0,0,0,0.16) 56%, rgba(0,0,0,0.68) 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 3px, rgba(0,0,0,0.05) 3px 7px, transparent 7px 18px), repeating-linear-gradient(115deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 8px, transparent 8px, transparent 26px), ${istakaTakimZemini}`;
        const dizAnaliz = okeyDizMod === 'seri'
          ? seriDiz(okeyDurum.oyuncular[0].el)
          : okeyDizMod === 'cift'
          ? ciftDiz(okeyDurum.oyuncular[0].el)
          : null;
        const dizPuan = dizAnaliz ? elPuanHesapla(dizAnaliz.gruplar, dizAnaliz.jokerler) : 0;
        const vipTasSayisiGorebilir = vipSeviyesi > 0;
        const rakipTasSayisiYazi = (idx: number) => vipTasSayisiGorebilir ? `${okeyDurum.oyuncular[idx].el.length} taş` : '';
        const sohbetSekmeleri = [
          { id: 'kanal1', ad: 'Kanal 1' }, { id: 'kanal2', ad: 'Kanal 2' }, { id: 'kanal3', ad: 'Kanal 3' },
          { id: 'kanal4', ad: 'Kanal 4' }, { id: 'kanal5', ad: 'Kanal 5' }, { id: 'kanal6', ad: 'Kanal 6' },
          { id: 'vip', ad: 'Vip' }, { id: 'oyun', ad: 'Masa' }, { id: 'ozel', ad: 'Özel' },
        ] as const;
        const ustSohbetSekmeleri = [
          { id: 'genel', ad: 'Genel', ikon: '🌐' }, { id: 'sehir', ad: 'Şehir', ikon: '🏙️' },
          { id: 'ozel', ad: 'Özel', ikon: '💬' }, { id: 'oyun', ad: 'Masa', ikon: '🃏' },
        ] as const;
        const kanalYanListe = [
          { id: 'kanal1', ad: 'Kanal 1' }, { id: 'kanal2', ad: 'Kanal 2' }, { id: 'kanal3', ad: 'Kanal 3' },
          { id: 'kanal4', ad: 'Kanal 4' }, { id: 'kanal5', ad: 'Kanal 5' }, { id: 'kanal6', ad: 'Kanal 6' }, { id: 'vip', ad: 'Vip' },
        ] as const;
        const profilAvatarlari = ['👑', '🟣', '🟢', '🔵'];
        const profilAvatarResimleri = [
          '/okey-assets/avatar-suleyman.svg',
          '/okey-assets/avatar-ahmet.svg',
          '/okey-assets/avatar-mehmet.svg',
          '/okey-assets/avatar-zeynep.svg',
        ];
        const oyunProfilResmi = (idx: number) => {
          if (idx === 0 && profilAvatar.startsWith('data:')) return profilAvatar;
          return profilAvatarResimleri[idx] || profilAvatarResimleri[0];
        };
        const profilRutbeleri = ['VIP 8', 'VIP 25', 'VIP 21', 'VIP 21'];
        const profilSeviyeleri = [130, 25, 21, 21];
        const profilSehirleri = ['İstanbul', 'Ankara', 'İzmir', 'Bursa'];
        const profilGizliSehir = [false, false, true, false];
        const profilCipleri = [bakiyeCip, 27000, 28100, 62900];
        const profilAylikKazanc = [184500, 52000, 81000, 136000];
        const profilAylikGalibiyet = [18, 7, 11, 16];
        const okeySohbetGonder = () => {
          const temiz = okeySohbetMetni.trim();
          if (!temiz) return;
          if (okeySohbetSekme === 'vip' && vipSeviyesi <= 0) {
            bildirimGoster("VIP gerekli", "VIP kanalına yazmak için önce VIP paketi satın almalısın.", "bilgi");
            return;
          }
          const hedefSohbetAnahtari = okeySohbetSekme === 'ozel' && okeyOzelSohbetKisi ? `ozel-${okeyOzelSohbetKisi}` : okeySohbetSekme;
          setOkeySohbetMesajlari(prev => ({
            ...prev,
            [hedefSohbetAnahtari]: [...(prev[hedefSohbetAnahtari] || []), { id: Date.now(), isim: isim || 'Süleyman', metin: temiz, zaman: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]
          }));
          setOkeySohbetMetni('');
        };

        // Taş renk stilleri — resimdeki gibi: beyaz zemin, renk + sembol
        const TAS_RENKLER: Record<string,{text:string; sembol: string}> = {
          kirmizi: { text:'text-red-600',    sembol:'♥' },
          siyah:   { text:'text-gray-900',   sembol:'♠' },
          mavi:    { text:'text-blue-600',   sembol:'♦' },
          sari:    { text:'text-yellow-500', sembol:'♣' },
          joker:   { text:'text-purple-600', sembol:'★' },
        };

        // Taş bileşeni — resimdeki gibi beyaz kart, üstte sayı, ortada sembol
        const Tas = ({ tas, onClick, disabled, pasif, secili, grupta, draggable, onDragStart, onDragOver, onDrop, mini }: {
          tas: {id:number;renk:string;deger:number;okeyMi:boolean};
          onClick?: ()=>void;
          disabled?: boolean;
          pasif?: boolean;
          secili?: boolean;
          grupta?: boolean;
          draggable?: boolean;
          onDragStart?: () => void;
          onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
          onDrop?: () => void;
          mini?: boolean;
        }) => {
          const r = TAS_RENKLER[tas.renk] || TAS_RENKLER['siyah'];
          const borderRenk: Record<string,string> = { kirmizi:'border-red-300', siyah:'border-gray-400', mavi:'border-blue-300', sari:'border-yellow-300', joker:'border-purple-300' };
          return (
            <div
              role="button"
              tabIndex={disabled || pasif ? -1 : 0}
              onClick={disabled || pasif ? undefined : onClick}
              draggable={Boolean(draggable && !disabled && !pasif)}
              onDragStart={(e) => { if (disabled || pasif) return; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(tas.id)); onDragStart?.(); }}
              onDragOver={(e) => { if (!disabled && !pasif) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver?.(e); } }}
              onDrop={(e) => { e.preventDefault(); if (!disabled && !pasif) onDrop?.(); }}
              onDragEnd={() => setOkeySuruklenenTas(null)}
              style={{
                transform: `perspective(620px) rotateX(6deg) ${secili ? 'translateY(-10px)' : ''}`,
                backgroundImage: "url('/okey-assets/tile-face.svg')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.95), inset 0 -4px 7px rgba(117,89,45,0.22), 0 7px 0 #c8b894, 0 13px 18px rgba(0,0,0,0.38)',
                touchAction: 'none'
              }}
              className={`relative ${mini ? 'w-[24px] h-[34px] rounded-md py-0.5' : 'w-[38px] h-[54px] rounded-lg py-1'} flex flex-col items-center justify-between shadow-md transition-all select-none border-2
                ${borderRenk[tas.renk] || 'border-gray-300'}
                ${secili ? 'shadow-[0_8px_20px_rgba(250,204,21,0.6)] ring-2 ring-yellow-400' : ''}
                ${grupta ? 'ring-1 ring-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : ''}
                ${!disabled && !pasif && !secili ? 'hover:-translate-y-3 hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)] cursor-grab active:cursor-grabbing active:scale-95' : ''}
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <span className={`${mini ? 'text-[7px]' : 'text-[11px]'} font-black leading-none ${r.text} w-full text-left pl-0.5`}>
                {tas.okeyMi ? '★' : tas.deger}
              </span>
              <span className={`${mini ? 'text-[10px]' : 'text-base'} font-black leading-none ${r.text}`}>
                {r.sembol}
              </span>
              <span className={`${mini ? 'text-[7px]' : 'text-[11px]'} font-black leading-none ${r.text} w-full text-right pr-0.5 rotate-180`}>
                {tas.okeyMi ? '★' : tas.deger}
              </span>
            </div>
          );
        };

        // Kapalı taş (bot için)
        const KapaliTas = ({ dikey, mini }: { dikey?: boolean; mini?: boolean }) => (
          <div
            className={`${mini ? 'w-[30px] h-[42px]' : dikey ? 'w-[34px] h-[48px]' : 'w-[42px] h-[56px]'} rounded-md border border-amber-300/70 shadow-[0_4px_0_rgba(75,38,12,0.88),0_8px_12px_rgba(0,0,0,0.34)] flex items-center justify-center overflow-hidden`}
            style={{
              backgroundImage: "url('/okey-assets/tile-back.svg')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent',
              transform: 'perspective(700px) rotateX(6deg)'
            }}>
            <div className="w-full h-full opacity-60" style={{backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, transparent 2px, transparent 8px)'}}></div>
          </div>
        );

        const OkeyProfilRozeti = ({ idx, className = "", yon = "bottom" }: { idx: number; className?: string; yon?: "top" | "left" | "right" | "bottom" }) => {
          const oyuncu = okeyDurum.oyuncular[idx];
          const aktif = okeyDurum.aktifOyuncu === idx;
          const ad = idx === 0 ? (isim || oyuncu?.isim || "Süleyman") : (oyuncu?.isim || "Oyuncu");
          const dikey = yon === "left" || yon === "right";

          return (
            <button
              type="button"
              onClick={() => oyunProfiliniAc(idx)}
              className={`okey-player-badge absolute z-[58] flex items-center gap-2 rounded-2xl border border-white/30 bg-slate-950/55 px-2.5 py-2 text-left text-white shadow-[0_16px_32px_rgba(0,0,0,0.38)] backdrop-blur-md transition hover:scale-[1.03] ${aktif ? "ring-2 ring-emerald-300" : ""} ${dikey ? "max-w-[156px]" : "min-w-[190px]"} ${className}`}
            >
              <span className={`relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-[3px] ${aktif ? "border-emerald-300" : "border-cyan-200"} bg-gradient-to-br from-sky-200 to-indigo-700 text-2xl font-black shadow-lg`}>
                <img src={oyunProfilResmi(idx)} alt="" className="h-full w-full object-cover" />
                <span className="absolute -bottom-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black leading-none text-amber-950">V{idx === 0 ? vipSeviyesi : profilSeviyeleri[idx]}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black drop-shadow">{ad}</span>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-black text-yellow-200">
                  <CipSimgesi boyut="xs" /> {profilCipleri[idx]?.toLocaleString("tr-TR")}
                </span>
                <span className={`mt-1 block text-[10px] font-black ${aktif ? "text-emerald-300" : "text-white/60"}`}>
                  {aktif ? "Sırası geldi" : idx === 0 ? "Sen" : rakipTasSayisiYazi(idx) || "Kapalı"}
                </span>
              </span>
            </button>
          );
        };

        const grupIdSet = new Set<number>();
        if (dizAnaliz) dizAnaliz.gruplar.forEach(g => g.forEach(t => grupIdSet.add(t.id)));

        // Istaka düzeni: mobil 101 Okey mantığı.
        // Taş sürüklenirken elden bağımsız hareket eder; bırakınca en yakın slota oturur.
        // Taşı ıstakanın üstüne/masa alanına bırakmak taş atma hareketidir; ayrı kutu yoktur.
        const el = okeyDurum.oyuncular[0].el;
        const SLOT_SAYISI = 14;
        const TAS_W = 38;
        const TAS_H = 54;
        const SLOT_W = 42;
        const RACK_PAD_X = 32;
        const ROW_Y = [12, 76];

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const tasVarsayilanPozisyon = (index: number) => ({
          x: RACK_PAD_X + (index % SLOT_SAYISI) * SLOT_W,
          y: ROW_Y[index < SLOT_SAYISI ? 0 : 1],
        });

        const pointerSlotIndex = (clientX: number, clientY: number) => {
          const rect = okeyIstakaRef.current?.getBoundingClientRect();
          if (!rect) return 0;
          const localX = clientX - rect.left;
          const localY = clientY - rect.top;
          const col = clamp(Math.round((localX - RACK_PAD_X - TAS_W / 2) / SLOT_W), 0, SLOT_SAYISI - 1);
          const row = localY < 68 ? 0 : 1;
          return clamp(row * SLOT_SAYISI + col, 0, el.length - 1);
        };

        const atmaAlanindaMi = (clientX: number, clientY: number) => {
          // Videodaki mantık: ayrı bir "buraya at" kutusu yok.
          // Oyuncu taşı kendi ıstakasından yukarı/masa alanına doğru sürükleyip bırakınca taş atılmış sayılır.
          const rect = okeyIstakaRef.current?.getBoundingClientRect();
          if (!rect) return false;
          return clientY < rect.top - 10;
        };

        const okeyTasiSlotaTasi = (tasId: number, hedefIndex: number) => {
          setOkeyDizMod('serbest');
          setOkeyDurum(prev => {
            if (!prev || prev.bitti) return prev;
            const d = { ...prev, oyuncular: prev.oyuncular.map(o => ({...o, el:[...o.el]})) };
            const elD = d.oyuncular[0].el;
            const kaynakIndex = elD.findIndex(t => t.id === tasId);
            if (kaynakIndex === -1) return prev;
            let temizHedef = clamp(hedefIndex, 0, elD.length - 1);
            const [tas] = elD.splice(kaynakIndex, 1);
            // Aynı listede sağa taşırken splice sonrası indeks bir eksilir; bu ayar üst üste binme hissini azaltır.
            if (kaynakIndex < temizHedef) temizHedef = Math.max(0, temizHedef);
            elD.splice(temizHedef, 0, tas);
            d.mesaj = 'Taşı ıstakada yeni yerine aldın.';
            return d;
          });
          setOkeyTasPozisyonlari(prev => {
            const kopya = { ...prev };
            delete kopya[tasId];
            return kopya;
          });
        };

        const renderIstakaTasi = (tas: OkeyTas, index: number) => {
          const aktifMi = okeyAktifSurukleme?.id === tas.id;
          const pos = aktifMi && okeyTasPozisyonlari[tas.id]
            ? okeyTasPozisyonlari[tas.id]
            : tasVarsayilanPozisyon(index);

          return (
            <div key={tas.id}
              className={`absolute touch-none transition-[left,top,transform] duration-150 ${aktifMi ? 'z-50 scale-105' : 'z-20'}`}
              style={{ left: pos.x, top: pos.y }}
              onPointerDown={(e) => {
                if (okeyDurum.bitti) return;
                const rect = okeyIstakaRef.current?.getBoundingClientRect();
                if (!rect) return;
                e.preventDefault();
                (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
                setOkeySecilenTaslar([tas.id]);
                setOkeyDizMod('serbest');
                setOkeyAktifSurukleme({
                  id: tas.id,
                  offsetX: e.clientX - rect.left - pos.x,
                  offsetY: e.clientY - rect.top - pos.y
                });
                setOkeyTasPozisyonlari(prev => ({ ...prev, [tas.id]: pos }));
              }}
              onPointerMove={(e) => {
                if (!okeyAktifSurukleme || okeyAktifSurukleme.id !== tas.id) return;
                const rect = okeyIstakaRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = clamp(e.clientX - rect.left - okeyAktifSurukleme.offsetX, 6, rect.width - TAS_W - 6);
                const y = clamp(e.clientY - rect.top - okeyAktifSurukleme.offsetY, 4, rect.height - TAS_H - 4);
                setOkeyTasPozisyonlari(prev => ({ ...prev, [tas.id]: { x, y } }));
              }}
              onPointerUp={(e) => {
                if (okeyAktifSurukleme?.id === tas.id) {
                  if (okeyDurum.aktifOyuncu === 0 && atmaAlanindaMi(e.clientX, e.clientY)) {
                    okeyTasAt(tas.id);
                    setOkeyTasPozisyonlari(prev => {
                      const kopya = { ...prev };
                      delete kopya[tas.id];
                      return kopya;
                    });
                    setOkeySecilenTaslar([]);
                  } else {
                    const hedefIndex = pointerSlotIndex(e.clientX, e.clientY);
                    okeyTasiSlotaTasi(tas.id, hedefIndex);
                  }
                }
                setOkeyAktifSurukleme(null);
              }}
              onPointerCancel={() => {
                setOkeyAktifSurukleme(null);
                setOkeyTasPozisyonlari(prev => {
                  const kopya = { ...prev };
                  delete kopya[tas.id];
                  return kopya;
                });
              }}>
              <Tas tas={tas}
                disabled={okeyDurum.bitti}
                secili={okeySecilenTaslar.includes(tas.id)}
                draggable={false}
                onClick={() => {
                  if (okeyDurum.bitti) return;
                  setOkeySecilenTaslar(prev => prev[0] === tas.id ? [] : [tas.id]);
                }} />
            </div>
          );
        };

        const renderAtilanTasKumesi = (oyuncuIdx: number, className: string, baseRotate = 0) => {
          const taslar = (okeyDurum.atilanTasGecmisi || [])
            .filter(kayit => kayit.oyuncuIdx === oyuncuIdx)
            .slice(-3);

          if (!taslar.length) return null;

          return (
            <div className={`okey-discard-pile absolute z-40 h-[76px] w-[92px] pointer-events-none ${className}`}>
              {taslar.map((kayit, i) => (
                <div
                  key={`atilan-${oyuncuIdx}-${kayit.tas.id}-${i}`}
                  className="absolute"
                  style={{
                    left: `${i * 10}px`,
                    top: `${i * 4}px`,
                    zIndex: i + 1,
                    transform: `rotate(${baseRotate + (i - 1) * 4}deg)`,
                  }}
                >
                  <Tas tas={kayit.tas} pasif />
                </div>
              ))}
            </div>
          );
        };

        return (
          <div className="okey-screen okey-pro-screen absolute inset-0 z-[100] overflow-hidden flex flex-col"
            style={{background: 'linear-gradient(180deg, #efe3ce 0%, #d7b982 38%, #3d2411 100%)'}}>
            {/* Lüks lounge arka planı — örneğe benzer, ama kopya olmayan sıcak salon atmosferi */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.92) 0 0, rgba(255,244,214,0.72) 18%, transparent 34%), radial-gradient(circle at 72% 20%, rgba(255,255,255,0.52) 0 0, transparent 25%), linear-gradient(135deg, rgba(255,255,255,0.18), rgba(93,47,16,0.28))'
              }}></div>
              <div className="absolute left-[8%] top-[7%] w-[22%] h-[42%] rounded-t-full border-[10px] border-amber-200/65 bg-gradient-to-b from-sky-200/70 to-blue-400/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.65),0_18px_35px_rgba(95,52,17,0.25)]"></div>
              <div className="absolute left-[38%] top-[5%] w-[22%] h-[40%] rounded-t-full border-[10px] border-amber-200/65 bg-gradient-to-b from-sky-200/65 to-blue-400/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.65),0_18px_35px_rgba(95,52,17,0.25)]"></div>
              <div className="absolute right-[8%] top-[7%] w-[22%] h-[42%] rounded-t-full border-[10px] border-amber-200/65 bg-gradient-to-b from-sky-200/70 to-blue-400/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.65),0_18px_35px_rgba(95,52,17,0.25)]"></div>
              <div className="absolute left-0 right-0 bottom-0 h-[42%]" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(153,93,35,0.35)), repeating-linear-gradient(115deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 48px)'}}></div>
              <div className="absolute -left-24 bottom-10 w-72 h-72 rounded-full bg-emerald-900/18 blur-2xl"></div>
              <div className="absolute -right-16 bottom-6 w-72 h-72 rounded-full bg-amber-300/20 blur-2xl"></div>
            </div>

            {/* ÜST PANEL */}
            <div className="hidden" style={{background: 'linear-gradient(90deg, rgba(20,30,55,0.88), rgba(57,31,15,0.72), rgba(20,30,55,0.88))', boxShadow:'0 8px 24px rgba(0,0,0,0.22)'}}>
              {/* Sol oyuncu (Bot 1) */}
              <div onClick={() => oyunProfiliniAc(1)} className="flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 border-2 border-purple-400 flex items-center justify-center text-lg font-black text-white shadow-lg">
                    {okeyDurum.oyuncular[1].isim[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-black px-1 rounded shadow">25</div>
                </div>
                <div>
                  <div className="font-black text-white text-xs">{okeyDurum.oyuncular[1].isim}</div>
                  <div className="inline-flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><CipSimgesi boyut="xs" /> 27.0K</div>
                </div>
                {vipTasSayisiGorebilir && <div className="bg-black/40 border border-emerald-400/40 text-emerald-300 rounded-lg px-2 py-0.5 text-xs font-black">{rakipTasSayisiYazi(1)}</div>}
              </div>

              {/* Orta: Karşı oyuncu (Bot 2) */}
              <div className="flex flex-col items-center gap-1">
                <div onClick={() => oyunProfiliniAc(2)} className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-1 cursor-pointer hover:bg-black/65 transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-700 border-2 border-teal-300 flex items-center justify-center text-base font-black text-white shadow">
                    {okeyDurum.oyuncular[2].isim[0]}
                  </div>
                  <div>
                    <div className="font-black text-white text-xs">{okeyDurum.oyuncular[2].isim}</div>
                    <div className="inline-flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><CipSimgesi boyut="xs" /> 28.1K</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {vipTasSayisiGorebilir && <div className="bg-black/40 border border-emerald-400/40 text-emerald-300 rounded px-2 py-0.5 text-[10px] font-bold">{rakipTasSayisiYazi(2)}</div>}
                  <div className="bg-black/40 border border-white/20 rounded px-2 py-0.5 text-green-400 text-[10px] font-bold">🕐 {okeyDurum.aktifOyuncu === 0 ? '--' : '20s'}</div>
                </div>
              </div>

              {/* Sağ: Bot 3 + Gösterge + çıkış */}
              <div className="flex items-center gap-3">
                {/* Gösterge taşı */}
                {okeyDurum.gosterge && (() => {
                  const g = okeyDurum.gosterge!;
                  const r = TAS_RENKLER[g.renk] || TAS_RENKLER['siyah'];
                  return (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[8px] text-gray-400 font-bold">GÖSTERGE</span>
                      <div className={`w-8 h-11 rounded-md bg-white border-2 flex flex-col items-center justify-between py-0.5 shadow-md ${r.text === 'text-red-600' ? 'border-red-300' : r.text === 'text-blue-600' ? 'border-blue-300' : r.text === 'text-yellow-500' ? 'border-yellow-300' : 'border-gray-400'}`}>
                        <span className={`text-[9px] font-black leading-none ${r.text} w-full text-left pl-0.5`}>{g.deger}</span>
                        <span className={`text-sm font-black ${r.text}`}>{r.sembol}</span>
                        <span className={`text-[9px] font-black leading-none ${r.text} rotate-180`}>{g.deger}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/40 rounded px-1.5 py-0.5">
                        <span className="text-[8px] text-yellow-300 font-bold">OKEY: {okeyDurum.okeyDeger}</span>
                      </div>
                    </div>
                  );
                })()}

                <div onClick={() => oyunProfiliniAc(3)} className="flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-600 to-red-800 border-2 border-orange-400 flex items-center justify-center text-lg font-black text-white shadow-lg">
                      {okeyDurum.oyuncular[3].isim[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-black px-1 rounded shadow">21</div>
                  </div>
                  <div>
                    <div className="font-black text-white text-xs">{okeyDurum.oyuncular[3].isim}</div>
                    <div className="inline-flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><CipSimgesi boyut="xs" /> 62.9K</div>
                    {vipTasSayisiGorebilir && <div className="mt-0.5 bg-black/40 border border-emerald-400/40 text-emerald-300 rounded px-1.5 py-0.5 text-[9px] font-black inline-block">{rakipTasSayisiYazi(3)}</div>}
                  </div>
                </div>
                <button onClick={() => { setOkeyAcik(false); setOkeyDurum(null); setOkeyDizMod('serbest'); }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-black text-white text-xs ml-2">✕</button>
              </div>
            </div>

            {/* SOL SOHBET AÇMA KUTUSU */}
            <button
              onClick={() => setOkeySohbetAcik(true)}
              className="hidden"
              title="Sohbet">
              <span className="text-[26px] leading-none drop-shadow">🎙️</span>
              <span className="text-[11px] leading-none">Sohbet</span>
            </button>

            {/* SOHBET PANELİ — kompakt, üst üste binmeyen, örnekteki kanal düzenine yakın */}
            {okeySohbetAcik && (
              <div className="absolute left-4 top-20 z-[130] w-[760px] h-[560px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] rounded-2xl border-2 border-sky-200 bg-sky-100/95 shadow-[0_18px_48px_rgba(13,71,161,0.34)] overflow-hidden backdrop-blur-md pointer-events-auto">
                <div className="h-14 flex items-stretch bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 border-b border-white/60">
                  {ustSohbetSekmeleri.map(({ id, ikon, ad }) => {
                    const genelAktif = id === 'genel' && (okeySohbetSekme.startsWith('kanal') || okeySohbetSekme === 'vip');
                    const aktif = genelAktif || okeySohbetSekme === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          if (id === 'genel') { setGenelKanalMenuAcik(v => !v); if (!okeySohbetSekme.startsWith('kanal') && okeySohbetSekme !== 'vip') setOkeySohbetSekme('kanal1'); }
                          else { setGenelKanalMenuAcik(false); setOkeySohbetSekme(id as 'sehir' | 'ozel' | 'oyun'); if (id !== 'ozel') setOkeyOzelSohbetKisi(null); }
                        }}
                        className={`flex-1 min-w-[92px] px-2 text-sm font-black transition-all flex items-center justify-center gap-1.5 border-r border-white/20 ${aktif ? 'bg-gradient-to-b from-amber-300 to-orange-400 text-white' : 'text-white/80 hover:text-white hover:bg-white/15'}`}
                      >
                        <span className="text-xl leading-none">{ikon}</span>
                        <span className="leading-none">{ad}</span>
                        {id === 'genel' && <span className="text-xs">▾</span>}
                      </button>
                    );
                  })}
                  <button onClick={() => setOkeySohbetAcik(false)} className="w-12 shrink-0 bg-white/18 hover:bg-white/30 text-white text-2xl font-black">×</button>
                </div>

                <div className="flex h-[calc(100%_-_56px)]">
                  <div className={`${genelKanalMenuAcik ? 'w-[142px] p-2 border-r-2' : 'w-0 p-0 border-r-0'} shrink-0 bg-gradient-to-b from-blue-500 to-blue-600 border-sky-200/70 flex flex-col gap-1.5 overflow-hidden transition-all duration-200`}>
                    {kanalYanListe.map(({ id, ad }) => (
                      <button
                        key={id}
                        onClick={() => { setOkeySohbetSekme(id as typeof okeySohbetSekme); setGenelKanalMenuAcik(false); }}
                        className={`h-[52px] rounded-xl text-base font-black transition-all border ${okeySohbetSekme === id ? 'bg-gradient-to-br from-amber-200 via-orange-300 to-orange-500 text-white border-yellow-100 shadow-[0_7px_14px_rgba(180,83,9,0.34)]' : id === 'vip' ? 'bg-gradient-to-br from-violet-500 to-indigo-700 text-white/90 border-white/20 font-serif text-xl' : 'bg-white/10 text-white/82 border-white/10 hover:bg-white/20'}`}
                      >
                        {id === 'vip' && vipSeviyesi <= 0 ? '🔒 Vip' : ad}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 min-w-0 bg-gradient-to-b from-white/88 via-sky-50/90 to-sky-100/96">
                    <div className="h-16 px-4 py-2 bg-white/50 border-b border-sky-200 flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-200 to-sky-400 border-2 border-white shadow flex items-center justify-center text-2xl shrink-0">🖼️</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-blue-700 font-black text-sm truncate">Trend sohbet odaları ⌃</div>
                        <div className="text-sky-700 text-xs font-bold truncate">Gönderilen kanal: <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-white shadow">{sohbetSekmeleri.find(s => s.id === okeySohbetSekme)?.ad}</span></div>
                      </div>
                      {okeySohbetSekme.startsWith('kanal') && <div className="rounded-xl bg-red-500 text-white text-xs font-black px-3 py-2 shadow shrink-0">+50 yeni mesaj var</div>}
                    </div>

                    <div className="h-[calc(100%_-_144px)] overflow-y-auto p-4 space-y-4">
                      {okeySohbetSekme === 'vip' && vipSeviyesi <= 0 && (
                        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 text-white border-2 border-violet-200 p-4 shadow-lg flex items-center gap-3">
                          <div className="text-3xl">🔒</div>
                          <div><div className="font-black">VIP Kanal Kilitli</div><div className="text-sm text-white/80">Bu kanalda sadece VIP paketi olan oyuncular yazabilir.</div></div>
                        </div>
                      )}

                      {okeySohbetSekme === 'ozel' ? (
                        !okeyOzelSohbetKisi ? (
                          <div className="space-y-3">
                            {[
                              { ad: 'ELİZ', msg: 'iyi yükselmişsn', zaman: '06/11 16:28', rozet:'77', renk:'text-orange-600' },
                              { ad: 'Ova', msg: 'Size nasıl yardımcı olabilirim?', zaman: '06/07 07:20', rozet:'✓', renk:'text-green-600' },
                              { ad: 'Zeyno', msg: 'slm rica etsem 3 m atarmısınız?', zaman: '06/05 00:34', rozet:'99', renk:'text-orange-700' },
                              { ad: 'Murat.k..', msg: 'adamsn', zaman: '05/31 23:31', rozet:'V', renk:'text-blue-700' },
                            ].map((p, i) => (
                              <button key={i} onClick={() => setOkeyOzelSohbetKisi(p.ad)} className="w-full text-left flex items-center gap-3 rounded-2xl bg-white/76 border border-sky-100 p-3 shadow-sm hover:bg-white hover:scale-[1.01] active:scale-[0.99] transition-all">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-300 to-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-xl shrink-0">{p.ad[0]}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2"><span className={`font-black ${p.renk}`}>{p.ad}</span><span className="text-[10px] rounded-full bg-blue-200 text-blue-700 px-1.5 py-0.5 font-black">{p.rozet}</span><span className="ml-auto text-gray-500 text-xs font-bold">{p.zaman}</span></div>
                                  <div className="mt-1 rounded-xl bg-sky-100 border border-sky-200 px-3 py-2 text-gray-700 font-bold truncate">{p.msg}</div>
                                </div>
                                <div className="text-blue-500 font-black text-xl">›</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col">
                            <div className="flex items-center gap-3 rounded-2xl bg-white/80 border border-sky-200 p-3 shadow-sm mb-3">
                              <button onClick={() => setOkeyOzelSohbetKisi(null)} className="w-9 h-9 rounded-full bg-blue-500 text-white font-black shadow">‹</button>
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-300 to-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-xl shrink-0">{okeyOzelSohbetKisi[0]}</div>
                              <div className="min-w-0"><div className="font-black text-blue-800 truncate">{okeyOzelSohbetKisi}</div><div className="text-xs text-sky-600 font-bold">Özel sohbet açık</div></div>
                            </div>
                            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-300 to-blue-500 border-2 border-white shadow flex items-center justify-center text-sm shrink-0">{okeyOzelSohbetKisi[0]}</div>
                                <div className="rounded-2xl rounded-tl-sm bg-white border border-sky-200 px-4 py-2 text-blue-900 font-bold shadow-sm max-w-[70%]">Merhaba, özel sohbet buradan devam eder.</div>
                              </div>
                              {(okeySohbetMesajlari[`ozel-${okeyOzelSohbetKisi}`] || []).map((m) => (
                                <div key={m.id} className="flex justify-end">
                                  <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-500 to-sky-400 text-white px-4 py-2 font-bold shadow max-w-[72%] break-words">{m.metin}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ) : (okeySohbetMesajlari[okeySohbetSekme] || []).length === 0 ? (
                        <div className="h-full flex items-center justify-center text-blue-400/55 text-sm font-black text-center px-8">Bu kanalda henüz mesaj yok.</div>
                      ) : (
                        <>
                          {(okeySohbetMesajlari[okeySohbetSekme] || []).map((m, i) => (
                            <div key={m.id} className={`flex items-start gap-3 ${i % 2 ? 'ml-8' : ''}`}>
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-200 to-orange-400 border-2 border-white shadow-lg flex items-center justify-center text-blue-700 font-black shrink-0">{m.isim[0]}</div>
                              <div className="min-w-0 max-w-[72%]">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-blue-700 text-sm font-black truncate">{m.isim}</span>
                                  <span className="text-white text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500 shadow">30</span>
                                  <span className="text-blue-300 text-[10px] font-bold">{m.zaman}</span>
                                </div>
                                <div className="relative inline-block rounded-xl bg-white border-2 border-orange-300 px-4 py-2 text-blue-800 text-sm font-bold shadow-[0_5px_12px_rgba(30,64,175,0.18)] break-words">
                                  {m.metin}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <div className="absolute left-0 right-0 bottom-0 h-20 p-3 bg-gradient-to-r from-sky-400 to-blue-500 border-t border-white/70 flex items-center gap-2">
                      <button onClick={()=>setSohbetDuyuruAcik(v=>!v)} className="w-10 h-10 rounded-full bg-yellow-200 text-blue-700 text-lg font-black shadow shrink-0">{sohbetDuyuruAcik ? '📢' : '🔕'}</button>
                      <button onClick={()=>bildirimGoster("Sesli mesaj", "Sesli mesaj özelliği hazırlanıyor.", "bilgi")} className="w-10 h-10 rounded-full bg-yellow-200 text-blue-700 text-lg font-black shadow shrink-0">🎙️</button>
                      <button onClick={()=>setSohbetSesAcik(v=>!v)} className="w-10 h-10 rounded-full bg-yellow-200 text-blue-700 text-lg font-black shadow shrink-0">{sohbetSesAcik ? '🔊' : '🔇'}</button>
                      <input
                        value={okeySohbetMetni}
                        onChange={(e) => setOkeySohbetMetni(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') okeySohbetGonder(); }}
                        disabled={okeySohbetSekme === 'vip' && vipSeviyesi <= 0}
                        placeholder={okeySohbetSekme === 'vip' && vipSeviyesi <= 0 ? 'VIP kanalına yazmak için VIP paketi satın almalısın...' : 'Mesajınızı yazın...'}
                        className="flex-1 min-w-0 rounded-xl bg-blue-700/45 border border-white/35 px-4 py-3 text-sm text-white outline-none focus:border-yellow-200 placeholder:text-white/55 font-bold disabled:opacity-55 disabled:cursor-not-allowed"
                      />
                      <button className="w-10 h-10 rounded-full bg-yellow-200 text-blue-700 text-lg font-black shadow shrink-0">😊</button>
                      <button onClick={okeySohbetGonder} disabled={okeySohbetSekme === 'vip' && vipSeviyesi <= 0} className="rounded-2xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white px-5 py-3 text-base font-black border-2 border-yellow-100 shadow-[0_8px_16px_rgba(180,83,9,0.35)] hover:brightness-110 disabled:grayscale disabled:opacity-60 disabled:cursor-not-allowed shrink-0">{okeySohbetSekme === 'vip' && vipSeviyesi <= 0 ? 'VIP' : 'Gönder'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OYUNCU PROFİL DETAY PANELİ */}
            {okeyProfilAcik && okeyProfilIndex !== 0 && (
              <div className="absolute inset-0 z-[140] flex items-center justify-center bg-black/55 backdrop-blur-sm" onClick={() => setOkeyProfilAcik(false)}>
                <div className="w-[470px] rounded-[2rem] border-4 border-sky-200/80 bg-gradient-to-b from-sky-100 via-white to-blue-100 shadow-[0_0_60px_rgba(96,165,250,0.45)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="relative h-32 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 overflow-hidden">
                    <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 20% 20%, white 0 2px, transparent 2px), radial-gradient(circle at 70% 30%, white 0 2px, transparent 2px)', backgroundSize:'34px 34px'}}></div>
                    <button onClick={() => setOkeyProfilAcik(false)} className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/25 hover:bg-white/40 text-white font-black shadow">×</button>
                    <div className="absolute left-6 -bottom-10 w-24 h-24 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-200 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center text-4xl">
                      <img src={oyunProfilResmi(okeyProfilIndex)} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute left-36 bottom-4 text-white drop-shadow">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black">{okeyProfilIndex === 0 ? isim : okeyDurum.oyuncular[okeyProfilIndex]?.isim}</span>
                        <span className="rounded-full bg-yellow-300 text-orange-700 px-2 py-0.5 text-xs font-black">{profilRutbeleri[okeyProfilIndex]}</span>
                      </div>
                      <div className="text-sm font-bold text-white/90">Oyuncu Detay Kartı · Seviye {profilSeviyeleri[okeyProfilIndex]}</div>
                    </div>
                  </div>

                  <div className="pt-12 px-5 pb-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-2xl bg-white border border-sky-200 p-3 text-center shadow-sm">
                        <div className="text-[10px] text-sky-600 font-black uppercase">Şehir</div>
                        <div className="text-blue-900 font-black">{profilGizliSehir[okeyProfilIndex] ? 'Gizli' : profilSehirleri[okeyProfilIndex]}</div>
                      </div>
                      <div className="rounded-2xl bg-white border border-sky-200 p-3 text-center shadow-sm">
                        <div className="text-[10px] text-sky-600 font-black uppercase">Çip</div>
                        <div className="inline-flex items-center justify-center gap-1.5 text-yellow-600 font-black"><CipSimgesi boyut="sm" /> {profilCipleri[okeyProfilIndex]?.toLocaleString()}</div>
                      </div>
                      <div className="rounded-2xl bg-white border border-sky-200 p-3 text-center shadow-sm">
                        <div className="text-[10px] text-sky-600 font-black uppercase">Oto Galibiyet</div>
                        <div className="text-cyan-700 font-black">{profilAylikGalibiyet[okeyProfilIndex]}</div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-r from-blue-50 to-sky-100 border border-sky-200 p-4 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-blue-800 font-black">Son 1 Ay Performans</div>
                        <div className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-black">+{profilAylikKazanc[okeyProfilIndex]?.toLocaleString()} çip</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between rounded-xl bg-white/75 px-3 py-2"><span className="text-gray-600 font-bold">Kazanılan oyun</span><span className="font-black text-blue-700">{profilAylikGalibiyet[okeyProfilIndex]} kez</span></div>
                        <div className="flex justify-between rounded-xl bg-white/75 px-3 py-2"><span className="text-gray-600 font-bold">Otomatik eşleşme kazancı</span><span className="inline-flex items-center gap-1 font-black text-emerald-600">+{profilAylikKazanc[okeyProfilIndex]?.toLocaleString()} <CipSimgesi boyut="xs" /></span></div>
                        <div className="flex justify-between rounded-xl bg-white/75 px-3 py-2"><span className="text-gray-600 font-bold">Şehir gizliliği</span><span className="font-black text-purple-600">{profilGizliSehir[okeyProfilIndex] ? 'Açık' : 'Kapalı'}</span></div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <button className="rounded-2xl bg-gradient-to-b from-yellow-300 to-orange-500 text-white font-black py-3 shadow">Hediye</button>
                      <button onClick={() => { const hedef = okeyProfilIndex === 0 ? (isim || 'Süleyman') : (okeyDurum.oyuncular[okeyProfilIndex]?.isim || 'Oyuncu'); setOkeyProfilAcik(false); setOkeySohbetAcik(true); setOkeySohbetSekme('ozel'); setOkeyOzelSohbetKisi(hedef); }} className="rounded-2xl bg-gradient-to-b from-sky-300 to-blue-500 text-white font-black py-3 shadow">Özel Mesaj</button>
                      <button className="rounded-2xl bg-gradient-to-b from-violet-300 to-purple-600 text-white font-black py-3 shadow">Arkadaş Ekle</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OKEY 16:9 UI LAYOUT */}
            <div className="okey-layout-v2 absolute inset-0 z-10 overflow-hidden">
              <button
                onClick={() => setOkeySohbetAcik(true)}
                className="okey-table-menu-v2"
                title="Sohbet"
              >
                ☰
              </button>
              <button
                onClick={() => { setOkeyAcik(false); setOkeyDurum(null); setOkeyDizMod('serbest'); }}
                className="okey-table-close-v2"
                aria-label="Oyundan çık"
              >
                ×
              </button>

              <OkeyProfilRozeti idx={2} yon="top" className="okey-seat-v2 okey-seat-top-v2" />
              <OkeyProfilRozeti idx={1} yon="left" className="okey-seat-v2 okey-seat-left-v2" />
              <OkeyProfilRozeti idx={3} yon="right" className="okey-seat-v2 okey-seat-right-v2" />
              <OkeyProfilRozeti idx={0} yon="bottom" className="okey-seat-v2 okey-seat-self-v2" />

              <div className="okey-table-v2">
                <div className="okey-table-felt-v2" />
                <div className="okey-table-watermark-v2">
                  <span>LOUNGE</span>
                  <b>101 CLUB</b>
                </div>

                {okeyDurum.gosterge && (() => {
                  const g = okeyDurum.gosterge!;
                  const gStil = TAS_RENKLER[g.renk] || TAS_RENKLER.siyah;
                  const oStil = TAS_RENKLER[okeyDurum.okeyRenk] || TAS_RENKLER.siyah;
                  const borderSinifi = (renk: string) => {
                    if (renk === 'kirmizi') return 'border-red-300';
                    if (renk === 'mavi') return 'border-blue-300';
                    if (renk === 'sari') return 'border-yellow-300';
                    if (renk === 'joker') return 'border-purple-300';
                    return 'border-gray-400';
                  };
                  const bilgiTasi = (deger: number, renk: string, stil: typeof gStil) => (
                    <div className={`okey-info-tile-v2 ${borderSinifi(renk)}`}>
                      <span className={stil.text}>{deger}</span>
                      <strong className={stil.text}>{stil.sembol}</strong>
                      <em className={stil.text}>{deger}</em>
                    </div>
                  );
                  return (
                    <div className="okey-info-panel-v2">
                      <div className="okey-info-card-v2">
                        <small>Gösterge</small>
                        {bilgiTasi(g.deger, g.renk, gStil)}
                      </div>
                      <div className="okey-info-card-v2">
                        <small>Okey</small>
                        {bilgiTasi(okeyDurum.okeyDeger, okeyDurum.okeyRenk, oStil)}
                      </div>
                      <div className="okey-rule-card-v2">
                        <b>{okeyDurum.katlamali ? 'Katlamalı' : 'Katlamasız'}</b>
                        <span>Açma {okeyDurum.minAcmaPuani || 101}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="okey-open-melds-v2">
                  {okeyDurum.oyuncular.map((oy, idx) => oy.acildi && oy.acilanGruplar?.length ? (
                    <div key={`acilan-${idx}`} className="okey-open-player-v2">
                      <span>{oy.isim} · {oy.acikPuan}</span>
                      <div>
                        {oy.acilanGruplar.slice(0, 4).map((grup, gi) => (
                          <div key={`g-${idx}-${gi}`} className="okey-open-group-v2">
                            {grup.slice(0, 5).map(t => <Tas key={`acik-${idx}-${gi}-${t.id}`} tas={t} mini pasif />)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null)}
                </div>

                <div className="opponent-rack-v2 opponent-rack-top-v2">
                  <img src="/okey-assets/rack-opponent-top.svg" alt="" />
                </div>
                <div className="opponent-rack-v2 opponent-rack-left-v2">
                  <img src="/okey-assets/rack-opponent-side.svg" alt="" />
                </div>
                <div className="opponent-rack-v2 opponent-rack-right-v2">
                  <img src="/okey-assets/rack-opponent-side.svg" alt="" />
                </div>

                <div className="okey-deck-area-v2">
                  <button
                    onClick={okeyTasCek}
                    disabled={okeyDurum.aktifOyuncu !== 0 || okeyDurum.bitti || okeyDurum.kalanDeste.length === 0 || okeyDurum.oyuncuTasCektiMi || el.length >= 22}
                    className={okeyDurum.aktifOyuncu === 0 && !okeyDurum.bitti && !okeyDurum.oyuncuTasCektiMi && el.length < 22 ? 'is-ready' : ''}
                  >
                    🂠
                  </button>
                  <span>{okeyDurum.kalanDeste.length}</span>
                </div>

                {renderAtilanTasKumesi(1, 'okey-discard-left-v2', -9)}
                {renderAtilanTasKumesi(2, 'okey-discard-top-v2', 2)}
                {renderAtilanTasKumesi(3, 'okey-discard-right-v2', 9)}

                <div className="okey-turn-pill-v2">
                  {okeyDurum.aktifOyuncu === 0 ? 'Sıra sende' : `${okeyDurum.oyuncular[okeyDurum.aktifOyuncu]?.isim} oynuyor`}
                </div>
              </div>

              {renderAtilanTasKumesi(0, 'okey-discard-self-v2', -3)}

              <button
                type="button"
                onClick={() => { setOkeySohbetAcik(true); setOkeySohbetSekme('oyun'); }}
                className="okey-mini-chat-v2"
              >
                {(okeySohbetMesajlari.oyun?.slice(-2).length ? okeySohbetMesajlari.oyun.slice(-2) : [
                  { id: 801, isim: 'Sistem', metin: 'Oyun içi konuşmalar burada görünür.', zaman: 'şimdi' }
                ]).map((m) => (
                  <span key={m.id}>
                    <b>{m.isim}:</b> {m.metin}
                  </span>
                ))}
              </button>

              <div className="okey-hand-bar-v2">
                <div className="okey-hand-stats-v2">
                  <span>{el.length} taş</span>
                  {okeyDurum.oyuncular[0].acildi && <span>Açıldı: {okeyDurum.oyuncular[0].acikPuan}</span>}
                  {dizAnaliz && <span>{dizAnaliz.gruplar.length} per · {dizPuan} puan · {dizAnaliz.tekler.length} tek</span>}
                </div>
                <div className="okey-hand-actions-v2">
                  {!okeyDurum.bitti && !okeyDurum.oyuncular[0].acildi && (() => {
                    const a = okeyElAcmaAnalizi(okeyDurum.oyuncular[0].el);
                    return a.acabilir ? (
                      <button onClick={okeyElAc}>El Aç ({a.puan})</button>
                    ) : <span>Açma: {a.puan}/101</span>;
                  })()}
                  {okeyDurum.bitti && (
                    <button onClick={() => { setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); setOkeyDizMod('serbest'); }}>
                      Yeni El
                    </button>
                  )}
                </div>
              </div>

              <div className="okey-main-rack okey-main-rack-asset okey-main-rack-v2"
                style={{
                  background: istakaParlakZemin,
                  boxShadow: `inset 0 4px 0 rgba(255,255,255,0.45), inset 0 18px 32px rgba(255,255,255,0.14), inset 0 -28px 38px rgba(0,0,0,0.62), 0 18px 0 rgba(65,28,8,0.95), 0 28px 36px rgba(0,0,0,0.62), 0 0 28px ${tema.renkB}66`,
                }}>
                <img src="/okey-assets/rack-main-premium.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                <div
                  className="okey-fan-rack-skin pointer-events-none absolute left-[8.5%] right-[8.5%] bottom-[14%] top-[59%] rounded-xl opacity-95"
                  style={{ background: istakaTakimZemini }}
                >
                  <span className="okey-fan-rack-mark">{tema.logo}</span>
                  <b>{tema.takim}</b>
                </div>
                <div
                  ref={okeyIstakaRef}
                  className="okey-rack-slots okey-rack-slots-v2 relative z-10 mx-auto select-none"
                  onPointerUp={() => { setOkeyAktifSurukleme(null); }}>
                  <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: Math.max(28, el.length) }).map((_, i) => {
                      const slot = tasVarsayilanPozisyon(i);
                      return (
                        <span
                          key={`slot-${i}`}
                          className="absolute rounded-lg border border-white/10 bg-black/10 shadow-inner"
                          style={{ left: slot.x, top: slot.y, width: TAS_W, height: TAS_H }}
                        />
                      );
                    })}
                  </div>
                  {el.map(renderIstakaTasi)}
                </div>
              </div>

              <div className="okey-sort-buttons-v2">
                <button onClick={() => okeyDizMod === 'seri' ? setOkeyDizMod('serbest') : okeyEliDiz('seri')} className={okeyDizMod === 'seri' ? 'is-active' : ''}>
                  <span><i>1</i><i>2</i><i>3</i></span>
                  <b>Seri Diz</b>
                </button>
                <button onClick={() => okeyDizMod === 'cift' ? setOkeyDizMod('serbest') : okeyEliDiz('cift')} className={okeyDizMod === 'cift' ? 'is-active' : ''}>
                  <span><i>5</i><i>5</i><i>5</i></span>
                  <b>Çift Diz</b>
                </button>
              </div>
            </div>

            {/* MASA ALANI */}
            <div className="hidden okey-table-shell okey-asset-stage relative z-10 flex-1 overflow-hidden mx-auto my-2 w-[96vw] max-w-[1380px] rounded-[1.35rem] border-[7px] border-white/95"
              style={{
                background: 'linear-gradient(180deg, rgba(255,246,224,0.98) 0%, rgba(226,202,158,0.96) 16%, rgba(54,101,177,0.98) 16%, rgba(54,101,177,0.98) 100%)',
                boxShadow: '0 26px 60px rgba(0,0,0,0.50), inset 0 0 0 2px rgba(204,151,65,0.60)'
              }}>
              <img src="/okey-assets/table-stage.svg" alt="" className="okey-stage-bg pointer-events-none absolute inset-0 h-full w-full object-fill" />
              <button
                onClick={() => setOkeySohbetAcik(true)}
                className="okey-table-menu absolute left-5 top-5 z-[80] grid h-12 w-12 place-items-center rounded-2xl border border-white/30 bg-black/35 text-2xl font-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.34)] backdrop-blur-md hover:bg-black/50"
                title="Sohbet ve masa menüsü"
              >
                ☰
              </button>
              <button
                onClick={() => { setOkeyAcik(false); setOkeyDurum(null); setOkeyDizMod('serbest'); }}
                className="okey-table-close absolute right-5 top-5 z-[80] grid h-12 w-12 place-items-center rounded-full border-2 border-white/55 bg-black/30 text-4xl font-light leading-none text-white shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:bg-white/15"
                aria-label="Oyundan çık"
              >
                ×
              </button>

              <OkeyProfilRozeti idx={2} yon="top" className="okey-badge-top left-1/2 top-[9.8%] -translate-x-1/2 -translate-y-1/2" />
              <OkeyProfilRozeti idx={1} yon="left" className="okey-badge-left left-[1.3%] top-[49%] -translate-y-1/2" />
              <OkeyProfilRozeti idx={3} yon="right" className="okey-badge-right right-[1.3%] top-[49%] -translate-y-1/2" />

              {/* Salon dekoru: örnekteki gibi masa etrafında lüks oda hissi */}
              <div className="okey-css-room-layer absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute left-0 right-0 top-0 h-[18%]" style={{background:'linear-gradient(180deg, rgba(255,247,229,0.92), rgba(204,166,103,0.38)), repeating-linear-gradient(90deg, rgba(116,72,28,0.12) 0 16px, transparent 16px 64px)'}}></div>
                <div className="absolute left-[8%] top-[3%] w-20 h-32 rounded-b-full bg-gradient-to-b from-amber-100 to-amber-700/30 blur-[1px]"></div>
                <div className="absolute right-[7%] top-[4%] w-24 h-28 rounded-b-full bg-gradient-to-b from-amber-100 to-amber-700/30 blur-[1px]"></div>
                <div className="absolute left-3 top-[22%] w-24 h-40 rounded-r-[2.5rem] bg-gradient-to-br from-blue-900 via-blue-800 to-amber-900 border-r-4 border-amber-200/70 shadow-[0_14px_28px_rgba(0,0,0,0.34)]"></div>
                <div className="absolute right-3 top-[22%] w-24 h-40 rounded-l-[2.5rem] bg-gradient-to-bl from-blue-900 via-blue-800 to-amber-900 border-l-4 border-amber-200/70 shadow-[0_14px_28px_rgba(0,0,0,0.34)]"></div>
                <div className="absolute left-10 top-[20%] text-4xl drop-shadow-lg">☕</div>
                <div className="absolute right-8 top-[18%] text-5xl drop-shadow-lg">📯</div>
              </div>

              {/* Mavi oyun bezi */}
              <div className="okey-css-felt-layer absolute left-4 right-4 top-[14%] bottom-5 rounded-b-[1.1rem] rounded-t-[2.3rem] border-x-[10px] border-b-[10px] border-t-[5px] border-amber-100/90"
                style={{
                  background: 'radial-gradient(circle at 50% 28%, rgba(138,184,255,0.36), transparent 34%), linear-gradient(180deg, rgba(71,119,197,0.98) 0%, rgba(48,93,176,0.98) 50%, rgba(36,73,149,0.99) 100%)',
                  boxShadow: 'inset 0 0 95px rgba(10,35,88,0.56), inset 0 0 0 3px rgba(255,255,255,0.12), 0 18px 32px rgba(0,0,0,0.24)'
                }}></div>
              <div className="okey-css-felt-layer absolute left-4 right-4 top-[14%] bottom-5 rounded-b-[1.1rem] rounded-t-[2.3rem] pointer-events-none opacity-30"
                style={{backgroundImage:'radial-gradient(circle at 35% 45%, rgba(255,255,255,0.22), transparent 14%), repeating-linear-gradient(135deg, rgba(255,255,255,0.075) 0 2px, transparent 2px 20px)'}}></div>

              {/* Üst duyuru bandı */}
              <div className="okey-table-announcement absolute top-4 left-1/2 -translate-x-1/2 z-20 px-7 py-1.5 rounded-full bg-black/35 border border-white/20 text-white text-sm font-black shadow-lg">
                📣 VIP seviyesine yükseldi, tüm oyuncular arasında göz kamaştırıcı bir oyuncu oldu!
              </div>

              {/* Masa logosu */}
              <div className="okey-table-watermark absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none flex flex-col items-center">
                <div className="okey-table-watermark-title">LOUNGE</div>
                <div className="okey-table-watermark-sub">
                  <span className="text-white/55 text-4xl rotate-[-10deg]">🃏</span>
                  <strong>101 CLUB</strong>
                </div>
              </div>

              {/* Oyun bilgileri: gösterge, okey, minimum açma ve katlamalı durumu */}
              {okeyDurum.gosterge && (() => {
                const g = okeyDurum.gosterge!;
                const r = TAS_RENKLER[g.renk] || TAS_RENKLER['siyah'];
                const borderSinifi = (renk: string) => {
                  if (renk === 'kirmizi') return 'border-red-300';
                  if (renk === 'mavi') return 'border-blue-300';
                  if (renk === 'sari') return 'border-yellow-300';
                  return 'border-gray-400';
                };
                const bilgiTasi = (deger: number, renk: string, stil: typeof r) => (
                  <div className={`okey-info-tile relative h-[58px] w-[42px] rounded-lg border-2 bg-white shadow-[0_5px_0_rgba(110,88,56,0.45),0_9px_14px_rgba(0,0,0,0.28)] ${borderSinifi(renk)}`}>
                    <span className={`absolute left-1 top-0.5 text-[11px] font-black leading-none ${stil.text}`}>{deger}</span>
                    <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-black ${stil.text}`}>{stil.sembol}</span>
                    <span className={`absolute bottom-0.5 right-1 rotate-180 text-[11px] font-black leading-none ${stil.text}`}>{deger}</span>
                  </div>
                );
                return (
                  <div className="okey-table-info-panel absolute right-[19%] top-[12.5%] z-40 flex items-center gap-2 rounded-xl bg-black/28 px-2 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-black tracking-wider text-white/70">GÖSTERGE</span>
                      {bilgiTasi(g.deger, g.renk, r)}
                    </div>
                    <div className="okey-rule-badge min-w-[104px] rounded-xl bg-slate-950/45 px-3 py-2 text-right font-black leading-tight text-white shadow-inner">
                      <div className="text-base">{okeyDurum.katlamali ? 'Katlamalı' : 'Katlamasız'}</div>
                      <div className="mt-1 text-[11px] text-sky-100">Açma {okeyDurum.minAcmaPuani || 101}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Açılan eller — oyuncular 101'i bulunca perler masanın ortasında görünür */}
              <div className="okey-open-melds absolute left-1/2 top-[36%] -translate-x-1/2 z-[35] w-[48%] max-h-[190px] overflow-hidden pointer-events-none flex flex-col gap-2 items-center">
                {okeyDurum.oyuncular.map((oy, idx) => oy.acildi && oy.acilanGruplar?.length ? (
                  <div key={`acilan-${idx}`} className="rounded-2xl bg-black/22 border border-white/15 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                    <div className="text-[10px] font-black text-cyan-100 mb-1">{oy.isim} açtı · {oy.acikPuan} puan</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {oy.acilanGruplar.slice(0, 4).map((grup, gi) => (
                        <div key={`g-${idx}-${gi}`} className="flex gap-0.5 bg-white/10 rounded-lg p-1">
                          {grup.slice(0, 5).map(t => <Tas key={`acik-${idx}-${gi}-${t.id}`} tas={t} mini disabled />)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null)}
              </div>

              {/* Rakip ıstakaları — örnekteki gibi masa kenarına oturan lüks 3D ahşap ayaklar */}
              <div className="absolute top-[15.5%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                <div className="opponent-rack opponent-rack-top relative w-[430px] h-[92px]" style={{transform:'perspective(900px) rotateX(12deg)'}}>
                  <img src="/okey-assets/rack-opponent-top.svg" alt="" className="h-full w-full object-fill drop-shadow-[0_18px_20px_rgba(0,0,0,0.35)]" />
                </div>
              </div>

              <div className="okey-rack-side-left absolute left-[11.3%] top-[25%] bottom-[16%] z-20 w-[92px]">
                <div className="opponent-rack opponent-rack-left relative h-full" style={{transform:'perspective(900px) rotateY(-14deg)'}}>
                  <img src="/okey-assets/rack-opponent-side.svg" alt="" className="h-full w-full object-fill drop-shadow-[14px_18px_18px_rgba(0,0,0,0.34)]" />
                </div>
              </div>

              <div className="okey-rack-side-right absolute right-[11.3%] top-[25%] bottom-[16%] z-20 w-[92px]">
                <div className="opponent-rack opponent-rack-right relative h-full" style={{transform:'perspective(900px) rotateY(14deg)'}}>
                  <img src="/okey-assets/rack-opponent-side.svg" alt="" className="h-full w-full scale-x-[-1] object-fill drop-shadow-[-14px_18px_18px_rgba(0,0,0,0.34)]" />
                </div>
              </div>

              {/* SAĞ ÜST: Deste + sayaç */}
              <div className="okey-deck-area absolute right-[9%] top-[18%] z-40 flex items-center gap-4">
                {/* Deste */}
                <div className="flex flex-col items-center gap-1">
                  <button onClick={okeyTasCek}
                    disabled={okeyDurum.aktifOyuncu !== 0 || okeyDurum.bitti || okeyDurum.kalanDeste.length === 0 || okeyDurum.oyuncuTasCektiMi || el.length >= 22}
                    className={`relative group transition-all ${okeyDurum.aktifOyuncu === 0 && !okeyDurum.bitti && !okeyDurum.oyuncuTasCektiMi && el.length < 22 ? 'cursor-pointer hover:scale-110' : 'opacity-60 cursor-not-allowed'}`}>
                    <div className="absolute -top-1 -left-1 w-10 h-14 rounded-lg border-2 border-amber-700" style={{background: 'linear-gradient(135deg, #7c5a2e, #4a3018)'}}></div>
                    <div className="absolute top-0 left-0 w-10 h-14 rounded-lg border-2 border-amber-600" style={{background: 'linear-gradient(135deg, #8c6a3e, #5a4028)'}}></div>
                    <div className="relative w-10 h-14 rounded-lg border-2 border-amber-500 flex items-center justify-center shadow-xl" style={{background: 'linear-gradient(135deg, #9c7a4e, #6a5038)'}}>
                      <span className="text-amber-100 text-2xl group-hover:scale-110 transition-all drop-shadow">🃏</span>
                    </div>
                  </button>
                  <div className="bg-black/60 border border-white/20 rounded-lg px-2 py-0.5">
                    <span className="text-white font-black text-xs">{okeyDurum.kalanDeste.length}</span>
                  </div>
                </div>

                {/* Ortada atılan taş kutusu yok; taşlar oyuncu yönlerine düşer. */}
              </div>



              {/* Oyuncuların attığı taşlar kendi kenarlarında görünür */}
              {renderAtilanTasKumesi(1, 'okey-discard-left left-[18%] top-[26%]', -9)}
              {renderAtilanTasKumesi(2, 'okey-discard-top left-1/2 top-[17.5%] -translate-x-1/2', 2)}
              {renderAtilanTasKumesi(3, 'okey-discard-right right-[18%] top-[26%]', 9)}
              {renderAtilanTasKumesi(0, 'okey-discard-self right-[21%] bottom-[10.5%]', -3)}

              {/* OYUN İÇİ CANLI SOHBET — panel açmadan masada görünür */}
              <div className="okey-table-live-chat absolute left-6 bottom-6 z-20 w-[360px] pointer-events-none">
                <div className="rounded-2xl bg-black/35 backdrop-blur-sm border border-white/10 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] space-y-1">
                  {(okeySohbetMesajlari.oyun?.slice(-3).length ? okeySohbetMesajlari.oyun.slice(-3) : [
                    { id: 801, isim: 'Sistem', metin: 'Masa sohbeti burada canlı görünür.', zaman: 'şimdi' }
                  ]).map((m) => (
                    <div key={m.id} className="text-[13px] leading-5 font-black drop-shadow">
                      <span className="text-cyan-300">{m.isim}:</span> <span className="text-white/95">{m.metin}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mesaj bandı (ortada küçük) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-20 bg-black/60 border border-white/10 rounded-full px-4 py-1">
                <span className={`text-xs font-bold ${okeyDurum.aktifOyuncu === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                  {okeyDurum.aktifOyuncu === 0 ? '🟢 Sıra sende' : `🔴 ${okeyDurum.oyuncular[okeyDurum.aktifOyuncu]?.isim} oynuyor`}
                </span>
              </div>
            </div>

            {/* ALT PANEL: Istaka + Oyuncu eli + Kontroller */}
            <div className="hidden okey-player-dock relative z-10 flex-shrink-0" style={{background: 'linear-gradient(180deg, rgba(72,38,12,0.95) 0%, rgba(32,15,5,0.98) 100%)', borderTop: '3px solid #d39b45', boxShadow:'0 -14px 34px rgba(0,0,0,0.28)'}}>

              {/* Istaka + el bilgisi satırı */}
              <div className="flex justify-between items-center px-4 py-1.5 border-b border-amber-900/50">
                {/* Sol: Oyuncu profili + istaka */}
                <div onClick={() => oyunProfiliniAc(0)} className="flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition-transform">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-800 border-4 border-amber-400 flex items-center justify-center overflow-hidden text-xl font-black text-white shadow-lg border-2">
                      <img src={oyunProfilResmi(0)} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-black px-1 rounded border border-black">V{vipSeviyesi}</div>
                  </div>
                  <div>
                    <div className="font-black text-white text-xs">{isim}</div>
                    <div className="inline-flex items-center gap-1 text-yellow-400 text-[10px] font-bold"><CipSimgesi boyut="xs" /> {bakiyeCip.toLocaleString()}</div>
                  </div>
                  <div className="hidden sm:flex flex-col items-start gap-1 ml-3">
                    <div className={`px-3 py-1 rounded-full border ${tema.kenarlık} ${tema.efekt} text-[10px] font-black shadow-lg`}
                      style={{background: istakaTakimZemini, color: tema.metinRenk}}>
                      {tema.isim} · {tema.takim} kuşanıldı
                    </div>
                    <div className="text-[9px] text-white/40 font-bold">Satın aldığın ıstaka ana elde kullanılıyor</div>
                  </div>
                </div>

                {/* Orta: El bilgisi */}
                <div className="flex items-center gap-4 text-xs text-white/60 font-bold">
                  <div className="flex items-center gap-1">
                    <span>🃏</span><span>{el.length} taş</span>
                  </div>
                  {okeyDurum.oyuncular[0].acildi && <div className="text-cyan-300">Açıldı: {okeyDurum.oyuncular[0].acikPuan}</div>}
                  {dizAnaliz && (
                    <>
                      <div className="text-green-400">{dizAnaliz.gruplar.length} per</div>
                      <div className="text-yellow-400">{dizPuan} puan</div>
                      <div className="text-red-400">{dizAnaliz.tekler.length} tek</div>
                    </>
                  )}
                </div>

                {/* Sağ: Oyun durumu */}
                <div className="flex gap-2 items-center">
                  {!okeyDurum.bitti && !okeyDurum.oyuncular[0].acildi && (() => { const a = okeyElAcmaAnalizi(okeyDurum.oyuncular[0].el); return a.acabilir ? (
                    <button onClick={okeyElAc} className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black px-4 py-1.5 rounded-lg text-xs hover:brightness-110">✅ El Aç ({a.puan})</button>
                  ) : <div className="rounded-lg bg-black/20 border border-white/10 px-3 py-1.5 text-[10px] font-black text-white/50">Açma: {a.puan}/101</div>; })()}
                  {okeyDurum.bitti && (
                    <button onClick={() => { setOkeyDurum(yeniOkeyOyunu(isim || 'Oyuncu')); setOkeyDizMod('serbest'); }}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black px-4 py-1.5 rounded-lg text-xs hover:brightness-110">
                      🔄 Yeni El
                    </button>
                  )}
                </div>
              </div>

              {/* EL — 3D Istaka üzerinde taşlar */}
              <button
                type="button"
                onClick={() => { setOkeySohbetAcik(true); setOkeySohbetSekme('oyun'); }}
                className="okey-dock-chat-strip text-left"
              >
                {(okeySohbetMesajlari.oyun?.slice(-2).length ? okeySohbetMesajlari.oyun.slice(-2) : [
                  { id: 801, isim: 'Sistem', metin: 'Masa sohbeti burada görünür.', zaman: 'şimdi' }
                ]).map((m) => (
                  <span key={m.id} className="block truncate">
                    <b>{m.isim}:</b> {m.metin}
                  </span>
                ))}
              </button>

              <div className="px-4 pt-3 pb-4">
                <div className={`okey-main-rack okey-main-rack-asset relative mx-auto max-w-[980px] min-h-[142px] rounded-t-2xl border-x-4 border-t-4 ${tema.kenarlık} overflow-visible ${tema.efekt}`}
                  style={{
                    background: istakaParlakZemin,
                    boxShadow: `inset 0 4px 0 rgba(255,255,255,0.45), inset 0 18px 32px rgba(255,255,255,0.14), inset 0 -28px 38px rgba(0,0,0,0.62), 0 18px 0 rgba(65,28,8,0.95), 0 28px 36px rgba(0,0,0,0.62), 0 0 28px ${tema.renkB}66`,
                    transform: 'perspective(900px) rotateX(5deg)',
                    transformOrigin: 'bottom center'
                  }}>
                  <img src="/okey-assets/rack-main-premium.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
                  <div
                    className="okey-fan-rack-skin pointer-events-none absolute left-[8.5%] right-[8.5%] bottom-[14%] top-[59%] rounded-xl opacity-95"
                    style={{ background: istakaTakimZemini }}
                  >
                    <span className="okey-fan-rack-mark">{tema.logo}</span>
                    <b>{tema.takim}</b>
                  </div>
                  <div className="rack-css-deco absolute left-4 right-4 top-3 h-8 rounded-full bg-white/18 blur-sm opacity-65 pointer-events-none"></div>
                  <div className="rack-css-deco absolute left-4 right-4 top-[58px] h-[4px] rounded-full bg-black/35 shadow-inner"></div>
                  <div className="rack-css-deco absolute left-1/2 top-7 -translate-x-1/2 w-28 h-16 rounded-2xl border-2 border-white/25 bg-black/20 flex flex-col items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.35)] pointer-events-none">
                    <div className="text-2xl font-black leading-none" style={{color: tema.metinRenk}}>{tema.logo}</div>
                    <div className="text-[9px] font-black tracking-widest" style={{color: tema.metinRenk}}>{tema.takim}</div>
                  </div>
                  <div className="rack-css-deco absolute left-0 right-0 bottom-0 h-8 rounded-b-xl"
                    style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.35))'}}></div>

                  <div
                    ref={okeyIstakaRef}
                    className="okey-rack-slots relative z-10 mx-auto mt-3 h-[136px] w-[704px] max-w-[calc(100%_-_32px)] select-none"
                    onPointerUp={() => { setOkeyAktifSurukleme(null); }}>
                    <div className="pointer-events-none absolute inset-0">
                      {Array.from({ length: Math.max(28, el.length) }).map((_, i) => {
                        const slot = tasVarsayilanPozisyon(i);
                        return (
                          <span
                            key={`slot-${i}`}
                            className="absolute rounded-lg border border-white/10 bg-black/10 shadow-inner"
                            style={{ left: slot.x, top: slot.y, width: TAS_W, height: TAS_H }}
                          />
                        );
                      })}
                    </div>
                    {el.map(renderIstakaTasi)}
                  </div>

                  {/* Taş atmak için kutu yok: taşı ıstakadan yukarı/masa alanına sürükleyip bırak. */}


                  <div className="rack-css-deco absolute left-1/2 bottom-2 -translate-x-1/2 font-black tracking-widest select-none flex items-center gap-3 opacity-80" style={{color: tema.metinRenk}}>
                    <span className="text-3xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)]">{tema.logo}</span>
                    <span className="text-xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)]">{tema.takim}</span>
                  </div>
                </div>
                <div className="rack-css-bottom mx-auto max-w-[1000px] h-5 rounded-b-2xl border-x-4 border-b-4 border-black/70"
                  style={{background: `linear-gradient(180deg, ${tema.renkC || tema.renkA} 0%, #090909 100%)`, boxShadow: '0 10px 20px rgba(0,0,0,0.55)'}}></div>
                <div className="text-center text-[10px] text-white/45 font-bold mt-1">Taşı basılı tutup sağa-sola diz · Taş atmak için ıstakadan yukarı/masaya sürükleyip bırak</div>
              </div>

              {/* Seri Diz / Çift Diz butonları — resimdeki gibi sağ köşe altın kartlar */}
              <div className="okey-sort-buttons absolute bottom-8 right-4 flex flex-col gap-2" style={{zIndex:20}}>
                {/* SERİ DİZ */}
                <button
                  onClick={() => okeyDizMod === 'seri' ? setOkeyDizMod('serbest') : okeyEliDiz('seri')}
                  className="okey-sort-action relative overflow-hidden transition-all active:scale-95"
                  style={{
                    width: '80px', height: '62px',
                    borderRadius: '10px',
                    background: okeyDizMod === 'seri'
                      ? 'linear-gradient(160deg, #ff9f2f 0%, #e07010 40%, #b85008 100%)'
                      : 'linear-gradient(160deg, #c87820 0%, #a05a10 40%, #7a3e08 100%)',
                    border: okeyDizMod === 'seri' ? '2px solid #ffcc60' : '2px solid #c8820a',
                    boxShadow: okeyDizMod === 'seri'
                      ? '0 0 16px rgba(255,160,48,0.7), 0 4px 8px rgba(0,0,0,0.5)'
                      : '0 4px 8px rgba(0,0,0,0.5)',
                  }}>
                  {/* İç parlaklık */}
                  <div style={{position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)', borderRadius:'8px 8px 0 0'}}></div>
                  {/* Mini taş sayıları */}
                  <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'2px', marginTop:'6px'}}>
                    {['1','2','3'].map((n, i) => (
                      <div key={i} style={{
                        width:'16px', height:'20px',
                        background: 'linear-gradient(180deg, #fff 60%, #f0ecdc)',
                        border: '1.5px solid #d4a030',
                        borderRadius: '3px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.4)',
                        color: i===0?'#e53e3e':i===1?'#2563eb':'#1a1a1a',
                        fontSize: '9px',
                        fontWeight: 900,
                      }}>{n}</div>
                    ))}
                  </div>
                  {/* Yazı */}
                  <div style={{
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 900,
                    textAlign: 'center',
                    marginTop: '4px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    letterSpacing: '0.5px',
                  }}>Seri Diz</div>
                </button>

                {/* ÇİFT DİZ */}
                <button
                  onClick={() => okeyDizMod === 'cift' ? setOkeyDizMod('serbest') : okeyEliDiz('cift')}
                  className="okey-sort-action relative overflow-hidden transition-all active:scale-95"
                  style={{
                    width: '80px', height: '62px',
                    borderRadius: '10px',
                    background: okeyDizMod === 'cift'
                      ? 'linear-gradient(160deg, #d4a030 0%, #a87820 40%, #7a5210 100%)'
                      : 'linear-gradient(160deg, #8a6010 0%, #6a4808 40%, #4a3005 100%)',
                    border: okeyDizMod === 'cift' ? '2px solid #f0c040' : '2px solid #9a7018',
                    boxShadow: okeyDizMod === 'cift'
                      ? '0 0 16px rgba(212,160,48,0.7), 0 4px 8px rgba(0,0,0,0.5)'
                      : '0 4px 8px rgba(0,0,0,0.5)',
                  }}>
                  <div style={{position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)', borderRadius:'8px 8px 0 0'}}></div>
                  {/* Mini taş sayıları — çift: 5-5-5 */}
                  <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'2px', marginTop:'6px'}}>
                    {['5','5','5'].map((n, i) => (
                      <div key={i} style={{
                        width:'16px', height:'20px',
                        background: 'linear-gradient(180deg, #fff 60%, #f0ecdc)',
                        border: '1.5px solid #b08020',
                        borderRadius: '3px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.4)',
                        color: i===0?'#e53e3e':i===1?'#2563eb':'#1a1a1a',
                        fontSize: '9px',
                        fontWeight: 900,
                      }}>{n}</div>
                    ))}
                  </div>
                  <div style={{
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 900,
                    textAlign: 'center',
                    marginTop: '4px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    letterSpacing: '0.5px',
                  }}>Çift Diz</div>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL: PİŞTİ OYUN EKRANI                                  */}
      {/* ======================================================== */}
      {pistiAcik && pistiDurum && (
        <div className="pisti-screen absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="w-[820px] bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.3)] overflow-hidden flex flex-col">

            {/* Başlık Bar */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🃏</span>
                <div>
                  <h2 className="font-black text-lg text-white">Pişti — Hızlı Eşleşme</h2>
                  <p className="text-blue-200 text-[10px]">vs Bot Rakip · Anlık</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center bg-black/30 px-4 py-1.5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-blue-300 font-bold">SEN</div>
                  <div className="font-black text-yellow-400 text-sm">{pistiDurum.oyuncuSkor} puan</div>
                </div>
                <div className="text-white font-black text-lg">vs</div>
                <div className="text-center bg-black/30 px-4 py-1.5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-blue-300 font-bold">BOT</div>
                  <div className="font-black text-red-400 text-sm">{pistiDurum.botSkor} puan</div>
                </div>
                <button
                  onClick={() => { setPistiAcik(false); setPistiDurum(null); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-black text-white ml-2"
                >✕</button>
              </div>
            </div>

            {/* Masa Alanı */}
            <div className="flex-1 flex flex-col items-center px-6 py-4 gap-4">

              {/* Bot Eli (ters) */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-bold mr-1">🤖 BOT</span>
                {pistiDurum.botEl.map((_, i) => (
                  <div key={i} className="w-10 h-14 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-900 border-2 border-blue-500/40 shadow-md flex items-center justify-center">
                    <span className="text-blue-400 text-lg">🂠</span>
                  </div>
                ))}
                <span className="text-[10px] text-gray-500 ml-2">{pistiDurum.botToplanan} kart</span>
              </div>

              {/* Yerdeki Kartlar + Deste */}
              <div className="flex-1 flex items-center justify-center gap-6 w-full">
                {/* Deste */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-900 to-blue-950 border-2 border-indigo-500/50 shadow-lg flex items-center justify-center relative">
                    <span className="text-indigo-400 text-xl">🂠</span>
                    <span className="absolute -bottom-5 text-[9px] text-gray-500 font-bold">{pistiDurum.deste.length} kart</span>
                  </div>
                </div>

                {/* Yer */}
                <div className="relative w-40 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/10 bg-white/5"></div>
                  {pistiDurum.yer.length === 0 ? (
                    <span className="text-gray-600 text-xs font-bold">YER BOŞ</span>
                  ) : (
                    <div className="flex -space-x-3">
                      {pistiDurum.yer.slice(-3).map((k, i) => {
                        const s = kartSeriSembol(k.seri);
                        return (
                          <div key={k.id} className="w-11 h-16 rounded-lg bg-white border-2 border-gray-200 shadow-xl flex flex-col justify-between p-1 relative"
                            style={{zIndex: i, transform: `rotate(${(i-1)*5}deg)`}}>
                            <span className={`text-xs font-black ${s.c}`}>{k.deger}{s.s}</span>
                            <span className={`text-xl self-center ${s.c}`}>{s.s}</span>
                            <span className={`text-xs font-black self-end rotate-180 ${s.c}`}>{k.deger}{s.s}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mesaj */}
                <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 max-w-[180px] text-center">
                  <p className="text-white text-sm font-bold leading-tight">{pistiDurum.mesaj}</p>
                  <p className="text-gray-500 text-[9px] mt-1">{pistiDurum.sira === 'oyuncu' ? '🟢 Sıra sende' : '🔴 Bot oynuyor...'}</p>
                </div>
              </div>

              {/* Oyuncu Eli */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {pistiDurum.oyuncuEl.map((k) => {
                    const s = kartSeriSembol(k.seri);
                    return (
                      <button
                        key={k.id}
                        onClick={() => pistiKartAt(k.id)}
                        disabled={pistiDurum.sira !== 'oyuncu' || pistiDurum.bitti}
                        className={`w-14 h-20 rounded-xl bg-white border-2 shadow-xl flex flex-col justify-between p-1.5 transition-all
                          ${pistiDurum.sira === 'oyuncu' && !pistiDurum.bitti
                            ? 'border-blue-400 hover:-translate-y-3 hover:shadow-[0_8px_25px_rgba(59,130,246,0.5)] cursor-pointer active:scale-95'
                            : 'border-gray-300 opacity-60 cursor-not-allowed'}`}
                      >
                        <span className={`text-sm font-black ${s.c}`}>{k.deger}{s.s}</span>
                        <span className={`text-2xl self-center ${s.c}`}>{s.s}</span>
                        <span className={`text-sm font-black self-end rotate-180 ${s.c}`}>{k.deger}{s.s}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  <span>👤 {isim} · {pistiDurum.oyuncuToplanan} kart toplandı</span>
                  {pistiDurum.bitti && (
                    <button onClick={() => setPistiDurum(yeniPistiOyunu())}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-blue-500">
                      🔄 Yeniden Oyna
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAVLA TAKİM SEÇİM EKRANI                           */}
      {/* ======================================================== */}
      {tavlaTakimSecimAcik && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-lg">
          <div className="w-[500px] bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.2)]">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="font-black text-xl text-white">🎲 Takım Seç</h2>
                <p className="text-emerald-200 text-[11px]">Tavla pullarının rengi seçtiğin takıma göre değişir</p>
              </div>
              <button onClick={() => setTavlaTakimSecimAcik(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-black text-white">✕</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {FUTBOL_TAKIMLARI.map((t) => {
                const sahip = sahipOlunanTakimlar.includes(t.id);
                const secili = seciliTakim.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (!sahip) {
                        if (bakiyeCip >= t.fiyat) {
                          setBakiyeCip(p => p - t.fiyat);
                          setSahipOlunanTakimlar(p => [...p, t.id]);
                          setSeciliTakim(t);
                          bildirimGoster("Takım seçildi", `${t.ad} takımı satın alındı ve seçildi.`, "basari");
                        } else {
                          bildirimGoster("Yetersiz çip", `Gerekli: ${t.fiyat.toLocaleString()} çip.`, "bilgi");
                        }
                      } else {
                        setSeciliTakim(t);
                      }
                    }}
                    className={`relative rounded-2xl p-4 flex items-center gap-3 transition-all border-2
                      ${secili ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'border-white/10 hover:border-white/30'}`}
                    style={{ background: `linear-gradient(135deg, ${t.renkA}33, ${t.renkB}22)` }}
                  >
                    {secili && <span className="absolute top-2 right-2 text-yellow-400 text-xs font-black">✓ SEÇİLİ</span>}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 flex-shrink-0"
                      style={{ borderColor: t.renkA, background: `linear-gradient(135deg, ${t.renkA}, ${t.renkB})` }}>
                      {t.emoji}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-white text-sm">{t.ad}</div>
                      {sahip
                        ? <div className="text-[10px] text-green-400 font-bold">✓ Sahipsiniz</div>
                        : <div className="inline-flex items-center gap-1 text-[10px] text-yellow-400 font-bold">{t.fiyat.toLocaleString()} <CipSimgesi boyut="xs" /></div>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => {
                  setTavlaTakimSecimAcik(false);
                  setTavlaDurum(yeniTavlaOyunu());
                  setTavlaAcik(true);
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-3 rounded-xl hover:brightness-110 transition-all"
              >
                🎲 {seciliTakim.emoji} {seciliTakim.ad} ile Oyna!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAVLA OYUN EKRANI                                   */}
      {/* ======================================================== */}
      {tavlaAcik && tavlaDurum && (
        <div className="tavla-screen absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="w-[900px] bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col">

            {/* Başlık Bar */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎲</span>
                <div>
                  <h2 className="font-black text-lg text-white flex items-center gap-2">
                    Tavla — Hızlı Eşleşme
                    <span className="text-lg">{seciliTakim.emoji}</span>
                    <span className="text-sm font-bold text-emerald-200">{seciliTakim.ad}</span>
                  </h2>
                  <p className="text-emerald-200 text-[10px]">vs Bot Rakip · Beyaz = Sen · Siyah = Bot</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTavlaTakimSecimAcik(true)}
                  className="bg-black/30 border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-black/50"
                >
                  🔄 Takım Değiştir
                </button>
                <div className="text-center bg-black/30 px-3 py-1 rounded-xl border border-white/10 text-xs">
                  <span className="text-gray-400">Kırık: </span>
                  <span className="text-red-400 font-bold">Sen {tavlaDurum.oyuncuKirik}</span>
                  <span className="text-gray-600 mx-1">·</span>
                  <span className="text-orange-400 font-bold">Bot {tavlaDurum.botKirik}</span>
                </div>
                <div className="text-center bg-black/30 px-3 py-1 rounded-xl border border-white/10 text-xs">
                  <span className="text-gray-400">Eve: </span>
                  <span className="text-green-400 font-bold">Sen {tavlaDurum.oyuncuToplanan}</span>
                  <span className="text-gray-600 mx-1">·</span>
                  <span className="text-red-400 font-bold">Bot {tavlaDurum.botToplanan}</span>
                </div>
                <button
                  onClick={() => { setTavlaAcik(false); setTavlaDurum(null); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-black text-white"
                >✕</button>
              </div>
            </div>

            {/* Oyun Alanı */}
            <div className="flex gap-4 p-4">

              {/* TAVLA TAHTASI */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Mesaj bandı */}
                <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex justify-between items-center">
                  <p className="text-white text-sm font-bold">{tavlaDurum.mesaj}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-xl font-black text-white bg-black/50 w-8 h-8 rounded-lg flex items-center justify-center border border-white/20">
                      {tavlaDurum.zar1}
                    </span>
                    <span className="text-xl font-black text-white bg-black/50 w-8 h-8 rounded-lg flex items-center justify-center border border-white/20">
                      {tavlaDurum.zar2}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">{tavlaDurum.hamleHaklari.length} hak</span>
                  </div>
                </div>

                {/* Tahta */}
                <div className="bg-amber-900/20 border-2 border-amber-700/40 rounded-2xl p-3 shadow-inner">
                  {/* Üst Haneler (13-24) */}
                  <div className="flex gap-1 mb-2">
                    {tavlaDurum.tahta.slice(12,24).map((hane, i) => {
                      const haneIdx = 12 + i;
                      const secili = tavlaDurum.seciliHane === haneIdx;
                      return (
                        <button
                          key={hane.index}
                          onClick={() => tavlaHaneClick(haneIdx)}
                          className={`flex-1 min-h-[80px] rounded-lg flex flex-col items-center justify-start pt-1 gap-0.5 transition-all
                            ${secili ? 'bg-yellow-400/20 border-2 border-yellow-400' : 'bg-black/20 border border-white/5 hover:bg-white/5'}`}
                        >
                          <span className="text-[8px] text-gray-600 font-bold">{hane.index}</span>
                          {Array.from({length: Math.min(hane.sayi, 5)}).map((_, pi) => (
                            <div key={pi} className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black shadow"
                              style={{
                                background: hane.renk === 'beyaz'
                                  ? `linear-gradient(135deg, ${seciliTakim.renkA}, ${seciliTakim.renkB})`
                                  : '#1e1e1e',
                                borderColor: hane.renk === 'beyaz' ? seciliTakim.renkB : '#555'
                              }}>
                              {hane.renk === 'beyaz' ? seciliTakim.sembol : '●'}
                            </div>
                          ))}
                          {hane.sayi > 5 && <span className="text-[8px] text-gray-400 font-black">+{hane.sayi-5}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bar (Ortadaki bölücü) */}
                  <div className="h-4 bg-amber-800/60 rounded flex items-center justify-center gap-4 border-y border-amber-700/50 mb-2">
                    {tavlaDurum.oyuncuKirik > 0 && (
                      <span className="text-[10px] font-black text-white bg-white/20 px-2 rounded">
                        {seciliTakim.emoji} Kırık: {tavlaDurum.oyuncuKirik}
                      </span>
                    )}
                    {tavlaDurum.botKirik > 0 && (
                      <span className="text-[10px] font-black text-gray-900 bg-gray-400/80 px-2 rounded">
                        ● Kırık: {tavlaDurum.botKirik}
                      </span>
                    )}
                  </div>

                  {/* Alt Haneler (1-12) */}
                  <div className="flex gap-1">
                    {tavlaDurum.tahta.slice(0,12).map((hane, i) => {
                      const secili = tavlaDurum.seciliHane === i;
                      return (
                        <button
                          key={hane.index}
                          onClick={() => tavlaHaneClick(i)}
                          className={`flex-1 min-h-[80px] rounded-lg flex flex-col items-center justify-end pb-1 gap-0.5 transition-all
                            ${secili ? 'bg-yellow-400/20 border-2 border-yellow-400' : 'bg-black/20 border border-white/5 hover:bg-white/5'}`}
                        >
                          {Array.from({length: Math.min(hane.sayi, 5)}).map((_, pi) => (
                            <div key={pi} className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black shadow"
                              style={{
                                background: hane.renk === 'beyaz'
                                  ? `linear-gradient(135deg, ${seciliTakim.renkA}, ${seciliTakim.renkB})`
                                  : '#1e1e1e',
                                borderColor: hane.renk === 'beyaz' ? seciliTakim.renkB : '#555'
                              }}>
                              {hane.renk === 'beyaz' ? seciliTakim.sembol : '●'}
                            </div>
                          ))}
                          {hane.sayi > 5 && <span className="text-[8px] text-gray-400 font-black">+{hane.sayi-5}</span>}
                          <span className="text-[8px] text-gray-600 font-bold">{hane.index}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SAĞ PANEL: Kontroller */}
              <div className="w-44 flex flex-col gap-3">
                {/* Takım rozeti */}
                <div className="rounded-2xl p-3 border border-white/10 text-center"
                  style={{ background: `linear-gradient(135deg, ${seciliTakim.renkA}44, ${seciliTakim.renkB}22)` }}>
                  <div className="text-3xl mb-1">{seciliTakim.emoji}</div>
                  <div className="font-black text-white text-sm">{seciliTakim.ad}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Senin takımın</div>
                  <div className="flex justify-center gap-1 mt-2">
                    <div className="w-4 h-4 rounded-full border" style={{background: seciliTakim.renkA, borderColor: seciliTakim.renkB}}></div>
                    <div className="w-4 h-4 rounded-full border" style={{background: seciliTakim.renkB, borderColor: seciliTakim.renkA}}></div>
                  </div>
                </div>

                {/* Zar at butonu */}
                {tavlaDurum.sira === 'oyuncu' && tavlaDurum.hamleHaklari.length === 0 && !tavlaDurum.bitti && (
                  <button onClick={tavlaZarAt}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-3 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg">
                    🎲 Zar At
                  </button>
                )}

                {/* Hamle iptali */}
                {tavlaDurum.seciliHane !== null && (
                  <button onClick={() => setTavlaDurum(p => p ? {...p, seciliHane: null} : p)}
                    className="bg-red-950/50 border border-red-900/40 text-red-400 font-bold py-2 rounded-xl text-xs hover:bg-red-900/40">
                    ✕ Seçimi İptal
                  </button>
                )}

                {/* Oyun bitti */}
                {tavlaDurum.bitti && (
                  <button onClick={() => setTavlaDurum(yeniTavlaOyunu())}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-2 rounded-xl text-xs hover:brightness-110">
                    🔄 Yeniden Oyna
                  </button>
                )}

                {/* Skor */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Eve aldın:</span>
                    <span className="font-black text-green-400">{tavlaDurum.oyuncuToplanan}/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bot eve:</span>
                    <span className="font-black text-red-400">{tavlaDurum.botToplanan}/15</span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hamle:</span>
                    <span className="font-bold text-white">{tavlaDurum.hamleHaklari.length} hak</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sıra:</span>
                    <span className={`font-black text-xs ${tavlaDurum.sira === 'oyuncu' ? 'text-green-400' : 'text-orange-400'}`}>
                      {tavlaDurum.sira === 'oyuncu' ? '🟢 Sen' : '🔴 Bot'}
                    </span>
                  </div>
                </div>

                <button onClick={() => { setTavlaAcik(false); setTavlaDurum(null); }}
                  className="bg-red-950/40 border border-red-900/30 text-red-400 font-bold py-2 rounded-xl text-xs hover:bg-red-900/30 mt-auto">
                  ✕ Masadan Kalk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MASA AÇ — OYUN SEÇİM EKRANI                       */}
      {/* ======================================================== */}
      {oyunSecimAcik && (
        <div className="game-select-modal absolute inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="game-select-card relative w-[420px] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
            
            {/* Başlık */}
            <div className="game-select-header bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="font-black text-xl text-white tracking-wide drop-shadow">🎮 Masa Aç</h2>
                <p className="text-purple-200 text-[11px] mt-0.5">Oyun türünü seç, masanı aç</p>
              </div>
              <button
                onClick={() => setOyunSecimAcik(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-black text-white transition-all"
              >✕</button>
            </div>

            {/* Oyun Kartları */}
            <div className="game-select-options p-5 flex flex-col gap-3">

              {/* Okey */}
              <button
                onClick={() => masaAc("101 Okey")}
                className="game-select-option group w-full bg-gradient-to-r from-orange-600/20 to-amber-600/20 hover:from-orange-600/40 hover:to-amber-600/40 border border-orange-500/40 hover:border-orange-400 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">🀄</div>
                <div className="text-left flex-1">
                  <div className="font-black text-white text-base tracking-wide">101 Okey</div>
                  <div className="text-orange-300 text-[11px] mt-0.5">4 oyuncu · 101 taş · Türk klasiği</div>
                </div>
                <div className="text-orange-400 text-xl opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">›</div>
              </button>

              {/* Pişti */}
              <button
                onClick={() => masaAc("Pişti")}
                className="game-select-option group w-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/40 hover:to-indigo-600/40 border border-blue-500/40 hover:border-blue-400 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">🃏</div>
                <div className="text-left flex-1">
                  <div className="font-black text-white text-base tracking-wide">Pişti</div>
                  <div className="text-blue-300 text-[11px] mt-0.5">2 oyuncu · İskambil · Hızlı ve eğlenceli</div>
                </div>
                <div className="text-blue-400 text-xl opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">›</div>
              </button>

              {/* Tavla */}
              <button
                onClick={() => masaAc("Tavla")}
                className="game-select-option group w-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">🎲</div>
                <div className="text-left flex-1">
                  <div className="font-black text-white text-base tracking-wide">Tavla</div>
                  <div className="text-emerald-300 text-[11px] mt-0.5">2 oyuncu · Zar oyunu · Strateji ve şans</div>
                </div>
                <div className="text-emerald-400 text-xl opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">›</div>
              </button>

            </div>

            {/* Alt bilgi */}
            <div className="game-select-footnote px-5 pb-5">
              <p className="text-center text-gray-600 text-[10px]">Masana katılmak isteyen oyuncular seni bulacak</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MASA AÇILDI — OYUNCU BEKLEME EKRANI                */}
      {/* ======================================================== */}
      {oyunBekleme && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg">
          <div className="w-[440px] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">

            {/* Başlık */}
            <div className={`px-6 py-4 ${
              aktifOyun === "101 Okey"
                ? "bg-gradient-to-r from-orange-600 to-amber-600"
                : aktifOyun === "Pişti"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                : "bg-gradient-to-r from-emerald-600 to-teal-600"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">
                  {aktifOyun === "101 Okey" ? "📿" : aktifOyun === "Pişti" ? "🃏" : "🎲"}
                </span>
                <div>
                  <h2 className="font-black text-xl text-white">{aktifOyun} Masası</h2>
                  <p className="text-white/80 text-[11px]">Masa açıldı, oyuncular bekleniyor...</p>
                </div>
              </div>
            </div>

            {/* Bekleme Animasyonu */}
            <div className="flex flex-col items-center py-8 px-6">

              {/* Dönen bekleme halkası */}
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent border-r-transparent animate-spin"
                  style={{
                    borderBottomColor: aktifOyun === "101 Okey" ? "#f97316" : aktifOyun === "Pişti" ? "#3b82f6" : "#10b981"
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  {aktifOyun === "101 Okey" ? "📿" : aktifOyun === "Pişti" ? "🃏" : "🎲"}
                </div>
              </div>

              <h3 className="font-black text-white text-lg mb-1">Oyuncu Bekleniyor</h3>
              <p className="text-gray-400 text-xs text-center mb-6">
                Masana katılacak rakipler aranıyor.<br/>Bu birkaç saniye sürebilir.
              </p>

              {/* Masa bilgileri */}
              <div className="w-full bg-black/40 rounded-2xl border border-white/10 p-4 mb-5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Oyun Türü</span>
                  <span className="font-bold text-white">{aktifOyun}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Masa Sahibi</span>
                  <span className="font-bold text-yellow-400">{isim}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Giriş Ücreti</span>
                  <span className="font-bold text-green-400">Ücretsiz</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Durum</span>
                  <span className="flex items-center gap-1.5 font-bold text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
                    Aktif
                  </span>
                </div>
              </div>

              {/* Hazırım / İptal butonları */}
              <div className="w-full flex gap-3">
                <button
                  onClick={() => { setOyunBekleme(false); setAktifOyun(""); setHazirTik(false); }}
                  className="flex-1 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-900/40 font-bold py-3 rounded-xl text-sm transition-all"
                >
                  ✕ Masayı Kapat
                </button>
                <button
                  onClick={() => setHazirTik(!hazirTik)}
                  className={`flex-1 font-black py-3 rounded-xl text-sm transition-all border ${
                    hazirTik
                      ? "bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      : "bg-green-900/40 border-green-700/50 text-green-400 hover:bg-green-800/40"
                  }`}
                >
                  {hazirTik ? "✓ Hazırım!" : "Hazırım"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
