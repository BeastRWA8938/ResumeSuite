# Technical Design Document (TDD)
## Career Intelligence System (V1)

---

## 1. System Overview

### 1.1 Purpose
The purpose of the Career Intelligence System (V1) is to establish a secure, local, single-user career asset management utility. It serves as a personal repository that structures raw professional memories into reusable units ("Atomic Facts") and automates the tailoring of job application assets (specifically LaTeX resumes) matching the constraints and styling of the target organization.

### 1.2 Problem Being Solved
1. **Memory Degradation:** Professionals struggle to recall granular project metrics, technical stacks, and specific contributions over time, which dilutes the strength of their resumes.
2. **Tailoring Overhead & Layout Breakage:** Manually rewriting bullet points to fit differing Job Descriptions (JDs) and formatting LaTeX source files to ensure a single-page fit is high-effort, slow, and prone to layout errors.

### 1.3 Target User
* **Rushikesh (The Career-Builder Developer):** A developer who requires a private, local-first system to maintain an exact record of their achievements and quickly generate optimized, single-page LaTeX resume source code.

### 1.4 Primary Outcomes
* **Searchable Career Asset Base:** A structured, local store of experiences, projects, skills, education, and hackathons populated with verified atomic facts.
* **Optimized Resume Generation:** Synthesized resume bullet points using high-impact professional writing styles (such as the Google XYZ formula, STAR method, and action-oriented achievements) tailored to target JDs, outputting clean, compile-ready LaTeX code in the "Jake's Resume" style.
* **Auto-Saved Local Drafts:** Programmatic exports of generated `.tex` files automatically written to the filesystem in a structured hierarchy, indexed in a local history log.

---

## 2. Scope Definition

### 2.1 In Scope
1. **Deployment Architecture:** Runs locally via a Docker environment (e.g., single-user local platform).
2. **User Interface:** A local Web-based browser interface.
3. **Knowledge Vault Schemas:** Core schemas limited to:
   * Profile / Contact Information
   * Work & Internship Experience
   * Projects
   * Hackathons & Competitions
   * Education
   * Skills (categorized)
4. **Information Extraction & Processing:**
   * Extraction of raw textual inputs into multiple structured, action-result matched "Atomic Facts" (representing action, metric/result, and tools/skills) at input time.
   * Full CRUD operations (Create, Read, Update, Delete) on Atomic Facts in the UI.
   * Incremental updates to existing Vault entries (smart deduplication and merging of new facts with old ones).
5. **Tailoring & Synthesis Engine:**
   * Processing a Job Description, Company Name, and manual Company Context (products/tech stack description).
   * Relevance computation ranking Vault items (Experiences, Projects, Hackathons) in descending order of relevance to the JD.
    * Dynamic synthesis of selected Atomic Facts into high-impact professional resume bullet points using formulas such as Google XYZ (*Accomplished X, measured by Y, by doing Z*), the STAR method, and action-oriented achievements.
    * Prioritized skill structuring (JD match -> company focus -> general related skills).
6. **Export & Persistence:**
    * Single-click Copy LaTeX source code (using the Jake's Resume style template).
    * Automated saving of `.tex` files to local directories: `resumes/<company_name>/<job_role>/<resume_date_time>.tex`.
    * Storing generation logs/metadata in a local index ledger file (JSON/YAML).

### 2.2 Out of Scope
1. **Compilation Services:** Server-side compilation of LaTeX source to PDF (V2).
2. **History UI Explorer:** Web UI for browsing, restoring, or viewing past resume drafts (V2).
3. **LaTeX Space Estimator:** Layout space calculator predicting LaTeX page coverage of selected bullets and sections to replace hard bullet count rules (V2).
4. **Free Cloud Storage Syncing:** Optional, secure synchronization of the local database to free cloud storage providers (e.g. Google Drive, Dropbox, or a free cloud database) for multi-device backup (V2).
5. **AI Profile Insights Dashboard:** Analytical profile dashboard visualizing skill mastery, domain distributions, and role-selection probabilities based on Vault contents (V2/V3).
6. **Credentials & Certifications:** Support for patents, conferences, certifications, and publications in the Vault or resume generator (V3/V4).
7. **ATS Scoring:** Automatic scoring of the generated resume against the JD (V3).
8. **Auto Company Analysis:** Web scraping/search of company tech stacks and products (V3).
9. **Custom Templating:** User-uploaded custom LaTeX templates or template selection engines (V5).



### 2.3 Assumptions
1. **External PDF Tooling:** The user will compile the generated LaTeX source code using external utilities (e.g., Overleaf, local `pdflatex` installations).
2. **Host System Write Permissions:** The application environment has write access to the host machine's directory to write resume files and update the history ledger.
3. **No Multi-User Isolation:** The application is accessed by a single user via local port mapping. User authentication, access control lists, or remote multi-tenant features are not required.

### 2.4 Constraints
1. **Strict Privacy/Security:** Local-First operation. All vault information resides locally on the user's host machine for primary access and offline capability. Future versions (V2) will support secure syncing with free cloud storage solutions. No telemetry is permitted.
2. **Single Page Budget:** Content mapping must fit exactly on a single page using a strict 10-bullet ceiling.
3. **Template Rigidity:** System strictly supports the "Jake's Resume" style LaTeX template for V1.
4. **Quality Priority:** Performance speed is subordinated to output quality. Processing times up to 5 minutes are acceptable if they ensure robust, hallucination-free output.

---

## 3. User Flows

### 3.1 Flow 1: Capture Raw Experience / Project / Competition
* **Trigger:** User completes a professional milestone (e.g., job milestone, project milestone, hackathon, competition) and wants to record it.
* **User Actions:**
  1. Navigates to the Vault and selects the category of entry (Work Experience, Project, or Hackathon/Competition).
  2. Enters metadata fields (e.g. Title, Organization, Dates, Role).
  3. Writes or pastes raw, unstructured text detailing what they did, metrics, tools used, and what happened.
  4. Submits the raw entry for processing.
  5. Reviews the list of extracted "Atomic Facts" (Action-Result paired points) generated by the system.
  6. Manually overrides/edits the Atomic Facts list if needed (adding missing details, correcting metric associations, or deleting misinterpretations).
  7. Confirms and saves the entry.
* **Expected Outcome:** A new entry is added to the Knowledge Vault. If the entry matches a previously recorded project/experience, the system automatically merges and updates the Atomic Facts list instead of creating a duplicate entry.

### 3.2 Flow 2: Edit Saved Career Memory (CRUD)
* **Trigger:** User reviews their saved Vault and wants to modify, append, or delete a recorded career memory.
* **User Actions:**
  1. Navigates to the Knowledge Vault dashboard.
  2. Selects an existing entry (Experience, Project, or Hackathon/Competition).
  3. Views the core details and the sub-list of Atomic Facts.
  4. Edits metadata fields, or performs CRUD operations directly on the individual Atomic Facts (e.g., editing an action description, correcting a metric, or deleting a fact).
  5. Saves the modifications.
* **Expected Outcome:** The system persists the modifications to the local database store.

### 3.3 Flow 3: Resume Tailoring & Generation
* **Trigger:** User is applying for a job and wants to generate a customized, 1-page LaTeX resume tailored to that role.
* **User Actions:**
  1. Navigates to the Resume Tailoring interface.
  2. Inputs the target Job Description, Company Name, and Company Context (products/stack).
  3. Views the list of experiences, projects, and hackathons/competitions ranked by relevance in descending order.
  4. Selects which items to include in the tailored resume.
  5. Views the "Content Budget Tracker" updating dynamically (Allocated bullets $N / 10$).
  6. Adjusts selections or edits bullet allocations per item to stay under the strict 10-bullet budget limit. The user interface disables the "Generate Resume" button if the total allocated bullets exceed 10.
  7. Clicks the "Generate Resume" action (only enabled when allocation <= 10).
  8. Copies the tailored LaTeX source code from the UI copy button.
* **Expected Outcome:** 
  1. The tailoring engine parses selected items, customizes and structures skills (JD match -> company focus -> general related skills), and synthesizes facts into high-impact professional resume bullet points (combining writing styles such as Google XYZ, STAR method, and action-oriented statements) matching the JD focus.
  2. The system generates compile-ready LaTeX source using the Jake's Resume layout template.
  3. The system automatically saves the `.tex` file to the local directory hierarchy (`resumes/<company_name>/<job_role>/<resume_date_time>.tex`) and writes a history entry to the local JSON/YAML ledger.

### 3.4 Flow 4: Profile, Skills, and Education Management
* **Trigger:** User needs to update contact info, educational credentials, or their base core skills list.
* **User Actions:**
  1. Navigates to the Profile/Settings dashboard.
  2. Edits personal contact details (links, email, phone) or updates educational information.
  3. Modifies the baseline skills directory (categorizing skills into languages, frameworks, developer tools, etc.).
  4. Saves updates.
* **Expected Outcome:** The updated profile metadata, education entries, and skills categorization are saved to the Vault.

---

## 4. Functional Components

### 4.1 User Interface Component (Web UI)
* **Responsibility:** Serves as the interactive boundary for the user. Renders forms for Vault CRUD, input panels for the resume tailoring workspace, relevance rankings, the dynamic 10-bullet budget checker, and the final LaTeX output copy view.
* **Inputs:** 
  * User inputs, clicks, selection events, and forms.
  * System data payloads (retrieved Career Vault entries, relevance scores, and generated LaTeX).
* **Outputs:** 
  * Formatted UI views.
  * System event triggers (Vault save requests, tailoring compilation triggers, file export events).

### 4.2 Knowledge Vault Manager (Data Handler)
* **Responsibility:** Manages read, write, update, and delete actions on the structured data entities in local storage. Ensures profile, experience, projects, education, skills, and hackathons are safely saved and queried.
* **Inputs:** Data payload modifications and query parameters from the UI or other components.
* **Outputs:** Saved entities, query response payloads (e.g., lists of experiences), and CRUD operation status confirmations.

### 4.3 Atomic Fact Extractor & De-duplication Component
* **Responsibility:** Parses raw text descriptions of projects, work, or hackathons. Identifies actions, tools/skills used, and result metrics to construct a list of structured "Atomic Facts". When new raw text is supplied for an existing entry, it compares new assertions semantically to prevent duplicate facts and updates existing facts with any new metrics.
* **Inputs:** Raw description text (from UI) and existing Vault entry facts (for de-duplication checks).
* **Outputs:** Structured, de-duplicated list of action-result matched Atomic Facts.

### 4.4 Relevance Ranking Engine
* **Responsibility:** Calculates semantic similarity between the user-provided Job Description (JD) and all Vault entries (experiences, projects, and hackathons). Generates relevance scores and ranks items in descending order, prioritizing items with strong impact.
* **Inputs:** Target Job Description and list of all active Vault items.
* **Outputs:** Sorted and scored list of Vault items, and a record of the extracted matching criteria/keywords derived from the JD.

### 4.5 Resume Tailoring & Synthesis Engine
* **Responsibility:** Customizes and synthesizes the selected items' atomic facts into high-impact professional resume bullet points (incorporating writing styles like Google XYZ, STAR, and action-oriented achievements) that highlight concepts relevant to the target JD. Prioritizes and structures the skills listing by matching JD keywords first, followed by skills matching the manual Company Context, and then general related skills.
* **Inputs:** Selected experiences/projects/hackathons, selected sub-facts, target Job Description, and Company Context description.
* **Outputs:** Tailored bullet point descriptions for selected entries, and a structured, prioritized list of skills.

### 4.6 LaTeX Resume Generator
* **Responsibility:** Injects profile data, education details, the prioritized skills lists, and synthesized job/project bullet points into the preconfigured LaTeX source template (based on the "Jake's Resume" layout style).
* **Inputs:** Structured Profile, Education, prioritized Skills list, and tailored bullet point segments.
* **Outputs:** Compile-ready LaTeX source string.

### 4.7 Local Export & History Logger
* **Responsibility:** Automates the physical storage of generated resumes on the host filesystem. Writes the `.tex` files into structured folder paths and appends application event records to a local JSON/YAML ledger file.
* **Inputs:** Target Company Name, Job Role, timestamp (date and time), generated LaTeX source string, and the relevance matching criteria/keywords extracted from the JD.
* **Outputs:** Folders and `.tex` files created under `resumes/<company_name>/<job_role>/<resume_date_time>.tex`, and a new ledger metadata record in the history file (containing the ledger event, generation timestamp, and the extracted JD matching criteria/keywords).

---

## 5. Data Flow

### 5.1 Pipeline 1: Career Memory Ingestion & Fact Extraction
* **Inputs:**
  * User inputs: entry category (Work Experience, Project, or Hackathon/Competition), metadata fields (title, company, role name, dates).
  * Raw description text payload (unstructured sentences detailing tasks, tools, and outcomes).
* **Transformations:**
  * **Text Decomposition:** The system processes the raw text payload to isolate individual activities, accomplishments, and skills.
  * **Fact Structuring:** Decomposed items are restructured into distinct "Atomic Facts" (each pairing a specific Action with its corresponding Result/Metric, alongside the associated tools/skills utilized).
  * **Duplicate Matching & Merge:** The De-duplication Component compares newly parsed Atomic Facts against existing facts for that entry. Duplicate facts are discarded, existing facts are updated with new metrics/skills, and entirely new facts are appended.
  * **User Correction Loop:** The UI allows the user to perform inline editing, deletion, or manual addition of facts.
* **Outputs:**
  * Finalized list of validated, structured Atomic Facts stored inside the Knowledge Vault.

### 5.2 Pipeline 2: Resume Tailoring & Generation
* **Inputs:**
  * Target Job Description (JD) text block.
  * Company Name and Company Context (products/tech stack) text description.
  * Selected experiences, projects, and hackathons/competitions from the Vault.
  * Bullet allocation selections per item (subject to the total budget constraint of $\le 10$ bullets).
* **Transformations:**
  * **JD Analysis & Feature Extraction:** The Relevance Engine parses the target JD to extract matching criteria (key requirements, technologies, tasks, and domain concepts).
  * **Relevance Ranking & Scoring:** The system compares extracted JD features with Vault entries to calculate similarity scores, sorting entries in descending order.
  * **Dynamic Bullet Customization:** The Synthesis Engine refines the selected items' Atomic Facts into tailored prose sentences, generating high-impact bullet points utilizing styles such as Google XYZ, STAR, or direct action-oriented statements matching the JD's context.
  * **Skills Structuring:** The engine aggregates and sorts the Skills list: matching JD skills are positioned first, followed by skills matching the Company Context, and then related general skills.
  * **Template Rendering:** The generator maps the user profile, education history, prioritized skills categories, and tailored experience bullet points into placeholders inside the Jake's Resume LaTeX markup structure.
* **Outputs:**
  * Tailored compile-ready LaTeX source string made copyable via the Web UI.
  * Save event writing a `.tex` file to local disk: `resumes/<company_name>/<job_role>/<resume_date_time>.tex`.
  * Ledger event appended to the JSON/YAML ledger, recording the run time, metadata, file path, and the extracted JD keywords/matching features.

---

## 6. Conceptual Data Model

### 6.1 Conceptual Entities

#### 1. User Profile
* **Purpose:** Represents the core professional identity of the user.
* **Fields:** Candidate name, email, phone number, location, and web links (e.g. LinkedIn, GitHub, Portfolio).

#### 2. Education
* **Purpose:** Represents academic credentials.
* **Fields:** School/Institution name, location, degree type, major/field, start date, graduation date, and optional GPA details.

#### 3. Skill
* **Purpose:** Represents specific technical capabilities or competencies.
* **Fields:** Name (e.g., "Python", "Docker") and Category (e.g., "Languages", "Developer Tools").

#### 4. Work Experience
* **Purpose:** Log of professional employment or internships.
* **Fields:** Employer/Organization name, role title, location, start date, end date, a sub-list of Atomic Facts, and references to associated Skills (gained/used/applied in this experience).

#### 5. Project
* **Purpose:** Log of independent or corporate development assets.
* **Fields:** Project name, description, start date, end date, external project link, a sub-list of Atomic Facts, and references to associated Skills (gained/used/applied in this project).

#### 6. Hackathon & Competition
* **Purpose:** Log of competitive hackathons, events, or programming contests.
* **Fields:** Event name, hosting organization, date of completion, role/placement, a sub-list of Atomic Facts, and references to associated Skills (gained/used/applied in this event).

#### 7. Atomic Fact
* **Purpose:** The granular, verifiable building blocks of a career accomplishment. Contains an action paired with a metric to ensure metrics are not mismatched.
* **Fields:** Action description text, result/metric achieved description, and references to associated Skills.

#### 8. Resume Generation Log
* **Purpose:** Records metadata for each generation event.
* **Fields:** Company Name, Job Role, timestamp (date and time), local path on disk to the written LaTeX file, and the list of extracted matching JD keywords used during tailoring.

### 6.2 Entity Relationships & Ownership

* **User Profile Ownership:** The User Profile is the root context. It owns multiple **Education** records, **Skills**, **Work Experiences**, **Projects**, **Hackathons/Competitions**, and **Resume Generation Logs**.
* **Composition Rules (Strict Ownership):**
  * **Work Experiences**, **Projects**, and **Hackathons/Competitions** possess a one-to-many composition relationship with **Atomic Facts**. An Atomic Fact cannot exist independently and must belong to exactly one parent record.
* **Association Rules:**
  * **Work Experiences**, **Projects**, and **Hackathons/Competitions** reference the collection of **Skills** gained/used/applied during that career activity.
  * **Atomic Facts** reference one or more **Skills** associated with that specific achievement.
  * **Resume Generation Logs** maintain references to the specific selected experiences, projects, and hackathons included in the compile run.

---

## 7. Failure Scenarios

### 7.1 Malformed Raw Ingestion Input
* **Scenario:** The user inputs unstructured text that does not contain any discernible accomplishments, metrics, or technologies (e.g., "I went to the office and did some tasks.").
* **Expected System Behavior:** The Extraction Component fails to structure any Action-Result pairings. The UI displays an alert message: *"Unable to extract structured achievements from the provided text. Please include details about what you did, the results achieved, or skills used."* and prompts the user to edit their raw text input.

### 7.2 Missing Required Metadata
* **Scenario:** The user attempts to save a new Vault entry (Experience, Project, or Hackathon/Competition) with blank required fields (e.g., missing Role Title or Employer/Event name).
* **Expected System Behavior:** The UI intercepts the submit action, flags the missing input fields with error markers, and blocks database write attempts until validation passes.

### 7.3 Empty Resume Tailoring inputs
* **Scenario:** The user requests relevance ranking or resume tailoring with empty Job Description or Company Name fields.
* **Expected System Behavior:** The tailoring action is blocked. The UI highlights the empty fields, requesting that the user supply a valid JD and target company details before proceeding to relevance ranking.

### 7.4 Over-budget Content Selections
* **Scenario:** The user selects experience/project bullet combinations that exceed the strict 10-bullet ceiling constraint.
* **Expected System Behavior:** The Content Budget Tracker in the UI turns red (e.g. `12 / 10 bullets allocated`) and disables the "Generate Resume" action button. The system blocks the generation pipeline until the user decreases selections or adjusts bullet allocations per item to $\le 10$.

### 7.5 No Matching Skills / Low Relevance
* **Scenario:** The user enters a Job Description containing skill requirements that do not overlap with any entries in the candidate's Skills Vault.
* **Expected System Behavior:** The Relevance Engine scores all vault entries near zero. The ranking dashboard still lists the items (flagged with a warning of low/no relevance) allowing the user to select them. The prioritized skills generator lists the user's base skills in their default categorized order since no matching priority is identified.

### 7.6 Local Filesystem Write Errors
* **Scenario:** The application attempts to write the generated `.tex` resume file to the local directory path `resumes/<company_name>/<job_role>/<resume_date_time>.tex` but the docker host lacks write permissions or the local path is read-only.
* **Expected System Behavior:** The system catches the IO exception and displays a prominent warning banner: *"Failed to save resume source to local storage. Please check host directory permissions."* The history ledger update is skipped, but the copyable LaTeX text box remains populated in the Web UI so the user does not lose their generated resume code.

---

## 8. Acceptance Criteria

### 8.1 Knowledge Vault CRUD
1. The user can create, view, update, and delete entries for all V1 core schemas: Profile, Work Experience, Projects, Hackathons & Competitions, Education, and Skills.
2. Saving new details to an existing entry merges new atomic facts and skills without creating duplicate assertions.

### 8.2 Ingestion & Fact Parsing
1. Pasting raw text results in the extraction of multiple structured "Atomic Facts" (pairing actions with corresponding metrics/results and tools used).
2. The user has the ability to add, edit, or delete these extracted facts via the UI before committing them to the Vault.

### 8.3 Relevance Ranking & Features Debugging
1. Inputting a Job Description (JD) ranks Experiences, Projects, and Hackathons/Competitions in descending order of relevance.
2. The keywords and criteria extracted from the JD that determined the ranking scores must be recorded transparently in the logs/history ledger of the tailoring run.

### 8.4 Budget Constraints (1-Page Fit)
1. The Web UI displays a live count of selected bullets (`N / 10`).
2. The "Generate Resume" button is disabled if the user's bullet selection exceeds 10.
3. The generated LaTeX source maps exactly to the user's selections and fits within a single page template limit.

### 8.5 Skills Tailoring
1. The generated resume output reorganizes the Skills list to position direct JD skill matches first, followed by skills matching the Company Context, and then related skills.

### 8.6 Document Output Formatting
1. Clicking "Generate" yields a copyable LaTeX source block matching the structure of the "Jake's Resume" template.
2. The generated LaTeX code compiles cleanly in LaTeX environments (like Overleaf) into a single page PDF without syntax errors.

### 8.7 File Export & Local Ledger
1. Generating a resume automatically saves the compile-ready LaTeX document to `resumes/<company_name>/<job_role>/<resume_date_time>.tex` on the host filesystem.
2. Generating a resume appends an entry to the local JSON/YAML history ledger containing the Company Name, Job Role, timestamp (date and time), filepath, and JD matching keywords.

### 8.8 Environment & Security boundaries
1. The system can be fully deployed and run locally using Docker (`docker-compose up`).
2. No data is written to or stored in external remote services or cloud environments.






