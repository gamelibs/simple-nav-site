const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 15002;

// 数据文件路径
const DATA_FILE_PATH = path.join(__dirname, 'data', 'data.json');

// 中间件
app.use(cors());
app.use(express.json());

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

// 添加新game
app.post('/api/sites', async (req, res) => {
  try {
    const { name, url, description, categoryId, icon, pubid, gid } = req.body;
    
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
    
    // 创建新game对象
    const newSite = {
      id: newId,
      name,
      url,
      description: description || '',
      pubid: pubid || '',
      gid: gid || '',
      categoryId: parseInt(categoryId),
      icon: icon || '/icons/default.svg',
      // also store path/pathBeta if provided (form may provide them)
      ...(req.body.path ? { path: req.body.path } : {}),
      ...(req.body.pathBeta ? { pathBeta: req.body.pathBeta } : {})
      
    };
    
    // 添加到数据中
    data.sites.push(newSite);
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: newSite,
      message: `game "${name}" 添加成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新game
app.put('/api/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    const { name, url, description, categoryId, icon, pubid, gid } = req.body;
    
    const data = await readDataFile();
    
    // 找到要更新的game
    const siteIndex = data.sites.findIndex(site => site.id === siteId);
    
    if (siteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'game不存在'
      });
    }
    
    // 更新game信息
    const updatedSite = {
      ...data.sites[siteIndex],
      ...(name && { name }),
      ...(url && { url }),
      ...(description !== undefined && { description }),
      ...(pubid !== undefined && { pubid }),
      ...(gid !== undefined && { gid }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(icon && { icon }),
      // accept edits to path and pathBeta as well
      ...(req.body.path !== undefined && { path: req.body.path }),
      ...(req.body.pathBeta !== undefined && { pathBeta: req.body.pathBeta })
    };
    
    data.sites[siteIndex] = updatedSite;
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: updatedSite,
      message: `game "${updatedSite.name}" 更新成功`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除game
app.delete('/api/sites/:id', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    
    const data = await readDataFile();
    
    // 找到要删除的game
    const siteIndex = data.sites.findIndex(site => site.id === siteId);
    
    if (siteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'game不存在'
      });
    }
    
    // 获取要删除的game信息
    const deletedSite = data.sites[siteIndex];
    
    // 从数组中移除
    data.sites.splice(siteIndex, 1);
    
    // 保存数据
    await writeDataFile(data);
    
    res.json({
      success: true,
      data: deletedSite,
      message: `game "${deletedSite.name}" 删除成功`
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

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 如果直接运行此文件，则启动仅包含 API 的编辑服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 编辑服务器已启动在端口 ${PORT}`);
    console.log(`📍 API 地址: http://localhost:${PORT}/api`);
    console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📊 数据文件: ${DATA_FILE_PATH}`);
  });
}

module.exports = app;
