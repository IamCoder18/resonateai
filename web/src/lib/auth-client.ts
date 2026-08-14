"use client";

import { createAuthClient } from "better-auth/react";
import { getApiBaseUrl } from "@/lib/api-base";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? getApiBaseUrl()
      : process.env.BETTER_AUTH_URL || "http://localhost:3000",
});