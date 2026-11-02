import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { LanguageProvider } from "@/contexts/language-context";

/**
 * Renders inside the language context every translated component needs.
 * Contexts a test wants to control (auth, cart, session, notifications) are
 * mocked by that test instead.
 */
export function renderWithLanguage(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    ),
  });
}
