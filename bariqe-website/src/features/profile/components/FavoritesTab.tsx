
"use client";

import React, { useEffect, useState } from "react";
import { useFavoritesStore } from "@/shared/hooks/useFavoritesStore";
import { useTranslations } from "next-intl";
import { Loader2, Heart } from "lucide-react";
import ProductCard from "@/features/products/components/ProductCard";

const FavoritesTab = () => {
  const t = useTranslations("profile.favorites");
  const { items: favorites, syncFromBackend } = useFavoritesStore();
  const [isLoading, setIsLoading] = useState(true);

  // Hydration fix for zustand persist
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // Sync from backend when the tab is opened
    syncFromBackend().finally(() => setIsLoading(false));
  }, [syncFromBackend]);

  if (!hydrated || isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary mb-4">{t("title")}</h2>

      {!favorites || favorites.length === 0 ? (
        <div className="text-center py-12 rounded-lg border shadow-sm">
          <Heart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">{t("noFavorites")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesTab;
