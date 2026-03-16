import { Link } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
 
function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (email?.[0] ?? "U").toUpperCase();
}
 
export function NavAvatar() {
  const { user, profile, signOut } = useAuth();
 
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40">
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt={profile?.full_name ?? "Profile"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
              {getInitials(profile?.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl w-44">
        {/* Name + email header */}
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-foreground truncate">
            {profile?.full_name || user?.email?.split("@")[0] || "User"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="text-sm">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive text-sm focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}