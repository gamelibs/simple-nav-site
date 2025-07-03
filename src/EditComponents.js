import React, { useState, useEffect } from 'react';

// 编辑模式工具栏组件
export const EditModeToolbar = ({ isEditMode, onToggleEditMode, onAddSite, onManageCategories }) => {
  if (!isEditMode) return null;

  return (
    <div className="fixed bottom-20 right-8 z-50 space-y-3">
      <button
        onClick={onAddSite}
        className="flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
        title="添加新网站"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      <button
        onClick={onManageCategories}
        className="flex items-center justify-center w-14 h-14 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
        title="管理分类"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l-7 12L5 4l7 12m2-7h6" />
        </svg>
      </button>
      
      <button
        onClick={onToggleEditMode}
        className="flex items-center justify-center w-14 h-14 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
        title="退出编辑模式"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// 编辑网站模态框组件
export const EditSiteModal = ({ isOpen, onClose, onSave, site, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    categoryId: 1,
    icon: '/icons/default.svg'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当编辑现有网站时，填充表单数据
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        url: site.url || '',
        description: site.description || '',
        categoryId: site.categoryId || 1,
        icon: site.icon || '/icons/default.svg'
      });
    } else {
      // 重置表单为默认值
      setFormData({
        name: '',
        url: '',
        description: '',
        categoryId: 1,
        icon: '/icons/default.svg'
      });
    }
    setErrors({});
  }, [site, isOpen]);

  // 验证表单数据
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '网站名称不能为空';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = '网站URL不能为空';
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = '请输入有效的URL (http://或https://)';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = '请选择分类';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      // onSave 成功后会关闭模态框
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {site ? '编辑网站' : '添加新网站'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 网站名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入网站名称"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* 网站URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  errors.url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
                disabled={isSubmitting}
              />
              {errors.url && (
                <p className="text-red-500 text-xs mt-1">{errors.url}</p>
              )}
            </div>

            {/* 网站描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none"
                placeholder="请输入网站描述"
                disabled={isSubmitting}
              />
            </div>

            {/* 分类选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类 *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">请选择分类</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* 图标URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图标路径
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                placeholder="/icons/default.svg"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                图标文件路径，相对于public目录
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  site ? '更新' : '添加'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 通知组件
export const Notification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-fadeInUp max-w-sm`}>
        {icon}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// 确认删除弹窗组件
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', type = 'danger' }) => {
  if (!isOpen) return null;

  const confirmButtonClass = type === 'danger' 
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-primary-blue hover:bg-blue-600 text-white';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeInUp">
        <div className="p-6">
          {/* 图标和标题 */}
          <div className="flex items-center mb-4">
            {type === 'danger' ? (
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.464 0L5.68 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>

          {/* 消息内容 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 添加分类模态框组件
export const AddCategoryModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📁'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 常用图标选项
  const iconOptions = [
    '📁', '📰', '📚', '🎬', '📖', '🎤', '😄', '🛒', '🎵', '🏥',
    '💻', '🎮', '🎨', '🔧', '🌐', '📱', '🏠', '🍔', '✈️', '🚗',
    '📊', '💡', '🔬', '📷', '🎯', '💰', '🎪', '🌟', '🔒', '📝'
  ];

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 处理图标选择
  const handleIconSelect = (icon) => {
    setFormData(prev => ({
      ...prev,
      icon
    }));
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '分类名称不能为空';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = '分类名称不能超过20个字符';
    }

    if (!formData.icon.trim()) {
      newErrors.icon = '请选择一个图标';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const categoryData = {
        name: formData.name.trim(),
        icon: formData.icon
      };

      await onSave(categoryData);
      
      // 重置表单
      setFormData({
        name: '',
        icon: '📁'
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('添加分类失败:', error);
      setErrors({ general: '添加分类失败，请重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单并关闭模态框
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        icon: '📁'
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">添加新分类</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 全局错误信息 */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* 分类名称 */}
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                分类名称 *
              </label>
              <input
                type="text"
                id="categoryName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入分类名称"
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500 ${
                  errors.name 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 图标选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择图标 *
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    disabled={isSubmitting}
                    className={`w-10 h-10 text-xl rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                      formData.icon === icon
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              {errors.icon && (
                <p className="mt-1 text-sm text-red-600">{errors.icon}</p>
              )}
            </div>

            {/* 预览 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-2">预览：</p>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{formData.icon}</span>
                <span className="text-sm font-medium text-gray-800">
                  {formData.name || '分类名称'}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '添加中...' : '添加分类'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 分类管理组件
export const CategoryManagement = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteCategory = async (categoryId) => {
    const result = await onDeleteCategory(categoryId);
    if (result.success) {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">分类管理</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          添加分类
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium text-gray-800">{category.name}</span>
            </div>
            <button
              onClick={() => setDeleteConfirm(category)}
              className="text-red-500 hover:text-red-700 transition-colors duration-200"
              title="删除分类"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 添加分类模态框 */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddCategory}
      />

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="删除分类"
          message={`确定要删除分类"${deleteConfirm.name}"吗？该分类下的所有网站也将被删除。`}
          confirmText="删除"
          cancelText="取消"
          onConfirm={() => handleDeleteCategory(deleteConfirm.id)}
          onClose={() => setDeleteConfirm(null)}
          type="danger"
        />
      )}
    </div>
  );
};
