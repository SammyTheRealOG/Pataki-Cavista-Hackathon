import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://pataki-cavista-hackathon.onrender.com"
    : "http://127.0.0.1:5000";
