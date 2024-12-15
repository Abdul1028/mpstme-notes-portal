"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Share2, Upload } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const subjects = [
    "Mathematics",
    "Physics",
    "Computer Science",
    // Add more subjects from the user's profile
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your notes and shared documents
          </p>
        </div>
        <div className="flex gap-4">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Notes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-2 bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Total Notes</h3>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-2 bg-primary/10">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Shared Notes</h3>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Your Subjects</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link key={subject} href={`/notes/${subject.toLowerCase()}`}>
              <Card className="p-6 hover:border-primary transition-colors cursor-pointer">
                <h4 className="font-semibold">{subject}</h4>
                <p className="text-sm text-muted-foreground">12 notes</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 