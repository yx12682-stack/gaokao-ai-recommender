# School-First National Real Data Redesign

## Goal

Upgrade the gaokao recommendation product from a demo-style "choose majors first, then show recommendations" flow into a formal school-first AI decision system.

The revised product should match how students and parents actually make decisions:

1. The student enters score, rank, province, subject type, city preference, and risk preference.
2. The system first answers: "Which schools are realistically reachable?"
3. The user clicks a school to understand that school, its eligible majors, major strengths, admissions risk, and employment paths.
4. The user compares schools and majors, then builds a final volunteer plan.
5. The product shows "similar rank outcomes" derived from official historical admission data, not personal student records.

This redesign must preserve the existing Render deployment and keep `POST /recommend` available.

## Core Decisions

### Product Flow

The confirmed product direction is:

`Student profile -> reachable school pool -> school detail -> school-specific major selection -> final volunteer plan`

The initial recommendation result should be school-centered. Majors become a second-stage decision inside each school, because most students and parents do not know which schools have which majors or which majors are strong.

### Similar Rank Outcomes

"Past students with this score chose what" will be implemented as an aggregated official-data feature:

- Same province
- Same subject type
- Similar rank band
- Recent years
- Aggregated school, major, city, and admission probability distribution

It must not claim to use personal student choice records. It should be labeled as "similar rank admission outcomes" or "similar rank destination distribution".

### Real Data Policy

The product must not fabricate real data.

Allowed official source categories:

- Provincial examination authorities
- Sunshine Gaokao
- School undergraduate admission offices
- School admission brochures, enrollment plans, and official historical admission pages
- School employment quality reports for employment-related evidence

When official data is unavailable, the UI must show "missing", "unverified", or "sample structure", not a fake real result.

### Major Catalog

The professional catalog should include all national undergraduate major names as the first-stage target.

Each major should have:

- Official major name
- Discipline category and major class
- Plain-language one-sentence explanation
- Tags for common interests and abilities

Detailed profiles should be added first for high-frequency majors, then expanded gradually:

- Professional introduction
- Core courses
- Suitable students
- Employment directions
- Representative careers
- Industry outlook
- Graduate study directions
- Risk reminders

The UI must explain majors in language that students and parents can understand.

### Visual Direction

The confirmed design direction is "Linear / AI Cockpit":

- Professional AI decision cockpit rather than a normal form page
- Higher information density, but still readable
- Stronger animations for AI reasoning, probability changes, cohort distributions, card transitions, and school detail panels
- Apple / Linear / Notion-level spacing, typography, and restraint
- No misleading decorative effects that reduce trust

## First Implementation Scope

First phase scope:

- Reframe the recommendation result around schools.
- Add a school pool model: reach, match, safety schools with school-level probability, rank gap, trend, source status, and reasons.
- Add school detail model with eligible majors and major explanations.
- Add similar-rank outcome model derived from historical admission rows.
- Add national major catalog structure with all undergraduate major names and plain-language descriptions.
- Add source registry and import validation for nationwide official datasets.
- Keep existing sample records clearly marked as sample.
- Import a small official-style sample set only to prove the pipeline. Do not claim nationwide verified coverage until data is actually imported.

Out of first phase:

- Fully verified nationwide historical data completion.
- User accounts and saved plans.
- Paid consulting workflow.
- Personal student record tracking.
- AI model training.

## Data Architecture

### Source Registry

Add a national source registry that can describe every province and source category:

- Province
- Source type
- Source name
- Source URL
- Dataset type
- Year
- Last checked date
- Updated date
- Import status
- Coverage status
- Notes
- Confidence

Coverage states:

- `verified`: imported and source-checked
- `partial`: official data exists but is incomplete
- `sample`: sample structure only
- `missing`: no usable data imported
- `stale`: source exists but is older than accepted freshness threshold

### Admission Data

Historical admission rows should support future real imports:

- School ID and name
- Province of the candidate
- Subject type
- Year
- Batch or admission group
- Major group if applicable
- Major name
- Enrollment plan count if available
- Min score
- Min rank
- Average score
- Average rank
- Standard deviation rank
- Source metadata
- Updated and verified timestamps

### School Data

School records should include:

- School name
- Province and city
- School level
- Ownership
- Institution type
- Tags
- Advantage disciplines
- Featured majors
- Campus and employment characteristics
- Suitable student profile
- Official source links

### Major Data

Major records should include:

- Major code when available
- Official name
- Discipline category
- Major class
- Plain-language explanation
- Core courses
- Suitable students
- Employment directions
- Representative careers
- Industry outlook
- Graduate study directions
- Risk reminders
- Related majors
- Source metadata

### Similar Rank Outcomes

This model aggregates historical admission data into cohort-style outputs:

- Province
- Subject type
- Rank center
- Rank band
- Years included
- School distribution
- Major distribution
- City distribution
- School-major pairs
- Data source status
- Missing-data explanation when coverage is insufficient

The rank band can start with a hybrid rule:

- `max(500, studentRank * 0.08)` on each side for high ranks
- Wider fallback bands when data is sparse

## Recommendation Logic

The sigmoid probability model remains:

`gap = student_rank - school_avg_rank`

`z = gap / school_std`

`probability = 1 / (1 + exp(-k * z))`

The result should expose a factor breakdown:

- Base sigmoid probability
- Rank gap
- z score
- Major heat modifier
- City competition modifier
- City preference modifier
- Year trend modifier
- Risk preference modifier
- Source confidence modifier
- Final probability

The school-first version should calculate two layers:

1. School reachability: based on the best matching official admission rows for that school and province.
2. School-major fit: based on major-specific rows when available, or marked as missing when unavailable.

## API Design

Keep:

- `POST /recommend`

Extend its response without breaking existing `reach`, `match`, and `safety` arrays. Each recommendation should become school-centered and include eligible majors and source status.

Add future-ready endpoints:

- `GET /catalog/majors`: national major catalog with plain-language descriptions.
- `GET /schools/:schoolId`: school profile and source status.
- `GET /schools/:schoolId/majors`: school-specific major options for a province and subject type.
- `POST /cohort-outcomes`: similar rank outcome distribution.
- `POST /plan`: build final volunteer plan from selected schools and majors.
- `GET /data/source-registry`: national source coverage map.
- `POST /data/import`: official data import with strict source validation.

## Frontend Design

### Home

The first screen should feel like an AI decision cockpit:

- Compact student profile input
- Data readiness panel
- National source coverage status
- Clear warning that missing data is shown as missing
- No long marketing hero

### Results

Results should focus on schools first:

- School pool tabs: reach, match, safety
- Probability and risk distribution
- Similar-rank outcome panel
- City distribution
- School level distribution
- Data coverage panel
- AI reasoning stream while generating

### School Detail

Clicking a school opens a rich detail panel:

- School overview
- Official source status
- Probability explanation
- Historical trend
- Similar-rank examples involving that school
- Eligible majors
- Major strength and heat
- Major plain-language explanation
- Employment and graduate study guidance
- Alternative schools

### Final Plan Builder

After reviewing schools and majors, the user can add selections to a volunteer plan:

- School
- Major group or major
- Probability
- Risk explanation
- Replacement suggestion
- Data status

The final plan still outputs:

- Reach 6
- Match 6
- Safety 4

## Animation And Interaction

Use restrained but stronger AI-system animations:

- AI reasoning steps with progressive text
- School cards stagger into the pool
- Probability rings animate from base to final probability
- Factor modifiers animate as small deltas
- Similar-rank distribution bars animate in sequence
- School detail panel opens with smooth scale and blur
- Card hover supports subtle 3D tilt
- Buttons keep press feedback and soft gradient shimmer
- Loading uses skeleton plus staged "analysis" states

Animations must respect readability and should not block core interaction.

## Error Handling

The product must handle missing real data honestly:

- If no official data exists for a province/year/subject, show missing coverage.
- If only school-level data exists, show school probability but mark major probability unavailable.
- If source confidence is low, reduce confidence and explain why.
- If a source URL or update timestamp is missing during import, reject the row.
- If similar-rank outcomes have too few records, show "insufficient official records" instead of a misleading chart.

## Testing

Add tests for:

- `POST /recommend` remains compatible.
- School-first recommendation output includes eligible majors.
- Similar-rank outcome aggregation works from official-style rows.
- Missing data is marked unavailable instead of sample or verified.
- Source registry coverage reports province-level status.
- Import validation rejects rows without official source metadata.
- Major catalog includes all required names and plain-language descriptions.
- Build succeeds for Render deployment.

Manual verification:

- `npm test`
- `npm run build`
- Local browser check
- Render redeploy check

## Acceptance Criteria

- Users can enter profile information without needing to choose majors first.
- The first recommendation result is a school pool.
- Users can click a school and understand its majors in plain language.
- The product shows similar-rank outcome distributions from aggregated historical admission data.
- The system clearly separates verified, partial, sample, missing, and stale data.
- The major catalog covers national undergraduate major names with plain-language explanations.
- Existing Render deployment remains valid.
- Existing `POST /recommend` remains available.
