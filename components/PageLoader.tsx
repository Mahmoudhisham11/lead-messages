"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    const frame = requestAnimationFrame(() => {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="page-loader">
      <div className="page-loader-bar" />
    </div>
  );
}
