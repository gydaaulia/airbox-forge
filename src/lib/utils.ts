import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return `Rp ${new Intl.NumberFormat("id-ID").format(v)}`;
}
