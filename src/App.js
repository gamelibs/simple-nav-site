import React, { useState, useEffect } from 'react';
import data from './data.json';
import { useLocalStorage, useDebounce } from './hooks';
import { SiteCard, CategoryButton, EmptyState } from './components';
import { EditModeToolbar, EditSiteModal, Notification } from './EditComponents';
import { useLocalAPI } from './hooks/useLocalAPI';

// 主应用组件
const App = () => {
  const [activeCategory, setActiveCategory] = useLocalStorage('activeCategory', 0);
  const [filteredSites, setFilteredSites] = useState(data.sites);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // 编辑模式相关状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // 本地API数据管理
  const { 
    data: apiData, 
    loading: apiLoading, 
    error: apiError,
    addSite, 
    editSite, 
    deleteSite 
  } = useLocalAPI();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 使用API数据或本地数据
  const currentData = apiData || data;

  // 检查URL参数来决定是否启用编辑模式
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit');
    if (editParam === '1' || editParam === 'true') {
      setIsEditMode(true);
      setNotification({ 
        message: '编辑模式已通过URL参数启用', 
        type: 'success' 
      });
    }
  }, []);

  // 监听滚动事件，控制回到顶部按钮显示
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 过滤网站数据
  useEffect(() => {
    setIsLoading(true);
    
    let sites = currentData.sites;
    
    // 按分类过滤
    if (activeCategory !== 0) {
      sites = sites.filter(site => site.categoryId === activeCategory);
    }
    
    // 按搜索词过滤
    if (debouncedSearchTerm) {
      sites = sites.filter(site => 
        site.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        site.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    // 立即更新状态，移除加载延迟
    setFilteredSites(sites);
    setIsLoading(false);
  }, [activeCategory, debouncedSearchTerm, currentData]);

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
      // 编辑现有网站
      result = await editSite(editingSite.id, formData);
      if (result.success) {
        setNotification({ message: '网站更新成功！', type: 'success' });
      } else {
        setNotification({ message: `更新失败: ${result.error}`, type: 'error' });
      }
    } else {
      // 添加新网站
      result = await addSite(formData);
      if (result.success) {
        setNotification({ message: '网站添加成功！', type: 'success' });
      } else {
        setNotification({ message: `添加失败: ${result.error}`, type: 'error' });
      }
    }
    setShowEditModal(false);
    setEditingSite(null);
  };

  const handleDeleteSite = async (siteId) => {
    if (window.confirm('确定要删除这个网站吗？')) {
      const result = await deleteSite(siteId);
      if (result.success) {
        setNotification({ message: '网站删除成功！', type: 'success' });
      } else {
        setNotification({ message: `删除失败: ${result.error}`, type: 'error' });
      }
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm(''); // 切换分类时清空搜索
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const getCurrentCategory = () => {
    return data.categories.find(cat => cat.id === activeCategory);
  };

  // 添加快捷键监听
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl+E (Windows/Linux) 或 Cmd+E (Mac) 切换编辑模式
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        setIsEditMode(!isEditMode);
        setNotification({ 
          message: `编辑模式${!isEditMode ? '已开启' : '已关闭'}`, 
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
        
        // 如果 3 秒内按了 3 次 E
        if (recentPresses.length >= 3) {
          localStorage.removeItem('keyPresses');
          setIsEditMode(!isEditMode);
          setNotification({ 
            message: `🎉 编辑模式${!isEditMode ? '已开启' : '已关闭'}！`, 
            type: 'success' 
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isEditMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* 标题和搜索框行 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h1 
                  className="text-2xl font-bold gradient-text cursor-pointer select-none"
                  onMouseDown={(e) => {
                    // 长按标题3秒激活编辑模式
                    const timer = setTimeout(() => {
                      if (!isEditMode) {
                        setIsEditMode(true);
                        setNotification({ 
                          message: '🎉 隐藏的编辑模式已激活！', 
                          type: 'success' 
                        });
                      }
                    }, 3000);
                    
                    const cleanup = () => {
                      clearTimeout(timer);
                      document.removeEventListener('mouseup', cleanup);
                    };
                    
                    document.addEventListener('mouseup', cleanup);
                  }}
                  title="长按3秒激活编辑模式"
                >
                  简约导航站
                </h1>
                {isEditMode && (
                  <span className="ml-3 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    💡 编辑模式
                  </span>
                )}
              </div>
              
              {/* 搜索框 - 右侧紧凑版 */}
              <div className="flex-shrink-0">
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200"
                    placeholder="搜索网站..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 分类导航 */}
            <nav className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleCategoryChange(0)}
                className={`category-button px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  activeCategory === 0
                    ? 'bg-primary-blue text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">🌟</span>
                全部
              </button>
              {data.categories.map((category) => (
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
              正在从服务器加载数据...
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
              服务器数据加载失败，使用本地数据: {apiError}
            </div>
          </div>
        )}

        {/* 搜索结果提示 */}
        {searchTerm && (
          <div className="mb-6 text-center">
            <p className="text-gray-600 text-sm">
              搜索 "{searchTerm}" 找到 {filteredSites.length} 个网站
            </p>
          </div>
        )}

        {/* 网站卡片网格 */}
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
            title="回到顶部"
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

        {/* 编辑网站模态框 */}
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
              © 2024 简约导航站. Made with ❤️
            </p>
            <div className="flex justify-center md:justify-end space-x-4 text-sm text-gray-500">
              <span>共收录 {currentData.sites.length} 个网站</span>
              <span>•</span>
              <span>{currentData.categories.length} 个分类</span>
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

      {/* 编辑网站模态框 */}
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
