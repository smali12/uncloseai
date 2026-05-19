"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ChatLayout } from "@/components/chat-layout";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LandingPage = dynamic(() => import("./landing/page"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return isAuthenticated ? <ChatLayout /> : <LandingPage />;
}
