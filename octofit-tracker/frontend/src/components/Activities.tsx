import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      dataKey="activities"
      emptyText="No activities yet."
      renderItem={(activity) => (
        <p>{String(activity.type)} · {String(activity.minutes)} minutes · {String(activity.points)} points</p>
      )}
    />
  );
}
