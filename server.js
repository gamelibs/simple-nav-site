const express = require('express');
const cors = require('cors');
const compression = require('compression');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 15001;

// 数据文件路径
const DATA_FILE_PATH = path.join(__dirname, 'src', 'data.json');
// 构建文件路径
const BUILD_PATH = path.join(__dirname, 'build');

// 允许跨域的来源（同源请求不经过 CORS，不受影响）
const ALLOWED_ORIGINS = [
  'https://nav.ovoforge.com',
  'http://localhost:15001',
  'http://localhost:3000',
];

// 中间件
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // 无 origin 的请求（同源、curl、服务器端）直接放行
    callback(null, !origin || ALLOWED_ORIGINS.includes(origin));
  },
}));
app.use(express.json());

// ============ 编辑模式鉴权（服务端硬锁） ============
// 编辑密码只存在于服务端，通过环境变量 EDIT_PASSWORD 配置
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || 'nav-edit-2026';
// 由密码派生的无状态编辑令牌（HMAC-SHA256），前端持有令牌即可操作写接口
const EDIT_TOKEN = crypto.createHmac('sha256', EDIT_PASSWORD).update('edit-mode-token').digest('hex');

if (!process.env.EDIT_PASSWORD) {
  console.log('⚠️  未设置 EDIT_PASSWORD 环境变量，正在使用默认编辑密码，上线请务必配置');
}

// 恒时比较，防止时序侧信道
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// 写接口鉴权中间件：令牌不匹配直接 401，数据不会被修改
const requireEditAuth = (req, res, next) => {
  if (safeEqual(req.get('x-edit-token'), EDIT_TOKEN)) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: '未授权：请先在编辑模式中验证密码'
  });
};

// 验证编辑密码（或已有令牌），通过则返回令牌
app.post('/api/auth/verify', (req, res) => {
  const { password, token } = req.body || {};
  if (safeEqual(password, EDIT_PASSWORD) || safeEqual(token, EDIT_TOKEN)) {
    return res.json({ success: true, token: EDIT_TOKEN });
  }
  return res.status(401).json({
    success: false,
    error: '密码错误'
  });
});

// 托管静态文件 - 优先提供 build 目录的静态文件
app.use(express.static(BUILD_PATH, {
  setHeaders: (res, filePath) => {
    // 带内容 hash 的静态资源（/static/js、/static/css）长缓存
    if (filePath.includes(`${path.sep}static${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// 为 icons 提供特殊路由，确保图标可以正确访问
app.use('/icons', express.static(path.join(BUILD_PATH, 'icons'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  },
}));

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
app.post('/api/sites', requireEditAuth, async (req, res) => {
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
app.put('/api/sites/:id', requireEditAuth, async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    const { name, url, description, categoryId, icon, featured } = req.body;
    
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
      ...(icon && { icon }),
      ...(featured !== undefined && { featured: Boolean(featured) })
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
app.delete('/api/sites/:id', requireEditAuth, async (req, res) => {
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
app.post('/api/categories', requireEditAuth, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    
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
      icon,
      description: description || ''
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

// 更新分类（需鉴权）
app.put('/api/categories/:id', requireEditAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, icon, description } = req.body;

    const data = await readDataFile();

    // 找到要更新的分类
    const categoryIndex = data.categories.findIndex(cat => cat.id === categoryId);

    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '分类不存在'
      });
    }

    // 更新分类信息
    const updatedCategory = {
      ...data.categories[categoryIndex],
      ...(name && { name }),
      ...(icon && { icon }),
      ...(description !== undefined && { description })
    };

    data.categories[categoryIndex] = updatedCategory;

    // 保存数据
    await writeDataFile(data);

    res.json({
      success: true,
      data: updatedCategory,
      message: `分类 "${updatedCategory.name}" 更新成功`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除分类（需鉴权；分类下还有网站时拒绝删除）
app.delete('/api/categories/:id', requireEditAuth, async (req, res) => {
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

// 所有非 API 的 GET 请求都返回 React 应用的 index.html
// （Express 5 不支持 app.get('*') 写法，改用中间件形式，同时兼容 Express 4）
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  // 如果请求的是 API 路由，继续处理错误
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API 路由不存在'
    });
  }

  // 否则返回 React 应用（HTML 不缓存，保证发布后即时生效）
  res.setHeader('Cache-Control', 'no-cache');
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
  console.log(`🚀 编辑服务器已启动在端口 ${PORT}`);
  console.log(`📍 API 地址: http://localhost:${PORT}/api`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📊 数据文件: ${DATA_FILE_PATH}`);
});

module.exports = app;
