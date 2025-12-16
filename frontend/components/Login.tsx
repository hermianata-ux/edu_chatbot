import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { GraduationCap, Users, Lock, ArrowRight, BookOpen, User as UserIcon, Mail } from 'lucide-react';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<UserRole>('STUDENT');
  
  // Form Fields
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setError('');
    setId('');
    setPassword('');
    setName('');
    setEmail('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await db.resetPassword(email, activeTab, password);
      alert("Password successfully reset. Please login with your new password.");
      setIsForgotPassword(false);
      setPassword('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const newUser = await db.signup({
          id,
          name,
          email,
          password,
          role: activeTab
        });
        onLogin(newUser);
      } else {
        // Login Logic
        const user = await db.login(id, password, activeTab);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid ID or Password. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderText = () => {
    if (isForgotPassword) return 'Reset Password';
    if (isSignUp) return `Create ${activeTab === 'FACULTY' ? 'Faculty' : 'Student'} Account`;
    return 'Welcome Back';
  };

  const getSubHeaderText = () => {
    if (isForgotPassword) return 'Enter your email to set a new password';
    if (isSignUp) return 'Fill in your details to get started';
    return 'Enter your credentials to access your notes';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-indigo-50 p-6 text-center border-b border-indigo-100">
          <div className="flex justify-center mb-3">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">EduNote Bot</h1>
          <p className="text-indigo-600 font-medium text-sm mt-1">Smart Learning Assistant</p>
        </div>

        {/* Role Tabs */}
        <div className="flex p-2 bg-gray-50 m-4 rounded-xl border border-gray-200">
          <button
            onClick={() => { setActiveTab('STUDENT'); resetForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'STUDENT'
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Student
          </button>
          <button
            onClick={() => { setActiveTab('FACULTY'); resetForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'FACULTY'
                ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Faculty
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-8 pb-2 text-center">
            <h2 className="text-lg font-bold text-gray-800">
                {getHeaderText()}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
                {getSubHeaderText()}
            </p>
        </div>

        {/* Form */}
        <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="px-8 pb-8 pt-4 flex-1 flex flex-col gap-4">
          
          {isForgotPassword ? (
            // Forgot Password Fields
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                    placeholder="e.g. john@university.edu"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            // Login / Signup Fields
            <>
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 ml-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                        placeholder="e.g. john@university.edu"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 ml-1">
                  {activeTab === 'FACULTY' ? 'Faculty ID' : 'Roll Number'}
                </label>
                <div className="relative">
                   <div className="absolute left-3 top-3.5 flex items-center justify-center w-4 h-4 text-gray-400 font-bold text-xs border border-gray-400 rounded-sm">#</div>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                    placeholder={activeTab === 'FACULTY' ? "e.g., F-101" : "e.g., 2024-CSE-001"}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => { setIsForgotPassword(true); resetForm(); }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                    >
                        Forgot Password?
                    </button>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-2 group"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Login')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <div className="text-center mt-2">
            <button 
                type="button"
                onClick={() => { 
                    if(isForgotPassword) setIsForgotPassword(false);
                    else setIsSignUp(!isSignUp); 
                    resetForm(); 
                }}
                className="text-xs text-indigo-600 font-semibold hover:underline"
            >
                {isForgotPassword ? 'Back to Login' : (isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;