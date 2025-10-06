export interface Commune {
  id: number;
  name: string;
  wilayaId: number;
}

export interface Wilaya {
  id: number;
  name: string;
  code: string;
  communes: Commune[];
}

export const WILAYAS: Wilaya[] = [
  { id: 1, name: "Adrar", code: "01", communes: [{ id: 1, name: "Adrar", wilayaId: 1 }] },
  { id: 2, name: "Chlef", code: "02", communes: [{ id: 2, name: "Chlef", wilayaId: 2 }] },
  { id: 3, name: "Laghouat", code: "03", communes: [{ id: 3, name: "Laghouat", wilayaId: 3 }] },
  { id: 4, name: "Oum El Bouaghi", code: "04", communes: [{ id: 4, name: "Oum El Bouaghi", wilayaId: 4 }] },
  { id: 5, name: "Batna", code: "05", communes: [{ id: 5, name: "Batna", wilayaId: 5 }] },
  { id: 6, name: "Béjaïa", code: "06", communes: [{ id: 6, name: "Béjaïa", wilayaId: 6 }] },
  { id: 7, name: "Biskra", code: "07", communes: [{ id: 7, name: "Biskra", wilayaId: 7 }] },
  { id: 8, name: "Béchar", code: "08", communes: [{ id: 8, name: "Béchar", wilayaId: 8 }] },
  { id: 9, name: "Blida", code: "09", communes: [{ id: 9, name: "Blida", wilayaId: 9 }] },
  { id: 10, name: "Bouira", code: "10", communes: [{ id: 10, name: "Bouira", wilayaId: 10 }] },
  { id: 11, name: "Tamanrasset", code: "11", communes: [{ id: 11, name: "Tamanrasset", wilayaId: 11 }] },
  { id: 12, name: "Tébessa", code: "12", communes: [{ id: 12, name: "Tébessa", wilayaId: 12 }] },
  { id: 13, name: "Tlemcen", code: "13", communes: [{ id: 13, name: "Tlemcen", wilayaId: 13 }] },
  { id: 14, name: "Tiaret", code: "14", communes: [{ id: 14, name: "Tiaret", wilayaId: 14 }] },
  { id: 15, name: "Tizi Ouzou", code: "15", communes: [{ id: 15, name: "Tizi Ouzou", wilayaId: 15 }] },
  { id: 16, name: "Alger", code: "16", communes: [{ id: 16, name: "Alger", wilayaId: 16 }] },
  { id: 17, name: "Djelfa", code: "17", communes: [{ id: 17, name: "Djelfa", wilayaId: 17 }] },
  { id: 18, name: "Jijel", code: "18", communes: [{ id: 18, name: "Jijel", wilayaId: 18 }] },
  { id: 19, name: "Sétif", code: "19", communes: [{ id: 19, name: "Sétif", wilayaId: 19 }] },
  { id: 20, name: "Saïda", code: "20", communes: [{ id: 20, name: "Saïda", wilayaId: 20 }] },
  { id: 21, name: "Skikda", code: "21", communes: [{ id: 21, name: "Skikda", wilayaId: 21 }] },
  { id: 22, name: "Sidi Bel Abbès", code: "22", communes: [{ id: 22, name: "Sidi Bel Abbès", wilayaId: 22 }] },
  { id: 23, name: "Annaba", code: "23", communes: [{ id: 23, name: "Annaba", wilayaId: 23 }] },
  { id: 24, name: "Guelma", code: "24", communes: [{ id: 24, name: "Guelma", wilayaId: 24 }] },
  { id: 25, name: "Constantine", code: "25", communes: [{ id: 25, name: "Constantine", wilayaId: 25 }] },
  { id: 26, name: "Médéa", code: "26", communes: [{ id: 26, name: "Médéa", wilayaId: 26 }] },
  { id: 27, name: "Mostaganem", code: "27", communes: [{ id: 27, name: "Mostaganem", wilayaId: 27 }] },
  { id: 28, name: "M'Sila", code: "28", communes: [{ id: 28, name: "M'Sila", wilayaId: 28 }] },
  { id: 29, name: "Mascara", code: "29", communes: [{ id: 29, name: "Mascara", wilayaId: 29 }] },
  { id: 30, name: "Ouargla", code: "30", communes: [{ id: 30, name: "Ouargla", wilayaId: 30 }] },
  { id: 31, name: "Oran", code: "31", communes: [{ id: 31, name: "Oran", wilayaId: 31 }] },
  { id: 32, name: "El Bayadh", code: "32", communes: [{ id: 32, name: "El Bayadh", wilayaId: 32 }] },
  { id: 33, name: "Illizi", code: "33", communes: [{ id: 33, name: "Illizi", wilayaId: 33 }] },
  { id: 34, name: "Bordj Bou Arréridj", code: "34", communes: [{ id: 34, name: "Bordj Bou Arréridj", wilayaId: 34 }] },
  { id: 35, name: "Boumerdès", code: "35", communes: [{ id: 35, name: "Boumerdès", wilayaId: 35 }] },
  { id: 36, name: "El Tarf", code: "36", communes: [{ id: 36, name: "El Tarf", wilayaId: 36 }] },
  { id: 37, name: "Tindouf", code: "37", communes: [{ id: 37, name: "Tindouf", wilayaId: 37 }] },
  { id: 38, name: "Tissemsilt", code: "38", communes: [{ id: 38, name: "Tissemsilt", wilayaId: 38 }] },
  { id: 39, name: "El Oued", code: "39", communes: [{ id: 39, name: "El Oued", wilayaId: 39 }] },
  { id: 40, name: "Khenchela", code: "40", communes: [{ id: 40, name: "Khenchela", wilayaId: 40 }] },
  { id: 41, name: "Souk Ahras", code: "41", communes: [{ id: 41, name: "Souk Ahras", wilayaId: 41 }] },
  { id: 42, name: "Tipaza", code: "42", communes: [{ id: 42, name: "Tipaza", wilayaId: 42 }] },
  { id: 43, name: "Mila", code: "43", communes: [{ id: 43, name: "Mila", wilayaId: 43 }] },
  { id: 44, name: "Aïn Defla", code: "44", communes: [{ id: 44, name: "Aïn Defla", wilayaId: 44 }] },
  { id: 45, name: "Naâma", code: "45", communes: [{ id: 45, name: "Naâma", wilayaId: 45 }] },
  { id: 46, name: "Aïn Témouchent", code: "46", communes: [{ id: 46, name: "Aïn Témouchent", wilayaId: 46 }] },
  { id: 47, name: "Ghardaïa", code: "47", communes: [{ id: 47, name: "Ghardaïa", wilayaId: 47 }] },
  { id: 48, name: "Relizane", code: "48", communes: [{ id: 48, name: "Relizane", wilayaId: 48 }] },
  { id: 49, name: "El M'Ghair", code: "49", communes: [{ id: 49, name: "El M'Ghair", wilayaId: 49 }] },
  { id: 50, name: "El Meniaa", code: "50", communes: [{ id: 50, name: "El Meniaa", wilayaId: 50 }] },
  { id: 51, name: "Ouled Djellal", code: "51", communes: [{ id: 51, name: "Ouled Djellal", wilayaId: 51 }] },
  { id: 52, name: "Bordj Baji Mokhtar", code: "52", communes: [{ id: 52, name: "Bordj Baji Mokhtar", wilayaId: 52 }] },
  { id: 53, name: "Béni Abbès", code: "53", communes: [{ id: 53, name: "Béni Abbès", wilayaId: 53 }] },
  { id: 54, name: "Timimoun", code: "54", communes: [{ id: 54, name: "Timimoun", wilayaId: 54 }] },
  { id: 55, name: "Touggourt", code: "55", communes: [{ id: 55, name: "Touggourt", wilayaId: 55 }] },
  { id: 56, name: "Djanet", code: "56", communes: [{ id: 56, name: "Djanet", wilayaId: 56 }] },
  { id: 57, name: "In Salah", code: "57", communes: [{ id: 57, name: "In Salah", wilayaId: 57 }] },
  { id: 58, name: "In Guezzam", code: "58", communes: [{ id: 58, name: "In Guezzam", wilayaId: 58 }] }
];

// Helper functions
export function getWilayaByName(name: string): Wilaya | undefined {
  return WILAYAS.find(w => w.name === name);
}

export function getWilayaById(id: number): Wilaya | undefined {
  return WILAYAS.find(w => w.id === id);
}

export function getCommunesByWilaya(wilayaName: string): Commune[] {
  const wilaya = getWilayaByName(wilayaName);
  return wilaya ? wilaya.communes : [];
}

export function getCommuneByName(communeName: string, wilayaName: string): Commune | undefined {
  const communes = getCommunesByWilaya(wilayaName);
  return communes.find(c => c.name === communeName);
}

export function validateAddress(wilayaName: string, communeName: string): boolean {
  const commune = getCommuneByName(communeName, wilayaName);
  return !!commune;
}
