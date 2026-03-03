import { createRoot } from "react-dom/client";
import "./index.css";

console.log("[MAIN] ENV check:", {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "SET" : "MISSING",
});

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>✅ App está funcionando!</h1>
      <p>SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || "NÃO DEFINIDA"}</p>
    </div>
  );
}
