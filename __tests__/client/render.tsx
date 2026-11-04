import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { CatalogProvider } from "@/contexts/catalog-context";
import { LanguageProvider } from "@/contexts/language-context";
import { PRODUCTS } from "@/lib/data/products";

/**
 * Renders inside the language context every translated component needs, and
 * the catalogue as written in lib/data/products.ts.
 * Contexts a test wants to control (auth, cart, session, notifications) are
 * mocked by that test instead.
 */
export function renderWithLanguage(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <CatalogProvider products={PRODUCTS}>
        <LanguageProvider>{children}</LanguageProvider>
      </CatalogProvider>
    ),
  });
}
