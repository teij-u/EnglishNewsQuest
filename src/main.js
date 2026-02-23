import './style.css';
import { fetchArticles } from './news-fetcher.js';
import { generateQuiz } from './quiz-generator.js';
import { recordAnswer } from './score-manager.js';
import {
  renderHeader,
  renderNav,
  renderHome,
  renderLoading,
  renderQuiz,
  showAnswerFeedback,
  renderResults,
  renderStatsScreen,
} from './ui-renderer.js';

/* ===== State ===== */

const state = {
  tab: 'home',           // 'home' | 'quiz' | 'results' | 'stats'
  articles: [],
  activeCategory: 'all',
  currentArticle: null,
  quiz: null,
  questionIndex: 0,
  correctCount: 0,
  startTime: 0,
  elapsed: 0,
  timerInterval: null,
};

const $header = document.getElementById('app-header');
const $main = document.getElementById('app-main');
const $nav = document.getElementById('app-nav');

/* ===== Render orchestration ===== */

function render() {
  renderHeader($header);
  renderNav($nav, state.tab === 'quiz' || state.tab === 'results' ? '' : state.tab, navigate);

  switch (state.tab) {
    case 'home':
      renderHome($main, state.articles, state.activeCategory, {
        onCategoryChange: (cat) => {
          state.activeCategory = cat;
          render();
        },
        onArticleClick: startQuiz,
      });
      break;

    case 'quiz':
      renderQuiz($main, {
        question: state.quiz[state.questionIndex],
        questionIndex: state.questionIndex,
        totalQuestions: state.quiz.length,
        elapsed: state.elapsed,
        onAnswer: handleAnswer,
        onBack: () => navigate('home'),
      });
      break;

    case 'results':
      renderResults($main, {
        correct: state.correctCount,
        total: state.quiz.length,
        elapsed: state.elapsed,
        onRetry: () => {
          // Pick a random different article
          const others = state.articles.filter((a) => a.id !== state.currentArticle?.id);
          const next = others.length > 0
            ? others[Math.floor(Math.random() * others.length)]
            : state.articles[0];
          if (next) startQuiz(next);
          else navigate('home');
        },
        onHome: () => navigate('home'),
      });
      break;

    case 'stats':
      renderStatsScreen($main);
      break;
  }
}

function navigate(tab) {
  stopTimer();
  state.tab = tab;
  render();
}

/* ===== Quiz flow ===== */

function startQuiz(article) {
  state.currentArticle = article;
  state.quiz = generateQuiz(article);
  state.questionIndex = 0;
  state.correctCount = 0;
  state.elapsed = 0;
  state.tab = 'quiz';
  startTimer();
  render();
}

function handleAnswer(selectedIdx) {
  const question = state.quiz[state.questionIndex];
  const correct = question.options[selectedIdx].correct;

  if (correct) state.correctCount++;
  recordAnswer(correct, state.currentArticle?.category);

  showAnswerFeedback($main, question, selectedIdx, () => {
    state.questionIndex++;
    if (state.questionIndex >= state.quiz.length) {
      stopTimer();
      state.tab = 'results';
    }
    render();
  });
}

/* ===== Timer ===== */

function startTimer() {
  stopTimer();
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const timerEl = document.querySelector('.quiz-timer');
    if (timerEl) {
      const m = Math.floor(state.elapsed / 60);
      const s = state.elapsed % 60;
      timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

/* ===== Init ===== */

async function init() {
  renderHeader($header);
  renderNav($nav, 'home', navigate);
  renderLoading($main);

  try {
    state.articles = await fetchArticles();
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    state.articles = [];
  }

  state.tab = 'home';
  render();
}

init();
