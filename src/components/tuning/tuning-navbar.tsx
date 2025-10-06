"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Upload, 
  Bell, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface TuningNavBarProps {
  className?: string;
}

export function TuningNavBar({ className }: TuningNavBarProps) {
  const { data: session } = useSession();
  const [notificationCount] = useState(0); // TODO: Implement notification count

  if (!session) {
    return null;
  }

  return (
    <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/files" className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="font-semibold text-lg">File Tuning</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/files"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                My Files
              </Link>
              <Link
                href="/files/upload"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Upload File
              </Link>
              {session.user.isAdmin && (
                <Link
                  href="/admin/files"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Quick Upload Button */}
            <Link href="/files/upload">
              <Button size="sm" className="hidden sm:flex">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </Link>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {session.user.firstName || session.user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <Link href="/files">
                  <DropdownMenuItem>
                    <FileText className="h-4 w-4 mr-2" />
                    My Files
                  </DropdownMenuItem>
                </Link>
                
                <Link href="/files/upload">
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </DropdownMenuItem>
                </Link>
                
                {session.user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin/files">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <Link href="/account/settings">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                </Link>
                
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
