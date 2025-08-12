import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';

const UserManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedUserStats, setSelectedUserStats] = useState(null);
  
  // Formularz nowego użytkownika
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user'
  });
  
  // Sprawdź uprawnienia
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Błąd pobierania użytkowników:', error);
      setError('Błąd pobierania użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    if (!newUser.email || !newUser.password) {
      setError('Email i hasło są wymagane');
      return;
    }

    try {
      await axios.post('/api/auth/register', {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
      
      await fetchUsers();
      setShowAddModal(false);
      setNewUser({ email: '', password: '', role: 'user' });
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd dodawania użytkownika');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!isSuperAdmin) {
      setError('Tylko super administrator może zmieniać role');
      return;
    }

    try {
      await axios.put(`/users/${userId}/role`, { role: newRole });
      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd aktualizacji roli');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Czy na pewno chcesz zresetować hasło tego użytkownika?')) {
      return;
    }

    try {
      const response = await axios.post(`/users/${userId}/reset-password`);
      alert(`Nowe hasło: ${response.data.newPassword}\n\nZapisz je i przekaż użytkownikowi!`);
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd resetowania hasła');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      return;
    }

    try {
      await axios.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd usuwania użytkownika');
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      const response = await axios.get(`/users/${userId}/stats`);
      setSelectedUserStats({ userId, stats: response.data });
      setShowStatsModal(true);
    } catch (error) {
      setError('Błąd pobierania statystyk');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-red-600">Brak uprawnień do tej strony</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-light-textSecondary dark:text-gray-400">Ładowanie...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-light-text dark:text-white">
            Zarządzanie użytkownikami
          </h1>
          
          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              + Dodaj użytkownika
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Lista użytkowników */}
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg shadow-lg p-4`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-light-text dark:text-white">
                      {u.email}
                    </h3>
                    <span className="text-sm text-light-textSecondary dark:text-gray-400">
                      • Utworzono: {u.created_at ? new Date(u.created_at).toLocaleDateString('pl-PL') : 'Nieznana data'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2">
                    {editingUser === u.id && isSuperAdmin ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        onBlur={() => setEditingUser(null)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          isDarkMode 
                            ? 'bg-dark-bg border-dark-border text-white' 
                            : 'bg-light-bg border-light-border'
                        } focus:ring-2 focus:ring-primary outline-none`}
                        autoFocus
                      >
                        <option value="user">Użytkownik</option>
                        <option value="admin">Administrator</option>
                        <option value="super_admin">Super Administrator</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${
                        u.role === 'super_admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                          : u.role === 'admin'
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                      }`}>
                        {u.role === 'super_admin' ? 'Super Admin' : 
                         u.role === 'admin' ? 'Admin' : 'Użytkownik'}
                      </span>
                    )}
                    
                    {!u.email_verified && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded">
                        Email niezweryfikowany
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Statystyki */}
                  <button
                    onClick={() => fetchUserStats(u.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
                    title="Statystyki"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>

                  {isSuperAdmin && u.id !== user.id && (
                    <>
                      {/* Edytuj rolę */}
                      <button
                        onClick={() => setEditingUser(u.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
                        title="Zmień rolę"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>

                      {/* Reset hasła */}
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-600 rounded-lg transition-colors"
                        title="Resetuj hasło"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      </button>

                      {/* Usuń */}
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        title="Usuń użytkownika"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-light-textSecondary dark:text-gray-400">
              Nie ma jeszcze żadnych użytkowników
            </p>
          </div>
        )}

        {/* Modal dodawania użytkownika */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`w-full max-w-md ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6`}>
              <h2 className="text-xl font-bold mb-4 text-light-text dark:text-white">
                Dodaj nowego użytkownika
              </h2>
              
              <form onSubmit={handleAddUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-light-bg border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                      Hasło
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-light-bg border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-light-text dark:text-gray-300">
                      Rola
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-light-bg border-light-border'
                      } focus:ring-2 focus:ring-primary outline-none`}
                    >
                      <option value="user">Użytkownik</option>
                      <option value="admin">Administrator</option>
                      <option value="super_admin">Super Administrator</option>
                    </select>
                  </div>
                </div>
                
                {error && (
                  <p className="text-red-600 text-sm mt-4">{error}</p>
                )}
                
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                  >
                    Dodaj użytkownika
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewUser({ email: '', password: '', role: 'user' });
                      setError('');
                    }}
                    className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal statystyk */}
        {showStatsModal && selectedUserStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`w-full max-w-md ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6`}>
              <h2 className="text-xl font-bold mb-4 text-light-text dark:text-white">
                Statystyki użytkownika
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-light-text dark:text-gray-300">Ukończone odcinki:</span>
                  <span className="font-semibold text-light-text dark:text-white">
                    {selectedUserStats.stats.completedEpisodes}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-light-text dark:text-gray-300">W trakcie słuchania:</span>
                  <span className="font-semibold text-light-text dark:text-white">
                    {selectedUserStats.stats.inProgressEpisodes}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-light-text dark:text-gray-300">Ulubione odcinki:</span>
                  <span className="font-semibold text-light-text dark:text-white">
                    {selectedUserStats.stats.favoriteEpisodes}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-light-text dark:text-gray-300">Czas słuchania:</span>
                  <span className="font-semibold text-light-text dark:text-white">
                    {Math.floor(selectedUserStats.stats.totalListeningTime / 3600)}h {Math.floor((selectedUserStats.stats.totalListeningTime % 3600) / 60)}m
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedUserStats(null);
                }}
                className="w-full mt-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;