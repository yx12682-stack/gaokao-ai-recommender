# National Real Data Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the gaokao recommender into a source-aware national real-data-ready system while preserving `POST /recommend` and Render deployment.

**Architecture:** Add focused shared modules for real-data types and an in-memory source-aware store. Keep the sigmoid recommendation engine, but enrich every recommendation with provenance, probability decomposition, admission trend, risk level, and evidence. Add server coverage/import endpoints and frontend trust/coverage surfaces.

**Tech Stack:** React 18, Vite, Express, TypeScript, Zod, Vitest, Supertest, Render Node web service.

---

## File Structure

- Create `src/shared/data-model.ts`: authoritative data source types, data modes, import payload types, probability explanation types, and coverage types.
- Create `src/shared/real-data-store.ts`: verified/sample seed data, JSON import validation, coverage summaries, and source-aware record access.
- Modify `src/shared/recommendation.ts`: consume the store, expose source-aware recommendation fields, and keep existing catalog exports compatible.
- Modify `src/shared/recommendation.test.ts`: add tests for provenance, explanation, trend, and sample/verified labeling.
- Modify `src/server/app.ts`: add `GET /data-sources`, `GET /data-coverage`, and `POST /data/import`.
- Modify `src/server/recommend-api.test.ts`: add API tests for provenance and import validation.
- Modify `src/App.tsx`: add trust banner, result overview, source chips, probability breakdown, and richer detail drawer.
- Modify `src/styles.css`: add product-grade styles for data trust, coverage, trend, and probability explanation sections.
- Modify `README.md`: document real-data workflow, import format, official source categories, and Render redeploy steps.

## Task 1: Data Model And Store

**Files:**
- Create: `src/shared/data-model.ts`
- Create: `src/shared/real-data-store.ts`
- Test: `src/shared/recommendation.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that import `getDataCoverage`, `importAdmissionData`, and `getAdmissionDataset` from `src/shared/real-data-store.ts`.

```ts
it("tracks source coverage and never treats sample records as verified", () => {
  const coverage = getDataCoverage();
  expect(coverage.totalRecords).toBeGreaterThan(0);
  expect(coverage.byMode.sample).toBeGreaterThan(0);
  expect(coverage.byMode.verified ?? 0).toBe(0);
});

it("rejects imported admission rows without required source metadata", () => {
  const result = importAdmissionData([
    {
      schoolName: "测试大学",
      province: "北京",
      city: "北京",
      major: "计算机科学与技术",
      year: 2025,
      minRank: 1000,
      avgRank: 1600,
      stdRank: 500
    }
  ]);
  expect(result.accepted).toBe(0);
  expect(result.errors[0].message).toContain("sourceUrl");
});
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/shared/recommendation.test.ts`

Expected: FAIL because `src/shared/real-data-store.ts` does not exist.

- [ ] **Step 3: Implement data model and store**

Create a source-aware data model with `DataMode`, `SourceType`, `DataSource`, `SourceAwareSchool`, `SourceAwareAdmissionStat`, `AdmissionImportRow`, `ImportResult`, and `DataCoverage`. Implement an in-memory dataset seeded from existing sample records, with every sample source marked `dataMode: "sample"`.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/shared/recommendation.test.ts`

Expected: PASS for the new data-store tests.

## Task 2: Recommendation Provenance And Explanation

**Files:**
- Modify: `src/shared/recommendation.ts`
- Test: `src/shared/recommendation.test.ts`

- [ ] **Step 1: Write failing tests**

Add assertions that every recommendation contains:

```ts
expect(first.dataMode).toBe("sample");
expect(first.dataSource.sourceUrl).toContain("gaokao.chsi.com.cn");
expect(first.probabilityExplanation.formula).toContain("1 / (1 + exp");
expect(first.probabilityExplanation.factors.base).toEqual(expect.any(Number));
expect(first.admissionTrend.latestYear).toBeGreaterThanOrEqual(2025);
expect(first.rankGap).toEqual(expect.any(Number));
expect(first.evidence.length).toBeGreaterThanOrEqual(3);
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/shared/recommendation.test.ts`

Expected: FAIL because recommendation objects do not yet expose the new fields.

- [ ] **Step 3: Implement source-aware recommendation fields**

Update `Recommendation`, `SchoolProfile`, and `CareerGuide` to include the professional fields from the design. Use the data store for records, calculate `rankGap`, build `probabilityExplanation`, derive `riskLevel`, and produce `admissionTrend` from the three-year rows.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/shared/recommendation.test.ts`

Expected: PASS.

## Task 3: API Coverage And Import Endpoints

**Files:**
- Modify: `src/server/app.ts`
- Test: `src/server/recommend-api.test.ts`

- [ ] **Step 1: Write failing API tests**

Add tests for:

```ts
const coverage = await request(app).get("/data-coverage");
expect(coverage.status).toBe(200);
expect(coverage.body.totalRecords).toBeGreaterThan(0);

const rejected = await request(app).post("/data/import").send([{ schoolName: "缺来源大学" }]);
expect(rejected.status).toBe(400);
expect(rejected.body.error).toBe("INVALID_IMPORT_RECORDS");
```

- [ ] **Step 2: Run failing tests**

Run: `npm test -- src/server/recommend-api.test.ts`

Expected: FAIL because the new endpoints do not exist.

- [ ] **Step 3: Implement endpoints**

Add:

```ts
app.get("/data-sources", ...)
app.get("/data-coverage", ...)
app.post("/data/import", ...)
```

Use the shared store import validator. Return 400 when no records are accepted.

- [ ] **Step 4: Run API tests**

Run: `npm test -- src/server/recommend-api.test.ts`

Expected: PASS.

## Task 4: Product UI For Real Data Trust

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add UI data expectations**

Update React types by consuming the richer `Recommendation` shape. Add derived overview data: total count, source modes, risk counts, city counts, major counts, and latest year.

- [ ] **Step 2: Implement trust surfaces**

Add a top trust banner, a result overview band, per-card data source chips, and detail-drawer sections for evidence, source URLs, admission trend, and probability decomposition.

- [ ] **Step 3: Style without breaking mobile**

Add CSS classes for `.trust-banner`, `.overview-grid`, `.source-chip`, `.probability-breakdown`, `.evidence-list`, `.trend-grid`, and `.source-list`.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

## Task 5: Documentation And Deployment

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document real-data truthfulness**

Explain that bundled data is sample seed data, real nationwide accuracy requires importing records from Sunshine Gaokao, provincial examination authorities, and school admission offices.

- [ ] **Step 2: Document import JSON format**

Include a complete import example with `sourceType`, `sourceName`, `sourceUrl`, `updatedAt`, `verifiedAt`, ranks, school, city, province, and major.

- [ ] **Step 3: Document redeploy**

Tell the operator to upload or push updated files to GitHub. Render will redeploy automatically, or they can click `Manual Deploy`.

- [ ] **Step 4: Final verification**

Run:

```bash
npm test
npm run build
```

Expected: both pass.

## Self-Review

- Spec coverage: data source model, import endpoint, probability explanation, frontend trust UI, tests, and Render deployment are covered.
- Placeholder scan: no TBD/TODO/fill-in markers are present.
- Type consistency: `dataMode`, `dataSource`, `dataSources`, `probabilityExplanation`, `admissionTrend`, `rankGap`, `riskLevel`, and `evidence` are introduced once and then used consistently.

