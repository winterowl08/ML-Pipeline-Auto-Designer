import React, { useState, useEffect } from 'react';
import DataInput from './components/DataInput';
import AnalysisDashboard from './components/AnalysisDashboard';
import CodeBlock from './components/CodeBlock';
import LoadingTerminal from './components/LoadingTerminal';
import { analyzeDataset } from './services/geminiService';
import { DatasetInfo, MLAnalysisResult } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MLAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const handleDataReady = async (dataset: DatasetInfo, userTarget: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSelectedModel(null);

    try {
      const analysisResult = await analyzeDataset(dataset, userTarget);
      setResult(analysisResult);
      // Select first model by default if available
      if (analysisResult.jsonSummary?.main_model_choices?.[0]) {
        setSelectedModel(analysisResult.jsonSummary.main_model_choices[0]);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while analyzing the dataset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSelectedModel(null);
  };

  // Determine which code to show
  const activeCode = (result && selectedModel && result.modelCodeMap[selectedModel]) 
    ? result.modelCodeMap[selectedModel] 
    : (result?.pythonCode || "");

  // Fallback: If current selectedModel has no code, try to find one that does
  useEffect(() => {
    if (result && selectedModel && !result.modelCodeMap[selectedModel]) {
        // If exact name match fails, try finding a key that contains the model name
        const partialMatch = Object.keys(result.modelCodeMap).find(k => k.includes(selectedModel) || selectedModel.includes(k));
        if (partialMatch) {
            // Just use the code, don't change selection state to avoid infinite loops if names mismatch slightly
        } else if (Object.keys(result.modelCodeMap).length > 0) {
            // Fallback to first available
             setSelectedModel(Object.keys(result.modelCodeMap)[0]);
        }
    }
  }, [result, selectedModel]);

  // Helper to parse inline markdown bolding (**text**) into React elements
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} className="font-semibold text-cyan-200">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2"></div>;

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        return (
          <div key={idx} className="flex items-start mb-3 group pl-2">
             <div className="mt-1.5 mr-3 min-w-[6px] h-[6px] rounded-full bg-cyan-400 group-hover:bg-cyan-300 transition-colors shadow-[0_0_8px_rgba(34,211,238,0.4)]"></div>
             <p className="text-slate-300 text-sm leading-relaxed">
               {formatInlineText(trimmed.substring(2))}
             </p>
          </div>
        );
      }
      
      // Numbered lists
      if (/^\d+\./.test(trimmed)) {
         return (
          <div key={idx} className="flex items-start mb-3 pl-2">
             <span className="mr-2 text-cyan-400 font-bold text-xs mt-0.5 font-mono">{trimmed.split('.')[0]}.</span>
             <p className="text-slate-300 text-sm leading-relaxed">
                {formatInlineText(trimmed.replace(/^\d+\.\s*/, ''))}
             </p>
          </div>
         );
      }

      // Headers (ends with colon)
      if (trimmed.endsWith(':')) {
        return (
          <h4 key={idx} className="text-white font-bold text-sm mt-5 mb-3 tracking-wide border-b border-slate-700/50 pb-1 flex items-center">
            {formatInlineText(trimmed)}
          </h4>
        );
      }

      // Default paragraph
      return (
        <p key={idx} className="text-slate-300 text-sm mb-3 leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-slate-200 pb-20">
      {/* Header */}
      <header className="bg-[#1C1C1C]/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <i className="fas fa-network-wired text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              PipelinePilot <span className="text-cyan-400">AI</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
               <i className="fab fa-github mr-2"></i>GitHub
             </a>
             <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
               <i className="fas fa-book mr-2"></i>Docs
             </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro */}
        {!result && !isLoading && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Automate your Machine Learning workflow
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Upload your dataset sample. We'll detect the problem type, identify issues, and write the complete Python training pipeline for you.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
           <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-8 flex items-center text-red-200 max-w-4xl mx-auto">
              <i className="fas fa-exclamation-triangle text-2xl mr-4"></i>
              <div>
                  <h3 className="font-bold">Analysis Failed</h3>
                  <p className="text-sm opacity-80">{error}</p>
              </div>
           </div>
        )}

        {/* Input Section */}
        {!result && !isLoading && (
          <div className="max-w-2xl mx-auto">
            <DataInput onDataReady={handleDataReady} isLoading={isLoading} />
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingTerminal />}

        {/* Results Section */}
        {result && (
          <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Analysis Report</h2>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors"
                >
                  Analyze New Dataset
                </button>
             </div>

             {/* 1. JSON Dashboard with Model Selection */}
             {result.jsonSummary && (
                <AnalysisDashboard 
                    data={result.jsonSummary} 
                    selectedModel={selectedModel}
                    onModelSelect={setSelectedModel}
                />
             )}

             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                {/* 3. Python Code & Strategy (Left col - lg:col-span-3) */}
                <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col gap-8">
                    {/* Code Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <i className="fas fa-code text-green-400 mr-2"></i>
                                Generated Pipeline
                            </h3>
                            <div className="flex items-center gap-3">
                                {selectedModel && (
                                    <span className="text-xs font-mono bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded border border-cyan-800">
                                        {selectedModel}
                                    </span>
                                )}
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">Python 3.8+</span>
                            </div>
                        </div>
                        <CodeBlock code={activeCode} />
                    </div>

                    {/* Pipeline Strategy Section (Moved here) */}
                    {result.jsonSummary?.recommended_pipeline_steps && (
                     <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center z-10 relative">
                            <i className="fas fa-layer-group text-purple-400 mr-2"></i>
                            Pipeline Strategy
                        </h3>
                        <ol className="relative border-l border-slate-700 ml-3 space-y-6 z-10 relative">
                            {result.jsonSummary.recommended_pipeline_steps.map((step, idx) => (
                                <li key={idx} className="mb-2 ml-6 relative">
                                    <div className="absolute w-6 h-6 bg-slate-800 border-2 border-cyan-500 rounded-full -left-[37px] top-0 flex items-center justify-center">
                                       <span className="text-[10px] text-cyan-400 font-bold">{idx + 1}</span>
                                    </div>
                                    <h4 className="text-sm font-medium text-slate-200 bg-slate-700/50 p-2 rounded-lg border border-slate-600/50">
                                        {step}
                                    </h4>
                                </li>
                            ))}
                        </ol>
                     </div>
                   )}
                </div>

                {/* 2. Human Summary (Right col - lg:col-span-2) */}
                <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                   
                   {/* Executive Summary Card */}
                   <div className="bg-[#1e293b] rounded-xl border-t-4 border-cyan-500 shadow-xl overflow-hidden sticky top-24">
                      <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 flex items-center">
                         <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-3 text-cyan-400">
                            <i className="fas fa-clipboard-list text-sm"></i>
                         </div>
                         <h3 className="text-lg font-bold text-white tracking-wide">
                            Executive Summary
                         </h3>
                      </div>
                      <div className="p-6">
                        {renderFormattedSummary(result.humanSummary)}
                      </div>
                   </div>

                </div>

             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;