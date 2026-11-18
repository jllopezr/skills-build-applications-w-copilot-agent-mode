import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = Record<string, unknown>;

function isTeam(value: unknown): value is Team {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<Record<string, unknown>>('/api/teams')
      .then((response) => {
        const data = response.teams;
        if (!Array.isArray(data) || !data.every(isTeam)) {
          throw new Error('Invalid teams response');
        }
        if (active) setTeams(data);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {error ? (
          <p role="alert">Unable to load teams: {error}</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <div>
            {teams.map((team, index) => (
              <div key={String(team._id ?? index)}>
                <p>{String(team.name)}</p>
                <p>{Array.isArray(team.members) ? team.members.map(String).join(', ') : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
