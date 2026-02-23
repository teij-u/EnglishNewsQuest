(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function e(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(a){if(a.ep)return;a.ep=!0;const r=e(a);fetch(a.href,r)}})();const H="https://api.rss2json.com/v1/api.json",q={world:"https://feeds.bbci.co.uk/news/world/rss.xml",technology:"https://feeds.bbci.co.uk/news/technology/rss.xml",science:"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",business:"https://feeds.bbci.co.uk/news/business/rss.xml"},$="enq_articles_cache",j=3600*1e3;function F(){try{const t=localStorage.getItem($);if(!t)return null;const{timestamp:s,data:e}=JSON.parse(t);return Date.now()-s>j?(localStorage.removeItem($),null):e}catch{return null}}function O(t){try{localStorage.setItem($,JSON.stringify({timestamp:Date.now(),data:t}))}catch{}}function P(t,s){var e;return{id:t.guid||t.link,title:t.title||"",summary:(t.description||"").replace(/<[^>]*>/g,"").trim(),link:t.link||"",pubDate:t.pubDate||"",category:s,thumbnail:t.thumbnail||((e=t.enclosure)==null?void 0:e.link)||""}}async function B(t=null){const s=F();if(s)return s;const e=t||Object.keys(q),a=(await Promise.allSettled(e.map(async r=>{const i=`${H}?rss_url=${encodeURIComponent(q[r])}`,c=await fetch(i);if(!c.ok)throw new Error(`HTTP ${c.status}`);const l=await c.json();if(l.status!=="ok")throw new Error(l.message||"Feed error");return(l.items||[]).map(u=>P(u,r))}))).filter(r=>r.status==="fulfilled").flatMap(r=>r.value);return a.sort((r,i)=>new Date(i.pubDate)-new Date(r.pubDate)),a.length>0&&O(a),a}function k(t){return t.replace(/([.!?])\s+/g,"$1|").split("|").map(s=>s.trim()).filter(s=>s.length>0)}function z(t){if(!t)return[];const s=k(t);if(s.length<=2)return[t.trim()];const e=[],n=Math.max(2,Math.ceil(s.length/3));for(let a=0;a<s.length;a+=n){const r=s.slice(a,a+n).join(" ");r.trim()&&e.push(r.trim())}return e}function N(t){return k(t)[0]||t}function _(t){if(!t)return 1;const s=t.split(/\s+/).filter(Boolean),e=s.length,n=s.reduce((r,i)=>r+i.length,0)/(e||1);let a=1;return e>30&&a++,e>60&&a++,n>5&&a++,n>6.5&&a++,Math.min(a,5)}function f(t){for(let s=t.length-1;s>0;s--){const e=Math.floor(Math.random()*(s+1));[t[s],t[e]]=[t[e],t[s]]}return t}function y(t){const s=[e=>{if(e.includes(" not "))return e.replace(" not "," ");const n=[" is "," are "," was "," were "," has "," have "," will "," can "," could "];for(const a of n)if(e.includes(a))return e.replace(a,`${a.trimEnd()} not `);return null},e=>{const n=e.split(" ");if(n.length<5)return null;const a=Math.floor(n.length*.2),r=Math.floor(n.length*.8);return[n[a],n[r]]=[n[r],n[a]],n.join(" ")},e=>{const n={increase:"decrease",decrease:"increase",support:"oppose",oppose:"support",growth:"decline",decline:"growth",success:"failure",failure:"success",better:"worse",worse:"better",more:"fewer",fewer:"more",new:"existing",existing:"new",large:"small",small:"large",rise:"fall",fall:"rise",positive:"negative",negative:"positive"};for(const[a,r]of Object.entries(n)){const i=new RegExp(`\\b${a}\\b`,"i");if(i.test(e))return e.replace(i,r)}return null}];for(const e of f([...s])){const n=e(t);if(n&&n!==t)return n}return`It is unlikely that ${t[0].toLowerCase()}${t.slice(1)}`}function J(t,s){return t.map((e,n)=>{const a=s[n],r=[],i=s.filter((l,u)=>u!==n);for(r.push(...f(i).slice(0,2)),r.push(y(a));r.length<3;)r.push(y(a));const c=f([{text:a,correct:!0},...r.slice(0,3).map(l=>({text:l,correct:!1}))]);return{type:"gist",passage:e,question:"What is the main point of this passage?",questionJa:"この段落の要旨として最も適切なものはどれですか？",options:c,explanation:`The main idea is: "${a}"`}})}function Q(t,s){if(t.length<2)return[];const e=Math.floor(Math.random()*s.length),n=s[e],a=[];for(const i of s)if(i!==n){const c=y(i);c&&a.push(c)}for(;a.length<3;)a.push(y(n));const r=f([{text:n,correct:!0},...a.slice(0,3).map(i=>({text:i,correct:!1}))]);return[{type:"content",passage:t.join(`

`),question:"Which of the following statements agrees with the article?",questionJa:"本文の内容と一致するものはどれですか？",options:r,explanation:`The correct answer matches the original text: "${n}"`}]}const A={climate:["weather patterns","political opinion","social trend","economic cycle"],crisis:["emergency","opportunity","celebration","routine"],significant:["important","small","temporary","invisible"],global:["worldwide","local","personal","ancient"],impact:["effect","decoration","origin","silence"],strategy:["plan","accident","memory","emotion"],decade:["ten years","hundred years","one year","one month"],annual:["yearly","daily","weekly","monthly"],threat:["danger","gift","promise","comfort"],launch:["start","end","pause","ignore"],reveal:["show","hide","destroy","copy"],massive:["very large","very small","very old","very fast"],crucial:["very important","unnecessary","simple","delayed"],vulnerable:["easily harmed","very strong","well-hidden","highly paid"],reform:["change to improve","return to original","completely remove","strongly support"],urge:["strongly encourage","quietly ignore","slowly reduce","carefully avoid"],summit:["high-level meeting","lowest point","casual gathering","written report"],pledge:["promise","refusal","question","complaint"],surge:["rapid increase","gradual decline","steady rate","complete stop"],amid:["during / in the middle of","after the end of","instead of","because of"]};function W(t){const s=t.toLowerCase(),e=[];for(const[n,[a,...r]]of Object.entries(A)){const i=new RegExp(`\\b${n}\\b`,"i");if(i.test(s)){const c=t.replace(i,`<span class="highlight">${n}</span>`),l=f([{text:a,correct:!0},...r.map(u=>({text:u,correct:!1}))]);if(e.push({type:"vocab",passage:c,question:`The word "${n}" in the passage most likely means:`,questionJa:`下線部の "${n}" に最も近い意味はどれですか？`,options:l,explanation:`"${n}" means "${a}" in this context.`}),e.length>=2)break}}return e}function R(t){const s=t.summary||t.title,e=z(s),n=e.map(N),a=[];return a.push(...J(e,n)),a.push(...Q(e,n)),a.push(...W(s)),a.length<3&&e.length>0&&a.push({type:"gist",passage:s,question:"What is this article mainly about?",questionJa:"この記事は主に何について述べていますか？",options:f([{text:n[0],correct:!0},{text:y(n[0]),correct:!1},{text:"The article focuses on unrelated historical events.",correct:!1},{text:"The article is a personal opinion piece with no factual basis.",correct:!1}]),explanation:`The article is about: "${n[0]}"`}),f(a)}function G(t){const s=t.summary||t.title,e=z(s);let n=e.length;e.length>=2&&n++;const a=s.toLowerCase();for(const r of Object.keys(A))new RegExp(`\\b${r}\\b`).test(a)&&n++;return Math.max(n,3)}const E="enq_scores";function h(){try{return JSON.parse(localStorage.getItem(E))||x()}catch{return x()}}function K(t){try{localStorage.setItem(E,JSON.stringify(t))}catch{}}function x(){return{totalCorrect:0,totalAnswered:0,streak:0,bestStreak:0,dailyStats:{},categoryStats:{}}}function U(){return new Date().toISOString().slice(0,10)}function V(t,s){const e=h();e.totalAnswered++,t?(e.totalCorrect++,e.streak++,e.streak>e.bestStreak&&(e.bestStreak=e.streak)):e.streak=0;const n=U();return e.dailyStats[n]||(e.dailyStats[n]={correct:0,total:0}),e.dailyStats[n].total++,t&&e.dailyStats[n].correct++,s&&(e.categoryStats[s]||(e.categoryStats[s]={correct:0,total:0}),e.categoryStats[s].total++,t&&e.categoryStats[s].correct++),K(e),e}function Y(){return h()}function X(){return h().streak}function C(){const{totalCorrect:t}=h();return t>=200?{name:"Master",icon:"👑",level:5}:t>=100?{name:"Expert",icon:"🌟",level:4}:t>=50?{name:"Advanced",icon:"⭐",level:3}:t>=20?{name:"Intermediate",icon:"📚",level:2}:{name:"Beginner",icon:"🌱",level:1}}function Z(){const t=h(),s=[];for(let e=6;e>=0;e--){const n=new Date;n.setDate(n.getDate()-e);const a=n.toISOString().slice(0,10),r=t.dailyStats[a];s.push({date:a,label:n.toLocaleDateString("en",{weekday:"short"}),accuracy:r&&r.total>0?Math.round(r.correct/r.total*100):null})}return s}function tt(){const t=h();return Object.entries(t.categoryStats).map(([s,e])=>({category:s,accuracy:e.total>0?Math.round(e.correct/e.total*100):0,total:e.total}))}function L(t){const s=X(),e=C();t.innerHTML=`
    <div class="header">
      <div class="header-logo">
        <span class="header-logo-icon">📰</span>
        <span class="header-logo-text">EnglishNewsQuest</span>
      </div>
      <div class="header-stats">
        <div class="streak-badge">🔥 ${s}</div>
        <div class="level-badge">${e.icon} ${e.name}</div>
      </div>
    </div>
  `}function I(t,s,e){const n=[{id:"home",icon:"🏠",label:"Home"},{id:"stats",icon:"📊",label:"Stats"}];t.innerHTML=`
    <div class="bottom-nav">
      ${n.map(a=>`
        <button class="nav-item ${a.id===s?"active":""}" data-tab="${a.id}">
          <span class="nav-item-icon">${a.icon}</span>
          <span>${a.label}</span>
        </button>
      `).join("")}
    </div>
  `,t.querySelectorAll(".nav-item").forEach(a=>{a.addEventListener("click",()=>e(a.dataset.tab))})}function et(t,s,e,{onCategoryChange:n,onArticleClick:a}){const r=["all",...new Set(s.map(c=>c.category))],i=e==="all"?s:s.filter(c=>c.category===e);t.innerHTML=`
    <div class="screen">
      <div class="category-filter">
        ${r.map(c=>`
          <button class="category-btn ${c===e?"active":""}" data-cat="${c}">
            ${c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        `).join("")}
      </div>
      <div class="article-list">
        ${i.length===0?'<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No articles found.</div></div>':i.map((c,l)=>st(c,l)).join("")}
      </div>
    </div>
  `,t.querySelectorAll(".category-btn").forEach(c=>{c.addEventListener("click",()=>n(c.dataset.cat))}),t.querySelectorAll(".article-card").forEach(c=>{c.addEventListener("click",()=>{const l=parseInt(c.dataset.idx,10);a(i[l])})})}function st(t,s){const e=_(t.summary),n=G(t),a=t.pubDate?new Date(t.pubDate).toLocaleDateString("en",{month:"short",day:"numeric"}):"";return`
    <div class="article-card" data-idx="${s}">
      <div class="article-card-header">
        <span class="article-card-category">${t.category}</span>
        <div class="article-card-difficulty">
          ${Array.from({length:5},(r,i)=>`<span class="difficulty-dot ${i<e?"filled":""}"></span>`).join("")}
        </div>
      </div>
      <div class="article-card-title">${t.title}</div>
      <div class="article-card-summary">${t.summary}</div>
      <div class="article-card-footer">
        <span class="article-card-date">${a}</span>
        <span class="article-card-questions">${n} questions</span>
      </div>
    </div>
  `}function at(t,s="Loading articles..."){t.innerHTML=`
    <div class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">${s}</div>
    </div>
  `}function nt(t,{question:s,questionIndex:e,totalQuestions:n,elapsed:a,onAnswer:r,onBack:i}){const c=["A","B","C","D"],l=e/n*100,u=Math.floor(a/60),d=a%60;t.innerHTML=`
    <div class="screen">
      <div class="quiz-header">
        <button class="quiz-back-btn" id="quiz-back">← Back</button>
        <div class="quiz-progress">
          <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${l}%"></div></div>
          <span>${e+1} / ${n}</span>
        </div>
        <div class="quiz-timer">${String(u).padStart(2,"0")}:${String(d).padStart(2,"0")}</div>
      </div>

      <div class="quiz-passage">
        <div class="quiz-passage-label">Passage</div>
        <div class="quiz-passage-text">${s.passage}</div>
      </div>

      <div class="quiz-question">
        <span class="quiz-question-number">Q${e+1}.</span>
        ${s.question}
      </div>
      <div class="quiz-question" style="font-size:0.85rem; color:var(--color-text-muted); margin-top:-0.5rem; margin-bottom:1rem;">
        ${s.questionJa}
      </div>

      <div class="quiz-options" id="quiz-options">
        ${s.options.map((p,v)=>`
          <button class="quiz-option" data-idx="${v}">
            <span class="quiz-option-label">${c[v]}</span>
            <span class="quiz-option-text">${p.text}</span>
          </button>
        `).join("")}
      </div>

      <div id="quiz-feedback"></div>
    </div>
  `,t.querySelector("#quiz-back").addEventListener("click",i),t.querySelectorAll(".quiz-option").forEach(p=>{p.addEventListener("click",()=>{const v=parseInt(p.dataset.idx,10);r(v)})})}function rt(t,s,e,n){t.querySelectorAll(".quiz-option").forEach((i,c)=>{i.classList.add("disabled"),s.options[c].correct&&i.classList.add("correct"),c===e&&!s.options[c].correct&&i.classList.add("incorrect")});const r=t.querySelector("#quiz-feedback");r.innerHTML=`
    <div class="quiz-explanation">
      <div class="quiz-explanation-title">Explanation</div>
      <div class="quiz-explanation-text">${s.explanation}</div>
    </div>
    <button class="quiz-next-btn" id="quiz-next">Next Question →</button>
  `,r.querySelector("#quiz-next").addEventListener("click",n)}function it(t,{correct:s,total:e,elapsed:n,onRetry:a,onHome:r}){const i=e>0?Math.round(s/e*100):0,c=Math.floor(n/60),l=n%60;let u="🎉",d="Great Job!";i<40?(u="💪",d="Keep Practicing!"):i<70?(u="👍",d="Good Effort!"):i===100&&(u="🏆",d="Perfect Score!"),t.innerHTML=`
    <div class="screen">
      <div class="results-card">
        <div class="results-icon">${u}</div>
        <div class="results-title">${d}</div>
        <div class="results-score">${i}%</div>
        <div class="results-detail">${s} out of ${e} correct</div>
        <div class="results-stats">
          <div class="results-stat">
            <div class="results-stat-value correct-val">${s}</div>
            <div class="results-stat-label">Correct</div>
          </div>
          <div class="results-stat">
            <div class="results-stat-value incorrect-val">${e-s}</div>
            <div class="results-stat-label">Incorrect</div>
          </div>
          <div class="results-stat">
            <div class="results-stat-value time-val">${c}:${String(l).padStart(2,"0")}</div>
            <div class="results-stat-label">Time</div>
          </div>
        </div>
        <div class="results-actions">
          <button class="results-btn secondary" id="results-home">Home</button>
          <button class="results-btn primary" id="results-retry">Try Another</button>
        </div>
      </div>
    </div>
  `,t.querySelector("#results-home").addEventListener("click",r),t.querySelector("#results-retry").addEventListener("click",a)}function ot(t){const s=Y(),e=Z(),n=tt(),a=C(),r=s.totalAnswered>0?Math.round(s.totalCorrect/s.totalAnswered*100):0;t.innerHTML=`
    <div class="screen">
      <div class="stats-overview">
        <div class="stats-card">
          <div class="stats-card-value">${r}%</div>
          <div class="stats-card-label">Accuracy</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${s.totalAnswered}</div>
          <div class="stats-card-label">Questions</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value" style="color:var(--color-secondary)">${s.bestStreak}</div>
          <div class="stats-card-label">Best Streak</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${a.icon} ${a.level}</div>
          <div class="stats-card-label">${a.name}</div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stats-section-title">Weekly Accuracy</div>
        <div class="stats-chart">
          ${ct(e)}
        </div>
      </div>

      ${n.length>0?`
        <div class="stats-section">
          <div class="stats-section-title">Category Breakdown</div>
          <div class="stats-categories">
            ${n.map(i=>`
              <div class="stats-category-row">
                <div class="stats-category-name">${i.category.charAt(0).toUpperCase()+i.category.slice(1)}</div>
                <div class="stats-category-bar">
                  <div class="stats-category-bar-fill" style="width:${i.accuracy}%"></div>
                </div>
                <div class="stats-category-pct">${i.accuracy}%</div>
              </div>
            `).join("")}
          </div>
        </div>
      `:""}
    </div>
  `}function ct(t){const a=t.map(d=>d.accuracy??0),r=100,i=a.map((d,p)=>{const v=5+p/(a.length-1||1)*90,D=45-d/r*40;return{x:v,y:D}}),c=i.map(d=>`${d.x},${d.y}`).join(" "),l=`${i[0].x},45 ${c} ${i[i.length-1].x},45`,u=t.map((d,p)=>`<text x="${5+p/(t.length-1||1)*90}" y="50" text-anchor="middle" class="stats-chart-label">${d.label}</text>`).join("");return`
    <svg viewBox="0 0 100 56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${l}" class="stats-chart-area"/>
      <polyline points="${c}" class="stats-chart-line"/>
      ${i.map(d=>`<circle cx="${d.x}" cy="${d.y}" r="1.5" class="stats-chart-dot"/>`).join("")}
      ${u}
    </svg>
  `}const o={tab:"home",articles:[],activeCategory:"all",currentArticle:null,quiz:null,questionIndex:0,correctCount:0,startTime:0,elapsed:0,timerInterval:null},M=document.getElementById("app-header"),g=document.getElementById("app-main"),T=document.getElementById("app-nav");function b(){switch(L(M),I(T,o.tab==="quiz"||o.tab==="results"?"":o.tab,m),o.tab){case"home":et(g,o.articles,o.activeCategory,{onCategoryChange:t=>{o.activeCategory=t,b()},onArticleClick:S});break;case"quiz":nt(g,{question:o.quiz[o.questionIndex],questionIndex:o.questionIndex,totalQuestions:o.quiz.length,elapsed:o.elapsed,onAnswer:lt,onBack:()=>m("home")});break;case"results":it(g,{correct:o.correctCount,total:o.quiz.length,elapsed:o.elapsed,onRetry:()=>{const t=o.articles.filter(e=>{var n;return e.id!==((n=o.currentArticle)==null?void 0:n.id)}),s=t.length>0?t[Math.floor(Math.random()*t.length)]:o.articles[0];s?S(s):m("home")},onHome:()=>m("home")});break;case"stats":ot(g);break}}function m(t){w(),o.tab=t,b()}function S(t){o.currentArticle=t,o.quiz=R(t),o.questionIndex=0,o.correctCount=0,o.elapsed=0,o.tab="quiz",dt(),b()}function lt(t){var n;const s=o.quiz[o.questionIndex],e=s.options[t].correct;e&&o.correctCount++,V(e,(n=o.currentArticle)==null?void 0:n.category),rt(g,s,t,()=>{o.questionIndex++,o.questionIndex>=o.quiz.length&&(w(),o.tab="results"),b()})}function dt(){w(),o.startTime=Date.now(),o.timerInterval=setInterval(()=>{o.elapsed=Math.floor((Date.now()-o.startTime)/1e3);const t=document.querySelector(".quiz-timer");if(t){const s=Math.floor(o.elapsed/60),e=o.elapsed%60;t.textContent=`${String(s).padStart(2,"0")}:${String(e).padStart(2,"0")}`}},1e3)}function w(){o.timerInterval&&(clearInterval(o.timerInterval),o.timerInterval=null)}async function ut(){L(M),I(T,"home",m),at(g);try{o.articles=await B()}catch(t){console.error("Failed to fetch articles:",t),o.articles=[]}o.tab="home",b()}ut();
