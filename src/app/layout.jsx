import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "1.125rem",
            color: "#374151",
            margin: 0,
          }}
        >
          Server is out of service, please recharge.
        </p>
      </div>
    </QueryClientProvider>
  );
}
