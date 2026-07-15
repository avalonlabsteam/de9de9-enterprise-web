/** Display an ISO (yyyy-mm-dd) date as dd/mm/yyyy; pass other strings through. */
export function fmtDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

/** Group thousands with a plain space: 180000 -> "180 000". */
export function fmtNumber(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** "180 000 DZD" */
export function fmtDzd(n: number): string {
  return `${fmtNumber(n)} DZD`;
}

/** Credits = DZD x 10 (BUILD-SPEC 1). "1 800 000 credits" */
export function fmtCredits(dzd: number): string {
  return `${fmtNumber(dzd * 10)} crédits`;
}
