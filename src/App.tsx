import { useCallback, useEffect, useRef, useState } from 'react';
import { ChartPie, House, Plus, ReceiptText, RefreshCw, Settings as SettingsIcon, WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { getCategories, getSettings, getTransactions } from './lib/db';
import { DEFAULT_SETTINGS, type Category, type Settings, type Transaction } from './types';
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionSheet } from './components/TransactionSheet';

const tabs = [
  { id: 'home', label: '首页', icon: House },
  { id: 'history', label: '账单', icon: ReceiptText },
  { id: 'stats', label: '统计', icon: ChartPie },
  { id: 'settings', label: '设置', icon: SettingsIcon },
] as const;
type Tab = typeof tabs[number]['id'];

function initialTab(): Tab {
  const value = window.location.hash.slice(1);
  return tabs.some((tab) => tab.id === value) ? value as Tab : 'home';
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [composer, setComposer] = useState<{ editing?: Transaction } | null>(null);
  const [historyFilter, setHistoryFilter] = useState<{ id: string; month: string }>();
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ immediate: true });

  const refresh = useCallback(async () => {
    const [nextTransactions, nextCategories, nextSettings] = await Promise.all([getTransactions(), getCategories(), getSettings()]);
    setTransactions(nextTransactions);
    setCategories(nextCategories);
    setSettings(nextSettings);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoadError('无法打开本地账本，请确认浏览器允许网站存储数据后重试。')).finally(() => setLoading(false));
    const handleHash = () => setTab(initialTab());
    window.addEventListener('hashchange', handleHash);
    return () => { window.removeEventListener('hashchange', handleHash); clearTimeout(toastTimer.current); };
  }, [refresh]);

  const notify = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);

  function navigate(next: Tab) {
    setTab(next);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function viewHistory(filter?: { id: string; month: string }) {
    setHistoryFilter(filter);
    navigate('history');
  }

  const pageProps = { transactions, categories, settings, refresh, notify };
  return <div className="app-shell">
    <main>
      {loading ? <div className="app-loading"><div className="loading-logo">轻</div><span>正在打开你的账本…</span></div> : loadError ? <div className="app-loading error"><WifiOff size={32} /><h1>暂时无法读取账本</h1><p>{loadError}</p><button className="button primary" onClick={() => window.location.reload()}><RefreshCw size={18} /> 重新打开</button></div> : <>
        {tab === 'home' && <HomePage {...pageProps} onAdd={() => setComposer({})} onViewCategory={(id, month) => viewHistory({ id, month })} onViewAll={() => viewHistory()} />}
        {tab === 'history' && <HistoryPage {...pageProps} initialCategory={historyFilter} onAdd={() => setComposer({})} onEdit={(editing) => setComposer({ editing })} />}
        {tab === 'stats' && <StatsPage {...pageProps} />}
        {tab === 'settings' && <SettingsPage {...pageProps} />}
      </>}
    </main>
    {!loading && !loadError && <>
      {!composer && <button className="floating-add" onClick={() => setComposer({})} aria-label="记一笔"><Plus size={27} /></button>}
      <nav className="bottom-nav" aria-label="主要导航">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => navigate(id)} aria-current={tab === id ? 'page' : undefined}><span><Icon size={22} strokeWidth={tab === id ? 2.3 : 1.8} /></span><small>{label}</small></button>)}</nav>
    </>}
    {composer && <TransactionSheet categories={categories} settings={settings} editing={composer.editing} onClose={() => setComposer(null)} onSaved={refresh} />}
    {toast && <div className="toast" role="status">{toast}</div>}
    {needRefresh && <div className="update-banner" role="status"><span>轻记有新版本</span><button onClick={() => void updateServiceWorker(true)}>更新</button></div>}
  </div>;
}
