/**
 * Role specifications and capabilities according to MASTER_DEVELOPMENT_PROMPT.md
 */

export const ROLES_DATA = [
  {
    id: 'coach',
    title: 'Coach Portal',
    badge: 'Squad Leadership',
    badgeVariant: 'warning',
    accentColor: 'amber',
    iconName: 'Whistle',
    tagline: 'Team Management, Practice Sessions & Match Control',
    description:
      'Coaches maintain complete authority over athlete registration, daily practice sessions, immutable attendance records, and match participation.',
    responsibilities: [
      {
        title: 'Player Roster Management',
        detail: 'Register and manage athletes with name, age, sport, and track individual readiness.',
      },
      {
        title: 'Session & Attendance Lock',
        detail: 'Create practice sessions by date and sport. Mark athletes Present/Absent. Sessions become permanently immutable once closed.',
      },
      {
        title: 'Match Organization & Scoring',
        detail: 'Schedule matches with date, sport, opponent. Enforce same-day presence check before entering scores.',
      },
      {
        title: 'Athlete Performance Analytics',
        detail: 'Calculate real-time attendance percentages and readiness thresholds (>=75% attendance & >=2 matches).',
      },
    ],
    rules: [
      'Closed practice sessions cannot be modified.',
      'Only players present in that day and sport practice can join matches.',
      'Can view all players, attendance, and scores across sports.',
    ],
    phaseAvailability: 'Phase 1 Preview • Phase 2 Auth • Phases 3-5 Full Workflows',
    primaryActionText: 'Preview Coach Console',
  },
  {
    id: 'player',
    title: 'Player Portal',
    badge: 'Athlete Self-Service',
    badgeVariant: 'info',
    accentColor: 'blue',
    iconName: 'UserCheck',
    tagline: 'Personal Performance, Attendance & Readiness Progress',
    description:
      'Athletes access an isolated, private dashboard to monitor their training consistency, match performances, and qualification for scout visibility.',
    responsibilities: [
      {
        title: 'Personal Profile Overview',
        detail: 'Inspect registered age, assigned sport category, and historical training statistics.',
      },
      {
        title: 'Real-Time Attendance Rate',
        detail: 'Track verified attendance percentage calculated strictly from closed, completed practice sessions.',
      },
      {
        title: 'Match History & Scorecard',
        detail: 'Review matches participated in, individual scores achieved, and opponent summaries.',
      },
      {
        title: 'Readiness Status Tracker',
        detail: 'Visual progress bar toward the 75% attendance and 2-match threshold required for scout eligibility.',
      },
    ],
    rules: [
      'Strict data isolation: Players can only see their own records.',
      'Attendance is calculated only from finalized (closed) sessions.',
      'Readiness is computed automatically by business logic, never hardcoded.',
    ],
    phaseAvailability: 'Phase 1 Preview • Phase 2 Auth • Phase 6 Dedicated Dashboard',
    primaryActionText: 'Preview Athlete Dashboard',
  },
  {
    id: 'scout',
    title: 'Scout Talent Hub',
    badge: 'Talent Discovery',
    badgeVariant: 'ready',
    accentColor: 'emerald',
    iconName: 'Target',
    tagline: 'Elite Athlete Pipeline & Verified Performance Data',
    description:
      'Professional scouts gain exclusive access to a filtered pool of competition-ready athletes who have satisfied rigorous training and match criteria.',
    responsibilities: [
      {
        title: 'Ready-Only Athlete Pool',
        detail: 'Scouts view exclusively players who have reached >=75% attendance and played >=2 matches.',
      },
      {
        title: 'Verified Performance Metrics',
        detail: 'Inspect match scoring trends, opponent caliber, and training consistency records.',
      },
      {
        title: 'Sport & Age Filtering',
        detail: 'Search and filter ready candidates by sport discipline, age bracket, and performance index.',
      },
      {
        title: 'Readiness Audit Trail',
        detail: 'Guaranteed compliance: Backend strictly enforces zero access to non-ready athlete records.',
      },
    ],
    rules: [
      'Scouts can NEVER view non-ready athletes.',
      'Readiness requires: Attendance >= 75% AND Matches Played >= 2.',
      'Readiness calculations exclude open, unclosed practice sessions.',
    ],
    phaseAvailability: 'Phase 1 Preview • Phase 2 Auth • Phase 6 Scout Filtering',
    primaryActionText: 'Preview Scout Talent Pool',
  },
];

