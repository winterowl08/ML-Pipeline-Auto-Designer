import React from 'react';
import { JSONSummary } from '../types';

interface Props {
  data: JSONSummary;
  selectedModel: string | null;
  onModelSelect: (model: string) => void;
}

const AnalysisDashboard: React.FC<Props> = ({ data, selectedModel, onModelSelect }) => {
  const getTaskColor = (type: string) => {
    switch (type) {
      case 'classification': return 'bg-blue-500 text-blue-100';
      case 'regression': return 'bg-green-500 text-green-100';
      case 'time_series': return 'bg-purple-500 text-purple-100';
      case 'clustering': return 'bg-yellow-500 text-yellow-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  const getConfidenceColor = (conf: string) => {
    switch (conf.toLowerCase()) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Info Card */}
      <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${getTaskColor(data.task_type)}`}>
              {data.task_type.replace('_', ' ')}
            </span>
            <h2 className="text-2xl font-bold text-white mb-1">
              Target: <span className="text-cyan-400">{data.target_column || "None / Unsupervised"}</span>
            </h2>
          </div>
          <div className="text-right">
             <div className="text-sm text-slate-400">Confidence</div>
             <div className={`text-xl font-bold ${getConfidenceColor(data.confidence)}`}>
               {data.confidence.toUpperCase()}
             </div>
          </div>
        </div>
        
        <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
          <i className="fas fa-robot mr-2 text-cyan-500"></i>
          {data.problem_statement}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            {/* Models */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recommended Models</h3>
                <div className="flex flex-wrap gap-2">
                    {data.main_model_choices.map((model, idx) => {
                      const isSelected = selectedModel === model;
                      return (
                        <button 
                          key={idx} 
                          onClick={() => onModelSelect(model)}
                          className={`px-3 py-1.5 text-xs rounded border transition-all duration-200 ${
                            isSelected 
                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'
                          }`}
                        >
                            {isSelected && <i className="fas fa-check mr-1.5 text-xs"></i>}
                            {model}
                        </button>
                      );
                    })}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Click a model to view its specific pipeline code.</p>
            </div>
            
            {/* Metrics */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Metrics</h3>
                <div className="flex flex-wrap gap-2">
                    {data.expected_eval_metrics.map((metric, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-700 text-cyan-200 text-xs rounded border border-slate-600">
                            {metric}
                        </span>
                    ))}
                </div>
            </div>

            {/* Optimization Techniques (New) */}
            {data.optimization_techniques && data.optimization_techniques.length > 0 && (
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Optimization</h3>
                  <div className="flex flex-wrap gap-2">
                      {data.optimization_techniques.map((tech, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-700/50 text-emerald-200 text-xs rounded border border-slate-600 border-dashed">
                              <i className="fas fa-wrench mr-1 text-[10px]"></i>
                              {tech}
                          </span>
                      ))}
                  </div>
              </div>
            )}

            {/* Extra Metrics (New) */}
            {data.extra_eval_metrics && data.extra_eval_metrics.length > 0 && (
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Advanced Metrics</h3>
                  <div className="flex flex-wrap gap-2">
                      {data.extra_eval_metrics.map((metric, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-700/50 text-purple-200 text-xs rounded border border-slate-600 border-dashed">
                              {metric}
                          </span>
                      ))}
                  </div>
              </div>
            )}
        </div>
      </div>

      {/* Warnings & Quality Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg flex flex-col h-full">
        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">
           Data Health Check
        </h3>
        
        <div className="space-y-4 flex-grow">
            {/* PII Warning */}
            <div className={`flex items-center p-3 rounded-lg border ${data.warnings.pii_warning === 'yes' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <div className={`mr-3 w-8 h-8 rounded-full flex items-center justify-center ${data.warnings.pii_warning === 'yes' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    <i className={`fas ${data.warnings.pii_warning === 'yes' ? 'fa-user-shield' : 'fa-check'}`}></i>
                </div>
                <div>
                    <div className="font-bold text-sm text-slate-200">PII Detected</div>
                    <div className="text-xs text-slate-400">{data.warnings.pii_warning === 'yes' ? 'Sensitive data found' : 'No PII detected'}</div>
                </div>
            </div>

            {/* Sensitive Domain Warning */}
            <div className={`flex items-center p-3 rounded-lg border ${data.warnings.sensitive_domain_warning === 'yes' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-700/30 border-slate-600'}`}>
                <div className={`mr-3 w-8 h-8 rounded-full flex items-center justify-center ${data.warnings.sensitive_domain_warning === 'yes' ? 'bg-orange-500 text-white' : 'bg-slate-600 text-slate-300'}`}>
                    <i className="fas fa-file-medical"></i>
                </div>
                <div>
                    <div className="font-bold text-sm text-slate-200">Domain Sensitivity</div>
                    <div className="text-xs text-slate-400">{data.warnings.sensitive_domain_warning === 'yes' ? 'High Risk (Medical/Finance)' : 'Standard'}</div>
                </div>
            </div>

            {/* Data Quality Notes */}
            <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quality Notes</h4>
                <ul className="space-y-2">
                    {data.warnings.data_quality_notes.map((note, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start">
                             <i className="fas fa-exclamation-circle text-yellow-500 mt-0.5 mr-2 text-xs"></i>
                             {note}
                        </li>
                    ))}
                    {data.warnings.data_quality_notes.length === 0 && (
                        <li className="text-xs text-slate-400 italic">No major issues detected.</li>
                    )}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;