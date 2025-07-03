const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 15001;

// 数据文件路径
const DATA_FILE_PATH = path.join(__dirname, 'src', 'data.json');
// 构建文件路径
const BUILD_PATH = path.join(__dirname, 'build');

// 中间件
app.use(cors());
app.use(express.json());

// 托管静态文件 - 优先提供 build 目录的静态文件
app.use(express.static(BUILD_PATH));

// 为 icons 提供特殊路由，确保图标可以正确访问
app.use('/icons', express.static(path.join(BUILD_PATH, 'icons')));

// 读取数据文件
const readDataFile = async () => {
  try {
    const data = await fs.readJson(DATA_FILE_PATH);
    return data;
  } catch (error) {
    console.error('读取数据文件失败:', error);
    throw new Error('无法读取数据文件');
  }
};

// 写入数据文件
const writeDataFile = async (data) => {
  try {
    await fs.writeJson(DATA_FILE_PATH, data, { spaces: 2 });
    console.log('数据文件已更新');
    return true;
  } catch (error) {
    console.error('写入数据文件失败:', error);
    throw new Error('无法写入数据文件');
  }
};

// 获取所有数据
app.get('/api/data', async (req, res) => {
  try {
    const data = await readDataFile();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加新网站
app.post('/api/sites', async (req, res) => {
  try {
    const { name, url, description, categoryId, icon } = req.body;
    
    // 验证必需字段
    if (!name || !url || !categoryId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: name, url, categoryId'
      });
    }

    const data = await readDataFile();
    
    // 生成新ID
    const newId = Math.max(...data.sites.map(site => site.id), 0) + 1;
    
    // 创建新网站对象
    const newSite = {
      id: newId,
      name,
      url,
      description: description || '',
      categoryId: parseInt(categoryId),
      icon: icon || '/icons/default.svg'
    };
    
    // 添加到数据中
    data.sites.push(newSite);
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: newSite,
      message: `网站 "${name}" 添加成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新网站
app.put('/api/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    const { name, url, description, categoryId, icon } = req.body;
    
    const data = await readDataFile();
    
    // 找到要更新的网站
    const siteIndex = data.sites.findIndex(site => site.id === siteId);
    
    if (siteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '网站不存在'
      });
    }
    
    // 更新网站信息
    const updatedSite = {
      ...data.sites[siteIndex],
      ...(name && { name }),
      ...(url && { url }),
      ...(description !== undefined && { description }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(icon && { icon })
    };
    
    data.sites[siteIndex] = updatedSite;
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: updatedSite,
      message: `网站 "${updatedSite.name}" 更新成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除网站
app.delete('/api/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    const data = await readDataFile();
    
    // 找到要删除的网站
    const siteIndex = data.sites.findIndex(site => site.id === siteId);
    
    if (siteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '网站不存在'
      });
    }
    
    // 获取要删除的网站信息
    const deletedSite = data.sites[siteIndex];
    
    // 从数组中移除
    data.sites.splice(siteIndex, 1);
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: deletedSite,
      message: `网站 "${deletedSite.name}" 删除成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加新分类
app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon } = req.body;
    
    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: name, icon'
      });
    }

    const data = await readDataFile();
    
    // 生成新ID
    const newId = Math.max(...data.categories.map(cat => cat.id), 0) + 1;
    
    // 创建新分类对象
    const newCategory = {
      id: newId,
      name,
      icon
    };
    
    // 添加到数据中
    data.categories.push(newCategory);
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: newCategory,
      message: `分类 "${name}" 添加成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除分类
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: '无效的分类ID'
      });
    }

    const data = await readDataFile();
    
    // 找到要删除的分类
    const categoryIndex = data.categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '分类不存在'
      });
    }
    
    // 检查该分类下是否有网站
    const sitesInCategory = data.sites.filter(site => site.categoryId === categoryId);
    
    if (sitesInCategory.length > 0) {
      return res.status(400).json({
        success: false,
        error: `无法删除分类，该分类下还有 ${sitesInCategory.length} 个网站。请先删除或移动这些网站。`
      });
    }
    
    // 获取要删除的分类信息
    const deletedCategory = data.categories[categoryIndex];
    
    // 从数组中移除
    data.categories.splice(categoryIndex, 1);
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: deletedCategory,
      message: `分类 "${deletedCategory.name}" 删除成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 所有非 API 路由都返回 React 应用的 index.html
app.get('*', (req, res) => {
  // 如果请求的是 API 路由，继续处理错误
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API 路由不存在'
    });
  }
  
  // 否则返回 React 应用
  res.sendFile(path.join(BUILD_PATH, 'index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器已启动在端口 ${PORT}`);
  console.log(`🌐 网站访问: http://localhost:${PORT}`);
  console.log(`📍 API 地址: http://localhost:${PORT}/api`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📊 数据文件: ${DATA_FILE_PATH}`);
  console.log(`📁 静态文件: ${BUILD_PATH}`);
});

module.exports = app;
