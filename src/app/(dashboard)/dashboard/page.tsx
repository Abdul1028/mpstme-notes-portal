"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { FileText, Users, Star, Clock, ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalFiles: number;
  totalDownloads: number;
  favoriteFiles: number;
  recentUploads: Array<{
    id: string;
    name: string;
    uploadedAt: string;
    subject: string;
  }>;
  subjectStats: Array<{
    subject: string;
    fileCount: number;
  }>;
}

export default function DashboardPage() {
  const { userId } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (refresh = false) => {
    try {
      const url = `/api/dashboard/stats${refresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-2xl font-bold">{stats.totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favorite Files</p>
                <p className="text-2xl font-bold">{stats.favoriteFiles}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
                <p className="text-2xl font-bold">{stats.subjectStats.length}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Your latest uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUploads.map((file, index) => (
                <div
                  key={`${file.id}-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.subject}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/notes?file=${file.id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Files by Subject</CardTitle>
            <CardDescription>Distribution of your uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.subjectStats.map((subject, index) => (
                <div
                  key={`${subject.subject}-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{subject.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {subject.fileCount} {subject.fileCount === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                  <div className="h-2 w-24 rounded-full bg-primary/20">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(subject.fileCount / stats.totalFiles) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild className="w-full">
              <Link href="/notes">
                <FileText className="mr-2 h-4 w-4" />
                Upload New File
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/notes?filter=favorites">
                <Star className="mr-2 h-4 w-4" />
                View Favorites
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/notes?sort=recent">
                <Clock className="mr-2 h-4 w-4" />
                Recent Files
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 