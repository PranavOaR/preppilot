# PrepPilot — Project Guide

@AGENTS.md

## Overview

PrepPilot is a technical interview preparation platform targeting Indian IT companies (TCS, Infosys, Wipro, Zoho, Flipkart, etc.). Built with Next.js 16, Firebase (Firestore + Auth), Judge0 CE for code execution, and Monaco Editor.

**Developers:** 2 (duo)
**No deadlines.** Work at our own pace.

## Tech Stack

- **Framework:** Next.js 16 (App Router) — uses `proxy.ts` instead of `middleware.ts`
- **Auth:** Firebase Auth (email/password + Google). GitHub auth deferred.
- **Database:** Firestore (Blaze plan, US region, production mode)
- **Code Execution:** Judge0 CE via RapidAPI (`wait=true` synchronous mode)
- **Editor:** Monaco Editor (dynamically imported, no SSR)
- **Styling:** Tailwind CSS with Material Design 3 token system (custom CSS variables)

## Architecture Decisions

- **Firebase Admin SDK** — optional, enabled via `FIREBASE_SERVICE_ACCOUNT_JSON` env var. Required for server-side plan activation (payments) and admin stats API. `src/lib/firebase/server.ts` exports `getAdminDb()` which returns `null` when not configured.
- **Cookie-based session** — `__session` httpOnly cookie stores a Firebase ID token. Set server-side via `POST /api/auth/session`, verified cryptographically in `proxy.ts` using JWK-based `verifyIdToken`. `onIdTokenChanged` in auth-context keeps it refreshed every ~hour.
- **Client-side Firestore filtering** — fetch all docs, filter in memory to avoid composite index requirements (viable for <200 problems)
- **Sequential Judge0 submissions** — one test case at a time with `wait=true` to keep it simple
- **`src/lib/plans/usage.ts`** — uses Firebase client SDK (`db`) intentionally. Called from Node.js API routes, not Edge runtime, so this is safe.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # /login, /register
│   ├── (admin)/          # /admin, /admin/problems, /admin/contests, /admin/users (role-guarded)
│   ├── (dashboard)/      # /dashboard, /practice, /practice/[slug], /profile, /roadmap, /leaderboard, /analytics
│   ├── api/
│   │   ├── submissions/  # POST — run/submit code against Judge0
│   │   └── user/         # profile, progress, activity, submissions
│   ├── layout.tsx        # Root layout with AuthProvider
│   ├── page.tsx          # Redirects to /dashboard
│   └── proxy.ts          # Route protection (Next.js 16 proxy, NOT middleware)
├── components/
│   ├── admin/            # AdminSidebar, ProblemForm, ProblemPicker
│   ├── analytics/        # PercentileCard, TopicRadar
│   ├── auth/             # LoginForm, RegisterForm, SocialButton
│   ├── dashboard/        # Dashboard widgets
│   ├── layout/           # TopNav
│   ├── leaderboard/      # ContestCard, LeaderboardTable, CollegeRankings
│   ├── practice/         # ProblemFilters, ProblemsTable, AptitudeProblem, TestResults, ContestTimer
│   ├── profile/          # Heatmap, ProblemsDonut, TopicProgress, RecentSubmissions
│   ├── roadmap/          # (placeholder)
│   └── ui/               # Shadcn primitives (Button, Card, Input, etc.)
├── contexts/
│   └── auth-context.tsx  # AuthProvider + useAuth() hook (exposes isAdmin)
├── lib/
│   ├── db/               # Firestore queries: problems, users, submissions, progress, activity, contests, analytics, admin
│   ├── firebase/         # Firebase client init, auth helpers (signIn, signUp, signInWithGoogle, etc.)
│   ├── judge/            # Judge0 client + language mappings
│   ├── types/            # TypeScript types (Problem, UserProfile, Submission, etc.)
│   └── xp/               # XP calculator + streak tracking
scripts/
├── seed-problems.ts      # 28 DSA problems across 16 topics
└── seed-aptitude.ts      # 63 MCQ problems across 15 aptitude topics
```

## Firestore Collections

- `users/{userId}` — profile data (username, university, targetCompany, xp, streak, etc.)
- `problems/{problemId}` — 91 problems (28 DSA + 63 aptitude)
- `submissions/{submissionId}` — code submissions with verdicts
- `userProgress/{progressId}` — per-topic solve counts
- `activityLog/{activityId}` — daily activity for heatmap

## Problem Data

- **28 DSA problems** — arrays, strings, two-pointers, binary-search, linked-list, stack, trees, DP, graph, sorting, heap, greedy, backtracking, hash-table, matrix, bit-manipulation
- **63 Aptitude MCQs** — numbers, percentages, profit-and-loss, average, ratio-and-proportion, mixture-and-alligation, time-and-work, time-speed-distance, pipes-and-cisterns, algebra, trigonometry-height-distance, geometry, probability, permutation-and-combination, age-problems
- All problems tagged with Indian companies
- DSA problems have starter code in Python, C, C++, Java + test cases
- Aptitude problems have 4 options + correctAnswer + explanation

## Completed Phases

### Phase 1: Auth + Firebase Setup
- [x] Firebase client SDK init
- [x] Email/password sign-up with profile fields (username, university, year, semester, target company, preferred language)
- [x] Google sign-in (auto-creates profile via ensureUserProfile)
- [x] Cookie-based session management (`__session`)
- [x] Next.js 16 proxy for route protection
- [x] AuthProvider context with useAuth() hook

### Phase 2: Problems + Practice
- [x] Firestore-backed problem fetching (client-side filtering)
- [x] Practice page with filters (type, difficulty, topic, company, search)
- [x] DSA problem page with Monaco Editor, language switching, Run Tests / Submit
- [x] Aptitude MCQ page with radio options, confirmation dialog, explanation reveal
- [x] Judge0 integration (API route + client) — needs RapidAPI subscription to work
- [x] Seed scripts for 28 DSA + 63 aptitude problems

### Phase 3: Profile Page (LeetCode-style)
- [x] User info card with stats (total solved, XP, streak, rank)
- [x] Problems donut chart (easy/medium/hard breakdown)
- [x] GitHub-style activity heatmap (52-week SVG grid)
- [x] Topic progress bars (grouped by DSA/Aptitude)
- [x] Recent submissions list with status badges
- [x] API routes: /api/user/profile, /api/user/progress, /api/user/activity, /api/user/submissions

### Phase 4: Gamification Backend
- [x] XP calculator (easy=10, medium=25, hard=50, 1.5x first solve bonus)
- [x] Streak tracking (daily, resets if day missed)
- [x] Activity logging (upserts daily activity docs)

### Phase 5: Adaptive Roadmap
- [x] Roadmap engine with company-weighted topic priority scoring
- [x] 12 Indian companies mapped with per-topic weights (1-10 scale)
- [x] Topics sorted by priority, marked as completed/in-progress/recommended/not-started
- [x] Accuracy tracking per topic, "High Priority" badges for weight >= 8
- [x] Practice links from roadmap pass topic+type filters to practice page
- [x] Mastery sidebar with global progress, streak, focus area suggestion

### Phase 6: Contests + Leaderboard
- [x] Contest DB layer (`src/lib/db/contests.ts`) — create, join, submit, leaderboard
- [x] Contests page with filterable tabs (All/Upcoming/Live/Completed)
- [x] Contest detail page (`/leaderboard/[id]`) with live leaderboard
- [x] Leaderboard table with medal icons, current user highlighting
- [x] Join contest flow, participant tracking via contestParticipants collection

### Phase 7: Dashboard + Polish
- [x] Dashboard wired with real Firestore data (XP, streak, solved count, recent submissions)
- [x] Recent activity feed (last 5 submissions with status badges)
- [x] Quick practice cards linking to filtered practice page
- [x] "Continue where you left off" card from most recent submission
- [x] Settings page (`/settings`) — edit profile (username, university, year, semester, company, language)
- [x] Profile page: green heatmap, removed topic progress, capped recent submissions
- [x] Solved/attempted status badges on problems table
- [x] Submission recording wired into both DSA (Judge0 submit) and Aptitude (MCQ confirm)
- [x] Removed unused mock dashboard components

### Phase 8: Admin System + Elevation Features
- [x] Role system (`role: "user" | "admin"` on UserProfile, `isAdmin` in auth context)
- [x] Admin layout with sidebar + role guard (redirects non-admins)
- [x] Admin dashboard with stats overview (users, problems, contests, submissions)
- [x] Problem management — create/edit problems (DSA + Aptitude) with status (draft/published)
- [x] Contest management — multi-step create (basics → schedule → pick problems → review), edit, delete
- [x] Problem picker component for contest creation (searchable, filterable, checkbox selection)
- [x] Contest taking experience — timer bar, problem sidebar, DSA editor + MCQ, per-problem submit, resumable
- [x] User management — list all users, search, promote/demote admin role
- [x] Performance analytics — topic-wise accuracy bars, percentile ranking, insights (strongest/weakest topics)
- [x] College leaderboard — aggregate users by university, rank by total XP

### Phase 9: Real-time Contests
- [x] Toast context + component (app-wide notifications)
- [x] ToastProvider in root layout
- [x] Firestore `onSnapshot` subscription functions (`subscribeToContests`, `subscribeToContest`, `subscribeToParticipants`)
- [x] `useContestStatus` hook — computes upcoming/active/completed from timestamps every second
- [x] `useContestsRealtime` hook — live contest list with new-contest toast notifications
- [x] `useContestRealtime` hook — live single contest doc
- [x] `useLeaderboardRealtime` hook — live participant rankings
- [x] Leaderboard pages refactored to use realtime hooks
- [x] Contest take page uses realtime contest status for auto-detecting contest end

### Phase 10: AI Hints (Groq)
- [x] Groq SDK integration with lazy initialization (`src/lib/groq/client.ts`)
- [x] Progressive hint prompts — 4 levels: nudge → approach → pseudocode → walkthrough
- [x] Hint cache in Firestore (`hintCache/{problemId}_level{N}`)
- [x] Hint usage tracking (`hintUsage/{userId}_{problemId}_level{N}`)
- [x] POST `/api/hints` route — validates level progression, checks cache, calls Groq, deducts XP
- [x] XP cost per level: 5/10/15/25, daily limit of 10 hints
- [x] `HintPanel` component with expandable hint cards
- [x] Integrated into DSA problem page (left panel) and aptitude problem page (before options)

### Phase 11: Mock Interview (Groq)
- [x] Groq interview prompts — question generation, follow-up, evaluation, feedback
- [x] Interview state machine (10 states, pure function transitions)
- [x] Audio utilities (MediaRecorder, AudioContext playback, blob conversion)
- [x] Firestore DB layer — sessions, Q&A subcollection, feedback
- [x] 3 API routes: `/api/interview/{clarify,diagnose,feedback}`
- [x] Interview setup page — type selection, company, question count, language
- [x] Active interview page — state machine drives question/record/evaluate cycle
- [x] Feedback report page — score ring, strengths/weaknesses, topic scores, suggestions
- [x] 7 interview components (setup, active, recorder, visualizer, transcript, progress, feedback)
- [x] "Interview" nav link in top nav + route protection in proxy

## Firestore Collections

- `users/{userId}` — profile data (includes `role: "user" | "admin"`)
- `problems/{problemId}` — 91+ problems (includes `status: "draft" | "published"`, `createdBy`)
- `submissions/{submissionId}` — code/aptitude submissions with verdicts
- `progress/{progressId}` — per-topic solve counts (doc ID: `{userId}_{topic}`)
- `activity/{activityId}` — daily activity for heatmap (doc ID: `{userId}_{date}`)
- `contests/{contestId}` — contest details (includes `type`, `topics`)
- `contestParticipants/{participantId}` — contest participation (doc ID: `{contestId}_{userId}`)
- `contestSubmissions/{submissionId}` — per-problem contest answers (doc ID: `{contestId}_{userId}_{problemId}`)
- `hintCache/{problemId}_level{N}` — cached AI-generated hints
- `hintUsage/{userId}_{problemId}_level{N}` — per-user hint unlock tracking
- `interviewSessions/{sessionId}` — mock interview session data
- `interviewSessions/{sessionId}/questions/{index}` — Q&A subcollection
- `interviewFeedback/{sessionId}` — AI-generated feedback reports

## Known Issues / Pending Items

- **Judge0 not active** — subscribe to Judge0 CE Basic plan on RapidAPI; set `JUDGE0_API_KEY` in `.env.local`
- **Firebase Admin SDK optional** — set `FIREBASE_SERVICE_ACCOUNT_JSON` to enable server-side plan activation and admin stats; without it, payments return 503 and admin dashboard fails to load
- **GitHub auth** — deferred
- **Deployment** — Vercel recommended; set all env vars in the Vercel dashboard
- **First admin setup** — manually set `role: "admin"` on one user doc in Firebase Console
- **DSA contest submissions** — records submission but doesn't run Judge0 for scoring in contest mode
- **Groq API key required** — add `GROQ_API_KEY` to `.env.local` for AI hints and mock interviews
