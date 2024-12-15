"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Share2 } from "lucide-react";
import Link from "next/link";

export default function SharedPage() {
  const sharedNotes = [
    {
      id: 1,
      title: "Advanced Calculus Notes",
      sharedBy: "John Doe",
      subject: "Mathematics",
      date: "2024-02-20",
      access: "read",
    },
    {
      id: 2,
      title: "Operating Systems",
      sharedBy: "Jane Smith",
      subject: "Computer Science",
      date: "2024-02-19",
      access: "write",
    },
    // Add more shared notes
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shared Notes</h2>
          <p className="text-muted-foreground">
            View notes shared with you by others
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search shared notes..." className="pl-8" />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sharedNotes.map((note) => (
          <Link key={note.id} href={`/shared/${note.id}`}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {note.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${
                    note.access === "write" ? "text-green-500" : "text-blue-500"
                  }`}>
                    {note.access === "write" ? "Can Edit" : "Can View"}
                  </span>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Shared by: {note.sharedBy}</p>
                  <p>{note.subject}</p>
                  <p>Updated {new Date(note.date).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 