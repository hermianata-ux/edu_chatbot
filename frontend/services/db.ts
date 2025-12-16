
import { Note, User, UserRole } from '../types';

const API_URL = 'http://localhost:5000/api';

class DatabaseService {
  public isOffline = false;
  
  private async request(endpoint: string, options: RequestInit = {}) {
    // If we already know we are offline, don't try fetching
    if (this.isOffline) {
      throw new Error("OFFLINE_MODE");
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // If the server is unreachable (Failed to fetch), switch to offline mode
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
         console.warn("Backend unreachable. Switching to Offline Mode (LocalStorage).");
         this.isOffline = true;
         throw new Error("OFFLINE_MODE");
      }
      throw error;
    }
  }

  // --- Helpers for Local Storage (Fallback) ---
  
  private getLocal<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setLocal(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Auth / User Methods ---

  async signup(data: { id: string; name: string; email: string; password: string; role: UserRole }): Promise<User> {
    try {
      return await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        const users = this.getLocal<User[]>('users', []);
        if (users.find(u => u.id === data.id && u.role === data.role)) {
          throw new Error('User ID already exists locally.');
        }
        const newUser: User = { ...data }; // In real app, don't store plain password
        users.push(newUser);
        this.setLocal('users', users);
        return newUser;
      }
      throw error;
    }
  }

  async login(id: string, password: string, role: UserRole): Promise<User | null> {
    try {
      return await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ id, password, role }),
      });
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        const users = this.getLocal<any[]>('users', []);
        const user = users.find(u => u.id === id && u.password === password && u.role === role);
        return user || null;
      }
      throw error;
    }
  }

  async resetPassword(email: string, role: UserRole, newPassword: string): Promise<void> {
    try {
      await this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, role, newPassword }),
      });
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        const users = this.getLocal<any[]>('users', []);
        const userIndex = users.findIndex(u => u.email === email && u.role === role);
        if (userIndex === -1) throw new Error('User not found locally.');
        
        users[userIndex].password = newPassword;
        this.setLocal('users', users);
        return;
      }
      throw error;
    }
  }

  // --- Note Methods ---

  async getNotes(): Promise<Note[]> {
    try {
      return await this.request('/notes');
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        return this.getLocal<Note[]>('notes', []);
      }
      throw error;
    }
  }

  async addNote(note: Note): Promise<Note> {
    try {
      return await this.request('/notes', {
        method: 'POST',
        body: JSON.stringify(note),
      });
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        const notes = this.getLocal<Note[]>('notes', []);
        notes.unshift(note);
        this.setLocal('notes', notes);
        return note;
      }
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await this.request(`/notes/${id}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        let notes = this.getLocal<Note[]>('notes', []);
        notes = notes.filter(n => n.id !== id);
        this.setLocal('notes', notes);
        return;
      }
      throw error;
    }
  }

  // --- Subject Methods ---

  async getSubjects(): Promise<string[]> {
    try {
      return await this.request('/subjects');
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        return this.getLocal<string[]>('subjects', [
          'DBMS', 'Operating Systems', 'Computer Networks'
        ]);
      }
      throw error;
    }
  }

  async addSubject(subject: string): Promise<string> {
    try {
      const res = await this.request('/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: subject }),
      });
      return res.name;
    } catch (error: any) {
      if (error.message === 'OFFLINE_MODE') {
        const subjects = this.getLocal<string[]>('subjects', ['DBMS', 'Operating Systems']);
        if (!subjects.includes(subject)) {
          subjects.push(subject);
          this.setLocal('subjects', subjects);
        }
        return subject;
      }
      throw error;
    }
  }
}

export const db = new DatabaseService();