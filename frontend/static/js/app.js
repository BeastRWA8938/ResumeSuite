// ==========================================================================
// Unified Frontend JavaScript Logic - Resume Suite (ATS + LaTeX Resume Generator)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // Tab Navigation Switching
    // ==========================================================================
    const tabs = {
        ats: document.getElementById("tab-ats"),
        generator: document.getElementById("tab-generator")
    };
    
    const views = {
        ats: document.getElementById("view-ats"),
        generator: document.getElementById("view-generator")
    };

    tabs.ats.addEventListener("click", () => {
        tabs.ats.classList.add("active");
        tabs.generator.classList.remove("active");
        views.ats.style.display = "flex";
        views.generator.style.display = "none";
    });

    tabs.generator.addEventListener("click", () => {
        tabs.generator.classList.add("active");
        tabs.ats.classList.remove("active");
        views.generator.style.display = "flex";
        views.ats.style.display = "none";
    });

    // ==========================================================================
    // ATS Scanner Component
    // ==========================================================================
    const atsElements = {
        sidebar: document.getElementById("historySidebar"),
        toggleSidebarBtn: document.getElementById("toggleSidebarBtn"),
        historyList: document.getElementById("historyList"),
        
        atsApiKeyInput: document.getElementById("atsApiKeyInput"),
        apiKeyStatus: document.getElementById("apiKeyStatus"),
        
        inputSection: document.getElementById("inputSection"),
        loadingSection: document.getElementById("loadingSection"),
        resultsSection: document.getElementById("resultsSection"),
        
        jobTitle: document.getElementById("jobTitle"),
        jobDescription: document.getElementById("jobDescription"),
        resumeFile: document.getElementById("resumeFile"),
        dropzone: document.getElementById("dropzone"),
        browseBtn: document.getElementById("browseBtn"),
        
        fileInfoBar: document.getElementById("fileInfoBar"),
        selectedFileName: document.getElementById("selectedFileName"),
        selectedFileSize: document.getElementById("selectedFileSize"),
        clearFileBtn: document.getElementById("clearFileBtn"),
        
        analyzeBtn: document.getElementById("analyzeBtn"),
        backToScanBtn: document.getElementById("backToScanBtn"),
        
        // Progress Steps
        stepExtract: document.getElementById("step-extract"),
        stepAi: document.getElementById("step-ai"),
        stepDb: document.getElementById("step-db"),
        
        // Results Dashboard DOMs
        resultMetaInfo: document.getElementById("resultMetaInfo"),
        scoreCircle: document.getElementById("scoreCircle"),
        scoreNumber: document.getElementById("scoreNumber"),
        scoreVerdict: document.getElementById("scoreVerdict"),
        analysisSummary: document.getElementById("analysisSummary"),
        
        strengthsList: document.getElementById("strengthsList"),
        weaknessesList: document.getElementById("weaknessesList"),
        matchedKeywordsContainer: document.getElementById("matchedKeywordsContainer"),
        missingKeywordsContainer: document.getElementById("missingKeywordsContainer"),
        matchKeywordCount: document.getElementById("matchKeywordCount"),
        missingKeywordCount: document.getElementById("missingKeywordCount"),
        skillGapGrid: document.getElementById("skillGapGrid"),
        formattingList: document.getElementById("formattingList"),
    };

    let selectedFile = null;
    let activeAnalysisId = null;

    initAts();

    function initAts() {
        registerAtsEventListeners();
        loadAtsApiKey();
        checkServerAndFetchHistory();
    }

    function loadAtsApiKey() {
        const savedApiKey = localStorage.getItem("gemini_api_key");
        if (savedApiKey) {
            atsElements.atsApiKeyInput.value = savedApiKey;
        }
    }

    function registerAtsEventListeners() {
        // Save API Key on change and sync with other tab
        atsElements.atsApiKeyInput.addEventListener("change", () => {
            const key = atsElements.atsApiKeyInput.value.trim();
            localStorage.setItem("gemini_api_key", key);
            if (makerElements && makerElements.apiKeyInput) {
                makerElements.apiKeyInput.value = key;
            }
        });

        // Sidebar collapse trigger
        atsElements.toggleSidebarBtn.addEventListener("click", () => {
            atsElements.sidebar.classList.toggle("collapsed");
        });

        // Click browse button triggers hidden file input
        atsElements.browseBtn.addEventListener("click", () => {
            atsElements.resumeFile.click();
        });

        atsElements.resumeFile.addEventListener("change", handleFileSelection);

        // Drag & Drop event listener setups
        ["dragenter", "dragover"].forEach(eventName => {
            atsElements.dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                atsElements.dropzone.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            atsElements.dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                atsElements.dropzone.classList.remove("dragover");
            }, false);
        });

        atsElements.dropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                atsElements.resumeFile.files = files;
                handleFileSelection({ target: atsElements.resumeFile });
            }
        });

        // Clear selection button
        atsElements.clearFileBtn.addEventListener("click", clearFileSelection);

        // Job description typing listener
        atsElements.jobDescription.addEventListener("input", validateInputs);

        // Perform analysis action
        atsElements.analyzeBtn.addEventListener("click", performScan);

        // Back to uploads button
        atsElements.backToScanBtn.addEventListener("click", () => {
            atsElements.resultsSection.style.display = "none";
            atsElements.inputSection.style.display = "block";
            // Scroll to top
            document.querySelector("#view-ats .scroll-container").scrollTop = 0;
            // Clear current active sidebar highlighted item
            document.querySelectorAll(".history-item").forEach(item => item.classList.remove("active"));
        });
    }
    
    function checkServerAndFetchHistory() {
        fetch("/api/history")
            .then(res => {
                if (res.ok) {
                    atsElements.apiKeyStatus.className = "api-key-indicator ready";
                    atsElements.apiKeyStatus.querySelector(".status-text").innerText = "Gemini API Ready";
                    return res.json();
                } else {
                    throw new Error("Server error");
                }
            })
            .then(history => {
                renderHistory(history);
            })
            .catch(err => {
                atsElements.apiKeyStatus.className = "api-key-indicator error";
                atsElements.apiKeyStatus.querySelector(".status-text").innerText = "Connection Error";
                console.error("Failed to connect or fetch history:", err);
            });
    }

    function handleFileSelection(e) {
        const file = e.target.files[0];
        if (!file) return;

        const allowedExtensions = /(\.pdf|\.docx|\.txt)$/i;
        if (!allowedExtensions.exec(file.name)) {
            alert("Unsupported format. Please select a PDF, DOCX, or TXT file.");
            clearFileSelection();
            return;
        }

        selectedFile = file;
        atsElements.selectedFileName.textContent = file.name;
        atsElements.selectedFileSize.textContent = formatBytes(file.size);
        
        // UI updates
        atsElements.dropzone.style.display = "none";
        atsElements.fileInfoBar.style.display = "flex";

        validateInputs();
    }

    function clearFileSelection() {
        selectedFile = null;
        atsElements.resumeFile.value = "";
        atsElements.dropzone.style.display = "flex";
        atsElements.fileInfoBar.style.display = "none";
        validateInputs();
    }

    function validateInputs() {
        const hasJobDescription = atsElements.jobDescription.value.trim().length > 50;
        const hasFile = selectedFile !== null;

        atsElements.analyzeBtn.disabled = !(hasJobDescription && hasFile);
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function performScan() {
        if (!selectedFile || atsElements.jobDescription.value.trim().length < 50) return;

        // Hide main input, display loader
        atsElements.inputSection.style.display = "none";
        atsElements.loadingSection.style.display = "block";

        // Setup loading steps transitions
        updateLoaderStep("step-extract");

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("job_description", atsElements.jobDescription.value.trim());
        formData.append("job_title", atsElements.jobTitle.value.trim());
        formData.append("gemini_api_key", atsElements.atsApiKeyInput.value.trim());

        // Simulated steps helper
        const step2Timer = setTimeout(() => updateLoaderStep("step-ai"), 1800);
        const step3Timer = setTimeout(() => updateLoaderStep("step-db"), 5000);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Scan request failed.");
            }

            const data = await response.json();
            
            // Clean loader intervals
            clearTimeout(step2Timer);
            clearTimeout(step3Timer);
            
            // Complete loader state
            atsElements.stepExtract.className = "status-step completed";
            atsElements.stepAi.className = "status-step completed";
            atsElements.stepDb.className = "status-step completed";

            setTimeout(() => {
                atsElements.loadingSection.style.display = "none";
                atsElements.resultsSection.style.display = "block";
                displayAnalysisResult(data);
                checkServerAndFetchHistory(); // Reload history sidebar
            }, 600);

        } catch (error) {
            clearTimeout(step2Timer);
            clearTimeout(step3Timer);
            alert(`Error: ${error.message}`);
            atsElements.loadingSection.style.display = "none";
            atsElements.inputSection.style.display = "block";
        }
    }

    function updateLoaderStep(stepId) {
        const steps = ["step-extract", "step-ai", "step-db"];
        let foundCurrent = false;

        steps.forEach(sid => {
            const el = document.getElementById(sid);
            if (sid === stepId) {
                el.className = "status-step active";
                foundCurrent = true;
            } else if (!foundCurrent) {
                el.className = "status-step completed";
            } else {
                el.className = "status-step";
            }
        });
    }

    function displayAnalysisResult(data) {
        activeAnalysisId = data.id;
        
        // Metadata title
        atsElements.resultMetaInfo.textContent = `Scanned: ${data.filename} for "${data.job_title}"`;
        
        const result = data.result;
        
        // Set circular score animations
        animateScoreWheel(result.score);
        
        // Set Executive Fit summary
        atsElements.analysisSummary.textContent = result.summary;

        // Render lists
        renderBulletList(atsElements.strengthsList, result.strengths);
        renderBulletList(atsElements.weaknessesList, result.weaknesses);
        renderBulletList(atsElements.formattingList, result.formatting_feedback);

        // Keywords
        renderTags(atsElements.matchedKeywordsContainer, result.matched_keywords, "tag-match");
        renderTags(atsElements.missingKeywordsContainer, result.missing_keywords, "tag-gap");
        atsElements.matchKeywordCount.textContent = result.matched_keywords.length;
        atsElements.missingKeywordCount.textContent = result.missing_keywords.length;

        // Skill gaps grid
        renderSkillGaps(result.skill_gap_analysis);

        // Scroll main viewport to top
        document.querySelector("#view-ats .scroll-container").scrollTop = 0;
    }

    function animateScoreWheel(score) {
        // Animate counter text
        let count = 0;
        atsElements.scoreNumber.textContent = "0";
        
        const interval = setInterval(() => {
            if (count >= score) {
                atsElements.scoreNumber.textContent = score;
                clearInterval(interval);
            } else {
                count++;
                atsElements.scoreNumber.textContent = count;
            }
        }, 12);

        // Circular dash animation
        const maxOffset = 314;
        const targetOffset = maxOffset - (maxOffset * (score / 100));
        atsElements.scoreCircle.style.strokeDashoffset = targetOffset;

        // Color theme mapping
        let scoreClass = "";
        let verdictClass = "";
        let verdictText = "";

        if (score >= 80) {
            scoreClass = "score-high";
            verdictClass = "verdict-high";
            verdictText = "Strong Match";
        } else if (score >= 60) {
            scoreClass = "score-med";
            verdictClass = "verdict-med";
            verdictText = "Moderate Gaps";
        } else {
            scoreClass = "score-low";
            verdictClass = "verdict-low";
            verdictText = "Major Revision Required";
        }

        atsElements.scoreCircle.className.baseVal = `radial-fill-circle ${scoreClass}`;
        atsElements.scoreVerdict.className = `score-badge-indicator ${verdictClass}`;
        atsElements.scoreVerdict.textContent = verdictText;
    }

    function renderBulletList(container, list) {
        container.innerHTML = "";
        if (!list || list.length === 0) {
            container.innerHTML = "<li>No details recorded.</li>";
            return;
        }
        list.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            container.appendChild(li);
        });
    }

    function renderTags(container, list, tagClass) {
        container.innerHTML = "";
        if (!list || list.length === 0) {
            container.innerHTML = `<span class="tag ${tagClass}">None</span>`;
            return;
        }
        list.forEach(tag => {
            const span = document.createElement("span");
            span.className = `tag ${tagClass}`;
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    function renderSkillGaps(gaps) {
        atsElements.skillGapGrid.innerHTML = "";
        if (!gaps || gaps.length === 0) {
            atsElements.skillGapGrid.innerHTML = "<p class='text-muted'>No categorized skill gaps found.</p>";
            return;
        }

        gaps.forEach(gap => {
            const card = document.createElement("div");
            card.className = "skill-gap-card";
            
            const title = document.createElement("h4");
            title.textContent = gap.category;
            card.appendChild(title);

            // Matched skills block
            if (gap.matched_skills && gap.matched_skills.length > 0) {
                const group = document.createElement("div");
                group.className = "skill-group";
                
                const label = document.createElement("span");
                label.className = "skill-group-label";
                label.textContent = "Matched";
                group.appendChild(label);
                
                const tagBox = document.createElement("div");
                tagBox.className = "tags-container";
                gap.matched_skills.forEach(skill => {
                    const span = document.createElement("span");
                    span.className = "tag tag-match";
                    span.style.fontSize = "11px";
                    span.style.padding = "4px 8px";
                    span.textContent = skill;
                    tagBox.appendChild(span);
                });
                group.appendChild(tagBox);
                card.appendChild(group);
            }

            // Missing skills block
            if (gap.missing_skills && gap.missing_skills.length > 0) {
                const group = document.createElement("div");
                group.className = "skill-group";
                group.style.marginTop = "14px";
                
                const label = document.createElement("span");
                label.className = "skill-group-label";
                label.textContent = "Missing";
                group.appendChild(label);
                
                const tagBox = document.createElement("div");
                tagBox.className = "tags-container";
                gap.missing_skills.forEach(skill => {
                    const span = document.createElement("span");
                    span.className = "tag tag-gap";
                    span.style.fontSize = "11px";
                    span.style.padding = "4px 8px";
                    span.textContent = skill;
                    tagBox.appendChild(span);
                });
                group.appendChild(tagBox);
                card.appendChild(group);
            }

            atsElements.skillGapGrid.appendChild(card);
        });
    }

    function renderHistory(history) {
        atsElements.historyList.innerHTML = "";
        
        if (!history || history.length === 0) {
            atsElements.historyList.innerHTML = `
                <div class="empty-history">
                    <p>No recent scans yet</p>
                </div>
            `;
            return;
        }

        history.forEach(item => {
            const card = document.createElement("div");
            card.className = `history-item ${activeAnalysisId === item.id ? "active" : ""}`;
            card.dataset.id = item.id;
            
            // Format dates
            let dateStr = "";
            try {
                const dateObj = new Date(item.created_at);
                dateStr = dateObj.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) + " " + dateObj.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit', hour12: false});
            } catch (e) {
                dateStr = item.created_at;
            }

            // Score classification
            const score = item.result.score;
            let scoreClass = "low";
            if (score >= 80) scoreClass = "high";
            else if (score >= 60) scoreClass = "med";

            card.innerHTML = `
                <div class="history-item-header">
                    <span class="history-title" title="${item.filename}">${item.filename}</span>
                    <span class="history-score ${scoreClass}">${score}%</span>
                </div>
                <div class="history-meta">
                    <span>${item.job_title}</span>
                    <button class="btn-delete-history" aria-label="Delete analysis" data-id="${item.id}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;

            // Selection handler
            card.addEventListener("click", (e) => {
                if (e.target.closest(".btn-delete-history")) return;
                loadHistoryItem(item.id);
            });

            // Delete handler
            card.querySelector(".btn-delete-history").addEventListener("click", (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.id);
            });

            atsElements.historyList.appendChild(card);
        });
    }

    async function loadHistoryItem(id) {
        try {
            const response = await fetch(`/api/history/${id}`);
            if (!response.ok) throw new Error("Could not retrieve analysis details.");
            
            const data = await response.json();
            
            // Render results
            atsElements.inputSection.style.display = "none";
            atsElements.resultsSection.style.display = "block";
            displayAnalysisResult(data);
            
            // Highlight current sidebar card active status
            document.querySelectorAll(".history-item").forEach(item => {
                if (parseInt(item.dataset.id) === id) {
                    item.classList.add("active");
                } else {
                    item.classList.remove("active");
                }
            });
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async function deleteHistoryItem(id) {
        if (!confirm("Are you sure you want to delete this scan record?")) return;
        
        try {
            const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Deletion request failed.");
            
            // Check if deleted item is currently viewed
            if (activeAnalysisId === id) {
                atsElements.resultsSection.style.display = "none";
                atsElements.inputSection.style.display = "block";
                activeAnalysisId = null;
            }
            
            checkServerAndFetchHistory();
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    // ==========================================================================
    // LaTeX Resume Maker Component
    // ==========================================================================
    const makerElements = {
        apiKeyInput: document.querySelector("#view-generator #apiKeyInput"),
        tailorForm: document.querySelector("#view-generator #tailorForm"),
        companyName: document.querySelector("#view-generator #companyName"),
        jobTitleInput: document.querySelector("#view-generator #jobTitleInput"),
        generatorJobDescription: document.querySelector("#view-generator #generatorJobDescription"),
        generateBtn: document.querySelector("#view-generator #generateBtn"),

        placeholderState: document.querySelector("#view-generator #placeholderState"),
        progressState: document.querySelector("#view-generator #progressState"),
        resultState: document.querySelector("#view-generator #resultState"),
        errorState: document.querySelector("#view-generator #errorState"),

        // Steps
        stepKb: document.querySelector("#view-generator #step-kb"),
        stepTailor: document.querySelector("#view-generator #step-tailor"),
        stepCompile: document.querySelector("#view-generator #step-compile"),
        stepFinalize: document.querySelector("#view-generator #step-finalize"),

        // Result outputs
        downloadPdfBtn: document.querySelector("#view-generator #downloadPdfBtn"),
        downloadTexBtn: document.querySelector("#view-generator #downloadTexBtn"),
        researchOutput: document.querySelector("#view-generator #researchOutput"),
        pdfFrame: document.querySelector("#view-generator #pdfFrame"),

        // Errors
        errorMessage: document.querySelector("#view-generator #errorMessage"),
        errorLogContainer: document.querySelector("#view-generator #errorLogContainer"),
        errorLog: document.querySelector("#view-generator #errorLog"),
        retryBtn: document.querySelector("#view-generator #retryBtn")
    };

    initMaker();

    function initMaker() {
        registerMakerEventListeners();
        loadMakerApiKey();
    }

    function registerMakerEventListeners() {
        // Save API Key on change and sync with other tab
        makerElements.apiKeyInput.addEventListener("change", () => {
            const key = makerElements.apiKeyInput.value.trim();
            localStorage.setItem("gemini_api_key", key);
            if (atsElements && atsElements.atsApiKeyInput) {
                atsElements.atsApiKeyInput.value = key;
            }
        });

        // Submit form tailored
        makerElements.tailorForm.addEventListener("submit", handleMakerSubmit);

        // Error retry action
        makerElements.retryBtn.addEventListener("click", () => {
            setMakerViewState("placeholder");
        });
    }

    function loadMakerApiKey() {
        const savedApiKey = localStorage.getItem("gemini_api_key");
        if (savedApiKey) {
            makerElements.apiKeyInput.value = savedApiKey;
        }
    }

    function setMakerViewState(state) {
        makerElements.placeholderState.classList.add("hidden");
        makerElements.progressState.classList.add("hidden");
        makerElements.resultState.classList.add("hidden");
        makerElements.errorState.classList.add("hidden");

        if (state === "placeholder") makerElements.placeholderState.classList.remove("hidden");
        if (state === "progress") makerElements.progressState.classList.remove("hidden");
        if (state === "result") makerElements.resultState.classList.remove("hidden");
        if (state === "error") makerElements.errorState.classList.remove("hidden");
    }

    function resetMakerProgressSteps() {
        const steps = [makerElements.stepKb, makerElements.stepTailor, makerElements.stepCompile, makerElements.stepFinalize];
        steps.forEach(step => {
            step.className = "";
            const icon = step.querySelector(".step-icon");
            icon.setAttribute("class", "step-icon");
            // Standard circle icon
            icon.innerHTML = `<circle cx="12" cy="12" r="10"></circle>`;
        });
    }

    let makerProgressTimers = [];

    function startMakerProgressSimulation() {
        resetMakerProgressSteps();
        
        makerProgressTimers.forEach(clearTimeout);
        makerProgressTimers = [];

        const setStepActive = (stepEl) => {
            stepEl.className = "active";
            const icon = stepEl.querySelector(".step-icon");
            icon.setAttribute("class", "step-icon fa-spin");
            icon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>`;
        };

        const setStepCompleted = (stepEl) => {
            stepEl.className = "completed";
            const icon = stepEl.querySelector(".step-icon");
            icon.setAttribute("class", "step-icon");
            icon.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline>`;
        };

        // Step 1: KB Active immediately
        setStepActive(makerElements.stepKb);

        // Step 2: KB Completed, Tailor Active after 1.5s
        makerProgressTimers.push(setTimeout(() => {
            setStepCompleted(makerElements.stepKb);
            setStepActive(makerElements.stepTailor);
        }, 1500));

        // Step 3: Tailor Completed, Compile Active after 9.5s
        makerProgressTimers.push(setTimeout(() => {
            setStepCompleted(makerElements.stepTailor);
            setStepActive(makerElements.stepCompile);
        }, 9500));

        // Step 4: Compile Completed, Finalize Active after 18s
        makerProgressTimers.push(setTimeout(() => {
            setStepCompleted(makerElements.stepCompile);
            setStepActive(makerElements.stepFinalize);
        }, 18000));
    }

    function finishMakerProgressSimulation() {
        makerProgressTimers.forEach(clearTimeout);
        makerProgressTimers = [];
        
        const steps = [makerElements.stepKb, makerElements.stepTailor, makerElements.stepCompile, makerElements.stepFinalize];
        steps.forEach(step => {
            step.className = "completed";
            const icon = step.querySelector(".step-icon");
            icon.setAttribute("class", "step-icon");
            icon.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline>`;
        });
    }

    async function handleMakerSubmit(e) {
        e.preventDefault();

        const companyName = makerElements.companyName.value.trim();
        const jobTitle = makerElements.jobTitleInput.value.trim();
        const jobDescription = makerElements.generatorJobDescription.value.trim();
        const geminiApiKey = makerElements.apiKeyInput.value.trim();

        if (!companyName || !jobTitle || !jobDescription) {
            alert("Please fill out all fields.");
            return;
        }

        setMakerViewState("progress");
        startMakerProgressSimulation();
        makerElements.generateBtn.disabled = true;

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    companyName,
                    jobTitle,
                    jobDescription,
                    geminiApiKey
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            // Success
            finishMakerProgressSimulation();

            setTimeout(() => {
                setMakerViewState("result");
                makerElements.generateBtn.disabled = false;
                
                makerElements.researchOutput.textContent = data.companyResearch;
                makerElements.downloadPdfBtn.href = data.pdfUrl;
                makerElements.downloadTexBtn.href = data.texUrl;
                
                // Embed PDF to preview Frame
                makerElements.pdfFrame.src = data.pdfUrl;
            }, 500);

        } catch (err) {
            console.error("Error tailoring resume:", err);
            makerProgressTimers.forEach(clearTimeout);
            makerElements.generateBtn.disabled = false;
            setMakerViewState("error");

            if (err.detail && err.detail.includes("LaTeX Compilation Failed")) {
                makerElements.errorMessage.textContent = "LaTeX compilation failed. The LLM may have introduced syntactical or parsing errors into the PlushCV template.";
                makerElements.errorLogContainer.classList.remove("hidden");
                makerElements.errorLog.textContent = err.detail || "";
            } else {
                makerElements.errorMessage.textContent = err.detail || err.error || err.message || "An unexpected server error occurred.";
                makerElements.errorLogContainer.classList.add("hidden");
                makerElements.errorLog.textContent = "";
            }
        }
    }
});
