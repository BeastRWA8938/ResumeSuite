# Implementation Plan
## Career Intelligence System (V1)

---

## Part 1 — Development Strategy

### Why the chosen implementation order is optimal
We organize development around **vertical slices** (User Value → UI → Data Handler → Processing Logic → File Export). 
1. **Early Validation:** Implementing base structures (Profile, Vault entry, Raw Ingestion) first establishes the core database structures and UI form habits.
2. **Sequential Complexity:** Raw data must exist and be parsed before it can be ranked. Ranking must happen before selection and budgeting. Selection and budgeting must happen before tailoring and LaTeX generation.
3. **De-risking AI Processing early:** Converting raw text into structured "Atomic Facts" (Action-Result paired facts) is the highest logic risk. Tackling this as Slice 4 ensures we solve data quality before worrying about typesetting or page budgeting.

### Why other implementation orders are worse
* **Database-First / Schema-First:** Writing all database tables first without connecting them to a UI creates a feedback vacuum. We risk building schemas that do not fit the UX, leading to rework when we discover layout problems.
* **UI-First / Mock-First:** Building all screens with static data gives a false sense of progress. The most complex transformations (fact parsing, relevance similarity scores, dynamic bullet rephrasing) are deferred, leading to integration issues at the end of the project.

### Key Risks in Development
1. **AI Parse Quality / Metrics Mismatching:** The parser might split actions from results (e.g. associating metric X with action Y). *Mitigation:* Ensure Slice 4 outputs a validation UI allowing the user to explicitly edit or pair actions and metrics before saving.
2. **Page Budget Inaccuracy:** A 10-bullet budget is selected, but the LaTeX template compiles to 1.5 pages due to name length or section formatting. *Mitigation:* Establish strict character and line-length limits in the LaTeX template parameters during Slice 9.

---

## Part 2 — Vertical Slice Breakdown

### Slice 1: Setup & Web Containerization
* **Purpose:** Establish local dev architecture.
* **User Value:** The user can spin up the application with a single command and see a working, responsive dashboard.
* **Dependencies:** None.
* **Complexity:** Low.
* **Learning Objectives:** Docker environment maps and local port routing.
* **Definition of Done:** Running `docker-compose up` starts the Web UI local server. Accessing the web port displays a functional dashboard frame.

### Slice 2: Profile & Education CRUD (Base Info)
* **Purpose:** Create base demographic/education forms and local persistence.
* **User Value:** User can save their contact links, email, phone, and education details in their vault.
* **Dependencies:** Slice 1.
* **Complexity:** Low.
* **Learning Objectives:** Form validation, JSON/data serialization.
* **Definition of Done:** Profile and Education forms save data to local storage, and details populate the UI automatically upon page refresh.

### Slice 3: Raw Memory Ingest & Basic Vault CRUD
* **Purpose:** UI forms to create, read, update, and delete Work Experiences, Projects, and Hackathons/Competitions with basic metadata and raw description fields.
* **User Value:** User can store their career history elements in one place.
* **Dependencies:** Slice 2.
* **Complexity:** Medium.
* **Learning Objectives:** Managing list relationships and data states in UI.
* **Definition of Done:** User can add, update, and remove Work Experiences, Projects, and Hackathons (metadata + raw description text block) in the UI; data persists across container restarts.

### Slice 4: Atomic Fact Extraction & Validation UI
* **Purpose:** Parse raw description text into structured Action-Result paired facts with utilized skills.
* **User Value:** User inputs a messy paragraph, and the system extracts structured, verified metrics and accomplishments.
* **Dependencies:** Slice 3.
* **Complexity:** High.
* **Learning Objectives:** Parsing unstructured text, matching actions to results.
* **Definition of Done:** Pasting raw text extracts structured "Atomic Facts" (Actions, Metrics, Skills). These facts are displayed in a validation list where the user can CRUD individual facts before they save.

### Slice 5: Smart Vault Merging & Incremental Updates
* **Purpose:** Deduplicate and merge newly inputted raw text with existing vault entries.
* **User Value:** User can add a new detail to a project months later without creating duplicate entries or losing old data.
* **Dependencies:** Slice 4.
* **Complexity:** Medium.
* **Learning Objectives:** Data matching logic.
* **Definition of Done:** Adding a raw text description to an existing entry merges new metrics/skills and appends unique facts while preserving old records.

### Slice 6: Relevance Ranking & Debug Keyword Log
* **Purpose:** Input Job Description (JD) and Company Context to rank Vault entries by semantic relevance.
* **User Value:** User sees exactly which projects and experiences match the target job, and what keywords were matched.
* **Dependencies:** Slice 5.
* **Complexity:** Medium.
* **Learning Objectives:** Semantic ranking algorithms, keyword extraction logic.
* **Definition of Done:** User inputs JD and Company Context; system displays Vault items sorted in descending order of relevance, showing the extracted keywords/matching features.

### Slice 7: Content Budget Selector (Budget Tracker)
* **Purpose:** Select experiences/projects and configure bullet point limits.
* **User Value:** User selects content while receiving a visual guarantee that it will compile onto exactly 1 page.
* **Dependencies:** Slice 6.
* **Complexity:** Medium.
* **Learning Objectives:** UI state synchronization, constraint validation.
* **Definition of Done:** Checking Vault items adds their bullets to a live counter (`N / 10`). If counter $> 10$, the counter turns red and the "Generate Resume" action button is disabled.

### Slice 8: Resume Synthesis (Bullet Customization) & Skills Prioritization
* **Purpose:** Refine selected facts into tailored professional bullet points (combining STAR, XYZ, and action styles) and sort the Skills list.
* **User Value:** Skills and accomplishments are tailored to the role and company context without losing truth.
* **Dependencies:** Slice 7.
* **Complexity:** High.
* **Learning Objectives:** Context-aware text synthesis, list sorting rules.
* **Definition of Done:** Selected items' facts are tailored into job-focused bullet points, and skills list is generated in order (JD matches -> Company Context focus -> related skills).

### Slice 9: LaTeX Template Mapping & Clipboard Export
* **Purpose:** Inject synthesized profile, education, skills, and bullets into the Jake's Resume LaTeX template.
* **User Value:** User gets compile-ready LaTeX source code to copy with one click.
* **Dependencies:** Slice 8.
* **Complexity:** Low.
* **Learning Objectives:** LaTeX syntax formatting.
* **Definition of Done:** The UI displays a copyable text area containing valid Jake's Resume LaTeX code that compiles cleanly in Overleaf.

### Slice 10: Local File Archiving & History Ledger
* **Purpose:** Automatically save the `.tex` file to local disk and log metadata.
* **User Value:** User has a permanent physical backup of every tailored resume draft and a history of past keywords matched.
* **Dependencies:** Slice 9.
* **Complexity:** Medium.
* **Learning Objectives:** Local file writing, ledger log updates.
* **Definition of Done:** Clicking "Generate" saves a `.tex` file to `resumes/<company_name>/<job_role>/<resume_date_time>.tex` and writes log entry with metadata and matched keywords.

---

## Part 3 — Recommended Build Order

```
[Slice 1: Setup] ➔ [Slice 2: Base CRUD] ➔ [Slice 3: Vault CRUD] ➔ [Slice 4: Fact Extraction] 
       ➔ [Slice 5: Smart Merge] ➔ [Slice 6: Relevance Rank] ➔ [Slice 7: Budget Tracker] 
       ➔ [Slice 8: Synthesis] ➔ [Slice 9: LaTeX Output] ➔ [Slice 10: History Export]
```

### Why this build order:
We follow a logical path:
1. **Core Shell (1-2):** Build the house and basic inputs.
2. **Vault Ingestion (3-5):** Build the data repository, parse unstructured details into atomic facts, and solve merging.
3. **Application Workspace (6-7):** Rank data against the target job and enforce layout budgets.
4. **Tailored Output (8-10):** Synthesize the bullets, render the LaTeX, display to user, save to disk, and update the debug logs.

---

## Part 4 — Detailed Slice Planning

*(See Section 6 of TDD for Entity references).*

### Slice 4: Atomic Fact Extraction & Validation UI
* **Goal:** Parse unstructured inputs into Action-Result-Skill facts.
* **User Workflow:** Paste raw text -> Click "Analyze" -> Verify/CRUD facts in validation list -> Save.
* **Components Involved:** UI, Atomic Fact Extractor, Vault Manager.
* **Data Flow:** UI (raw description) ➔ Extractor (parses metrics, actions, skills) ➔ UI Validation list (accepts user edits) ➔ Vault database.
* **Expected Inputs:** Unstructured text.
* **Expected Outputs:** List of structured items (Action string, Result string, Skills array).
* **Success Criteria:** Raw text is split into distinct action-result paired points with correctly associated skills; user can modify them before final saving.

### Slice 6: Relevance Ranking & Debug Keyword Log
* **Goal:** Compute semantic similarity and log matching features.
* **User Workflow:** Enter JD & Company details -> View ranked Vault items -> View debug logs.
* **Components Involved:** UI, Relevance Ranking Engine, Export Logger.
* **Data Flow:** UI (JD, Company Context) ➔ Ranking Engine (compares against Vault) ➔ UI (renders sorted list) & logs (write JD features).
* **Expected Inputs:** JD text block, Company Name, Company Context.
* **Expected Outputs:** Scored list of experiences, projects, and competitions; list of matching features/keywords.
* **Success Criteria:** Ranked items update instantly when JD changes; matched keywords are visible in the UI or log dashboard.

### Slice 7: Content Budget Selector
* **Goal:** Restrict selections to stay under 10 bullets.
* **User Workflow:** Check box to select experience -> Counter updates -> If counter $> 10$, UI disables "Generate".
* **Components Involved:** UI, Web UI Budget widget.
* **Data Flow:** UI checkboxes ➔ UI Budget state ➔ UI Button state.
* **Expected Inputs:** Selection events, allocated bullet counts.
* **Expected Outputs:** Updated counter display, button state (enabled/disabled).
* **Success Criteria:** Disables "Generate Resume" when total bullet allocations exceed 10.

### Slice 8: Resume Synthesis & Skills Prioritization
* **Goal:** Synthesize tailored bullets and prioritized skills list.
* **User Workflow:** System processes selected items to match target role tone.
* **Components Involved:** Resume Tailoring & Synthesis Engine.
* **Data Flow:** Selected Atomic Facts + JD ➔ Tailoring Engine (synthesizes prose) ➔ priority skill sorter ➔ LaTeX generator.
* **Expected Inputs:** Selected facts, target JD, Company Context.
* **Expected Outputs:** Tailored bullet strings, prioritized skills list.
* **Success Criteria:** Output bullets combine STAR, Google XYZ, and action-oriented achievements without hallucinating fake metrics.

### Slice 10: Local File Archiving & History Ledger
* **Goal:** Persist generated files and log history logs.
* **User Workflow:** User clicks "Generate" -> Files are saved to local filesystem path.
* **Components Involved:** Local Export & History Logger.
* **Data Flow:** Generated LaTeX + metadata ➔ File writer (saves file) ➔ ledger logger (saves history).
* **Expected Inputs:** LaTeX string, Company, Role, Timestamp, matching keywords.
* **Expected Outputs:** Mapped file path directories, saved `.tex` file, JSON/YAML ledger record.
* **Success Criteria:** A `.tex` file is written to `resumes/<company_name>/<job_role>/<resume_date_time>.tex` and history ledger records are updated.

---

## Part 5 — Milestones

### Milestone 1: Ingestion Engine & Vault Complete (Slices 1 - 5)
* **Goal:** Spin up Docker container, input demographics, and populate the Knowledge Vault with structured, de-duplicated Atomic Facts from raw text inputs.
* **Success Criteria:** Users can save profile data, raw paragraphs are successfully parsed into editable Action-Result pairs, and duplicate entries are merged.

### Milestone 2: Workspace Matching & Budgeting (Slices 6 - 7)
* **Goal:** Build the workspace interface where JDs are pasted, Vault items are ranked, and content is selected within a strict 10-bullet limit.
* **Success Criteria:** Vault items are ranked by relevance, and the "Generate Resume" button disables if bullet count exceeds 10.

### Milestone 3: Generation, Export, & Archives Complete (Slices 8 - 10)
* **Goal:** Tailor bullet points and skills, format into Jake's Resume LaTeX, save files locally, and update history ledger.
* **Success Criteria:** Copyable LaTeX code compiles cleanly to a single PDF page, a `.tex` file is written to disk under the correct path format, and the JSON history log records matching keywords.

---

## Part 6 — Testing Strategy

### Slice 4 (Atomic Fact Extraction)
* **What can break:** Metrics are paired with the wrong actions; skills are extracted incorrectly; parser fails on multi-line inputs.
* **Manual Test Cases:**
  * Test with a paragraph containing three metrics: verify they map to their respective actions.
  * Test with zero metrics: verify it extracts action points but leaves metric fields blank without crashing.
* **Acceptance Criteria:** 100% of extracted facts represent valid action-result pairings from the source text.

### Slice 7 (Budget Tracker)
* **What can break:** Bullet counts are calculated incorrectly; selecting a project with 3 bullets increments counter by 1; button stays enabled.
* **Manual Test Cases:**
  * Select 4 projects with 3 bullets each (total 12). Verify counter shows `12/10` in red and "Generate" is disabled.
  * Deselect one project (total 9). Verify counter turns green/neutral and "Generate" is enabled.
* **Acceptance Criteria:** The UI must enforce a strict budget ceiling.

### Slice 10 (File Archiving)
* **What can break:** Path cannot be created if directory contains spaces; write permission error crashes UI; history log gets corrupted.
* **Manual Test Cases:**
  * Enter Company Name "Google" and Job Role "Software Engineer". Verify file is written to `resumes/Google/Software_Engineer/YYYY-MM-DD_HH-MM-SS.tex`.
  * Trigger write failure (simulated by making folders read-only). Verify UI displays error warning banner but LaTeX remains copyable.
* **Acceptance Criteria:** File is created at the correct path, and metadata is logged to ledger.

---

## Part 7 — Learning Roadmap

### Concepts to Master
1. **Unstructured Data Parsing:** How to convert text paragraphs into reliable data fields.
2. **Semantic Similarity Scoring:** Calculating match vectors between Job Descriptions and career accomplishments.
3. **LaTeX Formatting via Code:** Programmatic string interpolation and escape character handling in LaTeX files.

### Important Files to Understand
* `docker-compose.yaml` (container port mapping, write directory volume mounts).
* `history_ledger.json` (format for index logs).

---

## Part 8 — Risks and Scope Control

### Risk 1: Scope Creep on Formatting
* *Description:* User wants to customize margins or fonts in the LaTeX template.
* *Mitigation:* The template is frozen to **Jake's Resume style** in code. Layout customization is strictly out-of-scope for V1.

### Risk 2: Overengineering the Merge Logic
* *Description:* Trying to build complex semantic diff tools for merging new project details.
* *Mitigation:* Simple keyword/metric comparison. If a new fact matches an existing fact's action context, update the metric and merge. Otherwise, append.

---

## Part 9 — Final Roadmap

1. **Build Order:** Slice 1 ➔ Slice 2 ➔ Slice 3 ➔ Slice 4 ➔ Slice 5 ➔ Slice 6 ➔ Slice 7 ➔ Slice 8 ➔ Slice 9 ➔ Slice 10.
2. **Milestones:** Milestone 1 (Slices 1-5), Milestone 2 (Slices 6-7), Milestone 3 (Slices 8-10).
3. **Core Definition of Done (V1):** Spin up via Docker ➔ Enter Profile/Skills/Experience ➔ Parse raw inputs into Atomic Facts ➔ Paste JD ➔ Selection ranked ➔ Budget enforced ➔ Copy LaTeX ➔ File auto-saved with date/time timestamp.
