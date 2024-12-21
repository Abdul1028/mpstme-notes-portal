"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function CustomUserButton() {
  const { theme } = useTheme();

  return (
    <UserButton
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          avatarBox: "h-8 w-8",
          userButtonPopup: "border border-border bg-background",
          userButtonTrigger: "focus-visible:ring-offset-background",
          userButtonPopoverCard: "shadow-md",
          userPreviewMainIdentifier: "text-foreground",
          userPreviewSecondaryIdentifier: "text-muted-foreground",
          userButtonPopoverActionButton: "text-foreground hover:bg-accent hover:text-foreground",
          userButtonPopoverActionButtonText: "text-foreground hover:text-foreground",
          userButtonPopoverFooter: "border-t border-border",
          card: "bg-background",
          userPreviewTextContainer: "text-foreground",
          userButtonPopoverActionButtonIcon: "text-foreground",
          userButtonPopoverText: "text-foreground",
          userButtonPopoverActionButtonContainer: "hover:text-foreground",
          userButtonPopoverActionButtonArrow: "text-foreground",
        },
      }}
    />
  );
}