import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('App Dashboard Component', () => {
  beforeEach(() => {
    // Mock global fetch to handle health check and API resources dynamically
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      let data = {};
      if (url.endsWith('/api/profile')) {
        data = {
          id: "test-profile-uuid",
          name: "Rushikesh",
          email: "rush@example.com",
          phone: "+1234567890",
          location: "Boston, MA"
        };
      } else if (url.includes('/api/education/profile/')) {
        data = [];
      } else if (url.includes('/api/work-experience/profile/')) {
        data = [];
      } else if (url.includes('/api/project/profile/')) {
        data = [];
      } else if (url.includes('/api/hackathon/profile/')) {
        data = [];
      } else if (url.includes('/api/fact/work-experience/')) {
        data = [];
      } else if (url.includes('/api/fact/project/')) {
        data = [];
      } else if (url.includes('/api/fact/hackathon/')) {
        data = [];
      } else if (url.includes('/api/fact/rank')) {
        data = [
          {
            fact: {
              id: "test-fact-uuid",
              action: "Saved fact",
              metric_result: "improved build times",
              skills: ["Vite"]
            },
            score: 0.85,
            matched_keywords: ["Vite", "build"]
          }
        ];
      } else if (url.includes('/api/fact/extract')) {
        data = [
          {
            action: "Extracted mock achievement",
            metric_result: "improved build times by 20%",
            skills: ["Vite", "React"]
          }
        ];
      } else if (url.includes('/api/fact')) {
        data = {
          id: "test-fact-uuid",
          action: "Saved fact",
          metric_result: "improved build times",
          skills: ["Vite"]
        };
      } else {
        data = {
          status: "healthy",
          service: "Career Intelligence System API",
          version: "1.0.0"
        };
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      });
    }));
  });

  it('renders the main brand heading', async () => {
    await act(async () => {
      render(<App />);
    });
    const headingElement = screen.getByRole('heading', { level: 1, name: /Career Intelligence System/i });
    expect(headingElement).toBeInTheDocument();
  });

  it('displays connected badge and success banner when API is healthy', async () => {
    await act(async () => {
      render(<App />);
    });
    const badgeElement = await screen.findByText(/Connected \(v1.0.0\)/i);
    expect(badgeElement).toBeInTheDocument();

    const successBanner = screen.getByText(/System verified and ready/i);
    expect(successBanner).toBeInTheDocument();
  });

  it('renders relevance ranking tailoring workspace and triggers scoring', async () => {
    await act(async () => {
      render(<App />);
    });

    // Navigate to tailoring workspace tab
    const tailorTabBtn = screen.getByRole('button', { name: /Resume Tailoring Workspace/i });
    expect(tailorTabBtn).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(tailorTabBtn);
    });

    // Verify workspace elements are rendered
    const workspaceHeading = screen.getByRole('heading', { level: 2, name: /Resume Tailoring Workspace/i });
    expect(workspaceHeading).toBeInTheDocument();

    const companyInput = screen.getByLabelText(/Company Name \/ Context/i);
    const jdTextarea = screen.getByLabelText(/Job Description Text/i);
    const rankBtn = screen.getByRole('button', { name: /Calculate Relevance Rankings/i });

    expect(companyInput).toBeInTheDocument();
    expect(jdTextarea).toBeInTheDocument();
    expect(rankBtn).toBeInTheDocument();

    // Trigger validation error on blank click
    await act(async () => {
      fireEvent.click(rankBtn);
    });
    const validationMessage = screen.getByText(/Company Name \/ Context is required before ranking./i);
    expect(validationMessage).toBeInTheDocument();

    // Input values
    fireEvent.change(companyInput, { target: { value: 'Google' } });
    fireEvent.change(jdTextarea, { target: { value: 'Looking for Vite developers.' } });

    // Submit
    await act(async () => {
      fireEvent.click(rankBtn);
    });

    // Expect score badge results to render
    const scoreBadge = await screen.findByText(/Match: 85%/i);
    expect(scoreBadge).toBeInTheDocument();
    
    // Expect matching keyword badge to render
    const keywordBadges = screen.getAllByText(/Vite/i);
    expect(keywordBadges.length).toBeGreaterThan(0);
  });
});
