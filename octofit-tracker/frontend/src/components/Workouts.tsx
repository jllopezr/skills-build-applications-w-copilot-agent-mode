import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = Record<string, unknown>;

function isWorkoutSuggestion(value: unknown): value is WorkoutSuggestion {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const path = `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`;

    getJson<Record<string, unknown>>(path)
      .then((response) => {
        const data = response.suggestions;
        if (!Array.isArray(data) || !data.every(isWorkoutSuggestion)) {
          throw new Error('Invalid workout suggestions response');
        }
        if (active) setSuggestions(data);
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {error ? (
          <p role="alert">Unable to load workout suggestions: {error}</p>
        ) : suggestions === null ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p>No workout suggestions yet.</p>
        ) : (
          <div>
            {suggestions.map((workout, index) => (
              <div key={String(workout._id ?? index)}>
                <p>{String(workout.title)}</p>
                <p>{String(workout.reason ?? '')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
