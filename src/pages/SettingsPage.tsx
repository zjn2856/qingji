import { useRef, useState } from 'react';
import { Archive, BookOpen, Check, ChevronRight, Coins, Database, Download, FileJson, FolderCog, Info, Pencil, Plus, ShieldCheck, Upload } from 'lucide-react';
import { createBackup, removeCategory, restoreBackup, saveCategory, updateSettings } from '../lib/db';
import { downloadBackup, readBackupFile } from '../lib/backup';
import { CURRENCIES, type BackupData, type Category, type TransactionType } from '../types';
import { CategoryIcon, ICON_CHOICES } from '../components/CategoryIcon';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import type { PageProps } from './HomePage';

const colors = ['#557967', '#ed8b5f', '#68a4db', '#a387d8', '#d8a44e', '#d880a1', '#54aaa5', '#929993'];

export function SettingsPage({ categories, settings, refresh, notify }: PageProps) {
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(settings.ledgerName);
  const [pendingCurrency, setPendingCurrency] = useState<string>();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');
  const [editing, setEditing] = useState<Category | 'new'>();
  const [categoryName, setCategoryName] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(colors[0]);
  const [backup, setBackup] = useState<BackupData>();
  const [working, setWorking] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function saveName() {
    try { await updateSettings({ ledgerName: name.trim() }); await refresh(); setNameOpen(false); notify('账本名称已更新'); }
    catch (error) { notify(error instanceof Error ? error.message : '保存失败'); }
  }

  async function changeCurrency() {
    if (!pendingCurrency) return;
    try { await updateSettings({ currency: pendingCurrency }); await refresh(); notify('货币已更改，历史金额未换算'); }
    catch { notify('货币设置保存失败'); }
    finally { setPendingCurrency(undefined); }
  }

  function openCategory(value: Category | 'new') {
    setEditing(value);
    setCategoryName(value === 'new' ? '' : value.name);
    setIcon(value === 'new' ? ICON_CHOICES[0] : value.icon);
    setColor(value === 'new' ? colors[0] : value.color);
  }

  async function submitCategory() {
    if (editing === undefined) return;
    try {
      const base = editing === 'new' ? {
        id: crypto.randomUUID(), type: categoryType, isDefault: false, archived: false, createdAt: new Date().toISOString(),
      } : editing;
      await saveCategory({ ...base, name: categoryName, icon, color });
      await refresh(); setEditing(undefined); notify('分类已保存');
    } catch (error) { notify(error instanceof Error ? error.message : '分类保存失败'); }
  }

  async function deleteCategory(category: Category) {
    try {
      const result = await removeCategory(category.id);
      await refresh(); notify(result === 'archived' ? '分类已有账单，已安全归档' : '分类已删除');
    } catch (error) { notify(error instanceof Error ? error.message : '操作失败'); }
  }

  async function exportData() {
    setWorking(true);
    try {
      const data = createBackup();
      downloadBackup(await data);
      navigator.storage?.persist().catch(() => undefined);
      notify('备份已生成，请保存到“文件”App');
    } catch { notify('导出失败，请稍后重试'); }
    finally { setWorking(false); }
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    try { setBackup(await readBackupFile(file)); }
    catch (error) { notify(error instanceof Error ? error.message : '无法读取备份'); }
    finally { if (fileInput.current) fileInput.current.value = ''; }
  }

  async function importData() {
    if (!backup || working) return;
    setWorking(true);
    try {
      await restoreBackup(backup);
      await refresh();
      setBackup(undefined);
      notify(`已恢复 ${backup.transactions.length} 笔账单`);
    } catch { notify('恢复失败，原有数据未更改，请重试'); }
    finally { setWorking(false); }
  }

  return <div className="page settings-page">
    <header className="page-header"><span className="eyebrow">你的数据，由你掌握</span><h1>设置</h1></header>
    <section className="settings-profile card"><div className="profile-logo">轻</div><div><strong>{settings.ledgerName}</strong><span>本地账本 · 无需登录</span></div><ShieldCheck size={23} /></section>
    <h2 className="settings-label">账本</h2>
    <section className="settings-list card">
      <button onClick={() => { setName(settings.ledgerName); setNameOpen(true); }}><span className="setting-icon"><BookOpen size={19} /></span><span>账本名称</span><b>{settings.ledgerName}</b><ChevronRight size={17} /></button>
      <label><span className="setting-icon"><Coins size={19} /></span><span>货币</span><select aria-label="货币设置" value={settings.currency} onChange={(event) => setPendingCurrency(event.target.value)}>{CURRENCIES.map((item) => <option value={item.code} key={item.code}>{item.code} · {item.name}</option>)}</select><ChevronRight size={17} /></label>
      <button onClick={() => setCategoryOpen(true)}><span className="setting-icon"><FolderCog size={19} /></span><span>分类管理</span><b>{categories.filter((item) => !item.archived).length} 个分类</b><ChevronRight size={17} /></button>
    </section>
    <h2 className="settings-label">数据安全</h2>
    <section className="settings-list card">
      <button onClick={() => void exportData()} disabled={working}><span className="setting-icon"><Download size={19} /></span><span>导出备份</span><b>JSON 文件</b><ChevronRight size={17} /></button>
      <button onClick={() => fileInput.current?.click()}><span className="setting-icon"><Upload size={19} /></span><span>导入恢复</span><b>覆盖当前账本</b><ChevronRight size={17} /></button>
      <input ref={fileInput} type="file" accept="application/json,.json" className="visually-hidden" data-testid="backup-file-input" onChange={(event) => void chooseFile(event.target.files?.[0])} />
    </section>
    <div className="backup-tip"><FileJson size={20} /><p><strong>建议每月备份一次</strong><span>数据仅保存在当前设备，不会自动同步到 iCloud。</span></p></div>
    <h2 className="settings-label">关于</h2>
    <section className="settings-list card about-list"><div><span className="setting-icon"><Database size={19} /></span><span>数据说明</span></div><p>所有账单、分类与设置均存储在此浏览器的 IndexedDB 中。卸载应用、删除网站数据或清理浏览器存储可能导致数据丢失，请务必定期导出备份。</p><div className="app-version"><span>轻记 QingJi</span><b>版本 1.0.0</b></div></section>
    <p className="privacy-note"><Info size={14} /> 无账号、无广告、无追踪，财务数据不会离开设备。</p>

    {nameOpen && <Sheet title="账本名称" onClose={() => setNameOpen(false)} className="small-sheet"><label className="input-field standalone"><span>名称</span><input value={name} maxLength={30} autoFocus onChange={(event) => setName(event.target.value)} /></label><button className="button primary full-button" onClick={() => void saveName()}>保存名称</button></Sheet>}
    {pendingCurrency && <ConfirmDialog title="更改账本货币？" description={`将显示为 ${pendingCurrency}。此操作只改变货币符号和小数位，不会按汇率换算历史金额。`} confirmText="确认更改" onClose={() => setPendingCurrency(undefined)} onConfirm={() => void changeCurrency()} />}
    {categoryOpen && <Sheet title="分类管理" onClose={() => setCategoryOpen(false)} className="category-sheet"><div className="type-switch"><button className={categoryType === 'expense' ? 'active' : ''} onClick={() => setCategoryType('expense')}>支出分类</button><button className={categoryType === 'income' ? 'active' : ''} onClick={() => setCategoryType('income')}>收入分类</button></div><div className="manage-category-list">{categories.filter((item) => item.type === categoryType).map((category) => <div key={category.id} className={category.archived ? 'archived' : ''}><span style={{ color: category.color, background: `${category.color}18` }}><CategoryIcon icon={category.icon} /></span><strong>{category.name}{category.archived && <small>已归档</small>}</strong><button className="icon-button" aria-label={`编辑${category.name}`} onClick={() => openCategory(category)}><Pencil size={17} /></button>{!category.isDefault && !category.archived && <button className="icon-button" aria-label={`删除${category.name}`} onClick={() => void deleteCategory(category)}><Archive size={17} /></button>}</div>)}</div><button className="button secondary full-button" onClick={() => openCategory('new')}><Plus size={18} /> 添加自定义分类</button></Sheet>}
    {editing !== undefined && <Sheet title={editing === 'new' ? '添加分类' : '编辑分类'} onClose={() => setEditing(undefined)} className="small-sheet"><label className="input-field standalone"><span>分类名称</span><input value={categoryName} maxLength={20} autoFocus placeholder="输入名称" onChange={(event) => setCategoryName(event.target.value)} /></label><fieldset className="icon-picker"><legend>图标</legend><div>{ICON_CHOICES.map((value) => <button key={value} className={icon === value ? 'selected' : ''} onClick={() => setIcon(value)} aria-label={`选择${value}图标`}><CategoryIcon icon={value} /></button>)}</div></fieldset><fieldset className="color-picker"><legend>颜色</legend><div>{colors.map((value) => <button key={value} style={{ background: value }} className={color === value ? 'selected' : ''} onClick={() => setColor(value)} aria-label={`选择颜色${value}`}>{color === value && <Check size={16} />}</button>)}</div></fieldset><button className="button primary full-button" onClick={() => void submitCategory()}>保存分类</button></Sheet>}
    {backup && <ConfirmDialog title="恢复这个备份？" description={`备份包含 ${backup.transactions.length} 笔账单、${backup.categories.length} 个分类，导出于 ${new Date(backup.exportedAt).toLocaleString('zh-CN')}。恢复将覆盖当前设备上的全部账本数据，且无法撤销。`} confirmText={working ? '正在恢复…' : '覆盖并恢复'} danger onClose={() => !working && setBackup(undefined)} onConfirm={() => void importData()} />}
  </div>;
}
