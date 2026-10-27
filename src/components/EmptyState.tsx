import { NotebookPen } from 'lucide-react';

export function EmptyState({ title = '还没有账单', description = '记下第一笔，慢慢看清自己的收支。', action }: { title?: string; description?: string; action?: () => void }) {
  return <div className="empty-state"><div className="empty-icon"><NotebookPen size={30} /></div><h3>{title}</h3><p>{description}</p>{action && <button className="button secondary" onClick={action}>记一笔</button>}</div>;
}
