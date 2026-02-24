"use client";

import React from "react";
import { AuthGuard } from "@/shared/components/guards";

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthGuard>{children}</AuthGuard>;
};

export default ProfileLayout;
