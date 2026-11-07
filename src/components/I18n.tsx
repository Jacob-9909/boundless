"use client";

import { createContext, use } from "react";
import { translatorOf, type Dict } from "@/lib/i18n";

const Lines = createContext<Dict>({});

/** Hands the current language's lines to client components. */
export function I18n({ dict, children }: { dict: Dict; children: React.ReactNode }) {
  return <Lines value={dict}>{children}</Lines>;
}

export const useT = () => translatorOf(use(Lines));
