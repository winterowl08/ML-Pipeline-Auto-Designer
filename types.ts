export interface MLAnalysisResult {
  jsonSummary: JSONSummary | null;
  humanSummary: string;
  pythonCode: string; // Default or concatenated code
  modelCodeMap: Record<string, string>; // Code specific to each model
  rawResponse: string;
}

export interface JSONSummary {
  task_type: 'classification' | 'regression' | 'multilabel' | 'time_series' | 'clustering' | 'unknown';
  target_column: string | null;
  problem_statement: string;
  recommended_pipeline_steps: string[];
  main_model_choices: string[];
  expected_eval_metrics: string[];
  optimization_techniques?: string[]; // Techniques like GridSearch, Pruning, Quantization
  extra_eval_metrics?: string[]; // Secondary metrics like AIC, Lift, Kappa
  warnings: {
    pii_warning: 'yes' | 'no';
    sensitive_domain_warning: 'yes' | 'no';
    data_quality_notes: string[];
  };
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface DatasetInfo {
  filename: string;
  rowCount: number;
  colCount: number;
  columns: string[];
  sample: string;
}