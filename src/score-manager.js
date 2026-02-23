const STORAGE_KEY = 'enq_scores';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData();
  } catch {
    return defaultData();
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function defaultData() {
  return {
    totalCorrect: 0,
    totalAnswered: 0,
    streak: 0,
    bestStreak: 0,
    dailyStats: {},     // { "2026-02-24": { correct: 3, total: 5 } }
    categoryStats: {},  // { "world": { correct: 2, total: 4 } }
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function recordAnswer(correct, category) {
  const data = load();
  data.totalAnswered++;
  if (correct) {
    data.totalCorrect++;
    data.streak++;
    if (data.streak > data.bestStreak) data.bestStreak = data.streak;
  } else {
    data.streak = 0;
  }

  // Daily stats
  const day = todayKey();
  if (!data.dailyStats[day]) data.dailyStats[day] = { correct: 0, total: 0 };
  data.dailyStats[day].total++;
  if (correct) data.dailyStats[day].correct++;

  // Category stats
  if (category) {
    if (!data.categoryStats[category]) data.categoryStats[category] = { correct: 0, total: 0 };
    data.categoryStats[category].total++;
    if (correct) data.categoryStats[category].correct++;
  }

  save(data);
  return data;
}

export function getStats() {
  return load();
}

export function getStreak() {
  return load().streak;
}

export function getLevel() {
  const { totalCorrect } = load();
  if (totalCorrect >= 200) return { name: 'Master', icon: '\u{1F451}', level: 5 };
  if (totalCorrect >= 100) return { name: 'Expert', icon: '\u{1F31F}', level: 4 };
  if (totalCorrect >= 50) return { name: 'Advanced', icon: '\u{2B50}', level: 3 };
  if (totalCorrect >= 20) return { name: 'Intermediate', icon: '\u{1F4DA}', level: 2 };
  return { name: 'Beginner', icon: '\u{1F331}', level: 1 };
}

export function getWeeklyAccuracy() {
  const data = load();
  const results = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = data.dailyStats[key];
    results.push({
      date: key,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      accuracy: day && day.total > 0 ? Math.round((day.correct / day.total) * 100) : null,
    });
  }
  return results;
}

export function getCategoryAccuracy() {
  const data = load();
  return Object.entries(data.categoryStats).map(([cat, s]) => ({
    category: cat,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    total: s.total,
  }));
}
