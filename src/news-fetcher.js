const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';

const FEEDS = {
  world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  technology: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
  science: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
};

const CACHE_KEY = 'enq_articles_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch { /* quota exceeded — ignore */ }
}

function normalizeArticle(item, category) {
  return {
    id: item.guid || item.link,
    title: item.title || '',
    summary: (item.description || '').replace(/<[^>]*>/g, '').trim(),
    link: item.link || '',
    pubDate: item.pubDate || '',
    category,
    thumbnail: item.thumbnail || item.enclosure?.link || '',
  };
}

export async function fetchArticles(categories = null) {
  const cached = getCached();
  if (cached) return cached;

  const cats = categories || Object.keys(FEEDS);
  const results = await Promise.allSettled(
    cats.map(async (cat) => {
      const url = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(FEEDS[cat])}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'ok') throw new Error(json.message || 'Feed error');
      return (json.items || []).map((item) => normalizeArticle(item, cat));
    })
  );

  const articles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // Sort by date descending
  articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (articles.length > 0) setCache(articles);
  return articles;
}

export function getCategories() {
  return Object.keys(FEEDS);
}
