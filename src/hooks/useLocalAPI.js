import { useState, useEffect } from 'react';

// 使用环境变量中的API地址，便于生产和开发环境切换
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:15001/api';

export const useLocalAPI = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取所有数据
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/data`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || '获取数据失败');
      }
    } catch (err) {
      setError(err.message);
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 添加网站
  const addSite = async (siteData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重新获取数据以更新本地状态
        await fetchData();
        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || '添加网站失败');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 编辑网站
  const editSite = async (siteId, siteData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重新获取数据以更新本地状态
        await fetchData();
        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || '更新网站失败');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 删除网站
  const deleteSite = async (siteId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重新获取数据以更新本地状态
        await fetchData();
        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || '删除网站失败');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 添加分类
  const addCategory = async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重新获取数据以更新本地状态
        await fetchData();
        return { success: true, data: result.data, message: result.message };
      } else {
        throw new Error(result.error || '添加分类失败');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 删除分类
  const deleteCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 尝试调用线上API删除分类
      try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 重新获取数据以更新本地状态
          await fetchData();
          return { success: true, message: result.message };
        } else {
          throw new Error(result.error || '删除分类失败');
        }
      } catch (apiError) {
        // API失败时，模拟本地删除（仅用于演示）
        console.warn('API删除失败，使用本地模拟:', apiError.message);
        
        if (data) {
          // 从本地数据中移除分类
          const updatedData = {
            ...data,
            categories: data.categories.filter(cat => cat.id !== categoryId),
            // 同时移除该分类下的所有网站
            sites: data.sites.filter(site => site.categoryId !== categoryId)
          };
          
          setData(updatedData);
          return { 
            success: true, 
            message: '分类删除成功！（本地模拟）',
            isLocal: true 
          };
        } else {
          throw new Error('无法删除分类：没有本地数据');
        }
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 初始化时获取数据
  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    addSite,
    editSite,
    deleteSite,
    addCategory,
    deleteCategory,
  };
};
