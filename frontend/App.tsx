
import React, { useState, useEffect } from 'react';
import FacultyDashboard from './components/FacultyDashboard';
import StudentChat from './components/StudentChat';
import Login from './components/Login';
import { Note, User } from './types';
import { db } from './services/db';
import { WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load data when user logs in
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsLoadingData(true);
        try {
          const [fetchedNotes, fetchedSubjects] = await Promise.all([
            db.getNotes(),
            db.getSubjects()
          ]);
          setNotes(fetchedNotes);
          setSubjects(fetchedSubjects);
          
          // Check if DB service switched to offline mode during fetch
          if (db.isOffline) {
            setIsOfflineMode(true);
          }
        } catch (error) {
          console.error("Failed to load data", error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    loadData();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Check immediately after login if we fell back
    if (db.isOffline) {
      setIsOfflineMode(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setNotes([]);
    setSubjects([]);
  };

  const handleAddNote = async (newNote: Note) => {
    // Optimistic update
    setNotes(prev => [newNote, ...prev]);
    // Persist
    await db.addNote(newNote);
    // Refresh to ensure consistency (optional)
    const freshNotes = await db.getNotes();
    setNotes(freshNotes);
  };

  const handleDeleteNote = async (id: string) => {
    // Optimistic update
    setNotes(prev => prev.filter(n => n.id !== id));
    // Persist
    await db.deleteNote(id);
  };

  const handleAddSubject = async (newSubject: string) => {
    if (!subjects.includes(newSubject)) {
      setSubjects(prev => [...prev, newSubject]);
      await db.addSubject(newSubject);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isOfflineMode && (
        <div className="bg-amber-100 text-amber-800 text-xs font-medium py-1 px-4 text-center border-b border-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" />
          <span>Offline Mode: Backend server not detected. Using local browser storage. (Run 'node backend/server.js' to use MongoDB)</span>
        </div>
      )}
      
      {user.role === 'FACULTY' ? (
        <FacultyDashboard 
          user={user}
          notes={notes}
          subjects={subjects}
          onAddNote={handleAddNote} 
          onDeleteNote={handleDeleteNote}
          onAddSubject={handleAddSubject}
          onLogout={handleLogout}
        />
      ) : (
        <StudentChat 
          user={user}
          notes={notes} 
          subjects={subjects}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;