/**
 * 一次性脚本：为 data.json 中空描述的站点抓取首页简介
 * 来源优先级：meta description > og:description > <title>
 * 只填充空描述，不覆盖已有内容
 * 用法: node scripts/fill-site-descriptions.js
 */
const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'src', 'data.json');
const CONCURRENCY = 10;       // 并发抓取数
const TIMEOUT_MS = 8000;      // 单站超时
const MAX_LEN = 50;           // 简介最大长度
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// 解码常见 HTML 实体
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'")
  .replace(/&nbsp;/g, ' ');

// 清洗简介文本
const cleanText = (s) => {
  if (!s) return '';
  let t = decodeEntities(s)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // 去掉标题常见的后缀噪音
  t = t.replace(/[_\-|丨—]\s*(官网|官方网站|首页|网)\s*$/i, '').trim();
  if (t.length > MAX_LEN) {
    const cut = t.slice(0, MAX_LEN);
    const punct = Math.max(
      cut.lastIndexOf('，'), cut.lastIndexOf('。'),
      cut.lastIndexOf('；'), cut.lastIndexOf('、'),
      cut.lastIndexOf(','), cut.lastIndexOf(' ')
    );
    t = (punct >= 20 ? cut.slice(0, punct) : cut).replace(/[,，、;；\s]+$/, '') + '…';
  }
  return t;
};

// 从 HTML 中提取简介
const extractFromHtml = (html) => {
  const pick = (regexes) => {
    for (const re of regexes) {
      const m = re.exec(html);
      if (m && m[1]) return m[1];
    }
    return '';
  };
  const description = pick([
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i,
  ]);
  if (cleanText(description).length >= 4) return description;
  return pick([/<title[^>]*>([^<]*)<\/title>/i]);
};

// 按声明的字符集解码（兼容 GBK 等中文站点）
const decodeBody = async (res) => {
  const buf = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || '';
  let charset = (/charset=([\w-]+)/i.exec(contentType) || [])[1];
  if (!charset) {
    const head = new TextDecoder('latin1').decode(buf.slice(0, 4096));
    charset = (/<meta[^>]*charset=["']?([\w-]+)/i.exec(head) || [])[1];
  }
  try {
    return new TextDecoder((charset || 'utf-8').toLowerCase()).decode(buf);
  } catch {
    return new TextDecoder('utf-8').decode(buf);
  }
};

// 抓取单个站点的简介，失败返回空串
const fetchDescription = async (site) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(site.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*' },
    });
    if (!res.ok) return '';
    const html = await decodeBody(res);
    return cleanText(extractFromHtml(html));
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
};

const run = async () => {
  const data = await fs.readJson(DATA_FILE);
  const targets = data.sites.filter((s) => !(s.description || '').trim());
  console.log(`共 ${data.sites.length} 个站点，待补简介 ${targets.length} 个`);

  let filled = 0;
  let failed = 0;
  let done = 0;
  const failedSites = [];
  const queue = [...targets];

  const worker = async () => {
    while (queue.length > 0) {
      const site = queue.shift();
      const description = await fetchDescription(site);
      done++;
      if (description) {
        site.description = description;
        filled++;
      } else {
        failed++;
        failedSites.push(site.name);
      }
      if (done % 50 === 0) {
        console.log(`进度 ${done}/${targets.length}（成功 ${filled}）`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  console.log(`完成：成功 ${filled}，失败 ${failed}，已写回 ${DATA_FILE}`);
  if (failedSites.length > 0) {
    console.log(`失败站点: ${failedSites.join('、')}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
