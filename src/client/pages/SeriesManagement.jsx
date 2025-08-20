import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import axios from 'axios';

const SeriesManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesColor, setNewSeriesColor] = useState('#3B82F6');
  const [newSeriesImage, setNewSeriesImage] = useState(null);
  const [newSeriesImagePreview, setNewSeriesImagePreview] = useState(null);
  const [editSeriesData, setEditSeriesData] = useState({ name: '', color: '', image: null, removeImage: false });
  const [editSeriesImagePreview, setEditSeriesImagePreview] = useState(null);
  const [error, setError] = useState('');

  // Sprawdź uprawnienia
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Predefiniowane kolory
  const predefinedColors = [
    { name: 'Biznes', color: '#3B82F6' },
    { name: 'Technologia', color: '#10B981' },
    { name: 'Nauka', color: '#8B5CF6' },
    { name: 'Historia', color: '#EF4444' },
    { name: 'Marketing', color: '#F59E0B' },
    { name: 'Zdrowie', color: '#EC4899' },
    { name: 'Kultura', color: '#14B8A6' },
    { name: 'Sport', color: '#84CC16' }
  ];

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const response = await axios.get('/api/series');
      setSeries(response.data);
    } catch (error) {
      console.error('Błąd pobierania serii:', error);
      setError('Błąd pobierania serii');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditSeriesData({ ...editSeriesData, image: file, removeImage: false });
          setEditSeriesImagePreview(reader.result);
        } else {
          setNewSeriesImage(file);
          setNewSeriesImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditSeriesData({ ...editSeriesData, removeImage: true, image: null });
    setEditSeriesImagePreview(null);
  };

  const handleAddSeries = async (e) => {
    e.preventDefault();
    setError('');

    if (!newSeriesName.trim()) {
      setError('Nazwa serii jest wymagana');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newSeriesName);
      formData.append('color', newSeriesColor);
      if (newSeriesImage) {
        formData.append('image', newSeriesImage);
      }

      const response = await axios.post('/api/series', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSeries([...series, response.data]);
      setShowAddModal(false);
      setNewSeriesName('');
      setNewSeriesColor('#3B82F6');
      setNewSeriesImage(null);
      setNewSeriesImagePreview(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd dodawania serii');
    }
  };

  const handleUpdateSeries = async (id) => {
    try {
      const formData = new FormData();
      formData.append('name', editSeriesData.name);
      formData.append('color', editSeriesData.color);
      formData.append('active', editSeriesData.active ? 1 : 0);
      
      if (editSeriesData.removeImage) {
        formData.append('removeImage', 'true');
      } else if (editSeriesData.image) {
        formData.append('image', editSeriesData.image);
      }

      await axios.put(`/api/series/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      fetchSeries();
      setEditingSeries(null);
      setEditSeriesData({ name: '', color: '', image: null, removeImage: false });
      setEditSeriesImagePreview(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd aktualizacji serii');
    }
  };

  const handleDeleteSeries = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę serię?')) {
      return;
    }

    try {
      await axios.delete(`/api/series/${id}`);
      setSeries(series.filter(s => s.id !== id));
    } catch (error) {
      setError(error.response?.data?.error || 'Błąd usuwania serii');
    }
  };

  const startEditing = (seria) => {
    setEditingSeries(seria.id);
    setEditSeriesData({
      name: seria.name,
      color: seria.color || '#3B82F6',
      active: seria.active,
      image: null,
      removeImage: false
    });
    setEditSeriesImagePreview(seria.image ? seria.image : null);
  };

  const cancelEditing = () => {
    setEditingSeries(null);
    setEditSeriesData({ name: '', color: '', image: null, removeImage: false });
    setEditSeriesImagePreview(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-light-textSecondary dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6" data-testid="series-management">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-light-text dark:text-white">
            {t('series.management')}
          </h1>
          
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              {t('series.addSeries')}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Lista serii */}
        <div className="grid gap-4">
          {series.map((seria) => (
            <div
              key={seria.id}
              className={`${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6 shadow-lg transition-all ${
                isAdmin && seria.episode_count > 0 ? 'cursor-pointer hover:shadow-xl' : ''
              }`}
              onClick={(e) => {
                // Kliknij tylko jeśli nie kliknięto w przyciski
                if (isAdmin && seria.episode_count > 0 && !e.target.closest('button') && !e.target.closest('input') && !e.target.closest('form')) {
                  window.location.href = `/episodes?series=${seria.id}`;
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingSeries === seria.id ? (
                    <div className="space-y-4">
                      {/* Edycja nazwy i koloru */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={editSeriesData.name}
                          onChange={(e) => setEditSeriesData({ ...editSeriesData, name: e.target.value })}
                          className={`px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-dark-bg border-dark-border text-white' 
                              : 'bg-light-bg border-light-border'
                          } focus:ring-2 focus:ring-primary outline-none`}
                          placeholder="Nazwa serii"
                        />
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={editSeriesData.color}
                            onChange={(e) => setEditSeriesData({ ...editSeriesData, color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer"
                          />
                          <select
                            value={editSeriesData.color}
                            onChange={(e) => setEditSeriesData({ ...editSeriesData, color: e.target.value })}
                            className={`flex-1 p-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-dark-bg border-dark-border text-white' 
                                : 'bg-light-bg border-light-border'
                            }`}
                          >
                            {predefinedColors.map(({ name, color }) => (
                              <option key={color} value={color}>
                                {name} ({color})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Edycja grafiki */}
                      <div>
                        <label className="block mb-2 text-sm">Grafika serii (300x300 px)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, true)}
                          className={`w-full p-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-dark-bg border-dark-border text-white' 
                              : 'bg-light-bg border-light-border'
                          }`}
                        />
                        {editSeriesImagePreview && !editSeriesData.removeImage && (
                          <div className="mt-2 flex items-start gap-2">
                            <img 
                              src={editSeriesImagePreview} 
                              alt="Preview" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                              title="Usuń grafikę"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {editSeriesData.removeImage && (
                          <p className="mt-2 text-sm text-red-600">Grafika zostanie usunięta po zapisaniu</p>
                        )}
                      </div>

                      {/* Przyciski akcji */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editSeriesData.active}
                            onChange={(e) => setEditSeriesData({ ...editSeriesData, active: e.target.checked })}
                            className="mr-2"
                          />
                          Aktywna seria
                        </label>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateSeries(seria.id)}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
                          >
                            Zapisz
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Wyświetlanie serii */}
                      <div className="flex items-center space-x-4">
                        {seria.image ? (
                          <img 
                            src={seria.image}
                            alt={seria.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: seria.color || '#3B82F6' }}
                          >
                            {seria.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-light-text dark:text-white">
                            {seria.name}
                          </h3>
                          <p className="text-sm text-light-textSecondary dark:text-gray-400 mt-1">
                            {seria.episode_count || 0} odcinków
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!editingSeries && isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(seria)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
                      title="Edytuj"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <div className="relative group">
                      <button
                        onClick={() => handleDeleteSeries(seria.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          seria.episode_count > 0 
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
                            : 'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600'
                        }`}
                        disabled={seria.episode_count > 0}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      {seria.episode_count > 0 && (
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          Nie można usunąć - seria ma {seria.episode_count} {seria.episode_count === 1 ? 'odcinek' : seria.episode_count < 5 ? 'odcinki' : 'odcinków'}
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status serii */}
              {!editingSeries && (
                <div className="mt-4 flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    seria.active 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                  }`}>
                    {seria.active ? 'Aktywna' : 'Nieaktywna'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {series.length === 0 && (
          <div className="text-center py-12">
            <p className="text-light-textSecondary dark:text-gray-400">
              Nie ma jeszcze żadnych serii
            </p>
          </div>
        )}

        {/* Modal dodawania serii */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`w-full max-w-md ${isDarkMode ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-6`}>
              <h2 className="text-xl font-bold mb-4 text-light-text dark:text-white">
                Dodaj nową serię
              </h2>
              
              <form onSubmit={handleAddSeries} className="space-y-4" data-testid="add-series-form">
                <div>
                  <label className="block mb-2 text-sm">Nazwa serii</label>
                  <input
                    type="text"
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder="Nazwa serii"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-white' 
                        : 'bg-light-bg border-light-border'
                    } focus:ring-2 focus:ring-primary outline-none`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm">Kolor serii</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newSeriesColor}
                      onChange={(e) => setNewSeriesColor(e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <select
                      value={newSeriesColor}
                      onChange={(e) => setNewSeriesColor(e.target.value)}
                      className={`flex-1 p-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-dark-bg border-dark-border text-white' 
                          : 'bg-light-bg border-light-border'
                      }`}
                    >
                      {predefinedColors.map(({ name, color }) => (
                        <option key={color} value={color}>
                          {name} ({color})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm">Grafika serii (300x300 px)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, false)}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-white' 
                        : 'bg-light-bg border-light-border'
                    }`}
                  />
                  {newSeriesImagePreview && (
                    <div className="mt-2">
                      <img 
                        src={newSeriesImagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                  >
                    Dodaj
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewSeriesName('');
                      setNewSeriesColor('#3B82F6');
                      setNewSeriesImage(null);
                      setNewSeriesImagePreview(null);
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
      </div>
    </Layout>
  );
};

export default SeriesManagement;