import React, { useState, memo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Site icon component
const SiteIcon = memo(({ site, onClick }) => {
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
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[6.5rem] lg:h-[6.5rem] bg-gradient-to-br from-blue-400 to-purple-500 rounded-md sm:rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-sm cursor-pointer"
      >
        {(site.name || '?').charAt(0)}
      </div>
    );
  }

  return (
  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[6.5rem] lg:h-[6.5rem] cursor-pointer" onClick={onClick} role={onClick ? 'button' : undefined}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg skeleton"></div>
      )}
      <img
        src={(() => {
          // If site.icon looks like an absolute URL (http://, https://) or protocol-relative (//),
          // use it as-is. Otherwise prefix with PUBLIC_URL so relative paths resolve correctly.
          const icon = site.icon || '/icons/default.svg';
          if (/^https?:\/\//i.test(icon) || /^\/\//.test(icon)) return icon;
          // Ensure PUBLIC_URL ends without a trailing slash
          const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
          // If icon already starts with '/', don't add extra slash
          return base ? base + (icon.startsWith('/') ? icon : '/' + icon) : icon;
        })()}
        alt={`${site.name} 图标`}
        className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[6.5rem] lg:h-[6.5rem] rounded-md sm:rounded-lg object-cover shadow-sm transition-opacity duration-300 ${
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
  const busRef = useRef(null);
  const handlersRef = useRef({});

  // cleanup when modal closes
  useEffect(() => {
    if (!open) return;
    return () => {
      try {
        const bus = busRef.current;
        const handlers = handlersRef.current || {};
        if (bus && typeof bus.off === 'function') {
          if (handlers.time) bus.off('game_time', handlers.time);
          if (handlers.start) bus.off('game_start', handlers.start);
          if (handlers.score) bus.off('game_score', handlers.score);
          if (handlers.level) bus.off('game_level', handlers.level);
          if (handlers.interstitial) {
            bus.off('game_interstitial', handlers.interstitial);
            bus.off('game_interstitialad', handlers.interstitial);
            bus.off('interstitial', handlers.interstitial);
            bus.off('interstitial_open', handlers.interstitial);
          }
          if (handlers.reward) {
            bus.off('game_reward', handlers.reward);
            bus.off('reward', handlers.reward);
          }
          if (handlers.beforeAd) {
            bus.off('before_ad', handlers.beforeAd);
            bus.off('interstitial_open', handlers.beforeAd);
            bus.off('beforeAd', handlers.beforeAd);
            bus.off('game_interstitialad_open', handlers.beforeAd);
            bus.off('game_reward_open', handlers.beforeAd);
          }
          if (handlers.afterAd) {
            bus.off('after_ad', handlers.afterAd);
            bus.off('interstitial_viewed', handlers.afterAd);
            bus.off('afterAd', handlers.afterAd);
            bus.off('game_interstitialad_viewed', handlers.afterAd);
          }
          if (handlers.dismissed) {
            bus.off('reward_dismissed', handlers.dismissed);
            bus.off('adDismissed', handlers.dismissed);
            bus.off('game_reward_dismissed', handlers.dismissed);
          }
          if (handlers.viewed) {
            bus.off('reward_viewed', handlers.viewed);
            bus.off('adViewed', handlers.viewed);
            bus.off('game_reward_viewed', handlers.viewed);
          }
          if (handlers.adError) bus.off('ad_error', handlers.adError);
        }
        if (bus && bus._isMessageListener && typeof bus._remove === 'function') {
          try { bus._remove(); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // ignore
      }
      busRef.current = null;
      handlersRef.current = {};
    };
  }, [open]);

  const normalizeEvent = (type) => {
    const raw = (type === undefined || type === null) ? '' : String(type);
    return raw.replace(/[^a-z0-9_]/gi, '_').replace(/_+/g, '_').toLowerCase();
  };

  const handleLoad = () => {
    try {
      const frame = iframeRef.current;
      if (!frame || !frame.contentWindow) return;

      // try iframe-scoped SDK first
      let candidate = null;
      try {
        const cw = frame.contentWindow;
        if (cw && cw.IframeSdk && cw.IframeSdk.events_iframe && typeof cw.IframeSdk.events_iframe.on === 'function') {
          candidate = cw.IframeSdk.events_iframe;
        }
      } catch (e) {
        candidate = null; // cross-origin or inaccessible
      }

      // try parent window SDK
      try {
        if (!candidate) {
          const parentCandidate = window && window.IframeSdk && window.IframeSdk.events_iframe;
          if (parentCandidate && typeof parentCandidate.on === 'function') candidate = parentCandidate;
        }
      } catch (e) {
        // ignore
      }

      // fallback: postMessage-based bus that listens only to messages from this iframe
      if (!candidate) {
        const listeners = {};
        const onMessage = (ev) => {
          try {
            if (ev.source !== frame.contentWindow) return;
            const payload = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
            const items = Array.isArray(payload) ? payload : [payload];
            items.forEach(item => {
              if (!item || !item.type) return;
              const key = normalizeEvent(item.type);
              const cbs = listeners[key] || [];
              cbs.forEach(cb => { try { cb(item.value); } catch (e) { /* ignore */ } });
            });
          } catch (e) {
            // ignore malformed messages
          }
        };
        window.addEventListener('message', onMessage);

        candidate = {
          on: (evt, cb) => {
            const k = normalizeEvent(evt);
            if (!listeners[k]) listeners[k] = [];
            listeners[k].push(cb);
          },
          off: (evt, cb) => {
            const k = normalizeEvent(evt);
            if (!listeners[k]) return;
            if (!cb) { listeners[k] = []; return; }
            listeners[k] = listeners[k].filter(x => x !== cb);
          },
          _isMessageListener: true,
          _remove: () => window.removeEventListener('message', onMessage)
        };
      }

      if (candidate && typeof candidate.on === 'function') {
        const formatSeconds = (sec) => {
          const total = Number(sec) || 0;
          const abs = Math.max(0, Math.floor(total));
          const h = Math.floor(abs / 3600);
          const m = Math.floor((abs % 3600) / 60);
          const s = abs % 60;
          const pad = (n) => String(n).padStart(2, '0');
          if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
          return `${pad(m)}:${pad(s)}`;
        };

        const handlers = {};
        handlers.time = (val) => {
          const el = document.getElementById('game-time-display');
          if (el) {
            el.textContent = formatSeconds(val);
            el.classList.add('updated');
            setTimeout(() => el.classList.remove('updated'), 300);
          }
        };
        handlers.score = (val) => {
          const el = document.getElementById('game-score-display');
          if (el) {
            el.textContent = String(val);
            el.classList.add('updated');
            setTimeout(() => el.classList.remove('updated'), 300);
          }
        };
        handlers.level = (val) => {
          const el = document.getElementById('game-level-display');
          if (el) {
            el.textContent = String(val);
            el.classList.add('updated');
            setTimeout(() => el.classList.remove('updated'), 300);
          }
        };
        handlers.start = (val) => {
          const el = document.getElementById('game-start-display');
          if (el) {
            const state = !!val;
            el.textContent = state ? 'true' : 'false';
            el.classList.add('updated');
            setTimeout(() => el.classList.remove('updated'), 300);
          }
        };

        // numeric accumulators
        const addToDisplay = (id, delta) => {
          const el = document.getElementById(id);
          if (!el) return;
          const cur = Number(el.textContent) || 0;
          let inc = 1;
          if (delta !== undefined && delta !== null) {
            if (typeof delta === 'object') {
              if (typeof delta.count === 'number') inc = delta.count;
              else if (typeof delta.value === 'number') inc = delta.value;
              else if (typeof delta.n === 'number') inc = delta.n;
              else if (delta.count !== undefined) inc = Number(delta.count) || 1;
              else if (delta.value !== undefined) inc = Number(delta.value) || 1;
              else inc = 1;
            } else {
              const n = Number(delta);
              inc = isNaN(n) ? 1 : n;
            }
          }
          const next = cur + inc;
          el.textContent = String(next);
          el.classList.add('updated');
          setTimeout(() => el.classList.remove('updated'), 300);
        };
        handlers.interstitial = (val) => addToDisplay('interstitial-display', val);
        handlers.reward = (val) => addToDisplay('reward-display', val);
        handlers.beforeAd = (val) => addToDisplay('before-ad-display', val);
        handlers.afterAd = (val) => addToDisplay('after-ad-display', val);
        handlers.dismissed = (val) => addToDisplay('dismissed-display', val);
        handlers.viewed = (val) => addToDisplay('viewed-display', val);
        handlers.adError = (val) => addToDisplay('error-display', val);

        try {
          candidate.on('game_time', handlers.time);
          candidate.on('game_start', handlers.start);
          candidate.on('game_score', handlers.score);
          candidate.on('game_level', handlers.level);

          // 兼容：prsdk/iframesdk 常用事件命名（线上已使用，站点仅做映射）
          // - interstitial/reward: 广告触发
          // - beforeAd/afterAd: 广告前后（等价于 interstitial_open/interstitial_viewed 或 before_ad/after_ad）
          // - adViewed/adDismissed: 广告结果（站点面板计数映射到 reward_viewed/reward_dismissed）
          candidate.on('game_interstitial', handlers.interstitial);
          // prsdk/GA 命名：interstitial
          candidate.on('game_interstitialad', handlers.interstitial);
          candidate.on('game_reward', handlers.reward);
          candidate.on('interstitial', handlers.interstitial);
          candidate.on('reward', handlers.reward);
          candidate.on('interstitial_open', handlers.beforeAd);
          candidate.on('before_ad', handlers.beforeAd);
          candidate.on('beforeAd', handlers.beforeAd);
          // prsdk/GA 命名：open
          candidate.on('game_interstitialad_open', handlers.beforeAd);
          candidate.on('game_reward_open', handlers.beforeAd);
          candidate.on('interstitial_viewed', handlers.afterAd);
          candidate.on('after_ad', handlers.afterAd);
          candidate.on('afterAd', handlers.afterAd);
          // prsdk/GA 命名：viewed
          candidate.on('game_interstitialad_viewed', handlers.afterAd);
          candidate.on('reward_dismissed', handlers.dismissed);
          candidate.on('reward_viewed', handlers.viewed);
          candidate.on('adDismissed', handlers.dismissed);
          candidate.on('adViewed', handlers.viewed);
          // prsdk/GA 命名：reward result
          candidate.on('game_reward_dismissed', handlers.dismissed);
          candidate.on('game_reward_viewed', handlers.viewed);
          candidate.on('ad_error', handlers.adError);

          busRef.current = candidate;
          handlersRef.current = handlers;
        } catch (e) {
          // ignore registration errors
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Normalize iframe src for protocol issues
  const normalizeSrcForProtocol = (url) => {
    if (!url) return url;
    try {
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
        if (/^http:\/\//i.test(url)) {
          return url.replace(/^http:\/\//i, 'https://');
        }
      }
    } catch (e) {
      // ignore and return original
    }
    return url;
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
          <div className="flex flex-col items-center min-w-[60px] sm:min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Time</span>
            <span id="game-time-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>00:00</span>
          </div>
          <div className="flex flex-col items-center min-w-[60px] sm:min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Start</span>
            <span id="game-start-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>false</span>
          </div>
          <div className="flex flex-col items-center min-w-[60px] sm:min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Score</span>
            <span id="game-score-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[60px] sm:min-w-[90px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Game Level</span>
            <span id="game-level-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Interstitial</span>
            <span id="interstitial-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Reward</span>
            <span id="reward-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>BeforeAd</span>
            <span id="before-ad-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>AfterAd</span>
            <span id="after-ad-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Dismissed</span>
            <span id="dismissed-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Viewed</span>
            <span id="viewed-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Error</span>
            <span id="error-display" className="text-sm font-semibold" style={{ color: '#ffffff' }}>0</span>
          </div>
        </div>

        <div className="game-frame-container h-[calc(100%-132px)]">
          <iframe
            ref={iframeRef}
            src={normalizeSrcForProtocol(src)}
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
  const [previewSrc, setPreviewSrc] = useState(site.pathBeta || site.path || site.url);
  const openPreview = (src) => {
    setPreviewSrc(src || (site.pathBeta || site.path || site.url));
    setPreviewOpen(true);
  };
  const closePreview = () => setPreviewOpen(false);
  return (
    <>
    <div 
      className={`card-hover bg-white rounded-lg shadow-card p-3 sm:p-4 border border-transparent transition-all duration-700 ease-out ${
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
          <SiteIcon site={site} onClick={() => openPreview(site.path || site.url)} />
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
              onClick={() => openPreview()}
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
  <IframePreviewModal open={previewOpen} onClose={closePreview} src={previewSrc} title={site.name} />
    </>
  );
});

// 分类按钮组件
const CategoryButton = memo(({ category, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={`category-button inline-flex px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 items-center space-x-1 whitespace-nowrap ${
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">The page encountered some technical issues, please refresh and try again</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { SiteCard, CategoryButton, SkeletonCard, EmptyState, SearchBox, LoadingSpinner, ErrorBoundary };
