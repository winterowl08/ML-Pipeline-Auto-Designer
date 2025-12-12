import React, { useEffect, useState } from 'react';

const steps = [
  "Reading dataset structure...",
  "Identifying data types and cardinality...",
  "Detecting missing values and anomalies...",
  "Scanning for PII and sensitive information...",
  "Determining machine learning task type...",
  "Formulating preprocessing strategy...",
  "Selecting optimal model candidates...",
  "Generating Python pipeline code...",
];

const LoadingTerminal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1C1C1C] rounded-xl border border-slate-700 p-6 shadow-2xl max-w-2xl mx-auto my-12 font-mono">
      <div className="flex space-x-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className={`flex items-center ${index > currentStep ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
             <span className="text-slate-500 mr-2">$</span>
             <span className={`${index === currentStep ? 'text-cyan-400' : 'text-slate-400'}`}>
                {step}
             </span>
             {index === currentStep && (
                <span className="inline-block w-2 h-4 bg-cyan-400 ml-2 animate-pulse"></span>
             )}
             {index < currentStep && (
                 <span className="ml-auto text-green-500 text-xs">[DONE]</span>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingTerminal;