import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(
    (item) => typeof item === 'string' && mongoose.isObjectIdOrHexString(item),
  );
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !mongoose.isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' ||
    !mongoose.isObjectIdOrHexString(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Valid user, team, type, and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot } = input;
  const suppliedMembers = input.members;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    (suppliedMembers !== undefined && !isObjectIdList(suppliedMembers))
  ) {
    throw Object.assign(new Error('A team name, mascot, and valid member IDs are required'), { status: 400 });
  }

  const members = suppliedMembers === undefined ? [] : suppliedMembers;
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $addFields: { totalPoints: { $sum: '$activities.points' } } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).select('type').lean(),
    Workout.find().lean(),
  ]);
  const reasonsByFocus = new Map<string, string>();
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  reasonsByFocus.set(goalFocus, `Recommended for your ${user.fitnessGoal} fitness goal.`);

  for (const activity of activities) {
    const type = activity.type.trim().toLowerCase();
    const focus = type === 'run' || type === 'cycle'
      ? 'endurance'
      : type === 'walk'
        ? 'mobility'
        : type;
    if (!reasonsByFocus.has(focus)) {
      reasonsByFocus.set(focus, `Recommended based on your recent ${activity.type} activity.`);
    }
  }

  const focusOrder = [...reasonsByFocus.keys()];
  return workouts
    .map((workout, index) => {
      const focus = workout.focus.trim().toLowerCase();
      const priority = focusOrder.indexOf(focus);
      return {
        ...workout,
        reason: reasonsByFocus.get(focus) ?? `Suggested as another option for your ${user.fitnessGoal} goal.`,
        priority: priority === -1 ? focusOrder.length : priority,
        originalIndex: index,
      };
    })
    .sort((left, right) => left.priority - right.priority || left.originalIndex - right.originalIndex)
    .map(({ priority: _priority, originalIndex: _originalIndex, ...suggestion }) => suggestion);
}

export { User };
