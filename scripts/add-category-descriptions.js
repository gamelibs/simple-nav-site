/**
 * 一次性脚本：为 data.json 中的分类补充简介文字
 * 用法: node scripts/add-category-descriptions.js
 */
const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'src', 'data.json');

// 按分类 id 配置的简介
const CATEGORY_DESCRIPTIONS = {
  1: '聚合权威新闻媒体与资讯平台，快速了解时政、财经与全球动态',
  2: '优质在线课程与学习平台合集，覆盖慕课、公开课与知识服务',
  3: '电影资讯、影评榜单与在线观影平台导航',
  4: '电子书、网络文学与数字阅读平台精选',
  5: '精选演讲视频与表达学习平台，聆听思想的声音',
  6: '段子、趣图与轻松内容合集，每天的快乐源泉',
  7: '主流电商与优惠导购平台，放心买买买',
  8: '在线音乐、电台与音频娱乐平台导航',
  9: '权威医疗资讯、健康科普与就医服务平台',
  11: '求职招聘与职场发展平台，助你找到好工作',
  12: '国内外纪录片平台与优质纪实内容合集',
  13: '科学科普与知识类内容平台，满足你的好奇心',
  14: '商业资讯与行业信息查询平台精选',
  15: '旅游出行与本地玩乐服务平台导航',
  16: '兴趣才艺学习与技能提升平台精选',
  17: '晨间资讯与有声收听平台，碎片时间涨知识',
  18: '美食菜谱、探店指南与餐饮服务平台',
  19: '图片素材、摄影社区与图库网站精选',
  20: 'PPT 模板、素材与演示设计资源平台',
  21: '网络流行语、热梗与流行文化速览',
  22: '财经资讯、行情数据与金融服务平台导航',
};

const run = async () => {
  const data = await fs.readJson(DATA_FILE);
  let updated = 0;
  data.categories.forEach((category) => {
    const description = CATEGORY_DESCRIPTIONS[category.id];
    if (description && category.description !== description) {
      category.description = description;
      updated++;
    }
  });
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  console.log(`完成：更新 ${updated} / ${data.categories.length} 个分类简介`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
