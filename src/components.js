import React, { useState, memo } from 'react';

// 网站图标组件
const SiteIcon = memo(({ site }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // 生成多样化的默认图标
  const generateDefaultIcon = (siteName) => {
    const name = siteName || 'N';
    const firstChar = name.charAt(0).toUpperCase();
    
    // 基于网站名称生成一致的随机数
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 根据网站名称关键词匹配emoji图标
    const keywordEmojis = {
      '新闻|news|资讯': '📰',
      '视频|电影|movie|video': '🎬',
      '音乐|music|歌曲': '🎵',
      '购物|商城|shop|mall': '🛒',
      '教育|学习|education|course': '📚',
      '游戏|game|娱乐': '🎮',
      '工具|tool|效率': '🔧',
      '社交|social|聊天': '💬',
      '搜索|search|引擎': '🔍',
      '设计|design|创意': '🎨',
      '开发|dev|code|编程': '💻',
      '云|cloud|存储': '☁️',
      '邮箱|email|mail': '📧',
      '地图|map|导航': '🗺️',
      '天气|weather': '🌤️',
      '财经|金融|finance': '💰',
      '医疗|健康|health': '🏥',
      '旅游|travel|出行': '✈️',
      '美食|food|餐饮': '🍕',
      '体育|sport|运动': '⚽',
      '阅读|read|书籍': '📖',
    };

    // 检查是否匹配关键词
    const lowerName = name.toLowerCase();
    let matchedEmoji = null;
    
    for (const [keywords, emoji] of Object.entries(keywordEmojis)) {
      const keywordList = keywords.split('|');
      if (keywordList.some(keyword => lowerName.includes(keyword))) {
        matchedEmoji = emoji;
        break;
      }
    }

    // 如果匹配到emoji，显示emoji图标
    if (matchedEmoji) {
      const shapes = ['rounded-lg', 'rounded-full', 'rounded-xl'];
      const shapeIndex = hash % shapes.length;
      
      return (
        <div className={`
          w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 
          ${shapes[shapeIndex]} border border-gray-200
          flex items-center justify-center text-lg 
          shadow-sm transform transition-all duration-200 hover:scale-105
        `}>
          {matchedEmoji}
        </div>
      );
    }

    // 多种渐变背景色
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-red-400 to-orange-500',
      'from-teal-400 to-cyan-500',
      'from-indigo-400 to-purple-500',
      'from-pink-400 to-rose-500',
      'from-orange-400 to-red-500',
      'from-emerald-400 to-teal-500',
      'from-violet-400 to-purple-500',
      'from-cyan-400 to-blue-500',
      'from-amber-400 to-orange-500',
      'from-lime-400 to-green-500',
      'from-fuchsia-400 to-pink-500',
      'from-sky-400 to-blue-500',
    ];

    // 多种图标形状
    const shapes = [
      'rounded-lg',
      'rounded-full',
      'rounded-xl',
      'rounded-2xl',
    ];

    // 多种装饰元素
    const decorations = [
      '', // 无装饰
      'ring-2 ring-white ring-opacity-50',
      'shadow-lg',
      'border-2 border-white border-opacity-30',
      'shadow-md shadow-black/20',
    ];

    // 多种文字效果
    const textEffects = [
      'font-bold',
      'font-extrabold',
      'font-black',
    ];

    const gradientIndex = hash % gradients.length;
    const shapeIndex = (hash * 2) % shapes.length;
    const decorationIndex = (hash * 3) % decorations.length;
    const textEffectIndex = (hash * 5) % textEffects.length;

    return (
      <div className={`
        w-10 h-10 bg-gradient-to-br ${gradients[gradientIndex]} 
        ${shapes[shapeIndex]} ${decorations[decorationIndex]}
        flex items-center justify-center text-white ${textEffects[textEffectIndex]} 
        text-sm shadow-sm transform transition-all duration-200 hover:scale-105
      `}>
        {firstChar}
      </div>
    );
  };

  if (imageError) {
    return generateDefaultIcon(site.name);
  }

  return (
    <div className="relative w-10 h-10">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg skeleton"></div>
      )}
      <img
        src={process.env.PUBLIC_URL + site.icon}
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

// 网站卡片组件
const SiteCard = memo(({ site, isVisible, delay = 0, isEditMode = false, onEdit, onDelete }) => {
  return (
    <div 
      className={`card-hover bg-white rounded-lg shadow-card p-3 border border-gray-100 transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      } ${isEditMode ? 'relative' : ''}`}
      style={{
        transitionDelay: `${delay}ms`
      }}
    >
      {/* 编辑模式按钮 */}
      {isEditMode && (
        <div className="absolute top-1 right-1 flex space-x-1">
          <button
            onClick={() => onEdit(site)}
            className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="编辑"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(site.id)}
            className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
            title="删除"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col items-center space-y-2">
        <div className="flex-shrink-0">
          <SiteIcon site={site} />
        </div>
        <div className="w-full text-center">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate hover:text-primary-blue transition-colors duration-200">
            {site.name}
          </h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
            {site.description}
          </p>
          {!isEditMode && (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-primary-blue text-white text-xs font-medium rounded-md hover:bg-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              访问
              <svg className="ml-1 w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
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
