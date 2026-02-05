
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeAudio = async (base64Audio: string, mimeType: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We use gemini-3-flash-preview for its multi-modal capabilities including audio processing
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: `Please transcribe this audio and provide a detailed analysis. 
          Return the response in a structured JSON format with the following fields:
          - transcription: The full text transcription of the audio.
          - executiveSummary: A concise professional summary of the discussion.
          - actionItems: A list of objects with 'task' and 'assignee' (use 'Unassigned' if not mentioned).
          - sentiment: One of 'Positive', 'Neutral', or 'Negative'.
          - sentimentReasoning: A brief explanation of the sentiment choice.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                assignee: { type: Type.STRING }
              },
              required: ["task", "assignee"]
            }
          },
          sentiment: { type: Type.STRING },
          sentimentReasoning: { type: Type.STRING }
        },
        required: ["transcription", "executiveSummary", "actionItems", "sentiment", "sentimentReasoning"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as AnalysisResult;
};

// Helper for the Python Script requested by the user
export const getPythonScript = () => `
import os
import whisper
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

def process_audio(file_path):
    print(f"--- Transcribing {file_path} locally using Whisper ---")
    model = whisper.load_model("base")
    result = model.transcribe(file_path)
    transcription = result["text"]
    
    print("--- Summarizing with Gemini Pro via LangChain ---")
    llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.getenv("GOOGLE_API_KEY"))
    
    template = """
    You are a professional meeting assistant. Analyze the following transcript:
    
    TRANSCRIPT:
    {transcript}
    
    Please generate:
    a) Executive Summary: A high-level overview of the discussion.
    b) Action Items: List each task and its assignee (if mentioned).
    c) Sentiment Analysis: Analyze the overall tone.
    
    Return the result in clean Markdown format.
    """
    
    prompt = PromptTemplate(template=template, input_variables=["transcript"])
    chain = LLMChain(llm=llm, prompt=prompt)
    
    summary = chain.run(transcription)
    
    # Save to Markdown
    output_filename = "analysis_output.md"
    with open(output_filename, "w") as f:
        f.write("# Audio Analysis Report\\n\\n")
        f.write(f"## Transcript\\n{transcription}\\n\\n")
        f.write(summary)
    
    print(f"--- Success! Analysis saved to {output_filename} ---")

if __name__ == "__main__":
    path = input("Enter audio file path: ")
    process_audio(path)
`;

export const getRequirementsTxt = () => `
openai-whisper
langchain-google-genai
google-generativeai
python-dotenv
`;

export const getReadmeMd = () => `
# Audio Analysis Script

This script transcribes audio locally using OpenAI's Whisper and summarizes it using Google's Gemini Pro API.

## Setup

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Set up your Google API Key:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Generate an API Key
   - Set it as an environment variable:
     \`\`\`bash
     export GOOGLE_API_KEY='your-api-key-here'
     \`\`\`

3. Run the script:
   \`\`\`bash
   python script.py
   \`\`\`
`;
