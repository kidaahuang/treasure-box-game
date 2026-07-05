import { toast } from 'sonner';

// Render's free tier spins the backend down after ~15 min idle; the first
// request after that can take up to ~50s. Surface that instead of looking hung.
export async function withColdStartNotice<T>(promise: Promise<T>): Promise<T> {
  const timer = setTimeout(() => {
    toast.info('Waking up the server… this can take up to a minute on the free tier.');
  }, 3000);
  try {
    return await promise;
  } finally {
    clearTimeout(timer);
  }
}
