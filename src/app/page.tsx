import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookText, Share2, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-32 pt-24 text-center md:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <h1 className="bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            Share Notes, Collaborate & Learn Together
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
            A modern platform for MPSTME students to share and collaborate on academic notes.
            Join your peers in creating a knowledge-sharing community.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="h-11 px-8">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg" className="h-11 px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-16 md:grid-cols-3 md:px-6">
        <div className="flex flex-col items-center space-y-4 rounded-lg border p-4 transition-all hover:border-primary">
          <div className="rounded-full border p-4">
            <BookText className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Organized Notes</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Keep your study materials organized by subjects and topics
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4 rounded-lg border p-4 transition-all hover:border-primary">
          <div className="rounded-full border p-4">
            <Share2 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Easy Sharing</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Share notes with classmates through secure, shareable links
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4 rounded-lg border p-4 transition-all hover:border-primary">
          <div className="rounded-full border p-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Collaboration</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Work together with peers to create comprehensive study materials
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a href="#" className="font-medium underline underline-offset-4">
              MPSTME Students
            </a>
            . The source code is available on{" "}
            <a
              href="#"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
