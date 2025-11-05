import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { logger, type LogEntry } from '@/services/logger';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTs(ts: string) {
  try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
}

function levelColor(level: string) {
  switch (level) {
    case 'error': return 'text-red-600 bg-red-50 border-red-200';
    case 'warn': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'info': return 'text-blue-700 bg-blue-50 border-blue-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getAll());
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [debug, setDebug] = useState<boolean>(logger.getDebug());
  const [copied, setCopied] = useState<'selected' | 'all' | null>(null);

  useEffect(() => {
    const unsub = logger.subscribe(() => setLogs(logger.getAll()));
    return () => unsub();
  }, []);

  useEffect(() => {
    setDebug(logger.getDebug());
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!filter) return logs.slice().reverse();
    const f = filter.toLowerCase();
    return logs
      .filter(l => {
        const s = `${l.level} ${l.event} ${l.reqId || ''} ${JSON.stringify(l.data || {})}`.toLowerCase();
        return s.includes(f);
      })
      .reverse();
  }, [logs, filter]);

  const handleCopy = async (data: any, type: 'selected' | 'all') => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = JSON.stringify(data, null, 2);
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        alert('Не удалось скопировать. Попробуйте вручную.');
      }
      document.body.removeChild(textarea);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block w-full max-w-5xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Логи</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={debug}
                  onChange={(e) => { setDebug(e.target.checked); logger.setDebug(e.target.checked); }}
                />
                <span className="text-gray-600">DEBUG</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Поиск (event, level, reqId, текст)"
                className="input input-bordered input-sm w-64"
              />
              <button 
                onClick={() => handleCopy(filtered, 'all')} 
                className="btn btn-outline btn-sm"
                title="Скопировать все логи"
              >
                {copied === 'all' ? '✓ Скопировано!' : 'Скопировать все'}
              </button>
              <button onClick={() => { logger.clear(); setSelected(null); }} className="btn btn-outline btn-sm">Очистить</button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg divide-y">
              {filtered.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Нет записей</div>
              )}
              {filtered.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className={`w-full text-left p-3 hover:bg-gray-50 ${selected?.id === l.id ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${levelColor(l.level)}`}>{l.level}</span>
                      <span className="text-xs text-gray-500">{formatTs(l.ts)}</span>
                      {l.reqId && (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{l.reqId.slice(0,8)}</span>
                      )}
                      <span className="text-sm font-medium">{l.event}</span>
                    </div>
                    {l.data?.durationMs && (
                      <span className="text-xs text-gray-500">{l.data.durationMs}ms</span>
                    )}
                  </div>
                  {l.data?.status && (
                    <div className="text-xs text-gray-500 mt-1">status: {l.data.status}</div>
                  )}
                  {l.data?.errorType && (
                    <div className="text-xs text-red-600 mt-1">{l.data.errorType}: {l.data.errorMessage || l.data.message}</div>
                  )}
                </button>
              ))}
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              {!selected ? (
                <div className="text-sm text-gray-500">Выберите запись слева, чтобы увидеть детали</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-700"><span className="font-medium">ID:</span> {selected.id}</div>
                  <div className="text-sm text-gray-700"><span className="font-medium">Время:</span> {selected.ts}</div>
                  {selected.reqId && (
                    <div className="text-sm text-gray-700"><span className="font-medium">ReqId:</span> {selected.reqId}</div>
                  )}
                  <pre className="text-xs bg-white border rounded p-2 overflow-auto max-h-80">{JSON.stringify(selected, null, 2)}</pre>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(selected, 'selected')}
                      className="btn btn-outline btn-sm"
                    >
                      {copied === 'selected' ? '✓ Скопировано!' : 'Скопировать'}
                    </button>
                    <button
                      onClick={() => handleCopy(filtered, 'all')}
                      className="btn btn-outline btn-sm"
                    >
                      {copied === 'all' ? '✓ Скопировано!' : 'Скопировать все'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
