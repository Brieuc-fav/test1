'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Home, Video, CreditCard, LogIn, UserPlus, LogOut, Menu } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Video className="h-6 w-6 text-white" />
            </div>
            <span className="hidden sm:inline-block font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Video Magic
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <Video className="h-4 w-4" />
                Mes vidéos
              </Link>
            )}
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            >
              <CreditCard className="h-4 w-4" />
              Tarifs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer md:hidden">
                  <Link href="/" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    Accueil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard" className="flex items-center">
                    <Video className="mr-2 h-4 w-4" />
                    Mes vidéos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer md:hidden">
                  <Link href="/pricing" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Tarifs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    S'inscrire
                  </Link>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/" className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      Accueil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/pricing" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Tarifs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/login" className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/signup" className="flex items-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      S'inscrire
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
