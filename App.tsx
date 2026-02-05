
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileAudio, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileCode, 
  ChevronRight, 
  BrainCircuit, 
  Target, 
  MessageSquareQuote,
  LayoutDashboard
} from 'lucide-react';
import { AppState, AnalysisResult } from './types';
import { analyzeAudio, getPythonScript, getRequirementsTxt, getReadmeMd } from './services/geminiService';

export default function App() {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (rough 20MB limit for browser-based Gemini base64 uploads)
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Please select an audio file under 20MB.");
      setState(AppState.ERROR);
      return;
    }

    setFileName(file.name);
    setState(AppState.UPLOADING);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        const mimeType = file.type || 'audio/mpeg';

        setState(AppState.ANALYZING);
        const analysis = await analyzeAudio(base64Data, mimeType);
        setResult(analysis);
        setState(AppState.COMPLETED);
      };
      reader.onerror = () => {
        throw new Error("Failed to read file");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
      setState(AppState.ERROR);
    }
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const content = `
# Audio Analysis: ${fileName}

## Executive Summary
${result.executiveSummary}

## Sentiment Analysis
**Tone:** ${result.sentiment}
**Reasoning:** ${result.sentimentReasoning}

## Action Items
${result.actionItems.map(item => `- [ ] **${item.task}** (Assignee: ${item.assignee})`).join('\n')}

## Full Transcription
${result.transcription}
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName?.split('.')[0] || 'analysis'}_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSource = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              AudioInsights AI
            </h1>
          </div>
          {state === AppState.COMPLETED && (
            <button
              onClick={downloadMarkdown}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
        {/* Hero Section */}
        {state === AppState.IDLE && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Transcribe & Analyze Meetings in Seconds
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Upload your audio files to get instant executive summaries, action items, and sentiment analysis powered by Gemini AI.
            </p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group bg-white shadow-sm"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="audio/*"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileAudio className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-slate-900 font-semibold text-lg">Click to select audio file</p>
                <p className="text-slate-500 text-sm mt-1">MP3, WAV, M4A up to 20MB</p>
              </div>
            </div>

            {/* Script Source Section */}
            <div className="mt-12 p-6 bg-slate-100/80 rounded-xl border border-slate-200 text-left">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Developer Assets (Python Script)
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Need to run this locally? Download the Python script using Whisper and LangChain.
              </p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => downloadSource(getPythonScript(), "transcribe_summary.py")}
                  className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm"
                >
                  Download script.py
                </button>
                <button 
                  onClick={() => downloadSource(getRequirementsTxt(), "requirements.txt")}
                  className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm"
                >
                  requirements.txt
                </button>
                <button 
                  onClick={() => downloadSource(getReadmeMd(), "README.md")}
                  className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm"
                >
                  README.md
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(state === AppState.UPLOADING || state === AppState.ANALYZING) && (
          <div className="max-w-xl mx-auto text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {state === AppState.UPLOADING ? 'Reading Audio...' : 'AI Analysis in Progress...'}
            </h3>
            <p className="text-slate-600">
              We're transcribing your file and extracting insights. This usually takes 15-30 seconds.
            </p>
            <div className="mt-8 bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
              <FileAudio className="w-5 h-5 text-indigo-600" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === AppState.ERROR && (
          <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-2xl border border-red-100 shadow-xl p-8">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => setState(AppState.IDLE)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Dashboard */}
        {state === AppState.COMPLETED && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Main Insights Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Executive Summary Card */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Executive Summary</h3>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 leading-relaxed text-lg italic border-l-4 border-indigo-100 pl-4 py-2">
                    {result.executiveSummary}
                  </p>
                </div>
              </section>

              {/* Action Items Card */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Action Items</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {result.actionItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                        <div className="mt-1">
                          <CheckCircle2 className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium">{item.task}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assignee:</span>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">
                              {item.assignee}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.actionItems.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No specific action items identified.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Transcription Card */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Transcript</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-slate-50 rounded-xl p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                    <p className="text-slate-600 leading-relaxed font-mono text-sm whitespace-pre-wrap">
                      {result.transcription}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Side Column */}
            <div className="space-y-6">
              {/* Sentiment Card */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Sentiment Analysis</h3>
                </div>
                <div className="p-6 text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold mb-4 shadow-sm ${
                    result.sentiment === 'Positive' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' :
                    result.sentiment === 'Negative' ? 'bg-red-100 text-red-700 ring-2 ring-red-200' :
                    'bg-slate-100 text-slate-700 ring-2 ring-slate-200'
                  }`}>
                    {result.sentiment}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed px-2">
                    {result.sentimentReasoning}
                  </p>
                </div>
              </section>

              {/* File Metadata Card */}
              <section className="bg-indigo-900 text-white rounded-2xl shadow-xl overflow-hidden p-6 relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileAudio className="w-24 h-24" />
                </div>
                <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">Processed File</h3>
                <div className="relative z-10">
                  <p className="text-xl font-bold truncate mb-1">{fileName}</p>
                  <p className="text-indigo-300 text-sm">Analysis complete</p>
                  <button 
                    onClick={() => setState(AppState.IDLE)}
                    className="mt-6 w-full py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    Upload New File
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            </div>

          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
}
