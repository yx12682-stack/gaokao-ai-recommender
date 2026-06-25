# Future 3D Gaokao Decision Product Design

## Goal

Upgrade the current gaokao recommendation site from a professional school-first tool into a more premium AI decision product with stronger technology, depth, and interaction.

The new experience should still solve the real admissions problem first:

1. The student and family enter score, rank, province, subject type, city preference, and risk preference.
2. The system first shows which schools are reachable, grouped by reach, match, and safety.
3. The user explores schools first, then understands which majors in those schools are suitable.
4. The user can see similar-rank historical outcome distributions: which schools, cities, and majors appeared in nearby official admission records.
5. The product generates a volunteer plan with probability, risk, reasons, alternatives, and data-source transparency.

The visual upgrade must make the product feel like an AI decision cockpit, not a decorative landing page. 3D, motion, and futuristic effects are used to explain uncertainty, choice space, school clusters, and historical outcomes.

This work must preserve the existing Render deployment and keep `POST /recommend` available.

## Non-Negotiable Product Principles

### School First, Major Second

Students and parents usually do not know which schools have which majors, or which majors are strong in a specific school. The product must not start by asking the user to choose from a huge list of majors as the main decision path.

The primary flow is:

`student profile -> reachable school universe -> school detail -> school major options -> final volunteer plan`

Major preference can still exist as an optional filter, but it should guide ranking rather than block discovery.

### Real Data Honesty

The product must never pretend sample data is nationwide verified data.

Every data-driven panel should make the data status visible:

- `verified`: official source imported and checked
- `partial`: official source imported but incomplete
- `sample`: structure/demo data only
- `missing`: no usable data imported
- `stale`: source exists but is too old

If data is missing, the product should explain what is missing and which official source is needed. It should not fill the gap with invented values.

### National Scope With Incremental Coverage

The architecture must support all provinces, all subject types, all schools, all undergraduate majors, and multiple years of official admission records.

The first implementation can include partial data, but the UI and API should be designed as if nationwide imports will be added province by province.

### Parent-Friendly Explanation

Major explanations must avoid insider language. A parent should understand:

- what the major studies
- what kind of student fits it
- what jobs it may lead to
- what risks or trade-offs exist
- what graduate-study directions are common

Technical terms can appear, but only after a plain-language explanation.

## Experience Architecture

### 1. AI Launch Console

The top input area becomes a compact command console rather than a plain form.

Required information:

- Score
- Rank
- Province
- Subject type
- Risk preference
- City preference

Optional guidance:

- Interested cities
- Major interests
- School level preference
- Region preference

The console should feel serious and decision-oriented:

- clean typography
- restrained dark/deep background
- glass-like input surfaces
- live validation
- clear source-readiness warning
- no marketing copy that distracts from the task

### 2. Reachable School Universe

After the student profile is submitted, the first result should be a 3D school universe.

The school universe is a decision map:

- Each school is a node or holographic card.
- Node distance from the center represents admission fit.
- Orbit/layer represents reach, match, or safety.
- Node size can represent school strength, data confidence, or relevance score.
- Node color should show risk level without becoming loud.
- Nearby clusters show region, city, school type, or major strength.

The user should be able to:

- switch between reach, match, and safety layers
- hover a school to see probability, rank gap, and source confidence
- click a school to open details
- compare selected schools
- filter by city, school level, and school type

The 3D view must have a graceful non-3D fallback:

- if WebGL is unavailable or the device is low-powered, show a premium 2D card matrix
- the recommendation logic and information should stay identical

### 3. School Intelligence Panel

Clicking a school opens a detailed school panel.

Each school should show:

- school name
- location
- school level
- ownership
- institution type
- advantage disciplines
- featured majors
- campus and employment characteristics
- suitable student profile
- probability
- rank gap
- trend
- source status
- official source links when available

The panel should include two layers:

1. School overview: "why this school is reachable and what it is good at"
2. Major options: "within this school, which majors are suitable for this student"

The panel should avoid dumping long text. Use structured cards, tags, short explanations, and expandable evidence.

### 4. School-Specific Major Layer

Major selection happens after a school is selected.

For each school, show majors in categories:

- stronger fit
- acceptable fit
- high risk
- insufficient data

Each major should explain:

- what it studies in plain language
- core courses
- suitable students
- employment directions
- representative careers
- industry outlook
- graduate-study directions
- risk reminders
- similar majors
- whether the school has a strength in this field

The major interface can use a "major prism" or layered card stack:

- discipline category as the first layer
- major class as the second layer
- specific major as the third layer
- career path as the fourth layer

This allows national major coverage without forcing users to scroll through a wall of tags.

### 5. Similar-Rank Outcome Nebula

The product should show what similar-rank historical admission outcomes look like.

This feature must be described accurately:

- It uses aggregated official admission records.
- It does not use private student choice records.
- It does not mean "students personally chose these options".
- It means "nearby ranks appeared in these school/major/city admission outcomes".

The visual treatment is a 3D or 2D nebula:

- school nodes
- major nodes
- city nodes
- connecting paths for school-major pairs
- density indicates frequency or record count
- confidence indicates data coverage

Clicking a node opens an evidence card:

- province
- subject type
- rank band
- years included
- school distribution
- major distribution
- city distribution
- source status
- missing-data notice when coverage is weak

### 6. Final Volunteer Plan

The final output remains a 6-6-4 plan:

- 6 reach choices
- 6 match choices
- 4 safety choices

Each item must include:

- school name
- suggested major or major group
- admission probability
- rank gap
- trend
- probability breakdown
- why recommended
- why risky
- source status
- alternative school suggestion

The final plan should look like a mission board or orbital stack, but must remain easy to read and print.

## Visual Direction

### Selected Style

The selected direction is:

`Future Tech / Deep School Universe / Full-Screen Universe Entry / Orbit Transition / Holographic 3D Card Matrix / Similar Outcome Nebula`

The visual identity should feel:

- premium
- restrained
- spatial
- intelligent
- trustworthy
- futuristic but not game-like

Avoid:

- noisy neon everywhere
- one-note blue/purple gradients
- decorative effects that obscure text
- excessive animation that slows decision-making
- card-heavy marketing layout

### Motion Language

Motion should explain progress and relationships:

- AI analysis has phased thinking states.
- Schools appear with staggered generation.
- Reach/match/safety changes use orbit or layer transitions.
- Clicking a school performs a controlled zoom or card expansion.
- Similar-rank outcomes animate as connected nodes.
- Probability breakdown can animate from base probability to final probability.

Every animation should be interruptible and should respect reduced-motion settings.

### 3D Implementation Boundary

The 3D layer should be an enhancement, not a dependency for core use.

Preferred implementation:

- use CSS 3D and Framer Motion first for cards, panels, parallax, and transitions
- introduce Three.js only for the school universe or outcome nebula if it materially improves the interaction
- keep all data, labels, and controls in normal accessible HTML

This keeps the product deployable on Render and usable on weaker devices.

## Data Architecture Additions

This design builds on the existing real-data architecture.

### Source Registry

Every imported dataset should point to a source registry entry:

- source id
- province
- source type
- source name
- official URL
- dataset category
- year
- last checked date
- imported date
- verification status
- coverage status
- confidence
- notes

### Admission Records

Admission records should support:

- school id
- school name
- candidate province
- subject type
- year
- batch
- major group
- major name
- min score
- min rank
- average score
- average rank
- standard deviation rank
- plan count
- source id
- updated at
- verified at

### National Major Catalog

The national major catalog should include:

- major code
- official major name
- discipline category
- major class
- plain-language explanation
- core courses
- suitable students
- employment directions
- representative careers
- industry outlook
- graduate-study directions
- risk reminders
- related majors
- source metadata

The UI can expose all national majors, but detailed long profiles can be filled in stages. Missing details should be shown as "basic catalog entry" rather than invented depth.

### Similar-Rank Outcome Model

The outcome model should aggregate historical admission rows:

- province
- subject type
- rank center
- rank band
- years included
- school distribution
- major distribution
- city distribution
- school-major pairs
- source status
- record count
- coverage warning

Rank band rule for first implementation:

`band = max(500, student_rank * 0.08)` on each side, with a wider fallback when records are sparse.

## Recommendation Logic

The existing sigmoid probability model stays:

`gap = student_rank - school_avg_rank`

`z = gap / school_std`

`probability = 1 / (1 + exp(-k * z))`

The UI should show the probability breakdown:

- base sigmoid probability
- rank gap
- z score
- major heat correction
- regional competition correction
- city preference correction
- year trend correction
- risk preference correction
- final probability

The model output should be explained in practical language:

- "位次比该校近年均值更靠前，所以基础概率较高"
- "该专业热度高，概率被下调"
- "目标城市竞争强，概率被下调"
- "近三年位次放宽，概率被上调"
- "风险偏好为保守，冲刺项权重降低"

## API Design

`POST /recommend` must remain stable.

The response can be expanded, but existing clients should still receive:

- `reach`
- `match`
- `safety`

Additional future endpoints can be added behind the same Express server:

- `POST /schools/reachable`
- `GET /schools/:schoolId`
- `GET /schools/:schoolId/majors`
- `GET /majors/catalog`
- `POST /cohort-outcomes`
- `POST /volunteer-plan`

The first implementation may keep these as internal functions if adding endpoints creates too much surface area. The important boundary is that the data model supports them.

## Error Handling And Missing Data

The product should handle incomplete real data as a normal state:

- show source status near every result
- explain missing fields in plain language
- let the user continue with lower-confidence recommendations
- avoid hiding missing data behind generic text
- avoid presenting sample values as verified facts

Examples:

- "该省该科类 2025 年专业分数据未导入，当前仅基于学校层级位次估算。"
- "该专业就业说明来自通用专业目录，不代表本校官方就业质量报告。"
- "同分段去向样本不足，已扩大位次区间。"

## Testing And Verification

Implementation should verify:

- `npm test` passes
- `npm run build` passes
- `POST /recommend` still returns reach/match/safety arrays
- school-first results do not require selecting majors first
- major catalog can expose national major names without crashing
- missing-data states render clearly
- 3D/futuristic UI has a reduced-motion or low-power fallback
- final volunteer plan still produces 6-6-4 when enough candidates exist

Visual verification should include:

- desktop screenshot
- narrow/mobile screenshot
- result-generation state
- school detail panel
- similar-rank outcome panel
- final volunteer plan

## Rollout Plan

### Phase 1: Visual Shell

Upgrade the page structure into the AI launch console and future decision cockpit.

No recommendation logic changes in this phase. This reduces deployment risk.

### Phase 2: School Universe

Convert school results into the reachable school universe and premium 2D fallback.

Add node/card interactions, probability badges, risk layers, and school detail opening.

### Phase 3: Major Layer

Move major selection inside school detail.

Add national major catalog grouping and parent-friendly explanations.

### Phase 4: Similar-Rank Outcome Nebula

Add the aggregate outcome model and visual distribution layer.

Clearly label official, partial, sample, and missing coverage.

### Phase 5: Final Plan Polish

Turn the final 6-6-4 volunteer plan into a polished decision board with probability breakdowns, risk explanations, and alternatives.

### Phase 6: Real Data Import Pipeline

Add or harden source registry, import normalization, validation, and coverage reporting so nationwide official data can be imported province by province.

## Acceptance Criteria

The upgrade is acceptable when:

- The first result users see after entering information is reachable schools, not a major wall.
- Users can click a school and understand suitable majors inside that school.
- The major catalog supports national major coverage and explains majors in simple language.
- Similar-rank outcomes are visible and accurately labeled as aggregate official admission outcomes.
- Every recommendation explains probability, rank gap, trend, hot major impact, city impact, risk, and alternatives.
- The interface feels spatial, premium, and future-facing without sacrificing readability.
- `POST /recommend` remains compatible.
- Render deployment remains functional.
- Tests and build pass locally before deployment.

