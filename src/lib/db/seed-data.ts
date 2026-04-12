export type CompetitorSeed = {
  id: string;
  name: string;
  slug: string;
  category: "direct" | "indirect" | "emerging";
  notes: string;
};

export type TargetSeed = {
  id: string;
  competitorId: string;
  url: string;
  pageType: string;
  label: string;
};

export type SnapshotSeed = {
  targetSlug: string;
  version: number;
  daysAgo: number;
};

export const COMPETITORS: CompetitorSeed[] = [
  { id: "c-projectflow", name: "ProjectFlow", slug: "projectflow", category: "direct", notes: "Aggressive pricing strategy, main competitor" },
  { id: "c-taskmaster", name: "TaskMaster Pro", slug: "taskmaster", category: "direct", notes: "Feature-heavy, targeting power users" },
  { id: "c-agilebuddy", name: "AgileBuddy", slug: "agilebuddy", category: "indirect", notes: "Startup niche, lightweight tool" },
  { id: "c-workos", name: "WorkOS Suite", slug: "workos", category: "emerging", notes: "Enterprise play, recent market entry" },
];

export const TARGETS: TargetSeed[] = [
  { id: "t-pf-pricing", competitorId: "c-projectflow", url: "https://projectflow.io/pricing", pageType: "pricing", label: "Pricing Page" },
  { id: "t-pf-changelog", competitorId: "c-projectflow", url: "https://projectflow.io/changelog", pageType: "changelog", label: "Changelog" },
  { id: "t-tm-features", competitorId: "c-taskmaster", url: "https://taskmaster.pro/features", pageType: "features", label: "Features Page" },
  { id: "t-tm-blog", competitorId: "c-taskmaster", url: "https://taskmaster.pro/blog", pageType: "blog", label: "Blog" },
  { id: "t-ab-homepage", competitorId: "c-agilebuddy", url: "https://agilebuddy.com", pageType: "homepage", label: "Homepage" },
  { id: "t-wo-pricing", competitorId: "c-workos", url: "https://workos.suite/pricing", pageType: "pricing", label: "Pricing Page" },
  { id: "t-wo-blog", competitorId: "c-workos", url: "https://workos.suite/blog", pageType: "blog", label: "Blog" },
];

export const SNAPSHOT_SEQUENCE: SnapshotSeed[] = [
  { targetSlug: "projectflow-pricing", version: 1, daysAgo: 14 },
  { targetSlug: "projectflow-pricing", version: 2, daysAgo: 7 },
  { targetSlug: "projectflow-changelog", version: 1, daysAgo: 14 },
  { targetSlug: "projectflow-changelog", version: 2, daysAgo: 7 },
  { targetSlug: "projectflow-changelog", version: 3, daysAgo: 2 },
  { targetSlug: "taskmaster-features", version: 1, daysAgo: 14 },
  { targetSlug: "taskmaster-features", version: 2, daysAgo: 7 },
  { targetSlug: "taskmaster-features", version: 3, daysAgo: 2 },
  { targetSlug: "taskmaster-blog", version: 1, daysAgo: 14 },
  { targetSlug: "taskmaster-blog", version: 2, daysAgo: 7 },
  { targetSlug: "agilebuddy-homepage", version: 1, daysAgo: 14 },
  { targetSlug: "agilebuddy-homepage", version: 2, daysAgo: 7 },
  { targetSlug: "agilebuddy-homepage", version: 3, daysAgo: 2 },
  { targetSlug: "workos-pricing", version: 1, daysAgo: 14 },
  { targetSlug: "workos-pricing", version: 2, daysAgo: 7 },
  { targetSlug: "workos-blog", version: 1, daysAgo: 14 },
  { targetSlug: "workos-blog", version: 2, daysAgo: 7 },
];
