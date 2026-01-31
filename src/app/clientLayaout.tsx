// app/layout.tsx
"use client";

import "./globals.css";
import { Provider } from "react-redux";
import { store, persistor } from "./GlobalState/GlobalState";
import { PersistGate } from "redux-persist/integration/react";
import React from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}
