
import React, { useEffect, useRef } from 'react';
import { TerminalLine } from '../types';

interface TerminalPaneProps {
  lines: TerminalLine[];
  onClear: () => void;
}

const TerminalPane: React.FC<TerminalPaneProps> = ({ lines, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-t border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-400">
        <span className="flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Terminal
        </span>
        <button 
          onClick={onClear}
          className="hover:text-white transition-colors"
          title="Clear Console"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 selection:bg-blue-500/30"
      >
        {lines.length === 0 && (
          <div className="text-gray-600 italic">No output yet. Run your code to see results here.</div>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`flex gap-3 ${
            line.type === 'error' ? 'text-red-400' : 
            line.type === 'info' ? 'text-blue-400' : 
            line.type === 'system' ? 'text-green-500 font-bold' : 
            'text-gray-300'
          }`}>
            <span className="text-gray-600 shrink-0 select-none">[{new Date(line.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span className="whitespace-pre-wrap break-all">{line.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalPane;
