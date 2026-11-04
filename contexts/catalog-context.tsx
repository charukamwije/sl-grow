"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import type { Product } from "@/lib/data/products";
import { createCatalog, type Catalog } from "@/lib/products";

const CatalogContext = createContext<Catalog | undefined>(undefined);

/**
 * Hands the server's product list to client components. The root layout
 * loads it once per request, so the shop, cart and planner price everything
 * from the same list the server checks orders against.
 */
export const CatalogProvider = ({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) => {
  const catalog = useMemo(() => createCatalog(products), [products]);

  return (
    <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
};
