import React, { useState, useRef } from 'react';
import { DatasetInfo } from '../types';

interface Props {
  onDataReady: (data: DatasetInfo, userTarget: string) => void;
  isLoading: boolean;
}

const DataInput: React.FC<Props> = ({ onDataReady, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [targetColumn, setTargetColumn] = useState('');
  const [pastedData, setPastedData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processData(text, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedData.trim()) return;
    processData(pastedData, "pasted_data.csv");
  };

  const processData = (rawText: string, filename: string) => {
    // Basic CSV parsing to get counts and sample
    const lines = rawText.trim().split('\n');
    const rowCount = lines.length;
    let colCount = 0;
    let columns: string[] = [];
    
    if (rowCount > 0) {
      // Very naive CSV split, usually sufficient for count estimation
      const firstLine = lines[0];
      const separator = firstLine.includes(',') ? ',' : '\t';
      columns = firstLine.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
      colCount = columns.length;
    }

    // Take top 50 lines as sample to avoid token limits
    const sample = lines.slice(0, 50).join('\n');

    const datasetInfo: DatasetInfo = {
      filename,
      rowCount,
      colCount,
      columns,
      sample
    };

    onDataReady(datasetInfo, targetColumn);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl mb-8">
      <div className="flex border-b border-slate-700 mb-6">
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="fas fa-upload mr-2"></i> Upload CSV
        </button>
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'paste' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setActiveTab('paste')}
        >
          <i className="fas fa-paste mr-2"></i> Paste Rows
        </button>
      </div>

      <div className="space-y-4">
        {/* Target Column Input - Optional */}
        <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Target Variable (Optional)</label>
            <input 
                type="text" 
                placeholder="e.g. price, churn, species (Leave empty for auto-detect)"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
            />
        </div>

        {activeTab === 'upload' ? (
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400 text-2xl">
              <i className="fas fa-file-csv"></i>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Drop your dataset here</h3>
            <p className="text-slate-400 text-sm mb-6">Support for CSV or Tab-separated files</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Browse Files'}
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Paste header and first few rows of your dataset here..."
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            ></textarea>
            <button
              onClick={handlePasteSubmit}
              disabled={isLoading || !pastedData.trim()}
              className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isLoading ? 'Processing...' : 'Analyze Sample'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataInput;