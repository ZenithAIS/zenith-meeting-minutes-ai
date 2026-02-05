
export interface ActionItem {
  task: string;
  assignee: string;
}

export interface AnalysisResult {
  transcription: string;
  executiveSummary: string;
  actionItems: ActionItem[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentReasoning: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  TRANSCRIBING = 'TRANSCRIBING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
