import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      dataKey="teams"
      emptyText="No teams yet."
      renderItem={(team) => (
        <>
          <p>{String(team.name)}</p>
          <p>{Array.isArray(team.members) ? team.members.map(String).join(', ') : ''}</p>
        </>
      )}
    />
  );
}
