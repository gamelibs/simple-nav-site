import React, { useState, useEffect } from 'react';
import data from './data.json';
import { useLocalStorage, useDebounce } from './hooks';
import { SiteCard, CategoryButton, EmptyState, SearchBox } from './components';

// 主应用组件
const App = () => {
  const [activeCategory, setActiveCategory] = useLocalStorage('activeCategory', 0);
  const [filteredSites, setFilteredSites] = useState(data.sites);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
    
    let sites = data.sites;
    
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
  }, [activeCategory, debouncedSearchTerm]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* 标题 */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 gradient-text animate-float">
                简约导航站
              </h1>
              <p className="text-gray-600 text-sm animate-fadeInUp">
                精选优质网站，简约高效导航
              </p>
            </div>
            
            {/* 搜索框 */}
            <SearchBox onSearch={handleSearch} />
            
            {/* 分类导航 */}
            <nav className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() => handleCategoryChange(0)}
                className={`category-button px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  activeCategory === 0
                    ? 'bg-primary-blue text-white shadow-lg shadow-blue-200 ring-2 ring-blue-300 ring-opacity-50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="mr-2">🌟</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 分类标题和统计 */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center justify-center mb-2">
            {activeCategory === 0 ? (
              <>
                <span className="mr-3 text-2xl">🌟</span>
                全部网站
              </>
            ) : (
              <>
                <span className="mr-3 text-2xl">
                  {getCurrentCategory()?.icon}
                </span>
                {getCurrentCategory()?.name}
              </>
            )}
          </h2>
          {searchTerm && (
            <p className="text-gray-600 text-sm mb-2">
              搜索 "{searchTerm}" 的结果
            </p>
          )}
          <p className="text-gray-500 text-sm">
            共找到 {filteredSites.length} 个网站
          </p>
        </div>

        {/* 网站卡片网格 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-1 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </main>

      {/* 底部信息 */}
      <footer className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🌟</span>
                关于我们
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                简约导航站致力于收集整理各类优质网站资源，为用户提供便捷的网站导航服务。
                我们精心挑选每一个网站，确保内容的质量和实用性。
              </p>
              <div className="flex space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  React
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Tailwind CSS
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📚</span>
                网站分类
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {data.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className="text-left text-gray-600 hover:text-primary-blue transition-colors duration-200 flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📞</span>
                联系信息
              </h3>
              <div className="text-sm text-gray-600 space-y-3">
                <div className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>contact@nav-site.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🌐</span>
                  <span>www.nav-site.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📱</span>
                  <span>NavSite2024</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-500 text-center md:text-left">
                © 2024 简约导航站. All rights reserved. Made with ❤️
              </p>
              <div className="flex justify-center md:justify-end space-x-4 text-sm text-gray-500">
                <span>共收录 {data.sites.length} 个网站</span>
                <span>•</span>
                <span>{data.categories.length} 个分类</span>
                <span>•</span>
                <span>持续更新中</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
