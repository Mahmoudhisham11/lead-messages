"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
