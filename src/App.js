import React, { useState, useEffect } from 'react';
import data from './data.json';
import { useLocalStorage, useDebounce } from './hooks';
import { SiteCard, EmptyState } from './components';
import { EditModeToolbar, EditSiteModal, Notification, ConfirmDialog, CategoryManagement } from './EditComponents';
import { useLocalAPI } from './hooks/useLocalAPI';

// 主应用组件
const App = () => {
  const [activeCategory, setActiveCategory] = useLocalStorage('activeCategory', 0);
  const [filteredSites, setFilteredSites] = useState(data.sites);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useLocalStorage('sidebarExpanded', false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 编辑模式相关状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  
  // 确认弹窗相关状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState(null);
  
  // 本地API数据管理
  const { 
    data: apiData, 
    loading: apiLoading, 
    error: apiError,
    addSite, 
    editSite, 
    deleteSite,
    addCategory,
    deleteCategory
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

  // 处理添加分类
  const handleAddCategory = async (categoryData) => {
    const result = await addCategory(categoryData);
    if (result.success) {
      setNotification({ 
        message: `分类"${categoryData.name}"添加成功！`, 
        type: 'success' 
      });
      return result;
    } else {
      setNotification({ 
        message: `添加分类失败: ${result.error}`, 
        type: 'error' 
      });
      return result;
    }
  };

  // 处理删除分类（用于分类管理组件）
  const handleManageDeleteCategory = async (categoryId) => {
    const category = currentData.categories.find(cat => cat.id === categoryId);
    if (!category) return { success: false, error: '分类不存在' };

    // 检查该分类下是否有网站
    const sitesInCategory = currentData.sites.filter(site => site.categoryId === categoryId);
    
    if (sitesInCategory.length > 0) {
      setNotification({ 
        message: `无法删除分类"${category.name}"，该分类下还有 ${sitesInCategory.length} 个网站。请先删除或移动这些网站。`, 
        type: 'error' 
      });
      return { success: false, error: '分类下有网站' };
    }

    const result = await deleteCategory(categoryId);
    if (result.success) {
      setNotification({ 
        message: result.isLocal 
          ? `分类"${category.name}"删除成功！（演示模式）`
          : `分类"${category.name}"删除成功！`, 
        type: 'success' 
      });
      // 如果当前选中的分类被删除，切换到"全部网站"
      if (activeCategory === categoryId) {
        setActiveCategory(0);
      }
    } else {
      setNotification({ 
        message: `删除失败: ${result.error}`, 
        type: 'error' 
      });
    }
    return result;
  };

  // 打开分类管理
  const handleManageCategories = () => {
    setShowCategoryManagement(true);
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* 移动端遮罩层 */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 左侧可折叠导航栏 */}
      <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ease-in-out z-50 flex flex-col ${
        // 桌面端和移动端都使用固定定位，不随页面滚动
        'fixed inset-y-0 left-0 ' + (sidebarExpanded ? 'lg:w-64' : 'lg:w-16') +
        // 移动端：中等宽度侧边栏（比之前更窄但能显示完整内容）
        ' w-48 transform ' + 
        (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
      } flex-shrink-0`}>
        {/* 侧边栏头部 */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200">
          {sidebarExpanded && !mobileMenuOpen ? (
            <button
              onClick={() => setSidebarExpanded(false)}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="收起侧边栏"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M9 5l7 7-7 7" />
              </svg>
              <span className="ml-2 text-sm">收起</span>
            </button>
          ) : mobileMenuOpen ? (
            // 移动端打开时不显示关闭按钮，用户可点击遮罩层关闭
            <div className="w-full h-10"></div>
          ) : (
            <button
              onClick={() => setSidebarExpanded(true)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-primary-blue transition-colors duration-200"
              title="展开侧边栏"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* 分类导航列表 */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* 全部网站 */}
          <button
            onClick={() => handleCategoryChange(0)}
            className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 group ${
              activeCategory === 0
                ? 'bg-primary-blue text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={(sidebarExpanded || mobileMenuOpen) ? '' : '全部网站'}
          >
            <span className="text-lg flex-shrink-0">🌟</span>
            {(sidebarExpanded || mobileMenuOpen) && (
              <>
                <span className="ml-3 font-medium">全部网站</span>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  activeCategory === 0 
                    ? 'bg-white bg-opacity-60 text-blue-800 font-bold' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentData.sites.length}
                </span>
              </>
            )}
          </button>

          {/* 分类列表 */}
          {currentData.categories.map((category) => {
            const categoryCount = currentData.sites.filter(site => site.categoryId === category.id).length;
            return (
              <div key={category.id} className="relative group">
                <button
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 group ${
                    activeCategory === category.id
                      ? 'bg-primary-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={(sidebarExpanded || mobileMenuOpen) ? '' : category.name}
                >
                  <span className="text-lg flex-shrink-0">{category.icon}</span>
                  {(sidebarExpanded || mobileMenuOpen) && (
                    <>
                      <span className="ml-3 font-medium">{category.name}</span>
                      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                        activeCategory === category.id 
                          ? 'bg-white bg-opacity-60 text-blue-800 font-bold' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {categoryCount}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* 侧边栏底部 */}
        {(sidebarExpanded || mobileMenuOpen) && (
          <div className="border-t border-gray-200 p-4">
            {isEditMode && (
              <div className="mb-3">
                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                  💡 编辑模式
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 space-y-1">
              <div>共收录 {currentData.sites.length} 个网站</div>
              <div>{currentData.categories.length} 个分类</div>
            </div>
          </div>
        )}
      </div>

      {/* 右侧主内容区域 */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        // 为固定侧边栏留出空间
        sidebarExpanded ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* 顶部搜索栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-primary-blue hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="打开菜单"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo标题 */}
              <div className="flex-shrink-0 mx-4">
                <h1 
                  className="text-xl lg:text-2xl font-bold gradient-text cursor-pointer select-none"
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
              </div>

              {/* 搜索框 */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200"
                    placeholder="搜索网站..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* 主内容区域 */}
      <main className="flex-1">
        {/* 状态提示栏 */}
        {(apiLoading || apiError || searchTerm) && (
          <div className="bg-white border-b border-gray-100 px-6 py-3">
            {/* API状态提示 */}
            {apiLoading && (
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm mr-4">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在从服务器加载数据...
              </div>
            )}

            {apiError && (
              <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm mr-4">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                服务器数据加载失败，使用本地数据: {apiError}
              </div>
            )}

            {/* 搜索结果提示 */}
            {searchTerm && (
              <span className="text-gray-600 text-sm">
                搜索 "{searchTerm}" 找到 {filteredSites.length} 个网站
              </span>
            )}
          </div>
        )}

        {/* 网站卡片区域 */}
        <div className="p-4 lg:p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {[...Array(14)].map((_, index) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
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
        </div>
      </main>

      {/* 底部信息 - 简化版 */}
      <footer className="bg-white border-t border-gray-100">
        <div className="px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            © 2025 简约导航站 · 共收录 {currentData.sites.length} 个网站 · {currentData.categories.length} 个分类
          </p>
        </div>
      </footer>
      </div>

      {/* 编辑模式工具栏 */}
      {isEditMode && (
        <EditModeToolbar 
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onAddSite={handleAddSite}
          onManageCategories={handleManageCategories}
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

      {/* 分类管理模态框 */}
      {showCategoryManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">分类管理</h2>
              <button
                onClick={() => setShowCategoryManagement(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CategoryManagement
                categories={currentData.categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleManageDeleteCategory}
              />
            </div>
          </div>
        </div>
      )}

      {/* 通知组件 */}
      {notification && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* 确认对话框 */}
      {showConfirmDialog && confirmDialogData && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setConfirmDialogData(null);
          }}
          onConfirm={confirmDialogData.onConfirm}
          title={confirmDialogData.title}
          message={confirmDialogData.message}
          confirmText={confirmDialogData.confirmText}
          cancelText={confirmDialogData.cancelText}
          type={confirmDialogData.type}
        />
      )}
    </div>
  );
};

export default App;
