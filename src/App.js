import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage, useDebounce } from './hooks';
import { SiteCard, CategoryButton, EmptyState } from './components';
import { EditModeToolbar, EditSiteModal, Notification } from './EditComponents';
import { useLocalAPI } from './hooks/useLocalAPI';

// Main application component
const App = () => {
  const [activeCategory, setActiveCategory] = useLocalStorage('activeCategory', 0);
  const [filteredSites, setFilteredSites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // localData removed: use API-driven data via useLocalAPI
  const [isLoading, setIsLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  // Edit mode related state
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Local API data management
  const { 
    data: apiData, 
    loading: apiLoading, 
    error: apiError,
    addSite, 
    editSite, 
    deleteSite 
  } = useLocalAPI();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Use API data as primary source; fall back to an empty structure
  // memoize to keep stable identity and avoid triggering effects every render
  const currentData = useMemo(() => (apiData || { sites: [], categories: [] }), [apiData]);

  // Check URL params to decide whether to enable edit mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit');
    if (editParam === '1' || editParam === 'true') {
      setIsEditMode(true);
      setNotification({ 
        message: 'Edit mode enabled via URL parameter', 
        type: 'success' 
      });
    }
  }, []);

  // Listen for scroll events to control back-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter games data
  useEffect(() => {
    setIsLoading(true);

    let sites = currentData.sites || [];
    
  // Filter by category
    if (activeCategory !== 0) {
      sites = sites.filter(site => site.categoryId === activeCategory);
    }
    
  // Filter by search term
    if (debouncedSearchTerm) {
      sites = sites.filter(site => 
        site.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        site.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
  // Update state immediately, remove loading delay
      // sort by id according to sortOrder
      const sorted = [...sites].sort((a, b) => {
        const ai = Number(a.id);
        const bi = Number(b.id);
        if (isNaN(ai) || isNaN(bi)) return 0;
        return sortOrder === 'asc' ? ai - bi : bi - ai;
      });

      setFilteredSites(sorted);
    setIsLoading(false);
  }, [activeCategory, debouncedSearchTerm, apiData, sortOrder]);

  // data is provided by useLocalAPI (apiData). No local /data.json fetch here.

  // 编辑功能处理函数
  const handleAddSite = () => {
    setEditingSite(null);
    setShowEditModal(true);
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setShowEditModal(true);
  };

  const handleSaveSite = async (formData) => {
    let result;
    if (editingSite) {
      // Edit existing game
      result = await editSite(editingSite.id, formData);
      if (result.success) {
        setNotification({ message: 'Game updated successfully!', type: 'success' });
      } else {
        setNotification({ message: `Update failed: ${result.error}`, type: 'error' });
      }
    } else {
      // Add new game
      result = await addSite(formData);
      if (result.success) {
        setNotification({ message: 'Game added successfully!', type: 'success' });
      } else {
        setNotification({ message: `Add failed: ${result.error}`, type: 'error' });
      }
    }
    setShowEditModal(false);
    setEditingSite(null);
  };

  const handleDeleteSite = async (siteId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      const result = await deleteSite(siteId);
      if (result.success) {
        setNotification({ message: 'Game deleted successfully!', type: 'success' });
      } else {
        setNotification({ message: `Delete failed: ${result.error}`, type: 'error' });
      }
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm(''); // Clear search on category change
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const getCurrentCategory = () => {
    return currentData.categories.find(cat => cat.id === activeCategory);
  };

  // 添加快捷键监听
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl+E (Windows/Linux) or Cmd+E (Mac) toggles edit mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        setIsEditMode(!isEditMode);
        setNotification({ 
          message: `Edit mode ${!isEditMode ? 'enabled' : 'disabled'}`, 
          type: 'success' 
        });
      }
      
      // 连续按 3 次 E 键也可以切换编辑模式
      if (event.key === 'e' || event.key === 'E') {
        const now = Date.now();
        const keyPresses = JSON.parse(localStorage.getItem('keyPresses') || '[]');
        keyPresses.push(now);
        
        // 只保留最近 3 秒内的按键
        const recentPresses = keyPresses.filter(time => now - time < 3000);
        localStorage.setItem('keyPresses', JSON.stringify(recentPresses));
        
        // If E was pressed 3 times within 3 seconds
        if (recentPresses.length >= 3) {
          localStorage.removeItem('keyPresses');
          setIsEditMode(!isEditMode);
          setNotification({ 
            message: `🎉 Edit mode ${!isEditMode ? 'enabled' : 'disabled'}!`, 
            type: 'success' 
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isEditMode]);

  return (
  <div className="min-h-screen bg-[#0b0b0c] text-gray-200">
      {/* 顶部导航 */}
  <header className="sticky top-0 z-50 bg-[#111111] text-white border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* 标题行 */}
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center">
                <div data-v-cffdc6d6="" className="header-content flex items-center">
                  <img
                    data-v-cffdc6d6=""
                    className="logo mr-3 rounded-md object-contain max-h-12"
                    src="/icons/logo.png"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/logo192.png'; }}
                    alt="Online Games Library"
                    style={{ width: 'auto', height: '48px' }}
                  />
                  <h1 data-v-cffdc6d6="" className="title text-lg font-semibold text-gray-200">Online Games Library</h1>
                </div>
                {isEditMode && (
                  <span className="ml-3 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    💡 Edit mode
                  </span>
                )}
              </div>
            </div>

            {/* Search row: search input and sort controls */}
            <div className="flex items-end justify-center mb-4 gap-3">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-9 pr-8 py-2 border border-gray-700 rounded-lg text-sm leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200 text-white"
                  placeholder="Search..."
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`sort-button w-10 h-9 flex items-center justify-center rounded-md bg-transparent transition-colors ${sortOrder === 'asc' ? 'active' : ''}`}
                  title="Sort by id ascending"
                  aria-label="Sort ascending"
                >
                  {/* Enlarged up arrow to indicate ascending order (uses currentColor) */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v13" />
                  </svg>
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`sort-button w-10 h-9 flex items-center justify-center rounded-md bg-transparent transition-colors ${sortOrder === 'desc' ? 'active' : ''}`}
                  title="Sort by id descending"
                  aria-label="Sort descending"
                >
                  {/* Enlarged down arrow to indicate descending order (uses currentColor) */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21V8" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 分类导航 */}
            <nav className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleCategoryChange(0)}
                className={`category-button px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  activeCategory === 0
                    ? 'bg-[#1a1a1a] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">🌟</span>
                All
              </button>
              {currentData.categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  isActive={activeCategory === category.id}
                  onClick={handleCategoryChange}
                />
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* API加载状态 */}
        {apiLoading && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading data from server...
            </div>
          </div>
        )}

        {/* API错误状态 */}
        {apiError && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Failed to load server data, using local data: {apiError}
            </div>
          </div>
        )}

        {/* 搜索结果提示 */}
        {searchTerm && (
          <div className="mb-6 text-center">
            <p className="text-gray-600 text-sm">
              Search "{searchTerm}" found {filteredSites.length} games
            </p>
          </div>
        )}

        {/* game卡片网格 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-lg shadow-card p-4 border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                      <div className="h-7 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSites.map((site, index) => (
              <div
                key={`site-${site.id}-cat-${activeCategory}`}
                className="animate-fadeInUp opacity-100"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SiteCard 
                  site={site} 
                  isVisible={true}
                  delay={index * 50}
                  isEditMode={isEditMode}
                  onEdit={handleEditSite}
                  onDelete={handleDeleteSite}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState category={getCurrentCategory()} />
        )}

        {/* 回到顶部按钮 */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 bg-primary-blue text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 animate-heartbeat z-40"
            title="Back to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}

        {/* 编辑模式工具栏 */}
        {isEditMode && (
          <EditModeToolbar 
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            onAddSite={handleAddSite}
          />
        )}

        {/* 编辑game模态框 */}
        {showEditModal && (
          <EditSiteModal 
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingSite(null);
            }}
            onSave={handleSaveSite}
            site={editingSite}
            categories={currentData.categories}
          />
        )}
      </main>

      {/* 底部信息 */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
            <p className="text-sm text-gray-500 text-center md:text-left">
                © 2023 - 2025 Online Games Library ·  Made by Vidar 
            </p>
            <div className="flex justify-center md:justify-end space-x-4 text-sm text-gray-500">
              <span>Collection of {currentData.sites.length} 个games</span>
              <span>❤️</span>
              <span>{currentData.categories.length} categories</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 编辑模式工具栏 */}
      {isEditMode && (
        <EditModeToolbar 
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onAddSite={handleAddSite}
        />
      )}

      {/* 编辑game模态框 */}
      {showEditModal && (
        <EditSiteModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingSite(null);
          }}
          onSave={handleSaveSite}
          site={editingSite}
          categories={currentData.categories}
        />
      )}

      {/* 通知组件 */}
      {notification && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App;
