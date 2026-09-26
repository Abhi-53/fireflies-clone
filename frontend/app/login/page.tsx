"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="login-shell">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/meetings");
        }}
      >
        <h1>MeetFlow</h1>
        <p>Sign in to your meeting notebook. SSO is available for Business workspaces.</p>
        <input className="mf-input" type="email" required placeholder="Work email" defaultValue="sarah@meetflow.ai" />
        <input className="mf-input" type="password" required placeholder="Password" defaultValue="password" />
        <Button type="submit" variant="primary" className="mf-btn--lg" style={{ width: "100%", marginTop: 8 }}>
          Continue
        </Button>
        <Button
          type="button"
          variant="outline"
          style={{
            width: "100%",
            marginTop: 10,
            background: "transparent",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.16)",
          }}
          onClick={() => router.push("/meetings")}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          style={{
            width: "100%",
            marginTop: 8,
            background: "transparent",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.16)",
          }}
          onClick={() => router.push("/meetings")}
        >
          Continue with Microsoft
        </Button>
      </form>
    </div>
  );
}
