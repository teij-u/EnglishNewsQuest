import { getStreak, getLevel, getStats, getWeeklyAccuracy, getCategoryAccuracy } from './score-manager.js';
import { calculateDifficulty } from './article-parser.js';
import { estimateQuestionCount } from './quiz-generator.js';

/* ===== Header ===== */

export function renderHeader(container) {
  const streak = getStreak();
  const level = getLevel();
  container.innerHTML = `
    <div class="header">
      <div class="header-logo">
        <span class="header-logo-icon">\u{1F4F0}</span>
        <span class="header-logo-text">EnglishNewsQuest</span>
      </div>
      <div class="header-stats">
        <div class="streak-badge">\u{1F525} ${streak}</div>
        <div class="level-badge">${level.icon} ${level.name}</div>
      </div>
    </div>
  `;
}

/* ===== Bottom Nav ===== */

export function renderNav(container, activeTab, onNavigate) {
  const tabs = [
    { id: 'home', icon: '\u{1F3E0}', label: 'Home' },
    { id: 'stats', icon: '\u{1F4CA}', label: 'Stats' },
  ];
  container.innerHTML = `
    <div class="bottom-nav">
      ${tabs.map((t) => `
        <button class="nav-item ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
          <span class="nav-item-icon">${t.icon}</span>
          <span>${t.label}</span>
        </button>
      `).join('')}
    </div>
  `;
  container.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.tab));
  });
}

/* ===== Home: Article List ===== */

export function renderHome(container, articles, activeCategory, { onCategoryChange, onArticleClick }) {
  const categories = ['all', ...new Set(articles.map((a) => a.category))];

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  container.innerHTML = `
    <div class="screen">
      <div class="category-filter">
        ${categories.map((c) => `
          <button class="category-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}">
            ${c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        `).join('')}
      </div>
      <div class="article-list">
        ${filtered.length === 0
          ? `<div class="empty-state"><div class="empty-state-icon">\u{1F4ED}</div><div class="empty-state-text">No articles found.</div></div>`
          : filtered.map((a, i) => renderArticleCard(a, i)).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => onCategoryChange(btn.dataset.cat));
  });
  container.querySelectorAll('.article-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.idx, 10);
      onArticleClick(filtered[idx]);
    });
  });
}

function renderArticleCard(article, idx) {
  const diff = calculateDifficulty(article.summary);
  const qCount = estimateQuestionCount(article);
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    : '';

  return `
    <div class="article-card" data-idx="${idx}">
      <div class="article-card-header">
        <span class="article-card-category">${article.category}</span>
        <div class="article-card-difficulty">
          ${Array.from({ length: 5 }, (_, i) =>
            `<span class="difficulty-dot ${i < diff ? 'filled' : ''}"></span>`
          ).join('')}
        </div>
      </div>
      <div class="article-card-title">${article.title}</div>
      <div class="article-card-summary">${article.summary}</div>
      <div class="article-card-footer">
        <span class="article-card-date">${date}</span>
        <span class="article-card-questions">${qCount} questions</span>
      </div>
    </div>
  `;
}

/* ===== Loading ===== */

export function renderLoading(container, message = 'Loading articles...') {
  container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    </div>
  `;
}

/* ===== Quiz Screen ===== */

export function renderQuiz(container, { question, questionIndex, totalQuestions, elapsed, onAnswer, onBack }) {
  const labels = ['A', 'B', 'C', 'D'];
  const progressPct = ((questionIndex) / totalQuestions) * 100;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  container.innerHTML = `
    <div class="screen">
      <div class="quiz-header">
        <button class="quiz-back-btn" id="quiz-back">\u2190 Back</button>
        <div class="quiz-progress">
          <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${progressPct}%"></div></div>
          <span>${questionIndex + 1} / ${totalQuestions}</span>
        </div>
        <div class="quiz-timer">${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</div>
      </div>

      <div class="quiz-passage">
        <div class="quiz-passage-label">Passage</div>
        <div class="quiz-passage-text">${question.passage}</div>
      </div>

      <div class="quiz-question">
        <span class="quiz-question-number">Q${questionIndex + 1}.</span>
        ${question.question}
      </div>
      <div class="quiz-question" style="font-size:0.85rem; color:var(--color-text-muted); margin-top:-0.5rem; margin-bottom:1rem;">
        ${question.questionJa}
      </div>

      <div class="quiz-options" id="quiz-options">
        ${question.options.map((opt, i) => `
          <button class="quiz-option" data-idx="${i}">
            <span class="quiz-option-label">${labels[i]}</span>
            <span class="quiz-option-text">${opt.text}</span>
          </button>
        `).join('')}
      </div>

      <div id="quiz-feedback"></div>
    </div>
  `;

  container.querySelector('#quiz-back').addEventListener('click', onBack);
  container.querySelectorAll('.quiz-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      onAnswer(idx);
    });
  });
}

export function showAnswerFeedback(container, question, selectedIdx, onNext) {
  const options = container.querySelectorAll('.quiz-option');
  options.forEach((btn, i) => {
    btn.classList.add('disabled');
    if (question.options[i].correct) btn.classList.add('correct');
    if (i === selectedIdx && !question.options[i].correct) btn.classList.add('incorrect');
  });

  const feedbackEl = container.querySelector('#quiz-feedback');
  feedbackEl.innerHTML = `
    <div class="quiz-explanation">
      <div class="quiz-explanation-title">Explanation</div>
      <div class="quiz-explanation-text">${question.explanation}</div>
    </div>
    <button class="quiz-next-btn" id="quiz-next">Next Question \u2192</button>
  `;
  feedbackEl.querySelector('#quiz-next').addEventListener('click', onNext);
}

/* ===== Results Screen ===== */

export function renderResults(container, { correct, total, elapsed, onRetry, onHome }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  let icon = '\u{1F389}';
  let title = 'Great Job!';
  if (pct < 40) { icon = '\u{1F4AA}'; title = 'Keep Practicing!'; }
  else if (pct < 70) { icon = '\u{1F44D}'; title = 'Good Effort!'; }
  else if (pct === 100) { icon = '\u{1F3C6}'; title = 'Perfect Score!'; }

  container.innerHTML = `
    <div class="screen">
      <div class="results-card">
        <div class="results-icon">${icon}</div>
        <div class="results-title">${title}</div>
        <div class="results-score">${pct}%</div>
        <div class="results-detail">${correct} out of ${total} correct</div>
        <div class="results-stats">
          <div class="results-stat">
            <div class="results-stat-value correct-val">${correct}</div>
            <div class="results-stat-label">Correct</div>
          </div>
          <div class="results-stat">
            <div class="results-stat-value incorrect-val">${total - correct}</div>
            <div class="results-stat-label">Incorrect</div>
          </div>
          <div class="results-stat">
            <div class="results-stat-value time-val">${minutes}:${String(seconds).padStart(2, '0')}</div>
            <div class="results-stat-label">Time</div>
          </div>
        </div>
        <div class="results-actions">
          <button class="results-btn secondary" id="results-home">Home</button>
          <button class="results-btn primary" id="results-retry">Try Another</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#results-home').addEventListener('click', onHome);
  container.querySelector('#results-retry').addEventListener('click', onRetry);
}

/* ===== Stats Screen ===== */

export function renderStatsScreen(container) {
  const stats = getStats();
  const weekly = getWeeklyAccuracy();
  const categories = getCategoryAccuracy();
  const level = getLevel();
  const overallPct = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  container.innerHTML = `
    <div class="screen">
      <div class="stats-overview">
        <div class="stats-card">
          <div class="stats-card-value">${overallPct}%</div>
          <div class="stats-card-label">Accuracy</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${stats.totalAnswered}</div>
          <div class="stats-card-label">Questions</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value" style="color:var(--color-secondary)">${stats.bestStreak}</div>
          <div class="stats-card-label">Best Streak</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${level.icon} ${level.level}</div>
          <div class="stats-card-label">${level.name}</div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stats-section-title">Weekly Accuracy</div>
        <div class="stats-chart">
          ${renderWeeklyChart(weekly)}
        </div>
      </div>

      ${categories.length > 0 ? `
        <div class="stats-section">
          <div class="stats-section-title">Category Breakdown</div>
          <div class="stats-categories">
            ${categories.map((c) => `
              <div class="stats-category-row">
                <div class="stats-category-name">${c.category.charAt(0).toUpperCase() + c.category.slice(1)}</div>
                <div class="stats-category-bar">
                  <div class="stats-category-bar-fill" style="width:${c.accuracy}%"></div>
                </div>
                <div class="stats-category-pct">${c.accuracy}%</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderWeeklyChart(weekly) {
  const W = 100;
  const H = 50;
  const padding = 5;
  const dataPoints = weekly.map((d) => d.accuracy ?? 0);
  const maxVal = 100;

  const points = dataPoints.map((val, i) => {
    const x = padding + (i / (dataPoints.length - 1 || 1)) * (W - padding * 2);
    const y = H - padding - (val / maxVal) * (H - padding * 2);
    return { x, y };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${H - padding} ${linePoints} ${points[points.length - 1].x},${H - padding}`;

  const labels = weekly.map((d, i) => {
    const x = padding + (i / (weekly.length - 1 || 1)) * (W - padding * 2);
    return `<text x="${x}" y="${H}" text-anchor="middle" class="stats-chart-label">${d.label}</text>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H + 6}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" class="stats-chart-area"/>
      <polyline points="${linePoints}" class="stats-chart-line"/>
      ${points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="1.5" class="stats-chart-dot"/>`).join('')}
      ${labels}
    </svg>
  `;
}
