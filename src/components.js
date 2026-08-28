import React, { useState, memo } from 'react';

// 从站点 URL 提取域名，生成 favicon 抓取地址
const getFaviconUrl = (url) => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch (error) {
    return null;
  }
};

// 网站图标组件
// 加载链：自定义图标（如有）→ Google favicon 抓取 → 首字母头像
const SiteIcon = memo(({ site }) => {
  const sources = [];
  if (site.icon && site.icon !== '/icons/default.svg') {
    sources.push(process.env.PUBLIC_URL + site.icon);
  }
  const faviconUrl = getFaviconUrl(site.url);
  if (faviconUrl) {
    sources.push(faviconUrl);
  }

  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setSourceIndex((prev) => prev + 1);
  };

  if (sourceIndex >= sources.length) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
        {site.name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg skeleton"></div>
      )}
      <img
        src={sources[sourceIndex]}
        alt={`${site.name} 图标`}
        className={`w-10 h-10 rounded-lg object-cover shadow-sm transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
});

// 从站点 URL 提取域名，作为空描述时的兜底显示
const getHost = (url) => {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return '';
  }
};

// 网站卡片组件 - 整卡可点击（编辑模式下为 div + 操作按钮）
const SiteCard = memo(({ site, isVisible, delay = 0, isEditMode = false, isNew = false, onEdit, onDelete }) => {
  const cardClassName = `card-hover relative block bg-white rounded-lg shadow-card p-4 border border-gray-100 transition-all duration-700 ease-out ${
    isVisible 
      ? 'opacity-100 translate-y-0 scale-100' 
      : 'opacity-0 translate-y-8 scale-95'
  }`;
  const cardStyle = { transitionDelay: `${delay}ms` };

  // 卡片主体内容
  const cardBody = (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <SiteIcon site={site} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate hover:text-primary-blue transition-colors duration-200">
          {site.name}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {site.description || getHost(site.url)}
        </p>
      </div>
      {!isEditMode && (
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </div>
  );

  // 编辑模式：不可跳转，显示编辑/删除按钮
  if (isEditMode) {
    return (
      <div className={cardClassName} style={cardStyle}>
        <div className="absolute top-2 right-2 flex space-x-1 z-10">
          <button
            onClick={() => onEdit(site)}
            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="编辑"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(site.id)}
            className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
            title="删除"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        {cardBody}
      </div>
    );
  }

  // 正常模式：整卡为链接
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClassName}
      style={cardStyle}
    >
      {/* 新收录角标 */}
      {isNew && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded shadow-sm">
          NEW
        </span>
      )}
      {cardBody}
    </a>
  );
});

// 分类按钮组件
const CategoryButton = memo(({ category, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={`category-button px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-1 ${
        isActive
          ? 'bg-primary-blue text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="text-sm">{category.icon}</span>
      <span>{category.name}</span>
    </button>
  );
});

// 加载骨架屏组件
const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-card p-4 border border-gray-100">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg skeleton"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded skeleton mb-2"></div>
          <div className="h-3 bg-gray-200 rounded skeleton mb-1 w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded skeleton mb-3 w-1/2"></div>
          <div className="h-7 bg-gray-200 rounded skeleton w-20"></div>
        </div>
      </div>
    </div>
  );
};

// 空状态组件
const EmptyState = ({ category }) => {
  return (
    <div className="text-center py-16 animate-fadeInUp">
      <div className="text-6xl mb-4 animate-bounce">🔍</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无网站</h3>
      <p className="text-gray-500">
        {category ? `${category.name}分类下暂时没有收录网站` : '暂时没有收录网站'}
      </p>
    </div>
  );
};

// 搜索框组件
const SearchBox = ({ onSearch, placeholder = "搜索网站..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative max-w-md mx-auto mb-8">
      <div className={`search-focus relative ${isFocused ? 'focused' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200"
          placeholder={placeholder}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// 加载指示器组件
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 border-top-primary-blue rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-top-blue-400 rounded-full animate-spin animate-spin-slow"></div>
      </div>
    </div>
  );
};

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😵‍💫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">出了点小问题</h2>
            <p className="text-gray-600 mb-6">页面遇到了一些技术问题，请刷新页面重试</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { SiteCard, CategoryButton, SkeletonCard, EmptyState, SearchBox, LoadingSpinner, ErrorBoundary };
