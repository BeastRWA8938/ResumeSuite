# Resume Suite — AI ATS Scanner & LaTeX Resume Maker

Resume Suite is an ultra-premium, modern web application that combines a **FastAPI backend** and a glassmorphic **single-page frontend** to provide both:
1. **Applicant Tracking System (ATS) Resume Analyzer**: Evaluates resumes against target job descriptions, computes match scores, outlines skill gaps, audits keywords, and generates formatting feedback.
2. **AI LaTeX Resume Generator**: Tailors custom XeLaTeX resumes based on candidate projects and work experiences in a local markdown-based Knowledge Base, and compiles them to PDF format.

---

## ✨ Features

### 1. ATS Scanner & Analyzer
- **Document Text Extractor**: Supports uploading `.pdf`, `.docx`, and `.txt` files directly.
- **Intelligent ATS Scoring**: Computes compatibility match score (0-100) using Gemini's structured models.
- **Skill Gap Analysis**: Divides skills into categorized domains with Side-by-Side matches & missing skills lists.
- **Keyword Auditing**: Visual tags indicating which target job keywords are matched vs. missing.
- **Scan History Sidebar**: Persists all scans locally via an SQLite database so you can re-load or delete past analyses.

### 2. LaTeX Resume Generator
- **Knowledge Base Aggregator**: Recursively crawls and aggregates markdown files from `Knowledge Base/Projects` and `Knowledge Base/Work`.
- **Target Company Check**: Researches the target company engineering culture and tech stack using Google Search Grounding to align the tailored resume.
- **XeLaTeX Compilation**: Automatically customizes LaTeX code based on the PlushCV template and compiles it into a single-page PDF locally.
- **Interactive Preview & Downloads**: Instantly preview the compiled PDF in the browser iframe and download both the compiled `.pdf` and `.tex` source files.

---

## 🛠️ Step-by-Step Installation Guide

Follow these instructions to set up and run the application locally on your system.

### Step 1: Install Python (3.9 or higher)
Ensure you have Python 3.9+ installed:
1. Download Python from the [official website](https://www.python.org/downloads/).
2. **Important for Windows**: During installation, check the box that says **"Add Python to PATH"**.
3. Verify your installation by running in terminal:
   ```bash
   python --version
   ```

### Step 2: Install XeLaTeX Compiler
To compile the tailored LaTeX code into a PDF resume, you must have a LaTeX distribution with the `xelatex` command line utility installed and configured in your environment PATH.

#### 🪟 Windows (Recommended: MiKTeX)
1. Go to the [MiKTeX Download Page](https://miktex.org/download) and download the Windows Installer.
2. Run the installer. We recommend keeping the default settings.
3. **CRITICAL STEP**: During the installation wizard, under the **"Auto-install missing packages"** option, select **"Yes"** (or "Ask me first"). The PlushCV template relies on several LaTeX packages (like `textpos`, `isodate`, `substr`, `titlesec`, `fancyhdr`). Choosing "Yes" allows MiKTeX to install these packages on-the-fly when compiling your first resume.
4. Verify XeLaTeX is available in your PATH by opening a new terminal (CMD or PowerShell) and running:
   ```powershell
   xelatex --version
   ```

#### 🍎 macOS (Recommended: MacTeX or BasicTeX)
1. Install using Homebrew:
   ```bash
   brew install --cask mactex-no-gui
   ```
   *Alternatively, download and run the full installer from the [MacTeX official site](https://tug.org/mactex/).*
2. Verify XeLaTeX:
   ```bash
   xelatex --version
   ```

#### 🐧 Linux (Debian/Ubuntu)
1. Install TeX Live with XeTeX support via `apt`:
   ```bash
   sudo apt update
   sudo apt-get install texlive-xetex texlive-fonts-recommended texlive-plain-generic
   ```
2. Verify XeLaTeX:
   ```bash
   xelatex --version
   ```

---

### Step 3: Setup Virtual Environment & Python dependencies
Initialize a virtual environment to manage backend dependencies cleanly:

1. Navigate to the root directory `ResumeATSAnalyzer`.
2. Create the virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install requirements:
   ```bash
   pip install -r backend/requirements.txt
   ```

---

### Step 3.5: Populate Your Local Knowledge Base (For Resume Maker)
To use the LaTeX Resume Tailoring feature, you must populate your personal experience and project details in Markdown format:
1. Create a directory named `Knowledge Base` in the project root (if it doesn't already exist).
2. Inside `Knowledge Base/`, create two subdirectories: `Projects/` and `Work/`.
3. Add your project descriptions as individual `.md` files inside `Projects/` (e.g. `Projects/smart-blind-stick.md`).
4. Add your work experience and internship histories as individual `.md` files inside `Work/` (e.g. `Work/think-of-it-foundation.md`).
5. The resume maker will crawl these files recursively on run, compile them, and feed them to the AI to customize the PlushCV LaTeX template.

> [!IMPORTANT]
> The `Knowledge Base/` directory is ignored by Git in `.gitignore` by default to prevent you from accidentally sharing your personal, sensitive career and project data publicly on GitHub.

---

### Step 4: Configure Gemini API Key

You can configure your Gemini API Key in one of two ways:
1. **Root Configuration (.env file)**: Create a `.env` file in the root folder of the project:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
2. **Web UI Customization**: Enter the key in the password input fields located in the top-right header of both views (ATS Scanner & Resume Maker). The key will automatically save to your browser's local storage for future visits.

---

### Step 5: Launch the Server

1. Start the FastAPI development server:
   ```bash
   uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Open your browser and navigate to **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.
3. Use the Left Navigation Bar to switch views between the ATS Scanner and Resume Maker!
