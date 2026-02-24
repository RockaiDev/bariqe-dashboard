
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useTranslations } from "next-intl";
import { User, Package, Heart } from "lucide-react";
import PersonalInfoSection from "./PersonalInfoSection";
import AddressSection from "./AddressSection";
import OrdersTab from "./OrdersTab";
import FavoritesTab from "./FavoritesTab";

const ProfileTabs = () => {
  const t = useTranslations("profile.tabs");

  return (
    <Tabs defaultValue="orders" className="w-full">
      <TabsList className="w-full justify-start p-1 bg-gray-100/80 rounded-3xl mb-8 h-auto flex-wrap ">
        <TabsTrigger 
            value="orders" 
            className="flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-white  data-[state=active]:shadow-sm py-2.5 rounded-3xl "
        >
          <Package className="w-4 h-4 mr-2" />
          {t("orders")}
        </TabsTrigger>
        <TabsTrigger 
            value="favorites" 
            className="flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 rounded-3xl "
        >
          <Heart className="w-4 h-4 mr-2" />
          {t("favorites")}
        </TabsTrigger>
        <TabsTrigger 
            value="personalInfo" 
            className="flex-1 min-w-[140px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 rounded-3xl"
        >
          <User className="w-4 h-4 mr-2" />
          {t("personalInfo")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="mt-0">
        <OrdersTab />
      </TabsContent>

      <TabsContent value="favorites" className="mt-0">
        <FavoritesTab />
      </TabsContent>

      <TabsContent value="personalInfo" className="mt-0 space-y-8">
        <PersonalInfoSection />
        <AddressSection />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;

