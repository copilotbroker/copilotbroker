export const onlyDigits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

export function isValidCPF(input?: string | null): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rev = 11 - (sum % 11); if (rev >= 10) rev = 0;
  if (rev !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rev = 11 - (sum % 11); if (rev >= 10) rev = 0;
  return rev === parseInt(cpf[10]);
}

export function isValidCNPJ(input?: string | null): boolean {
  const c = onlyDigits(input);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(base[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const d1 = calc(c, w1); const d2 = calc(c, w2);
  return d1 === parseInt(c[12]) && d2 === parseInt(c[13]);
}

export function isValidEmail(s?: string | null) {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function isValidPhone(s?: string | null) {
  const d = onlyDigits(s);
  return d.length >= 10 && d.length <= 13;
}

export function isValidCEP(s?: string | null) {
  return onlyDigits(s).length === 8;
}

export function formatCPF(s?: string | null) {
  const d = onlyDigits(s).slice(0, 11);
  return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_m, a, b, c, dd) =>
    [a, b, c, dd].filter(Boolean).join(".").replace(/\.(\d{2})$/, "-$1"));
}

export function formatCNPJ(s?: string | null) {
  const d = onlyDigits(s).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

export function formatCEP(s?: string | null) {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
}
