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

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'education'>('overview');
  const [connection, setConnection] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendData, setBackendData] = useState<BackendHealth | null>(null);

  // Profile data and forms states
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

  // Education list and forms states
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

  // 1. Initial boot connection check and data retrieval
  useEffect(() => {
    const runStartupChecks = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        setBackendData(data);
        setConnection('connected');
        
        // Fetch existing profile
        await fetchProfile();
      } catch (error) {
        console.error('Failed backend startup verification:', error);
        setConnection('disconnected');
      }
    };
    runStartupChecks();
  }, []);

  // Fetch educational list whenever the loaded profile changes
  useEffect(() => {
    if (profile?.id) {
      fetchEducation(profile.id);
    } else {
      setEducationList([]);
    }
  }, [profile]);

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

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaveProfileError(null);
    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (!response.ok) throw new Error('Failed to save profile. Check fields constraints.');
      const data = await response.json();
      setProfile(data);
      alert('Profile details saved successfully!');
    } catch (err: any) {
      setSaveProfileError(err.message || 'An error occurred while saving profile.');
    }
  };

  const handleSaveEducation = async (e: FormEvent) => {
    e.preventDefault();
    setSaveEduError(null);
    if (!profile?.id) {
      alert('You must save your Profile before adding education entries!');
      return;
    }

    try {
      const payload = {
        ...educationForm,
        profile_id: profile.id
      };

      let response;
      if (editingEduId) {
        // Update existing record
        response = await fetch(`http://localhost:8000/api/education/${editingEduId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new record
        response = await fetch('http://localhost:8000/api/education', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) throw new Error('Failed to save education record. Check details constraints.');
      
      await fetchEducation(profile.id);
      
      // Reset form
      setEducationForm({
        institution: '',
        location: '',
        degree: '',
        major: '',
        start_date: '',
        graduation_date: '',
        gpa: ''
      });
      setEditingEduId(null);
      alert(editingEduId ? 'Education updated!' : 'Education added!');
    } catch (err: any) {
      setSaveEduError(err.message || 'An error occurred while saving education.');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/education/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete record.');
      if (profile?.id) {
        await fetchEducation(profile.id);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting education record.');
    }
  };

  const startEditEducation = (edu: Education) => {
    setEditingEduId(edu.id);
    setEducationForm({
      institution: edu.institution,
      location: edu.location,
      degree: edu.degree,
      major: edu.major,
      start_date: edu.start_date,
      graduation_date: edu.graduation_date,
      gpa: edu.gpa || ''
    });
  };

  const cancelEditEducation = () => {
    setEditingEduId(null);
    setEducationForm({
      institution: '',
      location: '',
      degree: '',
      major: '',
      start_date: '',
      graduation_date: '',
      gpa: ''
    });
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
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            Demographics
          </button>
          <button 
            onClick={() => setActiveTab('education')} 
            className={`sidebar-btn ${activeTab === 'education' ? 'active' : ''}`}
            disabled={!profile}
            title={!profile ? "Create Profile first" : ""}
          >
            Education Credentials
          </button>
        </aside>

        <main className="main-panel">
          {activeTab === 'overview' && (
            <section className="tab-panel">
              <div className="intro-card">
                <h2>Welcome to your Career Vault</h2>
                <p>
                  This is a private, local-first workspace. All your professional achievements, experiences, 
                  projects, and skills are stored locally on your machine.
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
                  <svg viewBox="0 0 24 24" className="alert-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div className="alert-text">
                    <h3>Cannot connect to local backend API</h3>
                    <p>Please verify that the Docker backend service is running and accessible on port 8000.</p>
                  </div>
                </div>
              )}

              {connection === 'connected' && (
                <div className="alert-banner success">
                  <svg viewBox="0 0 24 24" className="alert-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div className="alert-text">
                    <h3>System verified and ready</h3>
                    <p>
                      Successfully connected to the FastAPI container. Select the tabs on the left to start building your credentials vault.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'profile' && (
            <section className="tab-panel">
              <h2>Candidate Demographics</h2>
              <p style={{ marginBottom: '24px' }}>Provide your contact links and primary details for resume header mappings.</p>
              
              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-name">Full Name *</label>
                    <input 
                      id="p-name"
                      type="text" 
                      required
                      className="form-control"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-email">Email Address *</label>
                    <input 
                      id="p-email"
                      type="email" 
                      required
                      className="form-control"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="e.g. email@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-phone">Phone Number *</label>
                    <input 
                      id="p-phone"
                      type="text" 
                      required
                      className="form-control"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. +1 (123) 456-7890"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-location">Location *</label>
                    <input 
                      id="p-location"
                      type="text" 
                      required
                      className="form-control"
                      value={profileForm.location}
                      onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                      placeholder="e.g. Boston, MA"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="p-website">Personal Website / Portfolio</label>
                  <input 
                    id="p-website"
                    type="text" 
                    className="form-control"
                    value={profileForm.website}
                    onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="e.g. https://johndoe.dev"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-linkedin">LinkedIn Profile</label>
                    <input 
                      id="p-linkedin"
                      type="text" 
                      className="form-control"
                      value={profileForm.linkedin}
                      onChange={e => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                      placeholder="e.g. https://linkedin.com/in/johndoe"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-github">GitHub Profile</label>
                    <input 
                      id="p-github"
                      type="text" 
                      className="form-control"
                      value={profileForm.github}
                      onChange={e => setProfileForm({ ...profileForm, github: e.target.value })}
                      placeholder="e.g. https://github.com/johndoe"
                    />
                  </div>
                </div>

                {saveProfileError && (
                  <p className="error-text" style={{ color: '#dc2626', margin: '12px 0' }}>{saveProfileError}</p>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                  Save Profile Details
                </button>
              </form>
            </section>
          )}

          {activeTab === 'education' && profile && (
            <section className="tab-panel">
              <h2>Education Credentials</h2>
              <p>Add and manage your academic milestones.</p>
              
              <form onSubmit={handleSaveEducation} style={{ marginTop: '24px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edu-inst">School / University *</label>
                    <input 
                      id="edu-inst"
                      type="text" 
                      required 
                      className="form-control"
                      value={educationForm.institution}
                      onChange={e => setEducationForm({ ...educationForm, institution: e.target.value })}
                      placeholder="e.g. Boston University"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edu-loc">Location *</label>
                    <input 
                      id="edu-loc"
                      type="text" 
                      required 
                      className="form-control"
                      value={educationForm.location}
                      onChange={e => setEducationForm({ ...educationForm, location: e.target.value })}
                      placeholder="e.g. Boston, MA"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edu-deg">Degree Type *</label>
                    <input 
                      id="edu-deg"
                      type="text" 
                      required 
                      className="form-control"
                      value={educationForm.degree}
                      onChange={e => setEducationForm({ ...educationForm, degree: e.target.value })}
                      placeholder="e.g. B.S., M.S."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edu-maj">Field of Study / Major *</label>
                    <input 
                      id="edu-maj"
                      type="text" 
                      required 
                      className="form-control"
                      value={educationForm.major}
                      onChange={e => setEducationForm({ ...educationForm, major: e.target.value })}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edu-start">Start Date *</label>
                    <input 
                      id="edu-start"
                      type="text" 
                      required 
                      className="form-control"
                      value={educationForm.start_date}
                      onChange={e => setEducationForm({ ...educationForm, start_date: e.target.value })}
                      placeholder="e.g. Sept 2022"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edu-grad">Graduation Date *</label>
                    <input 
                      id="edu-grad"
                      type="text" 
                      required 
                      className="form-control"
                      value={educationForm.graduation_date}
                      onChange={e => setEducationForm({ ...educationForm, graduation_date: e.target.value })}
                      placeholder="e.g. May 2026"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edu-gpa">GPA (Optional)</label>
                    <input 
                      id="edu-gpa"
                      type="text" 
                      className="form-control"
                      value={educationForm.gpa}
                      onChange={e => setEducationForm({ ...educationForm, gpa: e.target.value })}
                      placeholder="e.g. 3.8 / 4.0"
                    />
                  </div>
                </div>

                {saveEduError && (
                  <p className="error-text" style={{ color: '#dc2626', margin: '12px 0' }}>{saveEduError}</p>
                )}

                <div className="actions-container">
                  <button type="submit" className="btn btn-primary">
                    {editingEduId ? 'Save Changes' : 'Add Education Record'}
                  </button>
                  {editingEduId && (
                    <button type="button" onClick={cancelEditEducation} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="list-container">
                {educationList.map((edu) => (
                  <div key={edu.id} className="card-item">
                    <div className="card-item-header">
                      <div className="card-item-title">
                        <h3>{edu.institution}</h3>
                        <p className="card-item-meta">{edu.degree} in {edu.major} &bull; {edu.location}</p>
                      </div>
                      <div className="card-item-actions">
                        <button onClick={() => startEditEducation(edu)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteEducation(edu.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                      <span>Timeline: {edu.start_date} - {edu.graduation_date}</span>
                      {edu.gpa && <span style={{ marginLeft: '16px' }}>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}

                {educationList.length === 0 && (
                  <p style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text)', fontStyle: 'italic' }}>
                    No academic records added to your Vault yet.
                  </p>
                )}
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
