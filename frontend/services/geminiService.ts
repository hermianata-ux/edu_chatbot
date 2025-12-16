import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Note, ChatMessage } from "../types";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in process.env");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

// List of MIME types supported by Gemini 1.5/2.0 Flash for inlineData
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/html',
  'text/markdown',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

/**
 * Generates a response based on the student's query and the provided knowledge base (notes).
 * Uses Gemini's multimodal capabilities to process PDFs/Images directly.
 */
export const generateAnswer = async (
  query: string,
  history: ChatMessage[],
  knowledgeBase: Note[],
  selectedSubject?: string
): Promise<string> => {
  const ai = getGeminiClient();
  
  // Filter knowledge base if a specific subject is selected
  // Sort by upload date (descending) to get the most relevant/recent info and limit context
  const relevantNotes = (selectedSubject 
    ? knowledgeBase.filter(n => n.subject === selectedSubject)
    : knowledgeBase
  ).sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3); // Limit to top 3 notes to avoid payload size issues in this demo

  const systemInstruction = `
    You are EduNote Bot, a helpful teaching assistant. 
    Your goal is to answer student questions strictly based on the provided educational materials (Context).
    
    Rules:
    1. The user will provide files (PDFs/Images/Text) as context. Use the content of these files to answer.
    2. If the answer is found in the context, be detailed and helpful.
    3. If the answer is NOT in the context, state that "This topic is not covered in the current faculty notes."
    4. Provide summaries, bullet points, or step-by-step explanations when asked.
    5. Maintain a professional, encouraging academic tone.
  `;

  // Construct the contents parts with file data
  const contextParts = relevantNotes.map(note => {
    const isSupported = note.fileData && note.mimeType && SUPPORTED_MIME_TYPES.includes(note.mimeType);
    
    if (isSupported) {
      return {
        inlineData: {
          mimeType: note.mimeType!,
          data: note.fileData!
        }
      };
    } else {
      // Fallback for unsupported files (like PPT/DOCX) or text-only notes
      // We only send the title/content metadata so the AI knows the file exists but cannot read it.
      return {
        text: `\n--- Note Metadata: ${note.title} ---\nSubject: ${note.subject}\nUnit: ${note.unit}\nDescription: ${note.content}\n(Note: The actual file content of type '${note.type}' is not readable by the AI, rely on the description/title)\n`
      };
    }
  });

  if (relevantNotes.length === 0) {
     return "No notes have been uploaded for this subject yet. Please ask the faculty to upload materials.";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: "Here are the relevant course materials/notes:" },
            ...contextParts,
            { text: `\nStudent Question: ${query}` }
          ] 
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error while processing your request. Please ensure the uploaded files are valid PDF or Text files.";
  }
};

/**
 * Generates a few relevant MCQs based on the notes.
 */
export const generateQuiz = async (subject: string, knowledgeBase: Note[]): Promise<string> => {
  const ai = getGeminiClient();
  const relevantNotes = knowledgeBase.filter(n => n.subject === subject).slice(0, 2);

  if (relevantNotes.length === 0) return "No notes available for this subject to generate a quiz.";

  const contextParts = relevantNotes.map(note => {
    const isSupported = note.fileData && note.mimeType && SUPPORTED_MIME_TYPES.includes(note.mimeType);
    
    if (isSupported) {
      return {
        inlineData: {
          mimeType: note.mimeType!,
          data: note.fileData!
        }
      };
    } else {
      return {
        text: `\n--- Note Metadata: ${note.title} ---\n${note.content}\n`
      };
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
             ...contextParts,
             { text: `Generate 3 Multiple Choice Questions (MCQs) based on these notes for ${subject}. Format the output clearly with the question, options, and the correct answer hidden or at the end.` }
          ]
        }
      ],
    });
    return response.text || "Could not generate quiz.";
  } catch (e) {
    console.error(e);
    return "Error generating quiz.";
  }
}