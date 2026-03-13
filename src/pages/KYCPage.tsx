import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export default function KYCPage() {
  const { user, profile } = useAuth(); // Note: refreshProfile is removed
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [idNumber, setIdNumber] = useState(profile?.id_number || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim() || !phone.trim() || !idNumber.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);

    let avatarUrl: string | null = null;
    if (avatar) {
      // Create a unique filename
      const fileExt = avatar.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatar, { upsert: true });

      if (uploadError) {
        toast.error("Failed to upload avatar: " + uploadError.message);
        setLoading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = urlData.publicUrl;
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        id_number: idNumber.trim(),
        kyc_status: "pending",
        ...(avatarUrl && { avatar_url: avatarUrl }), // Only update if avatar was uploaded
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("KYC submitted! Awaiting admin approval.");
      
      // Wait a moment for the database to update
      setTimeout(() => {
        navigate("/kyc-pending");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Identity Verification</CardTitle>
          <CardDescription>
            {profile?.kyc_status === "rejected" 
              ? "Your previous submission was rejected. Please update your information."
              : "Complete your KYC to start using GigHold"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+27 81 234 5678"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">Government ID Number</Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                placeholder="ID number"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture (Optional)</Label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent cursor-pointer text-sm"
                >
                  <Upload className="h-4 w-4" />
                  {avatar ? avatar.name : "Choose file"}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                />
              </div>
              {avatar && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {avatar.name}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Submitting..." : "Submit Verification"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}