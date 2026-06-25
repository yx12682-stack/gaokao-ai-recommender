# Future 3D Gaokao Decision Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the school-first Gaokao recommender into a higher-end AI decision product with a futuristic 3D decision layer, richer similar-outcome visualization, and tested helper logic.

**Architecture:** Keep the backend recommendation API and probability model intact. Add a focused `src/shared/decision-experience.ts` helper for deterministic UI decision-state and outcome-nebula data. Consume that helper from `src/App.tsx` and add CSS-only 3D/holographic visuals in `src/styles.css` to avoid heavy dependencies and preserve Render stability.

**Tech Stack:** React, TypeScript, Vite, Framer Motion, Lucide React, Vitest, CSS 3D transforms/animations, existing Node/tsx server on Render.

---

## Task 1: Lock Decision Experience Logic With Tests

- [x] Add `src/shared/decision-experience.test.ts` covering profile, school-pool, major-selection, and volunteer-plan phases.
- [x] Cover similar-outcome nebula sorting, intensity labels, percentage formatting, and empty-state behavior.
- [x] Run the new test once before implementation and confirm it fails because the helper is missing.
- [x] Implement `src/shared/decision-experience.ts` with pure deterministic helpers.
- [x] Re-run the focused test until it passes.

## Task 2: Add The Future Decision Layer To The Product Flow

- [x] Import the decision helper into `src/App.tsx`.
- [x] Add a `DecisionUniverseHero` component that shows current decision phase, candidate count, risk split, selected majors, data status, and plan progress.
- [x] Place the universe between the existing flow steps and the cockpit so the product explains what the AI is deciding before showing detailed controls.
- [x] Add an `OutcomeNebula` component for aggregated similar-rank choices, preserving privacy and source notes.
- [x] Replace any flat cohort list display with the richer nebula view.

## Task 3: Upgrade Visual System And Motion

- [x] Add CSS-only 3D orbit/grid visuals, holographic panels, controlled glow, and card depth.
- [x] Add advanced but restrained hover, focus, and reduced-motion behavior.
- [x] Keep the existing school-first workflow usable on desktop and mobile.
- [x] Preserve the current API contract and Render start/build behavior.

## Task 4: Verify, Commit, Push, Deploy

- [x] Run the focused new test.
- [x] Run the full test suite with `npm test`.
- [x] Run `npm run build`.
- [x] Stage only source/docs files, leaving generated upload artifacts untracked.
- [ ] Commit and push to `main`.
- [ ] Confirm Render can deploy from the pushed commit, or give the manual deploy instruction if auto-deploy does not start.
