import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { useAuth } from '../../context/AuthContext';

export function AuthScreen() {
  const { continueAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-900">🏴‍☠️ Treasure Hunt</CardTitle>
          <CardDescription>Sign in to save your scores, or play as a guest.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={continueAsGuest}>
            Play as Guest
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
