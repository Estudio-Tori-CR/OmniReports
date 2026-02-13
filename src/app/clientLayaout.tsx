"use client";

import "./globals.css";
import { Provider } from "react-redux";
import { store, persistor } from "./GlobalState/GlobalState";
import { PersistGate } from "redux-persist/integration/react";
import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Loader from "./pages/components/loading";

const RouteLoaderSync = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    Loader().hidde();
  }, [pathname, searchParams]);

  return null;
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <RouteLoaderSync />
          {children}
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}
