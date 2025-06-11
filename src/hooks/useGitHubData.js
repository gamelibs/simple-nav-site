import { useState, useEffect } from 'react';

// GitHub配置
const GITHUB_CONFIG = {
  owner: 'gamelibs',
  repo: 'simple-nav-site',
  path: 'src/data.json',
  token: process.env.REACT_APP_GITHUB_TOKEN
};

// 修复中文编码问题的 Base64 解码函数
function decodeBase64(str) {
  try {
    // 使用 TextDecoder 正确处理 UTF-8 编码
    const bytes = Uint8Array.from(atob(str), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    // 如果解码失败，回退到原始方法
    return decodeURIComponent(escape(atob(str)));
  }
}

// 修复中文编码问题的 Base64 编码函数
function encodeBase64(str) {
  try {
    // 使用 TextEncoder 正确处理 UTF-8 编码
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes));
  } catch (error) {
    // 如果编码失败，回退到原始方法
    return btoa(unescape(encodeURIComponent(str)));
  }
}

export const useGitHubData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取当前文件数据和SHA
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (!response.ok) throw new Error('获取数据失败');
      
      const fileData = await response.json();
      const content = JSON.parse(decodeBase64(fileData.content));
      
      setData({
        content,
        sha: fileData.sha
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 更新数据到GitHub
  const updateData = async (newContent, commitMessage = '更新网站数据') => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: commitMessage,
            content: encodeBase64(JSON.stringify(newContent, null, 2)),
            sha: data.sha
          })
        }
      );

      if (!response.ok) throw new Error('更新数据失败');

      const result = await response.json();
      
      // 更新本地状态
      setData({
        content: newContent,
        sha: result.content.sha
      });

      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 添加网站
  const addSite = async (newSite) => {
    if (!data) return { success: false, error: '数据未加载' };

    const newData = {
      ...data.content,
      sites: [...data.content.sites, { ...newSite, id: Date.now() }]
    };

    return await updateData(newData, `添加网站: ${newSite.name}`);
  };

  // 编辑网站
  const editSite = async (siteId, updates) => {
    if (!data) return { success: false, error: '数据未加载' };

    const newData = {
      ...data.content,
      sites: data.content.sites.map(site => 
        site.id === siteId ? { ...site, ...updates } : site
      )
    };

    return await updateData(newData, `编辑网站: ${updates.name || siteId}`);
  };

  // 删除网站
  const deleteSite = async (siteId) => {
    if (!data) return { success: false, error: '数据未加载' };

    const siteToDelete = data.content.sites.find(site => site.id === siteId);
    const newData = {
      ...data.content,
      sites: data.content.sites.filter(site => site.id !== siteId)
    };

    return await updateData(newData, `删除网站: ${siteToDelete?.name || siteId}`);
  };

  // 添加分类
  const addCategory = async (newCategory) => {
    if (!data) return { success: false, error: '数据未加载' };

    const newData = {
      ...data.content,
      categories: [...data.content.categories, { ...newCategory, id: Date.now() }]
    };

    return await updateData(newData, `添加分类: ${newCategory.name}`);
  };

  useEffect(() => {
    if (GITHUB_CONFIG.token) {
      fetchData();
    }
  }, []);

  return {
    data: data?.content,
    loading,
    error,
    fetchData,
    updateData,
    addSite,
    editSite,
    deleteSite,
    addCategory
  };
};
