// src/components/layout/UnrestrictedRoute.tsx
import React from "react";

interface UnrestrictedRouteProps {
  children: React.ReactNode;
}

export function UnrestrictedRoute({ children }: UnrestrictedRouteProps) {
  return <>{children}</>;
}
