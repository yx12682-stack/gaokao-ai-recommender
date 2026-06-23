# National Real Data Architecture Design

## Goal

Upgrade the gaokao recommendation app from a mock-data recommender into a real-data-ready national admissions decision system. The first implementation must not pretend to have complete nationwide historical data. It must separate verified imported data from sample data, preserve source provenance, and clearly show whether a recommendation is based on authoritative records or unavailable for real calculation.

## Current State

The app currently stores schools, admission stats, major career profiles, probability logic, and catalog options in `src/shared/recommendation.ts`. The API exposes `POST /recommend`, and the frontend reads the response directly. Render deployment works through `npm run build` and `npm start`.

The current mock data is useful for interaction testing, but it is not suitable for "most real" recommendations. A real-data version needs a source-aware data layer before any nationwide confidence claim.

## Authoritative Source Model

The system will support national data ingestion from these source categories:

- `sunshine_college`: Sunshine Gaokao college database, used for college identity and official college profile links.
- `sunshine_major`: Sunshine Gaokao major database, used for major descriptions, study paths, employment directions, and graduate-study directions.
- `sunshine_charter`: Sunshine Gaokao admission charters, used for annual rules, selection requirements, and policy notes.
- `provincial_exam_authority`: Provincial education examination authority records, used for one-score-one-rank tables, admission plans, batch lines, and official投档/录取 records.
- `school_admission_office`: University undergraduate admission office records, used for school-published province-major historical admission stats.
- `manual_verified`: Manually verified records entered from authoritative files by an operator.
- `sample`: Existing sample data used only when demo mode is explicitly enabled.

Every real-data record must carry:

- `sourceType`
- `sourceName`
- `sourceUrl`
- `year`
- `province`
- `updatedAt`
- `verifiedAt`
- `confidence`
- `notes`

## Data Boundaries

The app will introduce these focused modules:

- `src/shared/data-model.ts`: real-data types and source metadata types.
- `src/shared/catalog-data.ts`: national province, city, subject, source-type, and major catalog exports.
- `src/shared/real-data-store.ts`: in-memory real-data store, import helpers, validation, source coverage summaries, and sample seed records.
- `src/shared/recommendation.ts`: recommendation model only. It will consume the store instead of owning all data.
- `src/shared/recommendation.test.ts`: tests for real data provenance, probability explanation, source coverage, and no-fake-real-data behavior.
- `src/server/app.ts`: retain `POST /recommend`; add import and coverage endpoints without breaking the existing route.
- `src/server/recommend-api.test.ts`: API tests for provenance fields and import validation.
- `src/App.tsx`: add source coverage UI, real-data disclaimer, probability decomposition, result overview, and richer detail drawer.
- `src/styles.css`: product-grade layout and states for source trust, coverage, and probability explanation.
- `README.md`: document the real-data workflow and Render redeploy instructions.

## API Design

Existing route stays compatible:

```http
POST /recommend
```

The response keeps:

```ts
{
  reach: Recommendation[];
  match: Recommendation[];
  safety: Recommendation[];
}
```

Each `Recommendation` gains:

- `dataMode`: `verified | partial | sample | unavailable`
- `dataSource`: primary source metadata
- `dataSources`: all sources used for the recommendation
- `probabilityExplanation`: base sigmoid, gap, z, major heat, regional competition, city preference, trend, risk adjustment, final probability, and human explanation
- `admissionTrend`: latest year, three-year average ranks when available, trend direction, volatility, and summary
- `rankGap`: student rank minus school average rank
- `riskLevel`: `high | medium | low`
- `evidence`: short bullet list of exact evidence used

New helper routes:

```http
GET /data-sources
GET /data-coverage
POST /data/import
```

`POST /data/import` accepts JSON records first. CSV can be documented as the next ingestion format but should not block the architecture. Import validation must reject records without source URL, year, province, school name, major, average rank, standard deviation, and update timestamp.

## Recommendation Rules

The probability model remains:

```ts
gap = student_rank - school_avg_rank
z = gap / school_std
probability = 1 / (1 + exp(-k * z))
```

The model still applies:

- major heat correction
- regional competition correction
- city preference correction
- year trend correction
- risk preference correction

The difference is that every correction is now exposed in `probabilityExplanation`. If the required real admission stats do not exist for the selected province and major, the model cannot label the result as verified. It must either:

- return verified/partial recommendations from matching authoritative data, or
- fall back to sample mode only when explicitly allowed by the frontend, or
- display an unavailable state with instructions to import official data.

## Frontend Design

The page will feel like an AI decision console, not a marketing page:

- A top trust banner states that real recommendations require official datasets from provincial examination authorities, Sunshine Gaokao, or school admission offices.
- The input area includes a data mode indicator: `真实数据`, `部分真实`, `示例数据`, or `暂无数据`.
- Results include a new overview band: total recommendations, source coverage, risk distribution, city distribution, major distribution, and latest data year.
- Each card shows probability, rank gap, latest year, source type, and risk level.
- The detail drawer shows:
  - school profile
  - admission evidence
  - probability decomposition
  - three-year trend
  - source links and updated time
  - professional major introduction
  - core courses
  - suitable student traits
  - employment directions
  - career roles
  - graduate-study directions
  - risk reminders

If data is missing, the UI must say so directly and provide a next action: import a provincial authority record or school admission office record.

## Testing Strategy

Tests must prove:

- Existing `POST /recommend` still returns `reach`, `match`, and `safety`.
- Recommendations include source provenance and probability explanations.
- The system does not label sample data as verified.
- Missing official data produces explicit `unavailable` or `sample` mode, not fake real certainty.
- Import validation rejects incomplete records.
- Build and production startup remain compatible with Render.

## Rollout Strategy

1. Build the source-aware data architecture and preserve the existing demo flow.
2. Add sample official-style seed records with source metadata, clearly labeled as sample until replaced.
3. Add JSON import and coverage endpoints.
4. Add frontend trust and coverage surfaces.
5. Document how to collect and import nationwide datasets by province.

## Non-Goals For This Pass

- Do not claim complete 2026 admission data exists before admissions finish.
- Do not scrape protected pages or bypass website controls.
- Do not train an AI model.
- Do not remove `POST /recommend`.
- Do not break current Render deployment.

