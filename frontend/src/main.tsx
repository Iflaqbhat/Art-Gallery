import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={clerkKey}
    afterSignOutUrl="/"
    appearance={{
      theme: shadcn,
      variables: {
        colorBackground: "#15120e",
        colorForeground: "#f5efe6",
        colorPrimary: "#d4a574",
        colorPrimaryForeground: "#17120d",
        colorMuted: "#29241f",
        colorMutedForeground: "#aaa095",
        colorInput: "#0f0d0b",
        colorInputForeground: "#f5efe6",
        colorBorder: "#3a332c",
        borderRadius: "2px",
      },
    }}
  >
    <App />
  </ClerkProvider>
);
