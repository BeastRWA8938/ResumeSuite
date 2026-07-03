import React, { useState, useEffect } from 'react';
import './App.css';

interface BackendHealth {
  status: string;
  service: string;
  version: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

interface Education {
  id: string;
  profile_id: string;
  institution: string;
  location: string;
  degree: string;
  major: string;
  start_date: string;
  graduation_date: string;
  gpa?: string;
}

interface WorkExperience {
  id: string;
  profile_id: string;
  employer: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Project {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  url?: string;
}

interface Hackathon {
  id: string;
  profile_id: string;
  name: string;
  organization: string;
  date: string;
  role_placement: string;
  description: string;
}

interface AtomicFact {
  id: string;
  action: string;
  metric_result?: string;
  skills: string[];
  work_experience_id?: string;
  project_id?: string;
  hackathon_id?: string;
}

interface AtomicFactCreate {
  action: string;
  metric_result?: string | null;
  skills: string[];
  work_experience_id?: string;
  project_id?: string;
  hackathon_id?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'education' | 'experience' | 'projects' | 'hackathons' | 'tailor'>('overview');
  const [connection, setConnection] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendData, setBackendData] = useState<BackendHealth | null>(null);

  // Profile state and forms
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: ''
  });
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);

  // Education state and forms
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [educationForm, setEducationForm] = useState({
    institution: '',
    location: '',
    degree: '',
    major: '',
    start_date: '',
    graduation_date: '',
    gpa: ''
  });
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [saveEduError, setSaveEduError] = useState<string | null>(null);

  // Work Experience state and forms
  const [experienceList, setExperienceList] = useState<WorkExperience[]>([]);
  const [experienceForm, setExperienceForm] = useState({
    employer: '',
    role: '',
    location: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [saveExpError, setSaveExpError] = useState<string | null>(null);

  // Projects state and forms
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    url: ''
  });
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [saveProjError, setSaveProjError] = useState<string | null>(null);

  // Hackathons state and forms
  const [hackathonList, setHackathonList] = useState<Hackathon[]>([]);
  const [hackathonForm, setHackathonForm] = useState({
    name: '',
    organization: '',
    date: '',
    role_placement: '',
    description: ''
  });
  const [editingHackId, setEditingHackId] = useState<string | null>(null);
  const [saveHackError, setSaveHackError] = useState<string | null>(null);

  // Atomic Facts persistent store (mapped by parent container record ID)
  const [experienceFacts, setExperienceFacts] = useState<Record<string, AtomicFact[]>>({});
  const [projectFacts, setProjectFacts] = useState<Record<string, AtomicFact[]>>({});
  const [hackathonFacts, setHackathonFacts] = useState<Record<string, AtomicFact[]>>({});

  // Draft Atomic Facts validation checklist
  const [draftFacts, setDraftFacts] = useState<AtomicFactCreate[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Relevance Ranking states
  const [jobDescription, setJobDescription] = useState('');
  const [companyContext, setCompanyContext] = useState('');
  const [rankingResults, setRankingResults] = useState<any[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [attemptedRanking, setAttemptedRanking] = useState(false);
  const [selectedFactIds, setSelectedFactIds] = useState<Set<string>>(new Set());

  // Resume Synthesis states
  const [synthesizedBullets, setSynthesizedBullets] = useState<Record<string, string>>({});
  const [prioritizedSkills, setPrioritizedSkills] = useState<Record<string, string[]>>({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [attemptedSynthesis, setAttemptedSynthesis] = useState(false);

  // LaTeX Generation states
  const [latexCode, setLatexCode] = useState('');
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);
  const [generateLatexError, setGenerateLatexError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  // 1. Connection check and initial retrieval
  useEffect(() => {
    const runStartupChecks = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        setBackendData(data);
        setConnection('connected');
        await fetchProfile();
      } catch (error) {
        console.error('Failed backend startup verification:', error);
        setConnection('disconnected');
      }
    };
    runStartupChecks();
  }, []);

  // Fetch relational details whenever profile loads/changes
  useEffect(() => {
    if (profile?.id) {
      fetchEducation(profile.id);
      fetchExperience(profile.id);
      fetchProjects(profile.id);
      fetchHackathons(profile.id);
    } else {
      setEducationList([]);
      setExperienceList([]);
      setProjectList([]);
      setHackathonList([]);
    }
  }, [profile]);

  // --- API FETCH RUNNERS ---

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profile');
      if (response.status === 404) {
        setProfile(null);
        return;
      }
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setProfile(data);
      setProfileForm({
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        website: data.website || '',
        linkedin: data.linkedin || '',
        github: data.github || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEducation = async (profileId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/education/profile/${profileId}`);
      if (!response.ok) throw new Error('Failed to load education');
      const data = await response.json();
      setEducationList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExperience = async (profileId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/work-experience/profile/${profileId}`);
      if (!response.ok) throw new Error('Failed to load experiences');
      const data = await response.json();
      setExperienceList(data);
      // Fetch linked facts for each experience
      data.forEach((exp: WorkExperience) => fetchFactsForParent(exp.id, 'work-experience'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async (profileId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/project/profile/${profileId}`);
      if (!response.ok) throw new Error('Failed to load projects');
      const data = await response.json();
      setProjectList(data);
      // Fetch linked facts for each project
      data.forEach((proj: Project) => fetchFactsForParent(proj.id, 'project'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHackathons = async (profileId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/hackathon/profile/${profileId}`);
      if (!response.ok) throw new Error('Failed to load hackathons');
      const data = await response.json();
      setHackathonList(data);
      // Fetch linked facts for each hackathon
      data.forEach((hack: Hackathon) => fetchFactsForParent(hack.id, 'hackathon'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFactsForParent = async (parentId: string, parentType: 'work-experience' | 'project' | 'hackathon') => {
    try {
      const response = await fetch(`http://localhost:8000/api/fact/${parentType}/${parentId}`);
      if (!response.ok) throw new Error(`Failed to load facts for ${parentType}`);
      const data = await response.json();
      if (parentType === 'work-experience') {
        setExperienceFacts(prev => ({ ...prev, [parentId]: data }));
      } else if (parentType === 'project') {
        setProjectFacts(prev => ({ ...prev, [parentId]: data }));
      } else if (parentType === 'hackathon') {
        setHackathonFacts(prev => ({ ...prev, [parentId]: data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- AI EXTRACTION HANDLER ---

  const handleExtractFacts = async (rawText: string) => {
    if (!rawText.trim()) {
      alert("Please enter a description paragraph first.");
      return;
    }
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const response = await fetch('http://localhost:8000/api/fact/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_description: rawText })
      });
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Extraction endpoint error');
      }
      const data = await response.json();
      setDraftFacts(data);
    } catch (err: any) {
      setExtractionError(err.message || 'AI extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  // --- RELEVANCE RANKING HANDLER ---

  const handleCalculateRankings = async () => {
    setAttemptedRanking(true);
    if (!jobDescription.trim() || !companyContext.trim()) {
      return;
    }
    setIsRanking(true);
    setRankingError(null);

    // Collect all facts currently loaded in local state
    const allFacts = [
      ...Object.values(experienceFacts).flat(),
      ...Object.values(projectFacts).flat(),
      ...Object.values(hackathonFacts).flat()
    ].filter(f => f && f.id);

    try {
      const response = await fetch('http://localhost:8000/api/fact/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facts: allFacts,
          job_description: jobDescription,
          company_context: companyContext
        })
      });
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Ranking endpoint failed');
      }
      const data = await response.json();
      setRankingResults(data);
      // Auto-select top 10 facts by default
      const sortedByScore = [...data]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setSelectedFactIds(new Set(sortedByScore.map(r => r.fact.id).filter(Boolean)));
    } catch (err: any) {
      setRankingError(err.message || 'Relevance ranking failed.');
    } finally {
      setIsRanking(false);
    }
  };

  // --- CONTENT BUDGET SELECTION HANDLERS ---

  const handleToggleFactSelection = (factId: string) => {
    setSelectedFactIds(prev => {
      const next = new Set(prev);
      if (next.has(factId)) {
        next.delete(factId);
      } else {
        next.add(factId);
      }
      return next;
    });
  };

  const handleSelectTop10 = () => {
    const sortedByScore = [...rankingResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setSelectedFactIds(new Set(sortedByScore.map(r => r.fact.id).filter(Boolean)));
  };

  const handleProceedToSynthesis = async () => {
    if (selectedFactIds.size === 0 || selectedFactIds.size > 10) return;
    setIsSynthesizing(true);
    setSynthesisError(null);
    setAttemptedSynthesis(true);

    try {
      const response = await fetch('http://localhost:8000/api/resume/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_fact_ids: Array.from(selectedFactIds),
          job_description: jobDescription,
          company_context: companyContext
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Resume synthesis failed');
      }

      const data = await response.json();
      
      const mapping: Record<string, string> = {};
      if (data.bullets) {
        data.bullets.forEach((b: any) => {
          mapping[b.fact_id] = b.synthesized_bullet;
        });
      }
      setSynthesizedBullets(mapping);
      setPrioritizedSkills(data.skills || {});
    } catch (err: any) {
      setSynthesisError(err.message || 'Synthesis failed.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleGenerateLaTeX = async () => {
    setIsGeneratingLatex(true);
    setGenerateLatexError(null);
    setSaveWarning(null);
    try {
      const response = await fetch('http://localhost:8000/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_fact_ids: Array.from(selectedFactIds),
          synthesized_bullets: synthesizedBullets,
          prioritized_skills: prioritizedSkills,
          company_name: companyContext || 'Unknown Company',
          job_role: jobDescription ? jobDescription.slice(0, 50) : 'Tailored Role'
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'LaTeX generation failed');
      }

      const data = await response.json();
      setLatexCode(data.latex_code || '');
      if (data.save_warning) {
        setSaveWarning(data.save_warning);
      }
    } catch (err: any) {
      setGenerateLatexError(err.message || 'Failed to generate LaTeX resume.');
    } finally {
      setIsGeneratingLatex(false);
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- DRAFT CHECKLIST CRUD METHODS ---

  const handleEditDraftFact = (index: number, field: keyof AtomicFactCreate, value: string) => {
    const updated = [...draftFacts];
    if (field === 'skills') {
      updated[index].skills = value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      updated[index][field] = value === "" ? null : (value as any);
    }
    setDraftFacts(updated);
  };

  const handleDeleteDraftFact = (index: number) => {
    setDraftFacts(draftFacts.filter((_, i) => i !== index));
  };

  const handleAddDraftFact = () => {
    setDraftFacts([...draftFacts, { action: 'Accomplished X task', metric_result: '', skills: [] }]);
  };

  const handleSaveFactsForParent = async (parentId: string, parentType: 'work_experience_id' | 'project_id' | 'hackathon_id') => {
    const savePromises = draftFacts.map(fact => {
      const payload = { ...fact, [parentType]: parentId };
      return fetch('http://localhost:8000/api/fact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    });
    await Promise.all(savePromises);
  };

  // --- CRUD SUBMIT & SAVE CONTROLLERS ---

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveProfileError(null);
    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (!response.ok) throw new Error('Failed to save profile details.');
      const data = await response.json();
      setProfile(data);
      alert('Profile details saved successfully!');
    } catch (err: any) {
      setSaveProfileError(err.message || 'An error occurred.');
    }
  };

  const handleSaveEducation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveEduError(null);
    if (!profile?.id) return;
    try {
      const payload = { ...educationForm, profile_id: profile.id };
      const url = editingEduId 
        ? `http://localhost:8000/api/education/${editingEduId}` 
        : 'http://localhost:8000/api/education';
      const method = editingEduId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save education record.');
      
      await fetchEducation(profile.id);
      setEducationForm({ institution: '', location: '', degree: '', major: '', start_date: '', graduation_date: '', gpa: '' });
      setEditingEduId(null);
    } catch (err: any) {
      setSaveEduError(err.message || 'Error occurred.');
    }
  };

  const handleSaveExperience = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveExpError(null);
    if (!profile?.id) return;
    try {
      const payload = { ...experienceForm, profile_id: profile.id };
      const url = editingExpId 
        ? `http://localhost:8000/api/work-experience/${editingExpId}` 
        : 'http://localhost:8000/api/work-experience';
      const method = editingExpId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save experience record.');
      const savedExp = await response.json();

      if (!editingExpId) {
        // Commit verified atomic facts linking to this experience
        await handleSaveFactsForParent(savedExp.id, 'work_experience_id');
      }

      await fetchExperience(profile.id);
      setExperienceForm({ employer: '', role: '', location: '', start_date: '', end_date: '', description: '' });
      setDraftFacts([]);
      setEditingExpId(null);
      alert(editingExpId ? 'Work experience updated!' : 'Work experience and extracted facts saved to Vault!');
    } catch (err: any) {
      setSaveExpError(err.message || 'Error occurred.');
    }
  };

  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveProjError(null);
    if (!profile?.id) return;
    try {
      const payload = { ...projectForm, profile_id: profile.id };
      const url = editingProjId 
        ? `http://localhost:8000/api/project/${editingProjId}` 
        : 'http://localhost:8000/api/project';
      const method = editingProjId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save project record.');
      const savedProj = await response.json();

      if (!editingProjId) {
        // Commit verified atomic facts linking to this project
        await handleSaveFactsForParent(savedProj.id, 'project_id');
      }

      await fetchProjects(profile.id);
      setProjectForm({ name: '', description: '', start_date: '', end_date: '', url: '' });
      setDraftFacts([]);
      setEditingProjId(null);
      alert(editingProjId ? 'Project updated!' : 'Project and extracted facts saved to Vault!');
    } catch (err: any) {
      setSaveProjError(err.message || 'Error occurred.');
    }
  };

  const handleSaveHackathon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveHackError(null);
    if (!profile?.id) return;
    try {
      const payload = { ...hackathonForm, profile_id: profile.id };
      const url = editingHackId 
        ? `http://localhost:8000/api/hackathon/${editingHackId}` 
        : 'http://localhost:8000/api/hackathon';
      const method = editingHackId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save hackathon record.');
      const savedHack = await response.json();

      if (!editingHackId) {
        // Commit verified atomic facts linking to this hackathon
        await handleSaveFactsForParent(savedHack.id, 'hackathon_id');
      }

      await fetchHackathons(profile.id);
      setHackathonForm({ name: '', organization: '', date: '', role_placement: '', description: '' });
      setDraftFacts([]);
      setEditingHackId(null);
      alert(editingHackId ? 'Hackathon/award updated!' : 'Hackathon and extracted facts saved to Vault!');
    } catch (err: any) {
      setSaveHackError(err.message || 'Error occurred.');
    }
  };

  // --- DELETE & EDIT ROUTINES ---

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/education/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchEducation(profile.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience and all linked facts?')) return;
    try {
      // First delete associated facts
      const facts = experienceFacts[id] || [];
      const deleteFactPromises = facts.map(f => fetch(`http://localhost:8000/api/fact/${f.id}`, { method: 'DELETE' }));
      await Promise.all(deleteFactPromises);

      const response = await fetch(`http://localhost:8000/api/work-experience/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchExperience(profile.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project and all linked facts?')) return;
    try {
      // First delete associated facts
      const facts = projectFacts[id] || [];
      const deleteFactPromises = facts.map(f => fetch(`http://localhost:8000/api/fact/${f.id}`, { method: 'DELETE' }));
      await Promise.all(deleteFactPromises);

      const response = await fetch(`http://localhost:8000/api/project/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchProjects(profile.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHackathon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hackathon entry and all linked facts?')) return;
    try {
      // First delete associated facts
      const facts = hackathonFacts[id] || [];
      const deleteFactPromises = facts.map(f => fetch(`http://localhost:8000/api/fact/${f.id}`, { method: 'DELETE' }));
      await Promise.all(deleteFactPromises);

      const response = await fetch(`http://localhost:8000/api/hackathon/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchHackathons(profile.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePersistentFact = async (factId: string, parentId: string, parentType: 'work-experience' | 'project' | 'hackathon') => {
    if (!confirm('Delete this structured accomplishment fact permanently?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/fact/${factId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete fact.');
      await fetchFactsForParent(parentId, parentType);
    } catch (err) {
      console.error(err);
    }
  };

  const getParentName = (fact: any) => {
    if (fact.work_experience_id) {
      const exp = experienceList.find(e => e.id === fact.work_experience_id);
      return exp ? `Experience: ${exp.employer} (${exp.role})` : 'Work Experience';
    }
    if (fact.project_id) {
      const proj = projectList.find(p => p.id === fact.project_id);
      return proj ? `Project: ${proj.name}` : 'Project';
    }
    if (fact.hackathon_id) {
      const hack = hackathonList.find(h => h.id === fact.hackathon_id);
      return hack ? `Hackathon: ${hack.name}` : 'Hackathon';
    }
    return 'General Vault Fact';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <svg className="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
          <h1>Career Intelligence System</h1>
        </div>
        <div className="status-badge-container">
          {connection === 'checking' && (
            <span className="badge checking">
              <span className="pulse-dot"></span> Checking API Connection...
            </span>
          )}
          {connection === 'connected' && (
            <span className="badge connected">
              <span className="pulse-dot"></span> Connected (v{backendData?.version})
            </span>
          )}
          {connection === 'disconnected' && (
            <span className="badge disconnected">
              <span className="pulse-dot"></span> API Offline
            </span>
          )}
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <button onClick={() => setActiveTab('overview')} className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}>
            Overview
          </button>
          <button onClick={() => setActiveTab('profile')} className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}>
            Demographics
          </button>
          <button onClick={() => setActiveTab('education')} className={`sidebar-btn ${activeTab === 'education' ? 'active' : ''}`} disabled={!profile} title={!profile ? "Create Profile first" : ""}>
            Education
          </button>
          <button onClick={() => setActiveTab('experience')} className={`sidebar-btn ${activeTab === 'experience' ? 'active' : ''}`} disabled={!profile} title={!profile ? "Create Profile first" : ""}>
            Work Experiences
          </button>
          <button onClick={() => setActiveTab('projects')} className={`sidebar-btn ${activeTab === 'projects' ? 'active' : ''}`} disabled={!profile} title={!profile ? "Create Profile first" : ""}>
            Projects Vault
          </button>
          <button onClick={() => setActiveTab('hackathons')} className={`sidebar-btn ${activeTab === 'hackathons' ? 'active' : ''}`} disabled={!profile} title={!profile ? "Create Profile first" : ""}>
            Hackathons & Awards
          </button>
          <button onClick={() => setActiveTab('tailor')} className={`sidebar-btn ${activeTab === 'tailor' ? 'active' : ''}`} disabled={!profile} title={!profile ? "Create Profile first" : ""}>
            Resume Tailoring Workspace
          </button>
        </aside>

        <main className="main-panel">
          {activeTab === 'overview' && (
            <section className="tab-panel">
              <div className="intro-card">
                <h2>Welcome to your Career Vault</h2>
                <p>
                  This is a private, local-first workspace. Log details regarding your employment, projects, and awards. 
                  Use our built-in Gemini extraction tool to structure descriptions into verified Accomplishment facts.
                </p>
                <div className="vault-status-summary">
                  <div className="status-item">
                    <span className="label">Database Type</span>
                    <span className="value">SQLite (Serverless)</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Storage Location</span>
                    <span className="value">/backend/database.db</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Active Profile</span>
                    <span className="value">{profile ? profile.name : "None created yet"}</span>
                  </div>
                </div>
              </div>

              {connection === 'disconnected' && (
                <div className="alert-banner error">
                  <div className="alert-text">
                    <h3>Cannot connect to local backend API</h3>
                    <p>Verify that your Docker containers are healthy and running.</p>
                  </div>
                </div>
              )}
              {connection === 'connected' && (
                <div className="alert-banner success">
                  <div className="alert-text">
                    <h3>System verified and ready</h3>
                    <p>Successfully linked. Choose options from the left sidebar to manage credentials.</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="tab-panel">
              <h2>Candidate Demographics</h2>
              <p style={{ marginBottom: '24px' }}>Provide contact info mapping to resume headers.</p>
              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-name">Full Name *</label>
                    <input id="p-name" type="text" required className="form-control" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-email">Email Address *</label>
                    <input id="p-email" type="email" required className="form-control" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-phone">Phone Number *</label>
                    <input id="p-phone" type="text" required className="form-control" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-location">Location *</label>
                    <input id="p-location" type="text" required className="form-control" value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="p-website">Personal Website / Portfolio</label>
                  <input id="p-website" type="text" className="form-control" value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-linkedin">LinkedIn Profile</label>
                    <input id="p-linkedin" type="text" className="form-control" value={profileForm.linkedin} onChange={e => setProfileForm({ ...profileForm, linkedin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-github">GitHub Profile</label>
                    <input id="p-github" type="text" className="form-control" value={profileForm.github} onChange={e => setProfileForm({ ...profileForm, github: e.target.value })} />
                  </div>
                </div>
                {saveProfileError && <p style={{ color: '#dc2626' }}>{saveProfileError}</p>}
                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>Save Profile Details</button>
              </form>
            </section>
          )}

          {activeTab === 'education' && (
            <section className="tab-panel">
              <h2>Education Credentials</h2>
              <form onSubmit={handleSaveEducation}>
                <div className="form-row">
                  <div className="form-group">
                    <label>School / University *</label>
                    <input type="text" required className="form-control" value={educationForm.institution} onChange={e => setEducationForm({ ...educationForm, institution: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input type="text" required className="form-control" value={educationForm.location} onChange={e => setEducationForm({ ...educationForm, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Degree Type *</label>
                    <input type="text" required className="form-control" value={educationForm.degree} onChange={e => setEducationForm({ ...educationForm, degree: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Major *</label>
                    <input type="text" required className="form-control" value={educationForm.major} onChange={e => setEducationForm({ ...educationForm, major: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="text" required className="form-control" value={educationForm.start_date} onChange={e => setEducationForm({ ...educationForm, start_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Graduation Date *</label>
                    <input type="text" required className="form-control" value={educationForm.graduation_date} onChange={e => setEducationForm({ ...educationForm, graduation_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>GPA (Optional)</label>
                    <input type="text" className="form-control" value={educationForm.gpa} onChange={e => setEducationForm({ ...educationForm, gpa: e.target.value })} />
                  </div>
                </div>
                {saveEduError && <p style={{ color: '#dc2626' }}>{saveEduError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingEduId ? 'Save Changes' : 'Add Education Record'}</button>
                  {editingEduId && <button type="button" onClick={() => { setEditingEduId(null); setEducationForm({ institution: '', location: '', degree: '', major: '', start_date: '', graduation_date: '', gpa: '' }); }} className="btn btn-secondary">Cancel</button>}
                </div>
              </form>
              <div className="list-container">
                {educationList.map(edu => (
                  <div key={edu.id} className="card-item">
                    <div className="card-item-header">
                      <div className="card-item-title">
                        <h3>{edu.institution}</h3>
                        <p className="card-item-meta">{edu.degree} in {edu.major} &bull; {edu.location} &bull; {edu.start_date} - {edu.graduation_date} {edu.gpa ? `(GPA: ${edu.gpa})` : ''}</p>
                      </div>
                      <div className="card-item-actions">
                        <button onClick={() => { setEditingEduId(edu.id); setEducationForm({ institution: edu.institution, location: edu.location, degree: edu.degree, major: edu.major, start_date: edu.start_date, graduation_date: edu.graduation_date, gpa: edu.gpa || '' }); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                        <button onClick={() => handleDeleteEducation(edu.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'experience' && (
            <section className="tab-panel">
              <h2>Work Experiences</h2>
              <p>Log details of your employment periods and review/edit extracted AI accomplishments.</p>
              <form onSubmit={handleSaveExperience} style={{ marginTop: '24px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Employer / Organization *</label>
                    <input type="text" required className="form-control" value={experienceForm.employer} onChange={e => setExperienceForm({ ...experienceForm, employer: e.target.value })} placeholder="e.g. Google" />
                  </div>
                  <div className="form-group">
                    <label>Job Title / Role *</label>
                    <input type="text" required className="form-control" value={experienceForm.role} onChange={e => setExperienceForm({ ...experienceForm, role: e.target.value })} placeholder="e.g. Software Engineer" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location *</label>
                    <input type="text" required className="form-control" value={experienceForm.location} onChange={e => setExperienceForm({ ...experienceForm, location: e.target.value })} placeholder="e.g. Mountain View, CA" />
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="text" required className="form-control" value={experienceForm.start_date} onChange={e => setExperienceForm({ ...experienceForm, start_date: e.target.value })} placeholder="e.g. Jan 2021" />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="text" required className="form-control" value={experienceForm.end_date} onChange={e => setExperienceForm({ ...experienceForm, end_date: e.target.value })} placeholder="e.g. Present or Dec 2023" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Raw Achievements Description (Text Area) *</label>
                  <textarea required className="form-control" rows={5} value={experienceForm.description} onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })} placeholder="Paste raw description describing what you built and results achieved here..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                {!editingExpId && (
                  <div className="ai-actions-box" style={{ margin: '16px 0', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--accent)' }}>AI Fact Extraction Checklist</h3>
                    <p style={{ fontSize: '13px', margin: '0 0 12px 0', opacity: 0.8 }}>
                      Convert raw text into reusable, structured accomplishments before adding.
                    </p>
                    <button type="button" onClick={() => handleExtractFacts(experienceForm.description)} disabled={isExtracting} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {isExtracting ? (
                        <>
                          <span className="spinner"></span> Extracting with Gemini...
                        </>
                      ) : 'Extract Accomplishments (Gemini AI)'}
                    </button>
                    {extractionError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{extractionError}</p>}

                    {draftFacts.length > 0 && (
                      <div className="draft-checklist" style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Draft Accomplishments List:</h4>
                        {draftFacts.map((fact, index) => (
                          <div key={index} className="draft-fact-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="form-group" style={{ marginBottom: '6px' }}>
                              <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Action *</label>
                              <textarea
                                required
                                className="form-control"
                                style={{ padding: '6px', fontSize: '13px', resize: 'vertical', width: '100%', fontFamily: 'inherit', background: 'rgba(0, 0, 0, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}
                                rows={2}
                                value={fact.action}
                                onChange={e => handleEditDraftFact(index, 'action', e.target.value)}
                              />
                            </div>
                            <div className="form-row" style={{ gap: '8px', marginBottom: '6px' }}>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Metric / Result (Optional)</label>
                                <input type="text" className="form-control" style={{ padding: '6px', fontSize: '13px' }} value={fact.metric_result || ''} onChange={e => handleEditDraftFact(index, 'metric_result', e.target.value)} />
                              </div>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Skills (Comma Separated)</label>
                                <input type="text" className="form-control" style={{ padding: '6px', fontSize: '13px' }} value={fact.skills.join(', ')} onChange={e => handleEditDraftFact(index, 'skills', e.target.value)} />
                              </div>
                            </div>
                            <button type="button" onClick={() => handleDeleteDraftFact(index)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }}>Exclude</button>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddDraftFact} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginTop: '4px' }}>+ Add Manual Accomplishment</button>
                      </div>
                    )}
                  </div>
                )}

                {saveExpError && <p style={{ color: '#dc2626' }}>{saveExpError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingExpId ? 'Save Changes' : 'Save Work Experience to Vault'}</button>
                  {editingExpId && <button type="button" onClick={() => { setEditingExpId(null); setExperienceForm({ employer: '', role: '', location: '', start_date: '', end_date: '', description: '' }); }} className="btn btn-secondary">Cancel</button>}
                </div>
              </form>

              <div className="list-container">
                {experienceList.map(exp => (
                  <div key={exp.id} className="card-item">
                    <div className="card-item-header">
                      <div className="card-item-title">
                        <h3>{exp.employer}</h3>
                        <p className="card-item-meta">{exp.role} &bull; {exp.location} &bull; {exp.start_date} - {exp.end_date}</p>
                      </div>
                      <div className="card-item-actions">
                        <button onClick={() => { setEditingExpId(exp.id); setExperienceForm({ employer: exp.employer, role: exp.role, location: exp.location, start_date: exp.start_date, end_date: exp.end_date, description: exp.description }); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                        <button onClick={() => handleDeleteExperience(exp.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>Delete</button>
                      </div>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-h)', opacity: 0.8 }}>{exp.description}</p>
                    
                    {/* Render Linked Atomic Facts */}
                    <div className="linked-facts-box" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <h4 style={{ fontSize: '13px', margin: '0 0 6px 0', color: 'var(--accent)' }}>Structured Accomplishments</h4>
                      {(experienceFacts[exp.id] || []).length === 0 ? (
                        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>No verified accomplishments linked yet. Edit or re-ingest to run Gemini extraction.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                          {(experienceFacts[exp.id] || []).map(fact => (
                            <li key={fact.id} style={{ marginBottom: '6px' }}>
                              <strong>{fact.action}</strong> {fact.metric_result ? `(${fact.metric_result})` : ''} 
                              {fact.skills.length > 0 && (
                                <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '6px' }}>
                                  {fact.skills.map(s => <span key={s} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>{s}</span>)}
                                </div>
                              )}
                              <button onClick={() => handleDeletePersistentFact(fact.id, exp.id, 'work-experience')} style={{ border: 'none', background: 'none', color: '#f87171', padding: '0 4px', fontSize: '11px', cursor: 'pointer', marginLeft: '8px' }}>&times;</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'projects' && (
            <section className="tab-panel">
              <h2>Projects Vault</h2>
              <p>Log details of independent/side projects and review/edit extracted AI accomplishments.</p>
              <form onSubmit={handleSaveProject} style={{ marginTop: '24px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Project Name *</label>
                    <input type="text" required className="form-control" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="e.g. Career Intelligence System" />
                  </div>
                  <div className="form-group">
                    <label>Project URL (Optional)</label>
                    <input type="text" className="form-control" value={projectForm.url} onChange={e => setProjectForm({ ...projectForm, url: e.target.value })} placeholder="e.g. https://github.com/user/project" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="text" required className="form-control" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} placeholder="e.g. 2024-01" />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="text" required className="form-control" value={projectForm.end_date} onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })} placeholder="e.g. 2024-03" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Raw Project Scope & Achievements *</label>
                  <textarea required className="form-control" rows={5} value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Paste raw description of what the project does..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                {!editingProjId && (
                  <div className="ai-actions-box" style={{ margin: '16px 0', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--accent)' }}>AI Fact Extraction Checklist</h3>
                    <p style={{ fontSize: '13px', margin: '0 0 12px 0', opacity: 0.8 }}>
                      Convert raw text into reusable, structured accomplishments before adding.
                    </p>
                    <button type="button" onClick={() => handleExtractFacts(projectForm.description)} disabled={isExtracting} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {isExtracting ? (
                        <>
                          <span className="spinner"></span> Extracting with Gemini...
                        </>
                      ) : 'Extract Accomplishments (Gemini AI)'}
                    </button>
                    {extractionError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{extractionError}</p>}

                    {draftFacts.length > 0 && (
                      <div className="draft-checklist" style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Draft Accomplishments List:</h4>
                        {draftFacts.map((fact, index) => (
                          <div key={index} className="draft-fact-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="form-group" style={{ marginBottom: '6px' }}>
                              <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Action *</label>
                              <textarea
                                required
                                className="form-control"
                                style={{ padding: '6px', fontSize: '13px', resize: 'vertical', width: '100%', fontFamily: 'inherit', background: 'rgba(0, 0, 0, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}
                                rows={2}
                                value={fact.action}
                                onChange={e => handleEditDraftFact(index, 'action', e.target.value)}
                              />
                            </div>
                            <div className="form-row" style={{ gap: '8px', marginBottom: '6px' }}>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Metric / Result (Optional)</label>
                                <input type="text" className="form-control" style={{ padding: '6px', fontSize: '13px' }} value={fact.metric_result || ''} onChange={e => handleEditDraftFact(index, 'metric_result', e.target.value)} />
                              </div>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Skills (Comma Separated)</label>
                                <input type="text" className="form-control" style={{ padding: '6px', fontSize: '13px' }} value={fact.skills.join(', ')} onChange={e => handleEditDraftFact(index, 'skills', e.target.value)} />
                              </div>
                            </div>
                            <button type="button" onClick={() => handleDeleteDraftFact(index)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }}>Exclude</button>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddDraftFact} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginTop: '4px' }}>+ Add Manual Accomplishment</button>
                      </div>
                    )}
                  </div>
                )}

                {saveProjError && <p style={{ color: '#dc2626' }}>{saveProjError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingProjId ? 'Save Changes' : 'Save Project to Vault'}</button>
                  {editingProjId && <button type="button" onClick={() => { setEditingProjId(null); setProjectForm({ name: '', description: '', start_date: '', end_date: '', url: '' }); }} className="btn btn-secondary">Cancel</button>}
                </div>
              </form>

              <div className="list-container">
                {projectList.map(proj => (
                  <div key={proj.id} className="card-item">
                    <div className="card-item-header">
                      <div className="card-item-title">
                        <h3>{proj.name}</h3>
                        <p className="card-item-meta">{proj.start_date} - {proj.end_date} {proj.url ? `| Link: ${proj.url}` : ''}</p>
                      </div>
                      <div className="card-item-actions">
                        <button onClick={() => { setEditingProjId(proj.id); setProjectForm({ name: proj.name, description: proj.description, start_date: proj.start_date, end_date: proj.end_date, url: proj.url || '' }); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>Delete</button>
                      </div>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-h)', opacity: 0.8 }}>{proj.description}</p>
                    
                    {/* Render Linked Atomic Facts */}
                    <div className="linked-facts-box" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <h4 style={{ fontSize: '13px', margin: '0 0 6px 0', color: 'var(--accent)' }}>Structured Accomplishments</h4>
                      {(projectFacts[proj.id] || []).length === 0 ? (
                        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>No verified accomplishments linked yet. Edit or re-ingest to run Gemini extraction.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                          {(projectFacts[proj.id] || []).map(fact => (
                            <li key={fact.id} style={{ marginBottom: '6px' }}>
                              <strong>{fact.action}</strong> {fact.metric_result ? `(${fact.metric_result})` : ''} 
                              {fact.skills.length > 0 && (
                                <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '6px' }}>
                                  {fact.skills.map(s => <span key={s} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>{s}</span>)}
                                </div>
                              )}
                              <button onClick={() => handleDeletePersistentFact(fact.id, proj.id, 'project')} style={{ border: 'none', background: 'none', color: '#f87171', padding: '0 4px', fontSize: '11px', cursor: 'pointer', marginLeft: '8px' }}>&times;</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'hackathons' && (
            <section className="tab-panel">
              <h2>Hackathons & Awards</h2>
              <p>Log details of competitions/hackathons and review/edit extracted AI accomplishments.</p>
              <form onSubmit={handleSaveHackathon} style={{ marginTop: '24px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Name *</label>
                    <input type="text" required className="form-control" value={hackathonForm.name} onChange={e => setHackathonForm({ ...hackathonForm, name: e.target.value })} placeholder="e.g. MIT Hackathon 2024" />
                  </div>
                  <div className="form-group">
                    <label>Hosting Organization *</label>
                    <input type="text" required className="form-control" value={hackathonForm.organization} onChange={e => setHackathonForm({ ...hackathonForm, organization: e.target.value })} placeholder="e.g. MIT" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Placement / Role *</label>
                    <input type="text" required className="form-control" value={hackathonForm.role_placement} onChange={e => setHackathonForm({ ...hackathonForm, role_placement: e.target.value })} placeholder="e.g. 1st Place, Participant" />
                  </div>
                  <div className="form-group">
                    <label>Completion Date *</label>
                    <input type="text" required className="form-control" value={hackathonForm.date} onChange={e => setHackathonForm({ ...hackathonForm, date: e.target.value })} placeholder="e.g. Feb 2024" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Raw Accomplishments & Tech Stack *</label>
                  <textarea required className="form-control" rows={5} value={hackathonForm.description} onChange={e => setHackathonForm({ ...hackathonForm, description: e.target.value })} placeholder="Describe what you built in the hackathon..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                {!editingHackId && (
                  <div className="ai-actions-box" style={{ margin: '16px 0', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--accent)' }}>AI Fact Extraction Checklist</h3>
                    <p style={{ fontSize: '13px', margin: '0 0 12px 0', opacity: 0.8 }}>
                      Convert raw text into reusable, structured accomplishments before adding.
                    </p>
                    <button type="button" onClick={() => handleExtractFacts(hackathonForm.description)} disabled={isExtracting} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {isExtracting ? (
                        <>
                          <span className="spinner"></span> Extracting with Gemini...
                        </>
                      ) : 'Extract Accomplishments (Gemini AI)'}
                    </button>
                    {extractionError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{extractionError}</p>}

                    {draftFacts.length > 0 && (
                      <div className="draft-checklist" style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Draft Accomplishments List:</h4>
                        {draftFacts.map((fact, index) => (
                          <div key={index} className="draft-fact-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="form-group" style={{ marginBottom: '6px' }}>
                              <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Action *</label>
                              <textarea
                                required
                                className="form-control"
                                style={{ padding: '6px', fontSize: '13px', resize: 'vertical', width: '100%', fontFamily: 'inherit', background: 'rgba(0, 0, 0, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}
                                rows={2}
                                value={fact.action}
                                onChange={e => handleEditDraftFact(index, 'action', e.target.value)}
                              />
                            </div>
                            <div className="form-row" style={{ gap: '8px', marginBottom: '6px' }}>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Metric / Result (Optional)</label>
                                <input type="text" className="form-control" style={{ padding: '6px', fontSize: '13px' }} value={fact.metric_result || ''} onChange={e => handleEditDraftFact(index, 'metric_result', e.target.value)} />
                              </div>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>Skills (Comma Separated)</label>
                                <input type="text" className="form-control" style={{ padding: '6px', fontSize: '13px' }} value={fact.skills.join(', ')} onChange={e => handleEditDraftFact(index, 'skills', e.target.value)} />
                              </div>
                            </div>
                            <button type="button" onClick={() => handleDeleteDraftFact(index)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }}>Exclude</button>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddDraftFact} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginTop: '4px' }}>+ Add Manual Accomplishment</button>
                      </div>
                    )}
                  </div>
                )}

                {saveHackError && <p style={{ color: '#dc2626' }}>{saveHackError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingHackId ? 'Save Changes' : 'Save Hackathon to Vault'}</button>
                  {editingHackId && <button type="button" onClick={() => { setEditingHackId(null); setHackathonForm({ name: '', organization: '', date: '', role_placement: '', description: '' }); }} className="btn btn-secondary">Cancel</button>}
                </div>
              </form>

              <div className="list-container">
                {hackathonList.map(hack => (
                  <div key={hack.id} className="card-item">
                    <div className="card-item-header">
                      <div className="card-item-title">
                        <h3>{hack.name}</h3>
                        <p className="card-item-meta">{hack.role_placement} &bull; {hack.organization} &bull; {hack.date}</p>
                      </div>
                      <div className="card-item-actions">
                        <button onClick={() => { setEditingHackId(hack.id); setHackathonForm({ name: hack.name, organization: hack.organization, date: hack.date, role_placement: hack.role_placement, description: hack.description }); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                        <button onClick={() => handleDeleteHackathon(hack.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>Delete</button>
                      </div>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-h)', opacity: 0.8 }}>{hack.description}</p>
                    
                    {/* Render Linked Atomic Facts */}
                    <div className="linked-facts-box" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <h4 style={{ fontSize: '13px', margin: '0 0 6px 0', color: 'var(--accent)' }}>Structured Accomplishments</h4>
                      {(hackathonFacts[hack.id] || []).length === 0 ? (
                        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>No verified accomplishments linked yet. Edit or re-ingest to run Gemini extraction.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                          {(hackathonFacts[hack.id] || []).map(fact => (
                            <li key={fact.id} style={{ marginBottom: '6px' }}>
                              <strong>{fact.action}</strong> {fact.metric_result ? `(${fact.metric_result})` : ''} 
                              {fact.skills.length > 0 && (
                                <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '6px' }}>
                                  {fact.skills.map(s => <span key={s} style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>{s}</span>)}
                                </div>
                              )}
                              <button onClick={() => handleDeletePersistentFact(fact.id, hack.id, 'hackathon')} style={{ border: 'none', background: 'none', color: '#f87171', padding: '0 4px', fontSize: '11px', cursor: 'pointer', marginLeft: '8px' }}>&times;</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'tailor' && (
            <section className="tab-panel">
              <div className="workspace-header" style={{ marginBottom: '24px' }}>
                <h2>Resume Tailoring Workspace</h2>
                <p style={{ opacity: 0.8 }}>
                  Input a target Job Description and Company Context to rank and sort accomplishments by relevance metrics.
                </p>
              </div>

              <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Inputs Panel */}
                <div className="card-item" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    Target Job Specification
                  </h3>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="companyNameInput" style={{ display: 'block', fontSize: '13px', marginBottom: '6px', opacity: 0.8 }}>
                      Company Name / Context <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="companyNameInput"
                      type="text"
                      className={`form-input ${attemptedRanking && !companyContext.trim() ? 'validation-highlight' : ''}`}
                      placeholder="e.g. Acme Tech Corporation"
                      value={companyContext}
                      onChange={(e) => setCompanyContext(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: attemptedRanking && !companyContext.trim() ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                    {attemptedRanking && !companyContext.trim() && (
                      <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                        Company Name / Context is required before ranking.
                      </p>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="jdTextArea" style={{ display: 'block', fontSize: '13px', marginBottom: '6px', opacity: 0.8 }}>
                      Job Description Text <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      id="jdTextArea"
                      className={`form-input ${attemptedRanking && !jobDescription.trim() ? 'validation-highlight' : ''}`}
                      rows={12}
                      placeholder="Paste the full job description or core specifications here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: attemptedRanking && !jobDescription.trim() ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: 'white',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    {attemptedRanking && !jobDescription.trim() && (
                      <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                        Job Description is required before ranking.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleCalculateRankings}
                    className="btn btn-primary"
                    disabled={isRanking}
                    style={{ width: '100%', padding: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isRanking ? (
                      <>
                        <span className="spinner"></span> Analyzing & Scoring Relevance...
                      </>
                    ) : 'Calculate Relevance Rankings'}
                  </button>

                  {rankingError && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171', fontSize: '13px' }}>
                      {rankingError}
                    </div>
                  )}
                </div>

                {/* Scored Results Panel */}
                <div className="card-item" style={{ padding: '24px', minHeight: '400px' }}>
                  <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    Ranked Achievements
                  </h3>

                  {rankingResults.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', opacity: 0.6, textAlign: 'center' }}>
                      <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" style={{ marginBottom: '12px' }}>
                        <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V11" />
                      </svg>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        No rankings calculated yet. Enter a job description and company context on the left to score accomplishments.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Content Budget Tracker Widget */}
                      <div className="budget-tracker-box" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'white' }}>
                            Allocated Accomplishments: <strong style={{ color: selectedFactIds.size > 10 ? '#ef4444' : '#c084fc', fontSize: '14px' }}>{selectedFactIds.size} / 10</strong>
                          </span>
                          <button
                            type="button"
                            onClick={handleSelectTop10}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Select Top 10 by Relevance
                          </button>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                          <div style={{
                            width: `${Math.min((selectedFactIds.size / 10) * 100, 100)}%`,
                            height: '100%',
                            background: selectedFactIds.size > 10 ? '#ef4444' : 'var(--accent)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease, background-color 0.3s ease'
                          }}></div>
                        </div>

                        {selectedFactIds.size > 10 && (
                          <div style={{ color: '#f87171', fontSize: '11.5px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '4px', padding: '8px' }}>
                            <span>⚠️ <strong>Budget Exceeded!</strong> Single-page compilation threshold exceeded. Please deselect some achievements.</span>
                          </div>
                        )}
                        {selectedFactIds.size === 0 && (
                          <div style={{ color: '#9ca3af', fontSize: '11.5px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '4px', padding: '8px' }}>
                            <span>Select at least 1 accomplishment to begin tailoring.</span>
                          </div>
                        )}
                      </div>

                      {/* Debug Matching Keyword Log */}
                      <div className="debug-keyword-log" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
                          Debug Matching Keyword Log
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Array.from(new Set(rankingResults.flatMap(r => r.matched_keywords || []))).length === 0 ? (
                            <span style={{ fontSize: '11px', opacity: 0.6 }}>No direct keyword intersections matched.</span>
                          ) : (
                            Array.from(new Set(rankingResults.flatMap(r => r.matched_keywords || []))).map(keyword => (
                              <span key={keyword} style={{ background: 'rgba(134, 59, 255, 0.15)', border: '1px solid rgba(134, 59, 255, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#d8b4fe' }}>
                                {keyword}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Sorted List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rankingResults.map((result, idx) => {
                          const scorePercent = Math.round(result.score * 100);
                          let badgeColor = '#9ca3af'; // gray
                          let badgeBg = 'rgba(156, 163, 175, 0.1)';
                          if (result.score >= 0.7) {
                            badgeColor = '#4ade80'; // green
                            badgeBg = 'rgba(74, 222, 128, 0.1)';
                          } else if (result.score >= 0.3) {
                            badgeColor = '#fb923c'; // orange
                            badgeBg = 'rgba(251, 146, 60, 0.1)';
                          } else if (result.score > 0.0) {
                            badgeColor = '#f87171'; // red
                            badgeBg = 'rgba(248, 113, 113, 0.1)';
                          }

                          return (
                            <div
                              key={idx}
                              className={`card-item fact-selection-card ${selectedFactIds.has(result.fact.id) ? 'selected' : ''}`}
                              onClick={() => handleToggleFactSelection(result.fact.id)}
                              style={{
                                padding: '16px',
                                background: selectedFactIds.has(result.fact.id) ? 'rgba(170, 59, 255, 0.04)' : 'rgba(255,255,255,0.02)',
                                border: selectedFactIds.has(result.fact.id) ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                                textAlign: 'left'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedFactIds.has(result.fact.id)}
                                onChange={() => {}} // handled by wrapper container click
                                style={{ marginTop: '4px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.05em' }}>
                                    {getParentName(result.fact)}
                                  </span>
                                  <span style={{ color: badgeColor, background: badgeBg, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                    Match: {scorePercent}%
                                  </span>
                                </div>
                                <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'white', lineHeight: '1.4' }}>
                                  <strong>{result.fact.action}</strong>
                                  {result.fact.metric_result && ` (${result.fact.metric_result})`}
                                </p>
                                
                                {/* Match Keywords Cloud */}
                                {result.matched_keywords.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {result.matched_keywords.map((k: string) => (
                                      <span key={k} style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', color: '#a7f3d0', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                        {k}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Proceed to Generation Button */}
                      <button
                        type="button"
                        onClick={handleProceedToSynthesis}
                        className="btn btn-primary"
                        disabled={selectedFactIds.size === 0 || selectedFactIds.size > 10 || isSynthesizing}
                        style={{
                          width: '100%',
                          padding: '14px',
                          marginTop: '20px',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {isSynthesizing ? (
                          <>
                            <span className="spinner"></span> Synthesizing Tailored Accomplishments...
                          </>
                        ) : 'Proceed to Bullet Synthesis'}
                      </button>

                      {synthesisError && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171', fontSize: '13px' }}>
                          {synthesisError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Synthesized Preview Panel */}
              {attemptedSynthesis && Object.keys(synthesizedBullets).length > 0 && (
                <div className="card-item" style={{ marginTop: '24px', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--accent)', paddingBottom: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tailored Bullet Points Preview (STAR / Google XYZ Format)</span>
                    <span style={{ fontSize: '12px', color: '#a7f3d0', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>AI Customized</span>
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
                    
                    {/* Tailored Bullet List */}
                    <div>
                      <h4 style={{ color: 'var(--accent)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        Synthesized Accomplishments
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: 'white', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(synthesizedBullets).map(([factId, bulletText]) => (
                          <li key={factId} style={{ lineHeight: '1.5' }}>
                            {bulletText}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prioritized Skills Directory */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ color: 'var(--accent)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        Prioritized Skills Categories (JD Aligned)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(prioritizedSkills).map(([category, skillsList]) => (
                          <div key={category} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                            <strong style={{ fontSize: '12.5px', color: '#d8b4fe', display: 'block', marginBottom: '4px' }}>
                              {category}
                            </strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {skillsList.map((skill: string) => (
                                <span key={skill} style={{ background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.2)', color: '#e9d5ff', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* LaTeX Generation & Copy Export Section */}
              {attemptedSynthesis && Object.keys(synthesizedBullets).length > 0 && (
                <div className="card-item" style={{ marginTop: '24px', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--accent)', paddingBottom: '8px', color: 'white' }}>
                    LaTeX Resume Document Export
                  </h3>
                  <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '16px' }}>
                    Inject the synthesized accomplishments and prioritized skills categories into the professional Jake's Resume LaTeX template.
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateLaTeX}
                    className="btn btn-primary"
                    disabled={isGeneratingLatex}
                    style={{
                      padding: '12px 24px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isGeneratingLatex ? (
                      <>
                        <span className="spinner"></span> Generating LaTeX Code...
                      </>
                    ) : 'Generate LaTeX Resume Source'}
                  </button>

                  {generateLatexError && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171', fontSize: '13px' }}>
                      {generateLatexError}
                    </div>
                  )}

                  {saveWarning && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '6px', color: '#fb923c', fontSize: '13px', lineHeight: '1.4' }}>
                      <strong>[!WARNING]</strong> {saveWarning}
                    </div>
                  )}

                  {latexCode && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#d8b4fe', fontWeight: 'bold' }}>
                          jakes_resume.tex (LaTeX Source)
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyClipboard}
                          className="btn"
                          style={{
                            background: copied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(134, 59, 255, 0.15)',
                            border: copied ? '1px solid #4ade80' : '1px solid var(--accent)',
                            color: copied ? '#4ade80' : 'white',
                            padding: '6px 12px',
                            fontSize: '12.5px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={latexCode}
                        rows={16}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '12px',
                          color: '#c084fc',
                          fontFamily: 'monospace',
                          fontSize: '12.5px',
                          lineHeight: '1.5',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <footer className="dashboard-footer">
        <p>Local-First Career Intelligence System V1 &bull; Ported securely on 127.0.0.1</p>
      </footer>
    </div>
  );
}

export default App;
