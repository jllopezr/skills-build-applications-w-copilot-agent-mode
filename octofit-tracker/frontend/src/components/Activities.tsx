import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = Record<string, unknown>;

function isActivity(value: unknown): value is Activity {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<Record<string, unknown>>('/api/activities')
      .then((response) => {
        const data = response.activities;
        if (!Array.isArray(data) || !data.every(isActivity)) {
          throw new Error('Invalid activities response');
        }
        if (active) setActivities(data);
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
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {error ? (
          <p role="alert">Unable to load activities: {error}</p>
        ) : activities === null ? (
          <p role="status">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No activities yet.</p>
        ) : (
          <div>
            {activities.map((activity, index) => (
              <div key={String(activity._id ?? index)}>
                <p>{String(activity.type)} · {String(activity.minutes)} minutes · {String(activity.points)} points</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
