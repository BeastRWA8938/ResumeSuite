import { useState, useEffect, FormEvent } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'education' | 'experience' | 'projects' | 'hackathons'>('overview');
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
    } catch (err) {
      console.error(err);
    }
  };

  // --- SUBMIT & SAVE HANDLERS ---

  const handleSaveProfile = async (e: FormEvent) => {
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

  const handleSaveEducation = async (e: FormEvent) => {
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

  const handleSaveExperience = async (e: FormEvent) => {
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

      await fetchExperience(profile.id);
      setExperienceForm({ employer: '', role: '', location: '', start_date: '', end_date: '', description: '' });
      setEditingExpId(null);
      alert(editingExpId ? 'Work experience updated!' : 'Work experience added!');
    } catch (err: any) {
      setSaveExpError(err.message || 'Error occurred.');
    }
  };

  const handleSaveProject = async (e: FormEvent) => {
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

      await fetchProjects(profile.id);
      setProjectForm({ name: '', description: '', start_date: '', end_date: '', url: '' });
      setEditingProjId(null);
      alert(editingProjId ? 'Project updated!' : 'Project added!');
    } catch (err: any) {
      setSaveProjError(err.message || 'Error occurred.');
    }
  };

  const handleSaveHackathon = async (e: FormEvent) => {
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

      await fetchHackathons(profile.id);
      setHackathonForm({ name: '', organization: '', date: '', role_placement: '', description: '' });
      setEditingHackId(null);
      alert(editingHackId ? 'Hackathon/award updated!' : 'Hackathon/award added!');
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
    if (!confirm('Are you sure you want to delete this experience?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/work-experience/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchExperience(profile.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/project/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchProjects(profile.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHackathon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hackathon entry?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/hackathon/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete.');
      if (profile?.id) await fetchHackathons(profile.id);
    } catch (err) {
      console.error(err);
    }
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
        </aside>

        <main className="main-panel">
          {activeTab === 'overview' && (
            <section className="tab-panel">
              <div className="intro-card">
                <h2>Welcome to your Career Vault</h2>
                <p>
                  This is a private, local-first workspace. Log details regarding your employment, projects, and awards. 
                  In the next phase, we will feed these entries to the LLM backend to parse them into structured facts.
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
              <p>Log details of your employment periods and raw achievement summaries.</p>
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
                  <textarea required className="form-control" rows={5} value={experienceForm.description} onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })} placeholder="Paste raw description or paragraphs describing what you built, results you achieved, and skills used here..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {saveExpError && <p style={{ color: '#dc2626' }}>{saveExpError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingExpId ? 'Save Changes' : 'Add Experience Record'}</button>
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
                    <p style={{ margin: '8px 0 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-h)' }}>{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'projects' && (
            <section className="tab-panel">
              <h2>Projects Vault</h2>
              <p>Log details of independent/side projects and their raw descriptions.</p>
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
                  <textarea required className="form-control" rows={5} value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Paste raw description of what the project does, key technical choices, and metrics..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {saveProjError && <p style={{ color: '#dc2626' }}>{saveProjError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingProjId ? 'Save Changes' : 'Add Project'}</button>
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
                    <p style={{ margin: '8px 0 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-h)' }}>{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'hackathons' && (
            <section className="tab-panel">
              <h2>Hackathons & Awards</h2>
              <p>Log details of competitions, hackathons, and awards.</p>
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
                  <textarea required className="form-control" rows={5} value={hackathonForm.description} onChange={e => setHackathonForm({ ...hackathonForm, description: e.target.value })} placeholder="Describe what you built in the hackathon, your contribution, and the results..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {saveHackError && <p style={{ color: '#dc2626' }}>{saveHackError}</p>}
                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">{editingHackId ? 'Save Changes' : 'Add Hackathon'}</button>
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
                    <p style={{ margin: '8px 0 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-h)' }}>{hack.description}</p>
                  </div>
                ))}
              </div>
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
