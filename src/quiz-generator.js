import { splitParagraphs, extractGist, extractKeywords } from './article-parser.js';

/**
 * Shuffle array in place (Fisher-Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Mutate a sentence to create a plausible wrong answer.
 */
function mutateSentence(sentence) {
  const strategies = [
    // Negate
    (s) => {
      if (s.includes(' not ')) return s.replace(' not ', ' ');
      const verbs = [' is ', ' are ', ' was ', ' were ', ' has ', ' have ', ' will ', ' can ', ' could '];
      for (const v of verbs) {
        if (s.includes(v)) return s.replace(v, `${v.trimEnd()} not `);
      }
      return null;
    },
    // Swap subject/object keywords
    (s) => {
      const words = s.split(' ');
      if (words.length < 5) return null;
      const i = Math.floor(words.length * 0.2);
      const j = Math.floor(words.length * 0.8);
      [words[i], words[j]] = [words[j], words[i]];
      return words.join(' ');
    },
    // Replace a keyword with a different one
    (s) => {
      const replacements = {
        increase: 'decrease', decrease: 'increase',
        support: 'oppose', oppose: 'support',
        growth: 'decline', decline: 'growth',
        success: 'failure', failure: 'success',
        better: 'worse', worse: 'better',
        more: 'fewer', fewer: 'more',
        new: 'existing', existing: 'new',
        large: 'small', small: 'large',
        rise: 'fall', fall: 'rise',
        positive: 'negative', negative: 'positive',
      };
      for (const [from, to] of Object.entries(replacements)) {
        const regex = new RegExp(`\\b${from}\\b`, 'i');
        if (regex.test(s)) return s.replace(regex, to);
      }
      return null;
    },
  ];

  for (const strategy of shuffle([...strategies])) {
    const result = strategy(sentence);
    if (result && result !== sentence) return result;
  }
  // Fallback: prepend qualifier
  return `It is unlikely that ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
}

/**
 * Generate paragraph-gist questions.
 * "What is the main idea of this paragraph?"
 */
function generateGistQuestions(paragraphs, allGists) {
  return paragraphs.map((para, idx) => {
    const correctGist = allGists[idx];
    const distractors = [];

    // Other paragraphs' gists
    const otherGists = allGists.filter((_, i) => i !== idx);
    distractors.push(...shuffle(otherGists).slice(0, 2));

    // Mutated version of the correct gist
    distractors.push(mutateSentence(correctGist));

    // Ensure we have exactly 3 distractors
    while (distractors.length < 3) {
      distractors.push(mutateSentence(correctGist));
    }

    const options = shuffle([
      { text: correctGist, correct: true },
      ...distractors.slice(0, 3).map((text) => ({ text, correct: false })),
    ]);

    return {
      type: 'gist',
      passage: para,
      question: 'What is the main point of this passage?',
      questionJa: 'この段落の要旨として最も適切なものはどれですか？',
      options,
      explanation: `The main idea is: "${correctGist}"`,
    };
  });
}

/**
 * Generate content-matching questions.
 * "Which of the following agrees with the article?"
 */
function generateContentQuestions(paragraphs, allGists) {
  if (paragraphs.length < 2) return [];

  const correctIdx = Math.floor(Math.random() * allGists.length);
  const correctStatement = allGists[correctIdx];

  const distractors = [];
  for (const gist of allGists) {
    if (gist !== correctStatement) {
      const mutated = mutateSentence(gist);
      if (mutated) distractors.push(mutated);
    }
  }
  while (distractors.length < 3) {
    distractors.push(mutateSentence(correctStatement));
  }

  const options = shuffle([
    { text: correctStatement, correct: true },
    ...distractors.slice(0, 3).map((text) => ({ text, correct: false })),
  ]);

  return [{
    type: 'content',
    passage: paragraphs.join('\n\n'),
    question: 'Which of the following statements agrees with the article?',
    questionJa: '本文の内容と一致するものはどれですか？',
    options,
    explanation: `The correct answer matches the original text: "${correctStatement}"`,
  }];
}

/**
 * Generate vocabulary-guessing questions.
 * "What does the underlined word most likely mean?"
 */
const VOCAB_HINTS = {
  climate: ['weather patterns', 'political opinion', 'social trend', 'economic cycle'],
  crisis: ['emergency', 'opportunity', 'celebration', 'routine'],
  significant: ['important', 'small', 'temporary', 'invisible'],
  global: ['worldwide', 'local', 'personal', 'ancient'],
  impact: ['effect', 'decoration', 'origin', 'silence'],
  strategy: ['plan', 'accident', 'memory', 'emotion'],
  decade: ['ten years', 'hundred years', 'one year', 'one month'],
  annual: ['yearly', 'daily', 'weekly', 'monthly'],
  threat: ['danger', 'gift', 'promise', 'comfort'],
  launch: ['start', 'end', 'pause', 'ignore'],
  reveal: ['show', 'hide', 'destroy', 'copy'],
  massive: ['very large', 'very small', 'very old', 'very fast'],
  crucial: ['very important', 'unnecessary', 'simple', 'delayed'],
  vulnerable: ['easily harmed', 'very strong', 'well-hidden', 'highly paid'],
  reform: ['change to improve', 'return to original', 'completely remove', 'strongly support'],
  urge: ['strongly encourage', 'quietly ignore', 'slowly reduce', 'carefully avoid'],
  summit: ['high-level meeting', 'lowest point', 'casual gathering', 'written report'],
  pledge: ['promise', 'refusal', 'question', 'complaint'],
  surge: ['rapid increase', 'gradual decline', 'steady rate', 'complete stop'],
  amid: ['during / in the middle of', 'after the end of', 'instead of', 'because of'],
};

function generateVocabQuestions(text) {
  const lowerText = text.toLowerCase();
  const questions = [];

  for (const [word, [correct, ...wrongs]] of Object.entries(VOCAB_HINTS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText)) {
      const highlightedText = text.replace(regex, `<span class="highlight">${word}</span>`);
      const options = shuffle([
        { text: correct, correct: true },
        ...wrongs.map((t) => ({ text: t, correct: false })),
      ]);
      questions.push({
        type: 'vocab',
        passage: highlightedText,
        question: `The word "${word}" in the passage most likely means:`,
        questionJa: `下線部の "${word}" に最も近い意味はどれですか？`,
        options,
        explanation: `"${word}" means "${correct}" in this context.`,
      });
      if (questions.length >= 2) break;
    }
  }
  return questions;
}

/**
 * Generate a full quiz for an article.
 */
export function generateQuiz(article) {
  const text = article.summary || article.title;
  const paragraphs = splitParagraphs(text);
  const gists = paragraphs.map(extractGist);

  const questions = [];

  // Gist questions
  questions.push(...generateGistQuestions(paragraphs, gists));

  // Content-matching question
  questions.push(...generateContentQuestions(paragraphs, gists));

  // Vocabulary question
  questions.push(...generateVocabQuestions(text));

  // Ensure minimum 3 questions — add extra gist/content if needed
  if (questions.length < 3 && paragraphs.length > 0) {
    questions.push({
      type: 'gist',
      passage: text,
      question: 'What is this article mainly about?',
      questionJa: 'この記事は主に何について述べていますか？',
      options: shuffle([
        { text: gists[0], correct: true },
        { text: mutateSentence(gists[0]), correct: false },
        { text: `The article focuses on unrelated historical events.`, correct: false },
        { text: `The article is a personal opinion piece with no factual basis.`, correct: false },
      ]),
      explanation: `The article is about: "${gists[0]}"`,
    });
  }

  return shuffle(questions);
}

/**
 * Get the number of questions that will be generated for an article.
 */
export function estimateQuestionCount(article) {
  const text = article.summary || article.title;
  const paragraphs = splitParagraphs(text);
  let count = paragraphs.length; // gist
  if (paragraphs.length >= 2) count++; // content
  const lowerText = text.toLowerCase();
  for (const word of Object.keys(VOCAB_HINTS)) {
    if (new RegExp(`\\b${word}\\b`).test(lowerText)) count++;
  }
  return Math.max(count, 3);
}
