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
  // --- Politics & Governance ---
  climate: ['weather patterns', 'political opinion', 'social trend', 'economic cycle'],
  crisis: ['emergency', 'opportunity', 'celebration', 'routine'],
  summit: ['high-level meeting', 'lowest point', 'casual gathering', 'written report'],
  pledge: ['promise', 'refusal', 'question', 'complaint'],
  reform: ['change to improve', 'return to original', 'completely remove', 'strongly support'],
  legislation: ['a law or set of laws', 'a court decision', 'a political party', 'a public protest'],
  sanction: ['penalty or restriction', 'reward or bonus', 'formal approval', 'public apology'],
  diplomacy: ['managing relations between countries', 'military strategy', 'domestic policy', 'trade agreement'],
  regime: ['government in power', 'daily routine', 'military base', 'economic system'],
  sovereignty: ['supreme authority of a state', 'financial independence', 'military strength', 'cultural identity'],
  coalition: ['alliance of groups', 'single political party', 'military unit', 'business merger'],
  referendum: ['public vote on a specific issue', 'government announcement', 'court ruling', 'election campaign'],
  mandate: ['official authority to act', 'personal request', 'informal suggestion', 'written complaint'],
  bipartisan: ['supported by two parties', 'involving one party', 'against all parties', 'outside politics'],
  veto: ['reject or block a decision', 'approve unanimously', 'delay temporarily', 'suggest an alternative'],

  // --- Economy & Business ---
  surge: ['rapid increase', 'gradual decline', 'steady rate', 'complete stop'],
  inflation: ['rising prices over time', 'falling employment', 'increasing production', 'growing population'],
  recession: ['economic decline', 'rapid growth', 'stable period', 'seasonal change'],
  revenue: ['income earned', 'money spent', 'debt owed', 'tax paid'],
  deficit: ['shortfall or gap', 'surplus amount', 'total earnings', 'average cost'],
  tariff: ['tax on imported goods', 'discount on exports', 'trade agreement', 'shipping fee'],
  commodity: ['raw material traded in bulk', 'finished product', 'luxury item', 'digital service'],
  stakeholder: ['person with an interest in something', 'company shareholder only', 'government official', 'random bystander'],
  acquisition: ['the act of obtaining something', 'the act of losing something', 'a formal protest', 'a legal dispute'],
  dividend: ['share of profit paid to shareholders', 'company debt payment', 'employee bonus', 'government subsidy'],
  austerity: ['strict spending cuts', 'generous spending', 'economic boom', 'tax reduction'],
  subsidy: ['financial aid from government', 'private loan', 'corporate tax', 'trade barrier'],
  volatile: ['likely to change rapidly', 'very stable', 'completely predictable', 'slowly declining'],
  fiscal: ['relating to government finances', 'relating to health', 'relating to education', 'relating to military'],

  // --- Conflict & Security ---
  threat: ['danger', 'gift', 'promise', 'comfort'],
  conflict: ['serious disagreement or war', 'friendly competition', 'peaceful agreement', 'casual debate'],
  ceasefire: ['agreement to stop fighting', 'declaration of war', 'peace treaty', 'military parade'],
  casualties: ['people killed or injured', 'survivors rescued', 'soldiers deployed', 'buildings destroyed'],
  militant: ['person engaged in aggressive action', 'peaceful protester', 'government official', 'neutral observer'],
  retaliation: ['action taken in return for an attack', 'peaceful negotiation', 'surrender to enemy', 'request for help'],
  surveillance: ['close monitoring or watching', 'public broadcasting', 'open discussion', 'free movement'],
  deploy: ['send into position for action', 'bring back home', 'keep in storage', 'sell to another country'],
  escalate: ['become more intense', 'become calmer', 'stay the same', 'end completely'],
  humanitarian: ['concerned with human welfare', 'focused on profit', 'related to military', 'about entertainment'],
  refugee: ['person forced to leave their country', 'tourist visiting abroad', 'immigrant by choice', 'foreign diplomat'],
  asylum: ['protection given to refugees', 'type of hospital', 'prison facility', 'government office'],

  // --- Science & Technology ---
  significant: ['important', 'small', 'temporary', 'invisible'],
  impact: ['effect', 'decoration', 'origin', 'silence'],
  innovative: ['introducing new ideas', 'old-fashioned', 'very expensive', 'widely criticized'],
  preliminary: ['coming before the main part', 'final and complete', 'most important', 'least relevant'],
  breakthrough: ['important discovery or achievement', 'minor setback', 'routine procedure', 'gradual decline'],
  sustainable: ['able to continue long-term', 'only short-term', 'very expensive', 'extremely rare'],
  emissions: ['substances released into the air', 'sounds produced', 'light reflected', 'signals received'],
  renewable: ['able to be replaced naturally', 'running out soon', 'artificially made', 'extremely costly'],
  biodiversity: ['variety of living things', 'single species study', 'ocean temperature', 'soil chemistry'],
  pandemic: ['disease spread across many countries', 'local health issue', 'hospital procedure', 'medical treatment'],
  vaccine: ['substance to prevent disease', 'medicine to cure illness', 'surgical tool', 'hospital department'],
  artificial: ['made by humans, not natural', 'completely natural', 'very expensive', 'extremely rare'],
  algorithm: ['set of rules for calculation', 'type of computer', 'internet connection', 'social media post'],
  infrastructure: ['basic systems and structures', 'advanced technology', 'government policy', 'financial investment'],
  ecosystem: ['community of living things and environment', 'single animal habitat', 'weather pattern', 'farming method'],
  phenomenon: ['observable event or occurrence', 'personal opinion', 'scientific theory', 'mathematical formula'],
  hypothesis: ['proposed explanation to be tested', 'proven scientific fact', 'mathematical equation', 'published result'],

  // --- Society & Culture ---
  global: ['worldwide', 'local', 'personal', 'ancient'],
  crucial: ['very important', 'unnecessary', 'simple', 'delayed'],
  massive: ['very large', 'very small', 'very old', 'very fast'],
  vulnerable: ['easily harmed', 'very strong', 'well-hidden', 'highly paid'],
  controversy: ['public disagreement', 'general agreement', 'private discussion', 'formal ceremony'],
  discrimination: ['unfair treatment based on group identity', 'equal treatment for all', 'job promotion', 'legal protection'],
  demographic: ['relating to population characteristics', 'relating to geography', 'relating to weather', 'relating to history'],
  indigenous: ['originating in a particular place', 'recently arrived', 'artificially created', 'temporarily visiting'],
  migration: ['movement from one place to another', 'staying in one location', 'building new homes', 'changing careers'],
  inequality: ['unfair difference between groups', 'perfect balance', 'shared resources', 'equal opportunity'],
  epidemic: ['widespread disease in a community', 'individual illness', 'medical treatment', 'health improvement'],
  advocate: ['publicly support or recommend', 'secretly oppose', 'quietly ignore', 'formally reject'],
  welfare: ['well-being and health', 'financial profit', 'military power', 'political influence'],
  literacy: ['ability to read and write', 'ability to speak', 'knowledge of math', 'skill in sports'],
  census: ['official count of population', 'political election', 'public holiday', 'national celebration'],

  // --- Media & Communication ---
  reveal: ['show', 'hide', 'destroy', 'copy'],
  launch: ['start', 'end', 'pause', 'ignore'],
  urge: ['strongly encourage', 'quietly ignore', 'slowly reduce', 'carefully avoid'],
  amid: ['during / in the middle of', 'after the end of', 'instead of', 'because of'],
  annual: ['yearly', 'daily', 'weekly', 'monthly'],
  decade: ['ten years', 'hundred years', 'one year', 'one month'],
  strategy: ['plan', 'accident', 'memory', 'emotion'],
  allege: ['claim without proof', 'prove with evidence', 'deny completely', 'accept without question'],
  propaganda: ['biased information to promote a view', 'neutral news report', 'academic research', 'personal diary'],
  anonymous: ['with unknown identity', 'very famous', 'easily recognized', 'publicly known'],
  elaborate: ['detailed and complex', 'simple and brief', 'quick and easy', 'rough and incomplete'],
  unprecedented: ['never happened before', 'very common', 'expected and planned', 'slightly unusual'],
  prominent: ['well-known and important', 'unknown and ordinary', 'recently arrived', 'quietly hidden'],
  scrutiny: ['careful and critical examination', 'casual glance', 'full approval', 'immediate rejection'],
  testimony: ['formal statement of evidence', 'casual conversation', 'written letter', 'public speech'],

  // --- Environment & Disaster ---
  catastrophe: ['terrible disaster', 'minor problem', 'lucky event', 'planned change'],
  drought: ['long period without rain', 'heavy flooding', 'strong winds', 'extreme cold'],
  evacuate: ['move people away from danger', 'bring people to a place', 'keep people inside', 'count the population'],
  contamination: ['making something impure or unsafe', 'cleaning thoroughly', 'improving quality', 'testing for safety'],
  erosion: ['gradual wearing away', 'rapid building up', 'sudden collapse', 'steady improvement'],
  deforestation: ['clearing of forests', 'planting new trees', 'protecting wildlife', 'studying plants'],
  habitat: ['natural home of an animal or plant', 'human-built shelter', 'farming equipment', 'food source'],
  conservation: ['protection of natural resources', 'use of all resources', 'destruction of forests', 'industrial development'],
  magnitude: ['size or extent of something', 'direction of movement', 'speed of change', 'color of light'],
  resilience: ['ability to recover from difficulty', 'tendency to give up', 'resistance to change', 'desire for comfort'],

  // --- Health & Medicine ---
  symptom: ['sign of illness', 'type of medicine', 'medical tool', 'hospital ward'],
  chronic: ['lasting a long time', 'very sudden', 'easily cured', 'extremely rare'],
  diagnosis: ['identification of an illness', 'treatment of a disease', 'prevention of infection', 'recovery from surgery'],
  therapy: ['treatment for illness or disability', 'type of medicine', 'surgical operation', 'hospital department'],
  contagious: ['spreading from person to person', 'not able to spread', 'caused by genetics', 'related to diet'],
  immune: ['protected against disease', 'easily affected by illness', 'allergic to medicine', 'sensitive to pain'],
  outbreak: ['sudden occurrence of disease', 'gradual improvement', 'complete recovery', 'planned vaccination'],
  prescription: ['doctor\u2019s written order for medicine', 'hospital bill', 'medical test result', 'health insurance plan'],
  rehabilitation: ['restoring to normal life after illness', 'preventing future disease', 'diagnosing new conditions', 'performing surgery'],

  // --- Legal & Justice ---
  verdict: ['decision in a court case', 'opening statement', 'lawyer\u2019s fee', 'prison sentence'],
  prosecute: ['bring legal action against someone', 'defend in court', 'release from prison', 'forgive a crime'],
  defendant: ['person accused in court', 'judge in a trial', 'witness giving evidence', 'lawyer for the state'],
  jurisdiction: ['authority to make legal decisions', 'type of crime committed', 'prison location', 'court building'],
  litigation: ['process of taking legal action', 'informal agreement', 'verbal warning', 'community service'],
  compliance: ['following rules or standards', 'breaking the law', 'ignoring guidelines', 'creating new rules'],
  tribunal: ['special court for disputes', 'regular classroom', 'government office', 'police station'],
  amendment: ['change or addition to a law', 'complete removal of a rule', 'original version of a text', 'informal suggestion'],
  statute: ['written law passed by legislature', 'unwritten tradition', 'personal opinion', 'judicial review'],
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
      if (questions.length >= 3) break;
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
