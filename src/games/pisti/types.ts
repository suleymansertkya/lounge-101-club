// Pişti İskambil Kart Tipleri
export type KartSerisi = 'kupa' | 'karo' | 'maca' | 'sinek';

export interface Kart {
  id: number;
  seri: KartSerisi;
  deger: string;  // "A", "2", "3" ..., "J", "Q", "K"
  sayisalDeger: number; // Eşleşme kolaylığı için (A=1, J=11, Q=12, K=13)
}

export interface PistiOyuncusu {
  id: string;
  isim: string;
  el: Kart[];
  topladigiKartlar: Kart[];
  skor: number;
}