import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            // Base styles
            "transition-all duration-200",
            // Default state - using #508991 (teal) for default text
            "text-[#508991] hover:text-[#F1D302]",
            // Active state - using #F1D302 (gold) for active
            isActive && (activeClassName || "text-[#F1D302] font-medium border-b-2 border-[#F1D302]"),
            // Pending state - using #27474E (dark teal) with opacity
            isPending && (pendingClassName || "text-[#27474E] opacity-60"),
            className
          )
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };