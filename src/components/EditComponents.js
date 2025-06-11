import React, { useState, useEffect } from 'react';

// 通知组件
export const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2`}>
        <span>{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const EditSiteModal = ({ isOpen, onClose, onSave, site = null, categories }) => {
  const [formData, setFormData] = useState({
    name: site?.name || '',
    url: site?.url || '',
    description: site?.description || '',
    categoryId: site?.categoryId || 1,
    icon: site?.icon || '/icons/default.svg'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {site ? '编辑网站' : '添加网站'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">网站名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">网站地址</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">分类</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})}
              className="w-full border rounded-lg px-3 py-2"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">图标路径</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="/icons/example.svg"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {site ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditModeToolbar = ({ isEditMode, onToggleEditMode, onAddSite }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!process.env.REACT_APP_GITHUB_TOKEN) {
    return null; // 没有token就不显示编辑功能
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex flex-col gap-2">
        {/* 快捷键提示 */}
        {showTooltip && (
          <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg mb-2 max-w-48">
            💡 快捷键提示：
            <br />• Ctrl+E / Cmd+E
            <br />• 连续按3次E键
            <br />• URL参数: ?edit=1
          </div>
        )}
        
        <button
          onClick={onToggleEditMode}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`px-4 py-2 rounded-full shadow-lg transition-all ${
            isEditMode 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title={isEditMode ? '退出编辑模式' : '进入编辑模式 (Ctrl+E)'}
        >
          {isEditMode ? '退出编辑' : '编辑模式'}
        </button>
        
        {isEditMode && (
          <button
            onClick={onAddSite}
            className="px-4 py-2 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all"
            title="添加新网站"
          >
            添加网站
          </button>
        )}
      </div>
    </div>
  );
};
