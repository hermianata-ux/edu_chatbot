import React, { useState, useRef, useEffect } from 'react';
import { Note, ChatMessage, User } from '../types';
import { generateAnswer, generateQuiz } from '../services/geminiService';
import { Send, User as UserIcon, Bot, Sparkles, Book, HelpCircle, GraduationCap, LogOut, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudentChatProps {
  user: User;
  notes: Note[];
  subjects: string[];
  onLogout: () => void;
}

const StudentChat: React.FC<StudentChatProps> = ({ user, notes, subjects, onLogout }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `👋 Hi ${user.name}! I'm EduNote Bot. I've read all the notes uploaded by your faculty.  `,
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    const responseText = await generateAnswer(userMsg.text, history, notes, selectedSubject);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const requestQuiz = async (subject: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `Give me a quiz for ${subject}`,
      timestamp: Date.now()
    };
    setHistory(prev => [...prev, userMsg]);
    setIsLoading(true);
    const quizText = await generateQuiz(subject, notes);
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: quizText,
      timestamp: Date.now()
    };
    setHistory(prev => [...prev, botMsg]);
    setIsLoading(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-8 text-indigo-600 px-2">
          <GraduationCap className="w-8 h-8" />
          <h1 className="text-xl font-bold text-gray-800">EduNote</h1>
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Focus Subject</label>
          <select 
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
             <button 
                onClick={() => setQuery("Summarize the latest notes for me")}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" /> Summarize Recent
             </button>
             <button 
                onClick={() => setQuery("What are the important topics for exams?")}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-blue-500" /> Exam Topics
             </button>
             {selectedSubject && (
               <button 
                onClick={() => requestQuiz(selectedSubject)}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center gap-2 transition-colors"
               >
                 <Book className="w-4 h-4 text-green-500" /> Take {selectedSubject} Quiz
               </button>
             )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 mt-auto">
           <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                 {user.name.charAt(0)}
               </div>
               <div className="overflow-hidden">
                 <p className="text-sm font-semibold text-gray-700 truncate w-32">{user.name}</p>
                 <p className="text-[10px] text-gray-500">Student</p>
               </div>
             </div>
             <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
               <LogOut className="w-4 h-4" />
             </button>
           </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-gray-200 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 text-indigo-600">
               <GraduationCap className="w-6 h-6" />
               <span className="font-bold text-gray-800">EduNote</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
            </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-[60px] left-0 w-full bg-white z-20 border-b border-gray-200 shadow-lg md:hidden p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Subject</label>
              <select 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setIsMobileMenuOpen(false); }}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="pt-2 border-t border-gray-100">
               <button onClick={onLogout} className="flex items-center gap-2 text-red-500 text-sm font-medium w-full p-2">
                 <LogOut className="w-4 h-4" /> Logout
               </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide"
          ref={scrollRef}
        >
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[90%] md:max-w-[75%] gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div 
                  className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'model' ? (
                     <div className="prose prose-sm max-w-none prose-indigo prose-p:my-1 prose-headings:my-2">
                        <ReactMarkdown 
                           components={{
                             ul: ({node, ...props}) => <ul {...props} className="list-disc list-outside ml-4" />,
                             ol: ({node, ...props}) => <ol {...props} className="list-decimal list-outside ml-4" />
                           }}
                        >
                           {msg.text}
                        </ReactMarkdown>
                     </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="flex max-w-[70%] gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                 </div>
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 md:p-6 border-t border-gray-200">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedSubject ? `Ask a doubt about ${selectedSubject}...` : "Ask a doubt from any subject notes..."}
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 pr-12 shadow-sm outline-none transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!query.trim() || isLoading}
              className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentChat;