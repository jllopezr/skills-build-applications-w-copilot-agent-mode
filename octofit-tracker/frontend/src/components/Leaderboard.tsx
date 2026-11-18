import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = Record<string, unknown>;

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<Record<string, unknown>>('/api/leaderboard')
      .then((response) => {
        const data = response.leaderboard;
        if (!Array.isArray(data) || !data.every(isLeaderboardEntry)) {
          throw new Error('Invalid leaderboard response');
        }
        if (active) setEntries(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unknown error');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {error ? (
          <p role="alert">Unable to load leaderboard: {error}</p>
        ) : entries === null ? (
          <p role="status">Loading leaderboard...</p>
        ) : entries.length === 0 ? (
          <p>No leaderboard rankings yet.</p>
        ) : (
          <div>
            {entries.map((entry, index) => (
              <div key={String(entry._id ?? index)}>
                <p>{String(entry.rank)}. {String(entry.teamName)} — {String(entry.totalPoints)} points</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
