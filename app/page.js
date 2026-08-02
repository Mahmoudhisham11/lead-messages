"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/crm/leads");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
