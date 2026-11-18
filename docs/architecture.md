# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision:Implement the React UI only after backend contracts pass. Add loading, empty, error and success states required by the frontend tests.
- Logic tier decision:Implement missing Express services and routes following the API contract. Return deliberate 4xx errors for invalid input instead of unhandled 500 responses.
- Data tier decision:Add required Mongoose schema validation and reference checks for users, teams and activities.
- Activity tracking approach:Validate userId and teamId before creation, calculate points automatically and persist occurredAt when creating activities.
- Team management approach:Validate team name on creation, store mascot information and expose list/create endpoints through the API.
- Leaderboard approach:Aggregate activity points by team, sort descending by total points and generate a 1-based rank field.
- Workout suggestions approach:Use seeded user goals and recent activity patterns to generate suggestions, including a reason field. Return 404 when the user email is not found.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
Failures indicate missing Mongoose validation, incorrect references or data model issues.
- API command: `npm run test:api --prefix octofit-tracker/backend`
Failures indicate incomplete services, route wiring problems or API contract violations.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
Failures indicate missing UI states, incorrect API integration or rendering issues.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
Failures indicate TypeScript compilation problems.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
Failures indicate React, Vite or TypeScript build issues.
