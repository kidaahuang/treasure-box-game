import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { credentialsSchema, type CredentialsInput } from '../../lib/auth-schema';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export function SignUpForm() {
  const { signUp } = useAuth();
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: CredentialsInput) => {
    try {
      await signUp(values.username, values.password);
      toast.success(`Welcome, ${values.username}!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sign up failed');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="treasure_hunter" autoComplete="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing up…' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
}
