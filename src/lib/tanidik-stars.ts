export function tanidikStarCount(educationStatus?: string | null) {
  return educationStatus === 'MEZUN' ? 3 : educationStatus === 'UNIVERSITE_OGRENCISI' ? 2 : 1;
}
