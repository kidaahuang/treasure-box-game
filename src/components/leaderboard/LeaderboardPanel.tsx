import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { fetchLeaderboard, type LeaderboardEntry } from '../../lib/api';
import { withColdStartNotice } from '../../lib/cold-start-notice';

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) return;
    setLoading(true);
    withColdStartNotice(fetchLeaderboard())
      .then((res) => setEntries(res.leaderboard))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trophy className="text-amber-600" />
          Leaderboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🏆 Top Treasure Hunters</DialogTitle>
          <DialogDescription>Best score per player, across all guests-turned-members.</DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}
        {!loading && entries && entries.length === 0 && (
          <p className="text-muted-foreground text-sm">No scores yet — be the first!</p>
        )}
        {!loading && entries && entries.length > 0 && (
          <ol className="space-y-1">
            {entries.map((entry, i) => (
              <li
                key={entry.username}
                className="flex items-center justify-between rounded-md px-3 py-2 odd:bg-amber-50"
              >
                <span className="text-amber-900">
                  <span className="text-amber-600 mr-2">#{i + 1}</span>
                  {entry.username}
                </span>
                <span className={entry.bestScore >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${entry.bestScore}
                </span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
