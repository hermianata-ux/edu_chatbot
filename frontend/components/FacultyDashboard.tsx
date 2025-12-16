import React, { useState, useRef } from 'react';
import { Note, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, FileText, Trash2, BookOpen, Bell, Plus, File, X, LogOut, FolderPlus } from 'lucide-react';

interface FacultyDashboardProps {
  user: User;
  notes: Note[];
  subjects: string[];
  onAddNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onAddSubject: (subject: string) => void;
  onLogout: () => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ 
  user, 
  notes, 
  subjects, 
  onAddNote, 
  onDeleteNote, 
  onAddSubject,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'analytics'>('content');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  
  // Form State
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState<string>('');
  const [newNoteUnit, setNewNoteUnit] = useState('Unit 1');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Subject State
  const [newSubjectName, setNewSubjectName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default subject when subjects load or change
  React.useEffect(() => {
    if (subjects.length > 0 && !newNoteSubject) {
      setNewNoteSubject(subjects[0]);
    }
  }, [subjects, newNoteSubject]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic client-side validation for PDF/Text
      if (file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
        alert("Please upload a PDF or Text file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const getFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // remove data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const base64Data = await getFileBase64(selectedFile);
      
      let fileType: Note['type'] = 'TXT';
      if (selectedFile.type.includes('pdf')) {
        fileType = 'PDF';
      }

      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle,
        subject: newNoteSubject || subjects[0],
        unit: newNoteUnit,
        content: `File: ${selectedFile.name}`,
        uploadedAt: new Date().toLocaleDateString(),
        views: 0,
        type: fileType,
        fileData: base64Data,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream'
      };

      onAddNote(newNote);
      setShowUploadModal(false);
      setNewNoteTitle('');
      setNewNoteUnit('Unit 1');
      setSelectedFile(null);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      onAddSubject(newSubjectName.trim());
      setNewSubjectName('');
      setShowSubjectModal(false);
    }
  };

  // Analytics Data Preparation
  const subjectData = subjects.map(subj => {
    const subjNotes = notes.filter(n => n.subject === subj);
    return {
      name: subj.length > 8 ? subj.substring(0, 8) + '...' : subj,
      fullName: subj,
      documents: subjNotes.length,
      views: subjNotes.reduce((acc, curr) => acc + curr.views, 0)
    };
  }).filter(d => d.documents > 0 || activeTab === 'analytics');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
             <h1 className="text-xl font-bold text-gray-800">Faculty Admin Panel</h1>
             <p className="text-xs text-gray-500">Manage notes and subjects</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'content'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage Content
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Analytics & Insights
          </button>
        </div>

        {activeTab === 'content' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Uploaded Materials</h2>
              <div className="flex gap-3">
                 <button
                  onClick={() => setShowSubjectModal(true)}
                  className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                  Add Subject
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Upload Note
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No notes uploaded yet</h3>
                <p className="text-gray-500 mt-1">Upload PDF or Text documents to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow group relative flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          note.type === 'PDF' ? 'bg-red-50 text-red-600' :
                          note.type === 'PPT' ? 'bg-orange-50 text-orange-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded truncate max-w-[120px]">
                          {note.subject}
                        </span>
                      </div>
                      <button 
                        onClick={() => onDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{note.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{note.unit} • {note.uploadedAt}</p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <File className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{note.fileName}</span>
                      </div>
                      <span>{note.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Student Engagement per Subject</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="views" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Content Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="documents"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Upload Material</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g., Introduction to Relational Model"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNoteSubject}
                    onChange={(e) => setNewNoteSubject(e.target.value)}
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit/Module</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Unit 3"
                    value={newNoteUnit}
                    onChange={(e) => setNewNoteUnit(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    selectedFile ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.md"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                      <p className="text-sm font-medium text-indigo-900">{selectedFile.name}</p>
                      <p className="text-xs text-indigo-600 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="mt-3 text-xs bg-white text-gray-600 border px-3 py-1 rounded hover:bg-gray-50"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PDF or Text (Max 4MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publish to Students
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Add New Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  required
                  type="text"
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Cloud Computing"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;