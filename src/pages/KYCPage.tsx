import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2, Upload, User, Phone, IdCard } from "lucide-react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB — matches bucket limit

export default function KYCPage() {
  const { user, profile } = useAuth();
  const [fullName,  setFullName]  = useState(profile?.full_name  || "");
  const [phone,     setPhone]     = useState(profile?.phone      || "");
  const [idNumber,  setIdNumber]  = useState(profile?.id_number  || "");
  const [avatar,    setAvatar]    = useState<File | null>(null);
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const videoSrc = isDark ? "/kyc-dark.mp4" : "/kyc-light.mp4";

  // ── Avatar file selection ─────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 5 MB.");
      e.target.value = "";
      return;
    }
    setAvatar(file);
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !phone.trim() || !idNumber.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);

    let avatarUrl: string | null = null;

    if (avatar) {
      // Path: {userId}.{ext}  — flat inside the "avatars" bucket.
      // No nested folder prefix so the public URL resolves cleanly.
      const ext      = avatar.name.split(".").pop();
      const filePath = `${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatar, { upsert: true, contentType: avatar.type });

      if (uploadError) {
        toast.error("Avatar upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name:  fullName.trim(),
        phone:      phone.trim(),
        id_number:  idNumber.trim(),
        kyc_status: "pending",
        ...(avatarUrl && { avatar_url: avatarUrl }),
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("KYC submitted successfully.");
      setTimeout(() => navigate("/kyc-pending"), 1000);
    }
  };

  // ── Styles (unchanged from original) ─────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    backgroundColor: isDark ? "rgba(100, 116, 139, 0.2)" : "rgba(255, 255, 255, 0.9)",
    border: `1px solid ${isDark ? "rgba(148, 163, 184, 0.6)" : "rgba(226, 232, 240, 0.8)"}`,
    borderRadius: "10px",
    color: isDark ? "white" : "#0f172a",
    fontSize: "14px",
    padding: "0 14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: isDark ? "#e2e8f0" : "#1e293b",
    fontWeight: 700,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "6px",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = isDark ? "rgba(234, 179, 8, 0.8)" : "#3b5bdb";
    e.target.style.boxShadow   = isDark
      ? "0 0 0 2px rgba(234, 179, 8, 0.3)"
      : "0 0 0 2px rgba(59, 91, 219, 0.15)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = isDark ? "rgba(148, 163, 184, 0.6)" : "rgba(226, 232, 240, 0.8)";
    e.target.style.boxShadow   = "none";
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", overflow: "hidden" }}>

      {/* Video background */}
      <video key={videoSrc} autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.80)" : "rgba(255,255,255,0.45)", transition: "background-color 0.5s" }} />

      {/* Card */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "620px", backgroundColor: isDark ? "rgba(30, 41, 59, 0.45)" : "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)"}`, borderRadius: "16px", boxShadow: isDark ? "0 25px 50px -12px rgba(0,0,0,0.8)" : "0 8px 32px rgba(0,0,0,0.12)", padding: "64px 52px 68px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{ color: isDark ? "white" : "#0f172a", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
            Identity Verification
          </h2>
          <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "14px", margin: 0 }}>
            {profile?.kyc_status === "rejected"
              ? "Your previous submission was rejected. Please update your information."
              : "Complete your KYC to start using GigHold"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" style={labelStyle}>
              <User size={16} color={isDark ? "#94a3b8" : "#64748b"} /> Full Name
            </label>
            <input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" style={labelStyle}>
              <Phone size={16} color={isDark ? "#94a3b8" : "#64748b"} /> Phone Number
            </label>
            <input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+27 81 234 5678" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* ID Number */}
          <div>
            <label htmlFor="idNumber" style={labelStyle}>
              <IdCard size={16} color={isDark ? "#94a3b8" : "#64748b"} /> Government ID Number
            </label>
            <input id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} required placeholder="ID number" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* Profile Picture */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "10px" }}>Profile Picture (Optional)</label>
            <label htmlFor="avatar-upload" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(226,232,240,0.8)"}`, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)", color: isDark ? "white" : "#1e293b", transition: "background-color 0.2s" }}>
              <Upload style={{ height: "14px", width: "14px" }} />
              {avatar ? avatar.name : "Choose file"}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "12px", marginTop: "6px" }}>
              Max 5 MB · JPG, PNG, WebP
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: "9999px", border: isDark ? "1px solid rgba(255,255,255,0.2)" : "none", background: isDark ? "rgba(255,255,255,0.1)" : "#1e3a8a", boxShadow: isDark ? "0px 4px 10px rgba(0,0,0,0.3)" : "0px 4px 12px rgba(30,58,138,0.3)", color: "white", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "background 0.2s", marginTop: "4px" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.18)" : "#1e40af"; }}
            onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#1e3a8a"; }}
          >
            {loading ? (
              <><Loader2 style={{ height: "18px", width: "18px", animation: "spin 1s linear infinite" }} /> Submitting...</>
            ) : "Submit Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}