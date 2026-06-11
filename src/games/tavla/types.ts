// Tavla Pul Renkleri
export type PulRengi = 'beyaz' | 'siyah';

// Tavla Tahtasındaki Her Bir Ok (Hane)
export interface Hane {
  index: number;       // 1 ile 24 arasındaki haneler
  pulRengi: PulRengi | null; // Hanede pul yoksa null
  pulSayisi: number;   // Hanedeki toplam pul sayısı
}

// Oyuncu Yapısı
export interface TavlaOyuncusu {
  id: string;
  isim: string;
  renk: PulRengi;
  kirikPullar: number;  // Kırılan ve dışarıda bekleyen pullar
  toplananPullar: number; // Oyunu bitirmek için tahtadan toplanan pullar
}

// Zar Atış Durumu
export interface ZarDurumu {
  zar1: number;
  zar2: number;
  hamleHaklari: number[]; // Çift gelirse 4 hamle hakkı olur (örn: 5-5 gelirse [5, 5, 5, 5])
}