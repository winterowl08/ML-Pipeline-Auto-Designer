import React, { useState } from 'react';

interface Props {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<Props> = ({ code, language = 'python' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-[#0d1117]">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-slate-400 font-mono">ml_autodesigner.py</div>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <i className="fas fa-check text-green-400"></i> Copied
            </>
          ) : (
            <>
              <i className="fas fa-copy"></i> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-auto max-h-[600px] p-4 text-sm font-mono leading-relaxed text-slate-300">
        <pre>
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;