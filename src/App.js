import React, { useState, useEffect, useMemo, useRef } from 'react';
import data from './data.json';
import { useLocalStorage, useDebounce } from './hooks';
import { SiteCard, CategoryButton, EmptyState } from './components';
import { EditModeToolbar, EditSiteModal, EditCategoryModal, EditPasswordModal, Notification } from './EditComponents';
import { useLocalAPI } from './hooks/useLocalAPI';

// 站外搜索引擎配置（"站内"为 null，表示过滤已收录网站）
const SEARCH_ENGINES = {
  site: { name: '站内', url: null },
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: '必应', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
};

// 懒加载每批渲染的卡片数量
const BATCH_SIZE = 60;

// 主应用组件
const App = () => {
  const [activeCategory, setActiveCategory] = useLocalStorage('activeCategory', 0);
  const [filteredSites, setFilteredSites] = useState(data.sites);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 深色模式与搜索引擎偏好（持久化）
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [searchEngine, setSearchEngine] = useLocalStorage('searchEngine', 'site');
  
  // 编辑模式相关状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // 编辑鉴权状态：令牌持久化，密码框默认关闭
  const [editToken, setEditToken] = useLocalStorage('editToken', '');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // 本地API数据管理
  const { 
    data: apiData, 
    loading: apiLoading, 
    error: apiError,
    addSite, 
    editSite, 
    deleteSite,
    addCategory,
    verifyEditAccess
  } = useLocalAPI();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 使用API数据或本地数据
  const currentData = apiData || data;

  // 应用深色模式到根元素
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // 最新收录（按 id 倒序取前 8 个）及其 id 集合，用于 NEW 角标
  const latestSites = useMemo(
    () => [...currentData.sites].sort((a, b) => b.id - a.id).slice(0, 8),
    [currentData]
  );
  const newSiteIds = useMemo(
    () => new Set(latestSites.map((site) => site.id)),
    [latestSites]
  );

  // 每个分类下的站点数量（用于分类栏计数显示）
  const categoryCounts = useMemo(() => {
    const counts = {};
    currentData.sites.forEach((site) => {
      counts[site.categoryId] = (counts[site.categoryId] || 0) + 1;
    });
    return counts;
  }, [currentData]);

  // 懒加载（分批渲染）：初始渲染一批，滚动到底部哨兵时自动追加下一批
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);

  // 切换分类或搜索时重置回第一批
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeCategory, debouncedSearchTerm]);

  // 哨兵进入视口附近时加载下一批
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredSites.length));
      }
    }, { rootMargin: '400px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredSites.length]);

  // 当前实际渲染的卡片与是否还有未加载项
  const displayedSites = filteredSites.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSites.length;

  // 回车跳转站外搜索引擎
  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter' || !searchTerm.trim() || searchEngine === 'site') {
      return;
    }
    const engine = SEARCH_ENGINES[searchEngine];
    window.open(engine.url + encodeURIComponent(searchTerm.trim()), '_blank', 'noopener,noreferrer');
  };

  // 检查URL参数来决定是否启用编辑模式
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit');
    if (editParam === '1' || editParam === 'true') {
      requestEditMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 请求进入编辑模式：已有令牌先向服务端验证，否则弹出密码框
  const requestEditMode = async () => {
    if (editToken) {
      const result = await verifyEditAccess({ token: editToken });
      if (result.success) {
        setIsEditMode(true);
        setNotification({ message: '编辑模式已开启', type: 'success' });
        return;
      }
      // 令牌失效（如密码已修改），清除后重新输入密码
      setEditToken('');
    }
    setShowPasswordModal(true);
  };

  // 切换编辑模式：进入需密码验证，退出直接关闭
  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setNotification({ message: '编辑模式已关闭', type: 'success' });
    } else {
      requestEditMode();
    }
  };

  // 密码弹窗提交：返回 true 表示服务端验证通过
  const handlePasswordSubmit = async (password) => {
    const result = await verifyEditAccess({ password });
    if (result.success) {
      setEditToken(result.token);
      setShowPasswordModal(false);
      setIsEditMode(true);
      setNotification({ message: '🎉 验证成功，编辑模式已开启', type: 'success' });
      return true;
    }
    return false;
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm(''); // 切换分类时清空搜索
  };

  // 添加分类处理函数
  const handleSaveCategory = async (formData) => {
    const result = await addCategory(formData);
    if (result.success) {
      setNotification({ message: `分类 "${formData.name}" 添加成功！`, type: 'success' });
    } else {
      setNotification({ message: `添加失败: ${result.error}`, type: 'error' });
    }
    setShowCategoryModal(false);
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
      // Ctrl+E (Windows/Linux) 或 Cmd+E (Mac) 切换编辑模式
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        toggleEditMode();
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
          toggleEditMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center">
                <h1 
                  className="text-2xl font-bold gradient-text cursor-pointer select-none"
                  onMouseDown={(e) => {
                    // 长按标题3秒激活编辑模式（需密码验证）
                    const timer = setTimeout(() => {
                      if (!isEditMode) {
                        requestEditMode();
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
              
              {/* 搜索框 - 中央主搜索（支持站外搜索引擎），移动端独占一行 */}
              <div className="order-3 sm:order-none w-full sm:w-auto sm:flex-1 sm:max-w-xl sm:mx-auto">
                <div className="relative flex items-center">
                  <select
                    value={searchEngine}
                    onChange={(e) => setSearchEngine(e.target.value)}
                    className="absolute inset-y-0 left-0 pl-2 pr-1 text-xs bg-transparent text-gray-500 border-0 focus:outline-none cursor-pointer z-10 appearance-none"
                    title="选择搜索引擎"
                  >
                    {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
                      <option key={key} value={key}>{engine.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="block w-full pl-16 pr-8 py-2 border border-gray-300 rounded-lg text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200"
                    placeholder={searchEngine === 'site' ? '搜索网站...' : `回车使用${SEARCH_ENGINES[searchEngine].name}搜索`}
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

            {/* 深色模式切换 */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="order-2 sm:order-none flex-shrink-0 ml-auto sm:ml-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200"
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 页面主体：左侧分类栏 + 内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:flex lg:items-start lg:gap-6">
        {/* 移动端分类横滚条 */}
        <nav className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto whitespace-nowrap flex gap-2 pb-1">
          <button
            onClick={() => handleCategoryChange(0)}
            className={`category-button flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === 0
                ? 'bg-primary-blue text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">🌟</span>
            全部
          </button>
          {data.categories.map((category) => (
            <span key={category.id} className="flex-shrink-0">
              <CategoryButton
                category={category}
                isActive={activeCategory === category.id}
                onClick={handleCategoryChange}
              />
            </span>
          ))}
        </nav>

        {/* 桌面端左侧分类栏（吸顶、可独立滚动） */}
        <aside className="hidden lg:block w-52 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6.5rem)] overflow-y-auto bg-white rounded-lg border border-gray-100 shadow-card p-2 space-y-0.5">
          <nav>
            <button
              onClick={() => handleCategoryChange(0)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                activeCategory === 0
                  ? 'bg-primary-blue text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center min-w-0">
                <span className="mr-2 flex-shrink-0">🌟</span>
                <span className="truncate">全部</span>
              </span>
              <span className={`ml-2 text-xs flex-shrink-0 ${activeCategory === 0 ? 'text-blue-100' : 'text-gray-400'}`}>
                {currentData.sites.length}
              </span>
            </button>
            {data.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  activeCategory === category.id
                    ? 'bg-primary-blue text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center min-w-0">
                  <span className="mr-2 flex-shrink-0">{category.icon}</span>
                  <span className="truncate">{category.name}</span>
                </span>
                <span className={`ml-2 text-xs flex-shrink-0 ${activeCategory === category.id ? 'text-blue-100' : 'text-gray-400'}`}>
                  {categoryCounts[category.id] || 0}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 min-w-0">
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

        {/* 当前分类标题与简介 - 选中具体分类且无搜索时显示 */}
        {activeCategory !== 0 && !debouncedSearchTerm && getCurrentCategory() && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center">
              <span className="mr-2">{getCurrentCategory().icon}</span>
              {getCurrentCategory().name}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {filteredSites.length} 个网站
              </span>
            </h2>
            {getCurrentCategory().description && (
              <p className="text-sm text-gray-500 mt-1">{getCurrentCategory().description}</p>
            )}
          </div>
        )}

        {/* 最新收录分区 - 仅在"全部"分类且无搜索时显示 */}
        {activeCategory === 0 && !debouncedSearchTerm && latestSites.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🆕</span>最新收录
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {latestSites.map((site, index) => (
                <SiteCard
                  key={`latest-${site.id}`}
                  site={site}
                  isVisible={true}
                  delay={index * 50}
                  isEditMode={isEditMode}
                  isNew={true}
                  onEdit={handleEditSite}
                  onDelete={handleDeleteSite}
                />
              ))}
            </div>
          </section>
        )}

        {/* 网站卡片网格 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {displayedSites.map((site, index) => (
              <div
                key={`site-${site.id}-cat-${activeCategory}`}
                className="animate-fadeInUp opacity-100"
                style={{ animationDelay: `${Math.min(index % BATCH_SIZE, 16) * 50}ms` }}
              >
                <SiteCard 
                  site={site} 
                  isVisible={true}
                  delay={Math.min(index % BATCH_SIZE, 16) * 50}
                  isEditMode={isEditMode}
                  isNew={newSiteIds.has(site.id)}
                  onEdit={handleEditSite}
                  onDelete={handleDeleteSite}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState category={getCurrentCategory()} />
        )}

        {/* 懒加载哨兵与加载状态 */}
        {filteredSites.length > 0 && hasMore && (
          <div ref={sentinelRef} className="py-8 text-center text-sm text-gray-500">
            <svg className="animate-spin inline-block -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            正在加载更多...（已显示 {displayedSites.length} / {filteredSites.length}）
          </div>
        )}
        {filteredSites.length > BATCH_SIZE && !hasMore && (
          <p className="py-8 text-center text-sm text-gray-500">
            已显示全部 {filteredSites.length} 个网站
          </p>
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

        </main>
      </div>

      {/* 底部信息 */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 品牌信息 */}
            <div>
              <p className="text-lg font-bold gradient-text mb-2">简约导航站</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                精选收录各类优质网站，涵盖效率工具、设计创意、学习资源、影音娱乐等分类，做你简约高效的上网入口。
              </p>
            </div>
            {/* 快速链接 */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">快速链接</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a href="https://ovoforge.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors duration-200">OVOForge 主站</a>
                </li>
                <li>
                  <a href="https://github.com/gamelibs/simple-nav-site" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors duration-200">GitHub 项目</a>
                </li>
                <li>
                  <a href="https://github.com/gamelibs/simple-nav-site/issues" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors duration-200">问题反馈 / 收录申请</a>
                </li>
                <li>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors duration-200">网站地图</a>
                </li>
              </ul>
            </div>
            {/* 站点统计 */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">站点统计</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>共收录 {currentData.sites.length} 个网站</li>
                <li>{currentData.categories.length} 个分类</li>
                <li>持续更新中</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            © 2026 简约导航站 · <a href="https://ovoforge.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors duration-200">OVOForge</a> 出品
          </div>
        </div>
      </footer>

      {/* 编辑模式工具栏 */}
      {isEditMode && (
        <EditModeToolbar 
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onAddSite={handleAddSite}
          onAddCategory={() => setShowCategoryModal(true)}
        />
      )}

      {/* 添加分类模态框 */}
      {showCategoryModal && (
        <EditCategoryModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
        />
      )}

      {/* 编辑模式密码验证弹窗 */}
      {showPasswordModal && (
        <EditPasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
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
