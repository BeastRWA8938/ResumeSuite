# Engineering Specification (ES)
## Career Intelligence System (V1)

---

## 1. Engineering Principles

This section establishes the core engineering philosophy for this codebase. Every architectural decision, code review, and implementation step must align with these values to ensure the codebase remains maintainable, secure, and robust over time.

### 1.1 Local-First Architecture & Data Sovereignty
* **Principle:** All user data is stored and processed locally on the user's machine by default. No telemetry or analytics are permitted.
* **Rationale:** Career vaults store highly sensitive personal history, performance metrics, and proprietary project details. Preserving local ownership of data is our primary security control, while preparing for optional cloud sync (e.g. to free cloud storage) in V2.
* **Tradeoffs:** Requires designing local databases to support synchronization (e.g. tracking revision IDs or timestamps), but provides absolute user privacy and offline availability.


### 1.2 Quality & Truthfulness Over Execution Speed
* **Principle:** We prioritize output quality and factual accuracy over execution speed. Processing times of up to 5 minutes are fully acceptable if they prevent factual errors or hallucinations.
* **Rationale:** A career memory system is useless if it misallocates metrics, misinterprets tech stacks, or invents details. The synthesized output must represent the absolute truth of the candidate's history.
* **Tradeoffs:** We sacrifice instant interface feedback, which we mitigate by displaying loading indicators and status logs during processing.

### 1.3 Simplicity and Zero-Dependency Creep
* **Principle:** We choose minimal, standard, well-supported technologies over trendy, complex libraries or architectures. We avoid introducing framework overhead unless it directly serves V1.
* **Rationale:** This is a single-user utility. Overengineering components (like distributed caching, message queues, or microservice boundaries) increases startup friction and long-term maintenance debt.
* **Tradeoffs:** Some manual boilerplate is preferred over importing heavy third-party packages that require frequent security updates.

### 1.4 Test-Driven Vertical Integration
* **Principle:** We implement and test the system in vertical slices. A slice is not complete until it connects UI input to data storage and verifies success end-to-end.
* **Rationale:** Testing slices end-to-end prevents late-stage integration failures. It ensures that UI inputs and data persistence layers are validated early and incrementally.
* **Tradeoffs:** Requires setting up database mocks or local test files early, but guarantees that the foundation remains stable as we add complex tailoring logic.

### 1.5 Strict Separation of Concerns
* **Principle:** Business logic (fact extraction, relevance ranking, bullet tailoring) must be completely decoupled from presentation layers (Web UI components) and transport/persistence layers.
* **Rationale:** If we migrate the template renderer or local storage in V2, we should not have to rewrite the text parsing and tailoring logic.
* **Tradeoffs:** Increases the number of modules and interface definitions in V1, but makes the codebase highly adaptable for future expansion.

---

## 2. Technology Stack

This section maintains the list of approved technologies for the codebase. Each choice is tied directly to an Architecture Decision Record (ADR) in Section 5.

* **Frontend Framework:** Vite + React (TypeScript) [ADR-001]
* **Backend Framework:** Python FastAPI [ADR-001]
* **Database:** SQLite [ADR-002]
* **AI Model:** Gemini 1.5 Pro & Gemini 1.5 Flash (via Task-Based AI Services) [ADR-003, ADR-004]
* **ORM:** SQLModel (with isolated Repository Interfaces) [ADR-006]
* **State Management:** *Pending Decision*
* **Styling:** Vanilla CSS (as per workspace design guidelines)
* **Authentication:** *Not applicable for V1*
* **Package Manager:** *Pending Decision*
* **Testing Frameworks:** *Pending Decision*
* **Dependency Management:** *Pending Decision*
* **Build Tools:** *Pending Decision*

---

## 5. Architecture Decision Records (ADR)

### ADR-001: Application Architecture & Programming Language

* **Context:**
  The Career Intelligence System V1 requires structured parsing of raw text into Action-Result metrics (Atomic Facts), semantic indexing and relevance matching against Job Descriptions, compile-ready LaTeX document output generation, and automated file-saving to host systems. It also requires a highly reactive, responsive user interface to manage content selections, inline fact editing, and bullet budgets.
* **Requirements:**
  1. Local containerized execution via Docker.
  2. Native filesystem integration to write `.tex` files.
  3. Interactive front-end validation and constraint checking.
  4. Robust AI structured text processing.
  5. Scalable for 2–3 years to support local PDF compilers and crawling engines.
* **Options Considered:**
  * **Option A:** Monolithic Next.js with TypeScript.
  * **Option B:** Decoupled Vite + React (TypeScript) Frontend and Python FastAPI Backend.
* **Tradeoffs:**
  * **Option A (Next.js Monolith):** Offers single-container simplicity and shared type definitions. However, running local PDF compiler subprocesses (LaTeX engines) or native resume parsing libraries over the next 2-3 years introduces runtime dependencies that bloat the web server image and mix compilation utilities with frontend presentation layers.
  * **Option B (Decoupled React + FastAPI):** Demands a two-service setup in `docker-compose.yaml` (introducing minor networking/CORS configuration overhead). However, it strictly decouples the presentation layers from system utilities and AI validation tasks. The Python backend is natively optimized for Pydantic schema validation, LaTeX/PDF parsing library integrations, and spawning compiler commands in sandboxed runtime configurations.
* **Final Decision:**
  **Option B (Decoupled Vite + React Frontend and Python FastAPI Backend)**.
* **Rationale:**
  Option B aligns with the data-centric and system-compiling domain of the product. The FastAPI backend utilizes Pydantic validation to enforce strict Action-Result-Skill structures, neutralizing data distortion risks. Decoupling the Vite/React frontend to serve static assets keeps UI code separate from compilation tools. This split simplifies security, testing, and container management as system dependencies (e.g. compilers) grow in V2.

### ADR-002: Local-First Database Choice

* **Context:**
  The database must store profile, experiences, projects, hackathons/competitions, and atomic facts. It must enforce relational associations (composition rules) and transactionally update facts during ingestion/merging. Under the Local-First model, V1 data must be persisted locally and offline, but be prepared for optional cloud sync in V2.
* **Requirements:**
  1. Low orchestration footprint (runs serverless inside the local container).
  2. Transactional relational schema validation.
  3. Easy portability for backups.
  4. Extensible to V2 cloud storage syncing (file-level and row-level sync models).
* **Options Considered:**
  * **Option A:** PostgreSQL Container.
  * **Option B:** SQLite (Single-File Local Database).
  * **Option C:** Flat JSON / YAML Files.
* **Tradeoffs:**
  * **Option A (PostgreSQL):** Matches cloud Postgres setups (Supabase) natively, but requires running a separate container locally, adding memory overhead, setup scripts, and port conflict risks.
  * **Option B (SQLite):** Serverless, sub-megabyte footprint, single-file portability, and ACID compliant. For V2 cloud sync, it allows easy file-level copies to Google Drive/Dropbox and row-level syncing to Postgres via database-agnostic ORMs. It lacks high write concurrency, which is irrelevant for a local single-user system.
  * **Option C (Flat JSON/YAML Files):** Simple to open and inspect in text editors, but lacks transactional write safety (prone to corruption) and requires writing custom data-joining logic.
* **Final Decision:**
  **Option B: SQLite (Single-File Local Database)**.
* **Rationale:**
  SQLite balances local performance and future sync capabilities. It ensures V1 is lightweight, running serverless inside the FastAPI backend's volume mapping. It preserves ACID constraints for relational integrity. In V2, we can synchronize SQLite rows with a cloud database (like a free-tier Supabase Postgres instance) using timestamps and revision tracking IDs, or perform simple file-level uploads to Google Drive.

### ADR-003: AI Model & Provider Selection

* **Context:**
  The application needs to perform complex natural language tasks locally by default (Local-First), including structured data extraction, job relevance scoring, and high-impact resume synthesis (STAR/XYZ formatting).
* **Requirements:**
  1. Low-cost development and testing lifecycle (generous free tier).
  2. Large token context handling (supports pasting long JDs and deep career history vaults).
  3. Enforces strict structured JSON matching our domain models natively.
  4. Minimizes dependencies on third-party parsing wrappers.
* **Options Considered:**
  * **Option A:** Google AI Studio (Gemini 1.5 Pro & Gemini 1.5 Flash).
  * **Option B:** OpenAI API (GPT-4o & GPT-4o-mini).
* **Tradeoffs:**
  * **Option A (Gemini):** Offers a robust free tier (Google AI Studio) and a massive 1-million token context window. It natively enforces JSON validation via direct integration with Pydantic schemas. It introduces vendor lock-in to Google's SDK, but this is mitigated by our abstraction boundary.
  * **Option B (OpenAI):** Industry-standard structured schemas and robust modeling. However, it lacks a free tier, features a smaller context window (128k), and has higher token execution costs.
* **Final Decision:**
  **Option A: Google AI Studio (Gemini 1.5 Pro & Gemini 1.5 Flash)**.
* **Rationale:**
  Gemini meets the requirement for cost-effective, high-context execution. Gemini 1.5 Flash provides fast, low-cost extraction for ingestion workflows, while Gemini 1.5 Pro provides deep semantic synthesis for resume tailoring. The native support for structured JSON using Pydantic templates ensures data integrity without third-party libraries.

### ADR-004: Task-Based AI Service Abstraction

* **Context:**
  We must isolate our core business domain from external AI providers, vendor SDK updates, and specific model choices. If we upgrade models or swap vendors in the future, we should do so without modifying application logic.
* **Requirements:**
  1. No external AI vendor dependencies leaked to the business domain.
  2. Clean separation of concerns.
  3. No third-party abstraction packages (like LiteLLM, LangChain, or Instructor) to keep V1 dependencies minimal and secure.
* **Options Considered:**
  * **Option A:** Direct LLM SDK invocations within the business logic.
  * **Option B:** LiteLLM / Instructor abstraction layer libraries.
  * **Option C:** Custom Task-Based AI Services implementing Abstract Base Classes (ABCs).
* **Tradeoffs:**
  * **Option A (No Abstraction):** Fast to prototype, but highly coupled. Modifying prompts or models requires editing business logic, causing technical debt.
  * **Option B (Abstraction Libraries):** Simplifies multi-provider routing but introduces heavy package dependency trees (tiktoken, openai, aiohttp), increasing vulnerability and build overhead.
  * **Option C (Custom ABC Services):** Requires writing simple custom interface classes in Python. It completely isolates the AI provider. Each service encapsulates its own model choice (e.g. the Fact Extraction Service internally chooses Gemini Flash, while the Tailoring Service chooses Gemini Pro).
* **Final Decision:**
  **Option C: Custom Task-Based AI Services implementing Abstract Base Classes (ABCs)**.
* **Rationale:**
  We define clean, task-oriented interfaces in our business logic layer (e.g., `FactExtractionService`, `ResumeTailoringService`, `JDAnalysisService`, `CompanyAnalysisService`).
  These interfaces are implemented in the infrastructure layer (e.g., `GeminiFactExtractionService`). The rest of the application imports only the abstract interfaces. Model selection is handled internally within each service implementation, completely abstracting the API provider and model choices.

### ADR-005: Prompt Versioning & Ingestion Audit Trails

* **Context:**
  A PKM career system needs long-term data reproducibility. We must be able to track exactly how a given career record or resume bullet was parsed, what prompt template was utilized, and identify obsolete records when schemas evolve.
* **Requirements:**
  1. Strict prompt template version control (integrated with Git diffs).
  2. Complete metadata logging of LLM operations.
  3. Traceability of schema versions and pipeline states.
* **Options Considered:**
  * **Option A:** Prompts hardcoded as constants in Python files, with minimal execution logging.
  * **Option B:** External prompt templates stored on disk, with detailed database auditing stamps.
* **Tradeoffs:**
  * **Option A:** Simpler file structure, but makes prompts invisible to Git version diffs and prevents reproducing historical extraction runs.
  * **Option B:** Adds text configuration files to the backend filesystem. However, it ensures prompts are isolated from code, version-controlled, and audit logs are fully intact.
* **Final Decision:**
  **Option B: External prompt templates stored on disk, with detailed database auditing stamps**.
* **Rationale:**
  Prompts are stored as configuration assets under `/backend/app/prompts/` (e.g. `fact_extraction_v1.txt`). Every structured record saved in the Knowledge Vault (e.g., Atomic Facts) and every resume draft generated will store auditing fields in the local database:
  - `model_name` (e.g., `gemini-1.5-flash`)
  - `prompt_version` (e.g., `extraction_v1`)
  - `knowledge_schema_version` (e.g., `schema_v1`)
  - `extraction_pipeline_version` (e.g., `pipeline_v1`)
  - `timestamp` (ISO datetime)
  This audit trail ensures we can run migrations or trigger automatic re-extractions if prompts or schemas change.


### ADR-006: Object-Relational Mapping (ORM), Persistence Isolation, and Migrations

* **Context:**
  The Career Intelligence System V1 requires storing structured local-first entities (Profiles, Experiences, Projects, Competitions, Atomic Facts, and Generation Logs) in a SQLite database (ADR-002). We need a Python-native Object-Relational Mapper (ORM) to interact with SQLite. To preserve the decoupling defined in our Engineering Principles (Section 1.5), we must isolate persistence details from our business logic, establish resilient database schema evolution patterns, and choose a primary key strategy that supports future cloud synchronization (V2).

* **Requirements:**
  1. **Low Definition Boilerplate:** Avoid dual-defining database schemas and JSON serialization/validation models.
  2. **Persistence Boundary:** The business logic/domain layer must never depend on ORM-specific details or models.
  3. **Local-First Sync Readiness:** Primary keys must guarantee global uniqueness to allow collision-free merging when syncing local databases to cloud storage in V2.
  4. **High Cohesion:** Database interactions must be modularized by domain boundary rather than grouped into a single monolithic class.
  5. **Data Protection:** Automatically backup existing user data before schema updates, and prevent launching the application in a corrupted/half-migrated state.

* **Primary Key Evaluation (UUIDv4 vs. ULID vs. UUIDv7):**
  We evaluated three options for primary keys to support local-first data generation and future cloud synchronization:
  
  * **Option A: UUIDv4 (Random UUID)**
    * *Pros:* Native, standard library support (`uuid.uuid4()` in Python); globally unique.
    * *Cons:* Random generation leads to non-sequential keys, causing index page fragmentation and degradation of database insert performance. Lacks chronological order, requiring separate datetime fields for sorting.
  * **Option B: ULID (Universally Unique Lexicographically Sortable Identifier)**
    * *Pros:* 128-bit size compatibility; lexicographically sortable (time-ordered), ensuring chronological index performance.
    * *Cons:* Shorter string representation (26 characters) and non-standard format compared to typical UUIDs. Requires external Python library dependencies (`ulid-py`), adding maintenance overhead.
  * **Option C: UUIDv7 (Time-Ordered UUID - RFC 9562)**
    * *Pros:* Standard 36-character UUID representation, natively supported by standard libraries and databases. Features a millisecond-precision 48-bit timestamp combined with random entropy. Lexicographically sortable (preserves SQLite index insert performance), chronologically queryable out of the box, and guarantees zero merge collisions in local-first distributed topologies.
    * *Cons:* Requires Python 3.12+ (or a lightweight utility import in older versions).
  
  * **Decision:** **Option C: UUIDv7** is selected as the primary key standard. It matches standard UUID definitions, ensures B-tree index efficiency, and prepares the schema for V2 cloud sync without introducing non-standard formatting libraries.

* **ORM Framework Options:**
  * **Option A: SQLAlchemy (Standard Core/ORM)**
    * *Pros:* Industry standard, mature, and handles complex relational transactions.
    * *Cons:* Requires defining database models (SQLAlchemy) and separate API schemas (Pydantic), leading to double-definition boilerplate.
  * **Option B: SQLModel**
    * *Pros:* Built on top of SQLAlchemy and Pydantic. A single class serves as both the database model and the validation schema, drastically reducing boilerplate for V1.
    * *Cons:* Can lead to tight coupling between business logic and database columns if SQLModel types leak outside the persistence layer.
  
  * **Decision:** **Option B: SQLModel**. To mitigate its cons, SQLModel is restricted strictly as an internal implementation detail of the persistence layer.

* **Architectural Decisions & Refinements:**

  1. **Strict Persistence Boundary:**
     * SQLModel classes (e.g. classes inheriting from `SQLModel`) are isolated within the database/persistence package. They must never be imported, referenced, or used in the business/domain layer or API routes.
     * The business/domain layer will operate exclusively using pure Pydantic models or standard Python types. Mapping between SQLModel persistence types and domain types will occur entirely inside the repository implementations.

  2. **Abstract Repository Interfaces & Domain Isolation:**
     * The persistence layer is split into fine-grained repositories matching domain boundaries instead of a monolithic repository class.
     * The business layer interacts with persistence strictly through abstract interfaces (ABCs) defined in the domain layer. The concrete implementations are located in the infrastructure/persistence layer:
       * `ProfileRepository` (Manage candidate profile and contact details)
       * `EducationRepository` (Manage education history)
       * `ExperienceRepository` (Manage work experience history)
       * `ProjectRepository` (Manage portfolio projects)
       * `CompetitionRepository` (Manage hackathons and contests)
       * `AtomicFactRepository` (Manage granular Action-Result paired achievements and skill tags)
       * `HistoryRepository` (Manage resume generation logs and archives)

  3. **Repository Responsibilities:**
     * Repositories handle CRUD operations, database queries, and transactional logic (session commits, rollbacks, session management).
     * Repositories must **never** contain business logic, invoke AI services, handle resume tailoring/synthesis, calculate relevance rankings, or format output documents (e.g., LaTeX generation).

  4. **Resilient Migration Policy (Alembic):**
     * Database migrations are executed via Alembic.
     * **Pre-migration Backup:** During Docker container startup, before running migrations, a backup utility copies the current active SQLite file (`database.db` copied to `database.db.bak`).
     * **Immediate Failure Containment:** If `alembic upgrade head` fails or encounters errors:
       - Container startup must halt/terminate immediately.
       - Detailed error logs must be printed to standard error to prevent the application from launching in a dirty or partially upgraded state.
       - The backup database file `database.db.bak` is retained to protect existing user data and allow manual rollback/recovery.




