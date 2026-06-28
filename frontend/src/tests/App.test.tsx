import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('App Dashboard Component', () => {
  beforeEach(() => {
    // Mock global fetch to return a healthy API payload
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: "healthy",
          service: "Career Intelligence System API",
          version: "1.0.0"
        }),
      })
    ));
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
});
