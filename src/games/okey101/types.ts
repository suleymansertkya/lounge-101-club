export type TasRengi = 'kirmizi' | 'siyah' | 'mavi' | 'sari' | 'joker';

export interface Tas {
  id: number;          
  renk: TasRengi;      
  deger: number;       
  sahteOkeyMi: boolean;
}

export interface Oyuncu {
  id: string;
  isim: string;
  el: Tas[];           
  vipSeviyesi: number; 
}