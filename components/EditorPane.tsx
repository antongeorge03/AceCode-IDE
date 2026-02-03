
import React from 'react';
import Editor from '@monaco-editor/react';
import { Language } from '../types';

interface EditorPaneProps {
  code: string;
  language: Language;
  onChange: (value: string | undefined) => void;
}

const EditorPane: React.FC<EditorPaneProps> = ({ code, language, onChange }) => {
  const filename = language === 'javascript' ? 'main.js' : 'script.py';

  return (
    <div className="h-full w-full bg-[#1e1e1e] border-b border-gray-800">
      <div className="flex items-center px-4 py-2 bg-[#1e1e1e] border-b border-gray-800 text-xs font-medium uppercase tracking-wider text-gray-500">
        <span className="flex items-center gap-2">
          {language === 'javascript' ? (
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.25.18l.9.2.73.26.59.33.45.38.34.44.25.51.15.57.06.63-.01.63-.08.63-.16.63-.26.63-.37.63-.48.63-.61.63-.1.1V4h2.5V3a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V6H20v5h-2.5V8.5h-1l-.1-.1-.61-.63-.48-.63-.37-.63-.26-.63-.16-.63-.08-.63-.01-.63.06-.63.15-.57.25-.51.34-.44.45-.38.59-.33.73-.26.9-.2zM9.75 23.82l-.9-.2-.73-.26-.59-.33-.45-.38-.34-.44-.25-.51-.15-.57-.06-.63.01-.63.08-.63.16-.63.26-.63.37-.63.48-.63.61-.63.1-.1V20h-2.5v1a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v1H4v-5h2.5v2.5h1l.1.1.61.63.48.63.37.63.26.63.16.63.08.63.01.63-.06.63-.15.57-.25.51-.34.44-.45.38-.59.33-.73.26-.9.2z" />
            </svg>
          )}
          {filename}
        </span>
      </div>
      <Editor
        height="calc(100% - 32px)"
        defaultLanguage={language}
        language={language}
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', monospace",
          cursorStyle: 'block',
          smoothScrolling: true,
          padding: { top: 16 },
        }}
      />
    </div>
  );
};

export default EditorPane;
