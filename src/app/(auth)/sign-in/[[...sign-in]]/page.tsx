import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: "bg-black text-white hover:bg-black/90",
          footerActionLink: "text-black hover:text-black/90",
          card: "bg-background shadow-none",
          formFieldInput: "bg-muted border-input",
          dividerLine: "bg-border",
          formFieldLabel: "text-foreground",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-muted text-foreground border border-border hover:bg-muted/90",
          socialButtonsBlockButtonText: "text-foreground font-normal",
          formFieldErrorText: "text-destructive",
          footer: "hidden",
        },
        variables: {
          colorPrimary: "#000000",
          colorText: "#FFFFFF",
          colorTextOnPrimaryBackground: "#FFFFFF",
          colorBackground: "#09090B",
          colorInputBackground: "#020817",
          colorInputText: "#FFFFFF",
          borderRadius: "0.5rem",
        },
      }}
    />
  );
}
