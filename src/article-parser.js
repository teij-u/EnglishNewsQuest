/**
 * Split text into sentences. Handles common abbreviations.
 */
function splitSentences(text) {
  return text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Split article summary into pseudo-paragraphs.
 * RSS summaries are short, so we treat every 2-3 sentences as a paragraph.
 */
export function splitParagraphs(text) {
  if (!text) return [];
  const sentences = splitSentences(text);
  if (sentences.length <= 2) return [text.trim()];

  const paragraphs = [];
  const chunkSize = Math.max(2, Math.ceil(sentences.length / 3));
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) paragraphs.push(chunk.trim());
  }
  return paragraphs;
}

/**
 * Extract the gist (first sentence) of a paragraph.
 */
export function extractGist(paragraph) {
  const sentences = splitSentences(paragraph);
  return sentences[0] || paragraph;
}

/**
 * Extract keywords (simple heuristic: longer words, excluding stop words).
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'and', 'but', 'or', 'nor', 'if', 'that',
  'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'he',
  'she', 'they', 'them', 'his', 'her', 'their', 'what', 'about', 'up',
  'just', 'also', 'new', 'said', 'says', 'told', 'added', 'get', 'got',
]);

export function extractKeywords(text, count = 5) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  // Count frequencies
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

/**
 * Calculate a difficulty score 1-5 based on word count and average word length.
 */
export function calculateDifficulty(text) {
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);

  let score = 1;
  if (wordCount > 30) score++;
  if (wordCount > 60) score++;
  if (avgWordLen > 5) score++;
  if (avgWordLen > 6.5) score++;
  return Math.min(score, 5);
}
