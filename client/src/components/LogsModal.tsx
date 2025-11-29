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
    case 'error': return 'text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-900/30 dark:border-red-800';
    case 'warn': return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800';
    case 'info': return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-200 dark:bg-blue-900/30 dark:border-blue-800';
    default: return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700';
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
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0 md:flex">
        <div className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80" onClick={onClose} />
        
        <div className="inline-flex flex-col w-full max-w-5xl max-h-[85vh] p-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 relative m-auto">
          {/* Close button absolute top-right */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 btn btn-ghost p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Close logs"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 pr-16 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Логи</h3>
              <label className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  checked={debug}
                  onChange={(e) => { setDebug(e.target.checked); logger.setDebug(e.target.checked); }}
                />
                <span className="text-gray-700 dark:text-gray-200 font-medium">DEBUG</span>
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Поиск (event, level, reqId...)"
                className="input w-64 h-9 text-sm"
              />
              <button 
                onClick={() => handleCopy(filtered, 'all')} 
                className="btn btn-outline btn-sm h-9"
                title="Скопировать все логи"
              >
                {copied === 'all' ? '✓' : 'Скопировать все'}
              </button>
              <button 
                onClick={() => { logger.clear(); setSelected(null); }} 
                className="btn btn-outline btn-sm h-9 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                Очистить
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="border dark:border-gray-700 rounded-xl divide-y dark:divide-gray-700 overflow-y-auto bg-white dark:bg-gray-800">
              {filtered.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Нет записей</div>
              )}
              {filtered.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${
                    selected?.id === l.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500' 
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${levelColor(l.level)}`}>
                        {l.level}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{formatTs(l.ts)}</span>
                    </div>
                    {l.data?.durationMs && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{l.data.durationMs}ms</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{l.event}</span>
                    {l.reqId && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
                        {l.reqId.slice(0,8)}
                      </span>
                    )}
                  </div>

                  {(l.data?.status || l.data?.errorType) && (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {l.data?.status && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          l.data.status >= 400 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          Status: {l.data.status}
                        </span>
                      )}
                      {l.data?.errorType && (
                        <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded truncate max-w-full">
                          {l.data.errorType}: {l.data.errorMessage || l.data.message}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto flex flex-col">
              {!selected ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <p>Выберите запись слева,</p>
                    <p>чтобы увидеть детали</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Event ID</span>
                      <span className="font-mono text-gray-900 dark:text-gray-200 select-all">{selected.id}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</span>
                      <span className="font-mono text-gray-900 dark:text-gray-200">{selected.ts}</span>
                    </div>
                    {selected.reqId && (
                      <div className="col-span-2">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Request ID</span>
                        <span className="font-mono text-gray-900 dark:text-gray-200 select-all bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700 inline-block">
                          {selected.reqId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Payload</span>
                    <pre className="text-xs bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 overflow-auto max-h-[400px] text-gray-800 dark:text-gray-200 font-mono">
                      {JSON.stringify(selected, null, 2)}
                    </pre>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => handleCopy(selected, 'selected')}
                      className="btn btn-primary btn-sm"
                    >
                      {copied === 'selected' ? 'Скопировано!' : 'Копировать JSON'}
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
