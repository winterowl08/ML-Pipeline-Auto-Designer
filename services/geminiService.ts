import { GoogleGenAI } from "@google/genai";
import { DatasetInfo, MLAnalysisResult, JSONSummary } from "../types";

const SYSTEM_INSTRUCTION = `
You are "PipelinePilot AI", an expert Machine Learning engineer and code generator.

Your goals:
1. Read the uploaded dataset.
2. Detect the problem type.
3. Identify target, issues, PII, etc.
4. Recommend a full ML pipeline.
5. Output a JSON summary.
6. Output human-readable explanations.
7. Output MULTIPLE Python pipelines, one for each recommended model.

-------------------------
RESPONSE FORMAT:
-------------------------

### (1) JSON SUMMARY
Emit a single JSON object in a code block:
{
  "task_type": "...",
  "target_column": "...",
  "problem_statement": "...",
  "recommended_pipeline_steps": ["..."],
  "main_model_choices": ["Model A", "Model B"],
  "expected_eval_metrics": ["..."],
  "optimization_techniques": ["Technique 1", "Technique 2"], 
  "extra_eval_metrics": ["Metric A", "Metric B"],
  "warnings": { "pii_warning": "no", "sensitive_domain_warning": "no", "data_quality_notes": [] },
  "assumptions": [],
  "confidence": "high"
}

### (2) HUMAN SUMMARY
- Bullet points
- Checklist
- Metric explanation

### (3) PYTHON CODE (MULTIPLE BLOCKS)
You MUST generate a separate, complete, runnable Python pipeline for EACH model listed in 'main_model_choices' (limit to top 3).
Each pipeline must be in its own Python code block with a specific comment header.

Format:

\`\`\`python
# MODEL: Model A
import pandas as pd
# ... full pipeline using Model A ...
\`\`\`

\`\`\`python
# MODEL: Model B
import pandas as pd
# ... full pipeline using Model B ...
\`\`\`

**Code Requirements:**
- load_data, preprocess, train, evaluate, save, predict.
- Preprocessing: Handle missing values, encoding, scaling.
- Safety: If PII warning is 'yes', drop those columns in code.
- ALWAYS generate the code, even if warnings exist. Do not suppress it.
`;

export const analyzeDataset = async (dataset: DatasetInfo, userTarget?: string): Promise<MLAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
filename: ${dataset.filename}
rows: ${dataset.rowCount}
columns: ${dataset.colCount}
target: ${userTarget || "Infer from data if possible, otherwise treat as unsupervised or ask user"}
sample:
${dataset.sample}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, 
        maxOutputTokens: 8192, 
      },
    });

    const text = response.text || "";
    return parseResponse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const parseResponse = (text: string): MLAnalysisResult => {
  let jsonSummary: JSONSummary | null = null;
  let humanSummary = "";
  let pythonCode = ""; // Fallback for raw text
  const modelCodeMap: Record<string, string> = {};

  // 1. Extract JSON
  const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/i;
  const jsonMatch = text.match(jsonRegex);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      jsonSummary = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn("Failed to parse JSON summary", e);
    }
  }

  // 2. Extract Python Code Blocks
  // We look for patterns like ```python ... ```
  // And inside those blocks, we look for "# MODEL: <name>"
  const codeBlockRegex = /```python([\s\S]*?)```/gi;
  let match;
  let firstCodeBlock = "";

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const codeContent = match[1].trim();
    if (!firstCodeBlock) firstCodeBlock = codeContent;

    // Check for model header
    const modelHeaderMatch = codeContent.match(/^#\s*MODEL:\s*(.+)$/m);
    if (modelHeaderMatch) {
      const modelName = modelHeaderMatch[1].trim();
      modelCodeMap[modelName] = codeContent;
    } else {
      // If no header found, but we have a JSON summary with models, 
      // we might assign it to the first model if map is empty
      if (jsonSummary && jsonSummary.main_model_choices && jsonSummary.main_model_choices.length > 0 && Object.keys(modelCodeMap).length === 0) {
         modelCodeMap[jsonSummary.main_model_choices[0]] = codeContent;
      }
    }
  }

  // If we found code blocks but no headers were parsed correctly, fallback
  if (Object.keys(modelCodeMap).length === 0 && firstCodeBlock) {
     if (jsonSummary && jsonSummary.main_model_choices.length > 0) {
        modelCodeMap[jsonSummary.main_model_choices[0]] = firstCodeBlock;
     } else {
        modelCodeMap["Default Pipeline"] = firstCodeBlock;
     }
  }

  pythonCode = firstCodeBlock;

  // 3. Extract Human Summary
  const summaryHeader = "### (2) HUMAN SUMMARY";
  const codeHeader = "### (3) PYTHON CODE";
  
  const summaryStart = text.indexOf(summaryHeader);
  const codeStart = text.indexOf(codeHeader);

  if (summaryStart !== -1) {
    if (codeStart !== -1) {
      humanSummary = text.substring(summaryStart + summaryHeader.length, codeStart).trim();
    } else {
      humanSummary = text.substring(summaryStart + summaryHeader.length).trim();
    }
  } else {
    // Fallback cleanup
    humanSummary = text
      .replace(jsonMatch ? jsonMatch[0] : "", "")
      .replace(/```python[\s\S]*?```/g, "") // Remove all code blocks
      .trim();
  }

  return {
    jsonSummary,
    humanSummary,
    pythonCode,
    modelCodeMap,
    rawResponse: text
  };
};