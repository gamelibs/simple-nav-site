import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

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
  };
};
