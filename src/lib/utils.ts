import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getQuarterDates(quarterStr: string) {
  const match = quarterStr.match(/Q([1-4])\s+(\d{4})/);
  if (!match) return null;
  const q = parseInt(match[1]);
  const y = parseInt(match[2]);
  
  if (q === 1) return { start: `${y}-01-01`, end: `${y}-03-31` };
  if (q === 2) return { start: `${y}-04-01`, end: `${y}-06-30` };
  if (q === 3) return { start: `${y}-07-01`, end: `${y}-09-30` };
  if (q === 4) return { start: `${y}-10-01`, end: `${y}-12-31` };
  return null;
}
