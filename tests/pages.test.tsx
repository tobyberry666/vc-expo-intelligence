import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../src/app';

const { feed } = vi.hoisted(() => ({
  feed: {
    fullSummary: '',
    investmentSummary: '',
    expoSummary: '',
    isLoading: false,
    phase: 'done',
    lastUpdate: null,
    error: null,
    hasData: true,
    refresh: () => {},
    resolveItemId: (id: string) => id,
    liveInvestments: [
      {
        id: 'investment-a',
        company: '星河科技',
        institution: 'IDG资本',
        sector: 'AI',
        round: 'A轮',
        date: '2026-07-01',
        amount: '1亿元',
        summary: '测试投资',
        source: 'live',
      },
    ],
    liveExpos: [
      {
        id: 'expo-a',
        name: 'CES 2026',
        type: 'consumer',
        startDate: '2026-01-06',
        endDate: '2026-01-09',
        location: '测试地点',
        description: '测试展会',
        exhibitors: ['测试科技'],
        chineseExhibitorCount: 1,
        source: 'live',
      },
    ],
  },
}));
vi.mock('../src/hooks/useLiveFeed', () => ({
  useLiveFeed: () => feed,
  loadLiveFeedCache: () => null,
}));
beforeEach(() => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
function NavigateQuery() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/investments?keyword=后退恢复')}>
      模拟历史导航
    </button>
  );
}
it('updates investment filters when history changes the URL without remounting', () => {
  render(
    <MemoryRouter initialEntries={['/investments?keyword=星河']}>
      <NavigateQuery />
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByPlaceholderText('搜索企业名称...')).toHaveValue('星河');
  fireEvent.click(screen.getByText('模拟历史导航'));
  expect(screen.getByPlaceholderText('搜索企业名称...')).toHaveValue(
    '后退恢复',
  );
});
it('restores expo keyword from a shared URL', () => {
  render(
    <MemoryRouter initialEntries={['/expos?keyword=CES']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByPlaceholderText('搜索展会名称...')).toHaveValue('CES');
});
it('opens investment details using memory when persistent storage is unavailable', () => {
  render(
    <MemoryRouter initialEntries={['/investments/investment-a']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: '星河科技' })).toBeInTheDocument();
});
it('opens the expo and its exhibitors using the same live state', () => {
  render(
    <MemoryRouter initialEntries={['/expos/expo-a']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'CES 2026' })).toBeInTheDocument();
  expect(screen.getByText('测试科技')).toBeInTheDocument();
});
