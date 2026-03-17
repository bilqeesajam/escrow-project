import { useState, useEffect } from "react";
import { Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { StatusBadge } from "../components/StatusBadge";

export default function KYCPendingPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const videoSrc = isDark ? "/kyc-dark.mp4" : "/kyc-light.mp4";
  const isRejected = profile?.kyc_status === "rejected";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflow: "hidden",
      }}
    >
      {/* VIDEO BACKGROUND — always shown in both modes */}
      <video
        key={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* OVERLAY — dark in dark mode, light-frosted in light mode */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          backgroundColor: isDark ? "rgba(0,0,0,0.80)" : "rgba(255,255,255,0.45)",
          transition: "background-color 0.5s",
        }}
      />

      {/* CARD */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "440px",
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.45)" : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)"}`,
          borderRadius: "16px",
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0,0,0,0.8)"
            : "0 8px 32px rgba(0,0,0,0.12)",
          padding: "48px 40px 52px",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: isRejected
              ? "rgba(239, 68, 68, 0.15)"
              : "rgba(234, 179, 8, 0.15)",
            marginBottom: "20px",
          }}
        >
          {isRejected ? (
            <Shield size={36} color={isDark ? "#f87171" : "#dc2626"} />
          ) : (
            <Clock size={36} color={isDark ? "#fbbf24" : "#d97706"} />
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            color: isDark ? "white" : "#0f172a",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            margin: "0 0 16px",
          }}
        >
          {isRejected ? "Verification Rejected" : "Verification Pending"}
        </h2>

        {/* Status Badge */}
        <div style={{ marginBottom: "16px" }}>
          <StatusBadge status={profile?.kyc_status || "pending"} />
        </div>

        {/* Description */}
        <p
          style={{
            color: isDark ? "#94a3b8" : "#64748b",
            fontSize: "14px",
            lineHeight: "1.6",
            margin: "0 0 32px",
          }}
        >
          {isRejected
            ? "Your identity verification was rejected. Please contact support."
            : "Your identity verification is being reviewed. You'll be notified once approved."}
        </p>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          style={{
            padding: "11px 32px",
            borderRadius: "9999px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
            color: isDark ? "white" : "#1e293b",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255,255,255,0.15)"
              : "rgba(255,255,255,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.9)";
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}