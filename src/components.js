import React, { useState, memo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Site icon component
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

  if (imageError) {
    return (
      <div className="w-[6.5rem] h-[6.5rem] bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-sm">
        {site.name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="relative w-[6.5rem] h-[6.5rem]">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg skeleton"></div>
      )}
      <img
        src={process.env.PUBLIC_URL + site.icon}
        alt={`${site.name} 图标`}
        className={`w-[6.5rem] h-[6.5rem] rounded-lg object-cover shadow-sm transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
});

// Site card component
// iframe preview modal component
const IframePreviewModal = ({ open, onClose, src, title = 'Game Preview' }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Handler to receive status updates from the iframe
    const onMessage = (ev) => {
      try {
        // Only accept messages coming from the iframe we opened (best-effort)
        if (!iframeRef.current || ev.source !== iframeRef.current.contentWindow) return;
        const d = ev.data || {};
        // Accept either a specific type or loose payloads that include time/score/level
        if (d.type === 'game-status' || d.type === 'status-update' || d.time !== undefined || d.score !== undefined || d.level !== undefined) {
          const setIf = (key, value) => {
            const el = document.getElementById(key);
            if (el && value !== undefined && value !== null) {
              el.textContent = String(value);
              // flash updated style
              el.classList.add('updated');
              setTimeout(() => el.classList.remove('updated'), 300);
            }
          };

          if (d.time !== undefined) setIf('game-time-display', d.time);
          if (d.score !== undefined) setIf('game-score-display', d.score);
          if (d.level !== undefined) setIf('game-level-display', d.level);
        }
      } catch (e) {
        // ignore malformed messages
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [open]);

  const handleLoad = () => {
    try {
      const frame = iframeRef.current;
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'init-load', url: src }, '*');
      }
    } catch (e) {
      // ignore
    }
  };

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative w-full max-w-6xl h-[92vh] bg-white rounded-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#2b2a00' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: '#f5d000', color: '#2b2a00', fontWeight: 700 }}>🎮</div>
            <div className="font-semibold" style={{ color: '#f5d000' }}>{title}</div>
          </div>
          <div>
            <button onClick={onClose} className="px-3 py-1 rounded font-bold" style={{ backgroundColor: '#118335', color: '#f5d000' }}>X</button>
          </div>
        </div>

        {/* English status bar used by the iframe to post updates (bright green strip) */}
        <div className="flex items-center gap-6 px-4 py-2" style={{ backgroundColor: '#000000ff', color: '#ffffff' }}>
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Time</span>
            <span id="game-time-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>00:00</span>
          </div>
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Score</span>
            <span id="game-score-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Level</span>
            <span id="game-level-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>1</span>
          </div>
        </div>

  <div className="game-frame-container h-[calc(100%-132px)]">
          <iframe
            ref={iframeRef}
            src={src}
            className="game-preview w-full h-full bg-white"
            onLoad={handleLoad}
            title={title}
          />
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

const SiteCard = memo(({ site, isVisible, delay = 0, isEditMode = false, onEdit, onDelete }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const openPreview = () => setPreviewOpen(true);
  const closePreview = () => setPreviewOpen(false);
  return (
    <>
    <div 
      className={`card-hover bg-white rounded-lg shadow-card p-4 border border-transparent transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
      } ${isEditMode ? 'relative' : ''}`}
      style={{
        transitionDelay: `${delay}ms`
      }}
    >
  {/* Edit mode buttons */}
      {isEditMode && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => onEdit(site)}
            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(site.id)}
            className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
            title="Delete"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

        <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <SiteIcon site={site} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate hover:text-primary-blue transition-colors duration-200">
            {site.name}
          </h3>
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-3">
            <span className="text-green-500 px-2 py-0.5 rounded">gid: {site.gid}</span>
            {site.pubid && site.pubid.length > 0 && (
              <span className="px-2 py-0.5 rounded" style={{ color: '#f5d000', backgroundColor: 'transparent' }}>pubid: {site.pubid}</span>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {site.description}
          </p>
        </div>
        {!isEditMode && (
          <div className="flex flex-col items-center justify-center space-y-2">
            <a
              href={site.path || site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center w-10 h-8 justify-center bg-primary-blue text-white text-xs font-medium rounded-md hover:bg-blue-600 hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
              aria-label="Open in new tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={openPreview}
              className="inline-flex items-center w-10 h-8 justify-center bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 hover:shadow-md transition-all duration-200"
              title="Preview on this page"
              aria-label="Preview"
            >
              {/* Arrow up into a U-shaped half-box */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v8m0-8l-4 4m4-4 4 4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18h16M6 18v-4M18 18v-4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
    <IframePreviewModal open={previewOpen} onClose={closePreview} src={site.path || site.url} title={site.name} />
    </>
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
          : 'bg-transparent text-white hover:bg-[#222222]'
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
  <div className="bg-white rounded-lg shadow-card p-4 border border-transparent">
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">No games</h3>
      <p className="text-gray-500">
        {category ? `${category.name} has no games yet` : 'No games have been added yet'}
      </p>
    </div>
  );
};

// 搜索框组件
const SearchBox = ({ onSearch, placeholder = "搜索game..." }) => {
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
