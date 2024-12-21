"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import CustomUserButton from "./user-button";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/notes", label: "Notes" },
    { href: "/shared", label: "Shared" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <div className="relative w-full flex items-center justify-between">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        className="lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Desktop Navigation */}
      <nav
        className={cn(
          "hidden lg:flex items-center space-x-4 lg:space-x-6",
          className
        )}
        {...props}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === link.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User Button */}
      <div className="flex items-center">
        <CustomUserButton />
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="absolute top-full left-0 right-0 w-48 min-w-full bg-background border rounded-md shadow-lg p-2 lg:hidden flex flex-col space-y-1 mt-2 z-50">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary w-full px-4 py-3 rounded-md",
                pathname === link.href
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
} 