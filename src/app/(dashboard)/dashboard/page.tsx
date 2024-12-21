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
    <div className="container p-4 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full sm:w-auto"
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalFiles}</p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favorite Files</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.favoriteFiles}</p>
              </div>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.subjectStats.length}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads and Subject Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6 sm:mb-8">
        <Card className="col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Recent Uploads</CardTitle>
            <CardDescription>Your latest uploaded files</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {stats.recentUploads.map((file, index) => (
                <div
                  key={`${file.id}-${index}`}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{file.subject}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild className="ml-2 flex-shrink-0">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Files by Subject</CardTitle>
            <CardDescription>Distribution of your uploaded files</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {stats.subjectStats.map((subject, index) => (
                <div
                  key={`${subject.subject}-${index}`}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="font-medium truncate">{subject.subject}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {subject.fileCount} {subject.fileCount === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                  <div className="h-2 w-16 sm:w-24 flex-shrink-0 rounded-full bg-primary/20">
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Button asChild className="w-full">
              <Link href="/notes" className="flex items-center justify-center">
                <FileText className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Upload New File</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/notes?filter=favorites" className="flex items-center justify-center">
                <Star className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">View Favorites</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/notes?sort=recent" className="flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Recent Files</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 