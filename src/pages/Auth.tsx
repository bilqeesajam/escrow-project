import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') || 'signup');

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await signIn(fd.get('email') as string, fd.get('password') as string);
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await signUp(
      fd.get('email') as string,
      fd.get('password') as string,
      fd.get('displayName') as string,
    );
    setLoading(false);
    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created', description: 'Check your email to confirm, or log in if email confirmation is disabled.' });
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2836]">
      <header className="bg-[#0f1a2b] sticky top-0 z-50 ">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent border border-white">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              EscrowShield
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white">
            <Link to="/#how-it-works" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-white before:transition-[width] before:duration-300 hover:before:w-full">
              How it works
            </Link>
            <Link to="/#features" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-white before:transition-[width] before:duration-300 hover:before:w-full">
              Features
            </Link>
            <Link to="/about" className="relative hover:text-white transition-colors before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-0 before:bg-white before:transition-[width] before:duration-300 hover:before:w-full">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white " onClick={() => setTab('login')}>
              Log In
            </Button>
            <Button size="sm" className="bg-[#f5b800] text-black hover:bg-[#e0a500]" onClick={() => setTab('signup')}>
              Sign Up
            </Button>
          </div>
        </div>
      </header><br /><br /><br />
      <div className="flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#0f1a2b]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-[#f5b800]">EscrowShield</CardTitle>
          <CardDescription className="text-[#66758a]">Secure escrow transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1a2a42] rounded-md">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#f5b800] data-[state=active]:text-black data-[state=inactive]:text-[#66758a]">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-[#f5b800] data-[state=active]:text-black data-[state=inactive]:text-[#66758a]">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4 text-[#66758a] ">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full bg-[#f5b800] text-black hover:bg-[#e0a500]" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4 text-[#66758a]">
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" name="displayName" required />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="signup-password">Create Password</Label>
                  <Input id="signup-password" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full bg-[#f5b800] text-black hover:bg-[#e0a500]" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div><br /><br /><br /><br />
      <footer className="border-t border-border/60 bg-[#0f1a2b]">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} EscrowShield. All rights reserved.</span>
          <div className="flex items-center gap-6">
            {/* <Link to="/#how-it-works" className="hover:text-white transition-colors">How it works</Link> */}
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/auth?tab=signup" className="hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
