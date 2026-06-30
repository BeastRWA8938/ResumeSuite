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
      } else if (url.includes('/api/resume/synthesize')) {
        data = {
          bullets: [
            {
              fact_id: "test-fact-uuid-0",
              synthesized_bullet: "Custom synthesized achievement bullet point for test uuid 0."
            }
          ],
          skills: {
            "Languages": ["TypeScript", "Python"],
            "Frameworks": ["React", "FastAPI"]
          }
        };
      } else if (url.includes('/api/fact/rank')) {
        data = Array.from({ length: 12 }, (_, i) => ({
          fact: {
            id: `test-fact-uuid-${i}`,
            action: `Saved fact achievement number ${i}`,
            metric_result: `metric result ${i}`,
            skills: ["Vite"]
          },
          score: 0.95 - (i * 0.05),
          matched_keywords: ["Vite"]
        }));
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
    const scoreBadge = await screen.findByText(/Match: 95%/i);
    expect(scoreBadge).toBeInTheDocument();
    
    // Expect matching keyword badge to render
    const keywordBadges = screen.getAllByText(/Vite/i);
    expect(keywordBadges.length).toBeGreaterThan(0);
  });

  it('enforces strict content budget selection limits', async () => {
    await act(async () => {
      render(<App />);
    });

    // Navigate to tailoring tab
    const tailorTabBtn = screen.getByRole('button', { name: /Resume Tailoring Workspace/i });
    await act(async () => {
      fireEvent.click(tailorTabBtn);
    });

    const companyInput = screen.getByLabelText(/Company Name \/ Context/i);
    const jdTextarea = screen.getByLabelText(/Job Description Text/i);
    const rankBtn = screen.getByRole('button', { name: /Calculate Relevance Rankings/i });

    fireEvent.change(companyInput, { target: { value: 'Google' } });
    fireEvent.change(jdTextarea, { target: { value: 'Looking for Vite developers.' } });

    // Submit rankings
    await act(async () => {
      fireEvent.click(rankBtn);
    });

    // Auto-selected top 10 on start
    const budgetCounter = await screen.findByText(/Allocated Accomplishments:/i);
    expect(budgetCounter).toHaveTextContent("10 / 10");

    const proceedBtn = screen.getByRole('button', { name: /Proceed to Bullet Synthesis/i });
    expect(proceedBtn).not.toBeDisabled();

    // Checkboxes are rendered. Let's find all checkboxes.
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(12);

    // Click the 11th checkbox (index 10) to select it
    await act(async () => {
      fireEvent.click(checkboxes[10]);
    });
    expect(budgetCounter).toHaveTextContent("11 / 10");
    expect(proceedBtn).toBeDisabled();
    expect(screen.getByText(/Budget Exceeded!/i)).toBeInTheDocument();

    // Click the 12th checkbox (index 11) to select it too (total 12)
    await act(async () => {
      fireEvent.click(checkboxes[11]);
    });
    expect(budgetCounter).toHaveTextContent("12 / 10");

    // Deselect index 0, index 1, index 2 (now 9/10 selected)
    await act(async () => {
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);
    });
    expect(budgetCounter).toHaveTextContent("9 / 10");
    expect(proceedBtn).not.toBeDisabled();
    expect(screen.queryByText(/Budget Exceeded!/i)).not.toBeInTheDocument();

    // Click "Select Top 10 by Relevance" helper button to reset selection to top 10
    const selectTopBtn = screen.getByRole('button', { name: /Select Top 10 by Relevance/i });
    await act(async () => {
      fireEvent.click(selectTopBtn);
    });
    expect(budgetCounter).toHaveTextContent("10 / 10");
    expect(proceedBtn).not.toBeDisabled();
  });

  it('triggers bullet synthesis and displays preview metrics', async () => {
    await act(async () => {
      render(<App />);
    });

    const tailorTabBtn = screen.getByRole('button', { name: /Resume Tailoring Workspace/i });
    await act(async () => {
      fireEvent.click(tailorTabBtn);
    });

    const companyInput = screen.getByLabelText(/Company Name \/ Context/i);
    const jdTextarea = screen.getByLabelText(/Job Description Text/i);
    const rankBtn = screen.getByRole('button', { name: /Calculate Relevance Rankings/i });

    fireEvent.change(companyInput, { target: { value: 'Google' } });
    fireEvent.change(jdTextarea, { target: { value: 'Looking for TypeScript developers.' } });

    await act(async () => {
      fireEvent.click(rankBtn);
    });

    // Proceed to synthesis click
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Bullet Synthesis/i });
    expect(proceedBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(proceedBtn);
    });

    // Check preview header and results are rendered
    const previewHeader = await screen.findByText(/Tailored Bullet Points Preview/i);
    expect(previewHeader).toBeInTheDocument();

    const bulletText = screen.getByText(/Custom synthesized achievement bullet point/i);
    expect(bulletText).toBeInTheDocument();

    const skillTexts = screen.getAllByText(/TypeScript/i);
    expect(skillTexts.length).toBeGreaterThan(0);
  });
});
