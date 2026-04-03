/**
 * Main App
 * Router + Page rendering
 */

const ZODIACS = [
  { name: '白羊座', icon: '♈', dates: '3.21-4.19' },
  { name: '金牛座', icon: '♉', dates: '4.20-5.20' },
  { name: '双子座', icon: '♊', dates: '5.21-6.21' },
  { name: '巨蟹座', icon: '♋', dates: '6.22-7.22' },
  { name: '狮子座', icon: '♌', dates: '7.23-8.22' },
  { name: '处女座', icon: '♍', dates: '8.23-9.22' },
  { name: '天秤座', icon: '♎', dates: '9.23-10.23' },
  { name: '天蝎座', icon: '♏', dates: '10.24-11.22' },
  { name: '射手座', icon: '♐', dates: '11.23-12.21' },
  { name: '摩羯座', icon: '♑', dates: '12.22-1.19' },
  { name: '水瓶座', icon: '♒', dates: '1.20-2.18' },
  { name: '双鱼座', icon: '♓', dates: '2.19-3.20' }
];

// ===== Router =====
class Router {
  constructor() {
    this.routes = {
      '/': this.renderHome.bind(this),
      '/chart': this.renderChart.bind(this),
      '/tarot': this.renderTarot.bind(this),
      '/compatibility': this.renderCompatibility.bind(this),
      '/fortune': this.renderFortune.bind(this),
      '/fate': this.renderFate.bind(this)
    };

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes[hash];

    if (route) {
      this.updateNav(hash);
      route();
    } else {
      this.renderHome();
    }
  }

  updateNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${hash}`);
    });
  }
}

const router = new Router();

// ===== Mobile Nav =====
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('mainNav').classList.toggle('active');
});

// ===== Page Renderers =====

// --- HOME ---
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container page-enter">
      <section class="home-hero">
        <h1>星轨 XingGui</h1>
        <p>仰望星空，读懂自己的轨迹</p>
      </section>

      <section class="home-content">
        <div class="home-zodiac-select">
          <p class="home-zodiac-label">选择你的星座，查看今日运势</p>
          <div class="zodiac-grid" id="homeZodiacGrid">
            ${ZODIACS.map((z, i) => `
              <div class="zodiac-item" data-zodiac="${z.name}" data-index="${i}">
                <span class="zodiac-icon">${z.icon}</span>
                <span class="zodiac-name">${z.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div id="homeFortuneResult"></div>
      </section>
    </div>
  `;

  // Zodiac selection
  let selectedZodiac = null;
  document.querySelectorAll('#homeZodiacGrid .zodiac-item').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelectorAll('#homeZodiacGrid .zodiac-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedZodiac = item.dataset.zodiac;

      const resultDiv = document.getElementById('homeFortuneResult');
      resultDiv.innerHTML = renderLoading();

      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await API.getHoroscope(selectedZodiac, today);
        resultDiv.innerHTML = renderFortuneCard(data);
        animateFortuneScore(data.score);
        animateProgressBars(data);
      } catch (e) {
        resultDiv.innerHTML = '<p class="text-center text-danger">加载失败，请重试</p>';
      }
    });
  });
}

function renderLoading() {
  return `
    <div class="card">
      <div class="skeleton" style="height: 200px; margin-bottom: 16px;"></div>
      <div class="skeleton" style="height: 100px;"></div>
    </div>
  `;
}

function renderFortuneCard(data) {
  return `
    <div class="card">
      <div class="fortune-score">
        <div class="score-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6"/>
                <stop offset="100%" stop-color="#22d3ee"/>
              </linearGradient>
            </defs>
            <circle class="score-circle-bg" cx="60" cy="60" r="54"/>
            <circle class="score-circle-fill" id="scoreFill" cx="60" cy="60" r="54"/>
          </svg>
          <div class="score-number" id="scoreNumber">0</div>
        </div>
        <span class="score-label">今日综合运势</span>
      </div>

      <div class="stars" id="stars" style="justify-content: center; margin-bottom: 24px;">
        ${[1,2,3,4,5].map(i => `<span class="star" data-index="${i}">★</span>`).join('')}
      </div>

      <div style="display: grid; gap: 16px; margin-bottom: 24px;">
        <div class="progress-item">
          <div class="progress-header">
            <span class="progress-label">💕 爱情运势</span>
            <span class="progress-value" id="loveValue">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="loveFill" data-target="${data.love}"></div>
          </div>
        </div>
        <div class="progress-item">
          <div class="progress-header">
            <span class="progress-label">💼 事业运势</span>
            <span class="progress-value" id="careerValue">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="careerFill" data-target="${data.career}"></div>
          </div>
        </div>
        <div class="progress-item">
          <div class="progress-header">
            <span class="progress-label">💰 财运</span>
            <span class="progress-value" id="wealthValue">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="wealthFill" data-target="${data.wealth}"></div>
          </div>
        </div>
      </div>

      <div class="lucky-info">
        <div class="lucky-item">
          <span class="lucky-icon">🎨</span>
          <span class="lucky-label">幸运色</span>
          <span class="lucky-value">${data.luckyColor}</span>
        </div>
        <div class="lucky-item">
          <span class="lucky-icon">🔢</span>
          <span class="lucky-label">幸运数</span>
          <span class="lucky-value">${data.luckyNumber}</span>
        </div>
        <div class="lucky-item">
          <span class="lucky-icon">🧭</span>
          <span class="lucky-label">幸运方位</span>
          <span class="lucky-value">${data.luckyDirection}</span>
        </div>
      </div>

      <div class="fortune-tip">
        ✧ ${data.tip}
      </div>
    </div>
  `;
}

function animateFortuneScore(score) {
  const percentage = (score / 5) * 100;
  const circle = document.getElementById('scoreFill');
  const number = document.getElementById('scoreNumber');

  if (!circle || !number) return;

  const circumference = 339.292;
  const offset = circumference - (percentage / 100) * circumference;

  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);

  let current = 0;
  const increment = score / 30;
  const timer = setInterval(() => {
    current += increment;
    if (current >= score) {
      current = score;
      clearInterval(timer);
    }
    number.textContent = Math.round(current);
  }, 50);

  const stars = document.querySelectorAll('#stars .star');
  stars.forEach((star, i) => {
    setTimeout(() => {
      if (i < score) {
        star.classList.add('filled');
      }
    }, 500 + i * 150);
  });
}

function animateProgressBars(data) {
  ['love', 'career', 'wealth'].forEach((type, i) => {
    const fill = document.getElementById(`${type}Fill`);
    const value = document.getElementById(`${type}Value`);
    if (!fill || !value) return;

    setTimeout(() => {
      const target = parseInt(fill.dataset.target);
      fill.style.width = `${target}%`;

      let current = 0;
      const increment = target / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        value.textContent = `${Math.round(current)}%`;
      }, 50);
    }, 300 + i * 200);
  });
}

// --- CHART PAGE ---
async function renderChart() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container page-enter">
      <section class="section-title">
        <h2>星盘分析</h2>
        <p>输入出生信息，探索你的宇宙密码</p>
      </section>

      <div class="chart-container">
        <div class="card chart-form">
          <div class="form-group">
            <label class="form-label">出生日期</label>
            <input type="date" class="form-input" id="chartDate">
          </div>
          <div class="form-group">
            <label class="form-label">出生时间（精确到小时）</label>
            <input type="time" class="form-input" id="chartTime">
          </div>
          <div class="form-group">
            <label class="form-label">出生城市</label>
            <input type="text" class="form-input" id="chartCity" placeholder="例如：北京、上海、纽约">
          </div>
          <button class="btn btn-primary" id="chartSubmit" style="width: 100%;">
            ✧ 计算我的星盘
          </button>
        </div>

        <div id="chartResult" class="chart-result"></div>
      </div>
    </div>
  `;

  document.getElementById('chartSubmit').addEventListener('click', async () => {
    const date = document.getElementById('chartDate').value;
    const time = document.getElementById('chartTime').value;
    const city = document.getElementById('chartCity').value;

    if (!date || !time) {
      alert('请填写出生日期和时间');
      return;
    }

    const resultDiv = document.getElementById('chartResult');
    resultDiv.innerHTML = '<div class="skeleton" style="height: 300px;"></div>';
    resultDiv.classList.add('show');

    const data = await API.getNatalChart(date, time, city);
    resultDiv.innerHTML = renderChartResult(data);
  });
}

function renderChartResult(data) {
  return `
    <div class="card">
      <div class="chart-main-signs">
        <div class="main-sign">
          <div class="main-sign-icon">☀️</div>
          <div class="main-sign-label">太阳星座</div>
          <div class="main-sign-value">${data.sun}</div>
        </div>
        <div class="main-sign">
          <div class="main-sign-icon">🌙</div>
          <div class="main-sign-label">月亮星座</div>
          <div class="main-sign-value">${data.moon}</div>
        </div>
        <div class="main-sign">
          <div class="main-sign-icon">⬆️</div>
          <div class="main-sign-label">上升星座</div>
          <div class="main-sign-value">${data.rising}</div>
        </div>
      </div>

      <h3 style="text-align: center; margin-bottom: 16px; color: var(--accent-purple);">行星分布</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">
        ${data.houses.map(h => `
          <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; text-align: center;">
            <span style="color: var(--text-muted); font-size: 0.85rem;">${h.sign}</span>
            <div style="color: var(--accent-gold);">${h.planet}</div>
          </div>
        `).join('')}
      </div>

      <h3 style="text-align: center; margin-bottom: 16px; color: var(--accent-purple);">主要相位</h3>
      <div style="display: grid; gap: 8px;">
        ${data.aspects.map(a => `
          <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span>${a.planet1}</span>
            <span style="color: var(--accent-cyan);">${a.type}</span>
            <span>${a.planet2}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- TAROT PAGE ---
async function renderTarot() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container page-enter">
      <section class="section-title">
        <h2>塔罗占卜</h2>
        <p>让牌卡指引你的困惑</p>
      </section>

      <div class="tarot-layout">
        <div class="tarot-mode-select">
          <button class="tarot-mode-btn active" data-mode="single">单张抽牌</button>
          <button class="tarot-mode-btn" data-mode="three">三张牌阵</button>
        </div>

        <div class="tarot-container" id="tarotContainer">
          ${renderTarotBack(3)}
        </div>

        <button class="btn btn-primary tarot-draw-btn" id="tarotDraw">
          🃏 洗牌并抽牌
        </button>

        <div id="tarotReading" class="tarot-reading"></div>
      </div>
    </div>
  `;

  let currentMode = 'single';

  document.querySelectorAll('.tarot-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tarot-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;

      const container = document.getElementById('tarotContainer');
      container.innerHTML = renderTarotBack(currentMode === 'three' ? 3 : 1);

      document.getElementById('tarotReading').classList.remove('show');
      document.getElementById('tarotReading').innerHTML = '';
    });
  });

  document.getElementById('tarotDraw').addEventListener('click', async () => {
    const container = document.getElementById('tarotContainer');
    const drawBtn = document.getElementById('tarotDraw');
    const reading = document.getElementById('tarotReading');

    drawBtn.disabled = true;
    drawBtn.textContent = '🃏 洗牌中...';

    await new Promise(resolve => setTimeout(resolve, 1500));

    const cards = await API.drawTarot(currentMode);

    const cardCount = cards.length;
    container.innerHTML = cards.map((card, i) => `
      <div class="tarot-card" data-index="${i}" data-reversed="${card.isReversed}">
        <div class="tarot-back">
          <div class="tarot-back-pattern">✧</div>
        </div>
        <div class="tarot-front">
          <div class="tarot-name">${card.name}</div>
          ${card.isReversed ? '<div style="color: var(--danger); font-size: 0.75rem; margin-bottom: 8px;">逆位</div>' : ''}
          <div class="tarot-meaning">${card.isReversed ? card.reversed : card.upright}</div>
        </div>
      </div>
    `).join('');

    const cardElements = container.querySelectorAll('.tarot-card');
    for (let i = 0; i < cardElements.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const card = cardElements[i];
      if (card.dataset.reversed === 'true') {
        card.classList.add('reversed');
      }
      card.classList.add('flipped');
    }

    await new Promise(resolve => setTimeout(resolve, cardCount * 500 + 300));

    if (currentMode === 'three') {
      reading.innerHTML = `
        <h3 class="tarot-reading-title">✧ 牌阵解读 ✧</h3>
        <div class="tarot-position-meanings">
          ${cards.map((card, i) => `
            <div class="tarot-position">
              <div class="tarot-position-label">${card.position}</div>
              <div class="tarot-position-name">${card.name}${card.isReversed ? ' (逆位)' : ''}</div>
              <div class="tarot-position-meaning">${card.isReversed ? card.reversed : card.upright}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      reading.innerHTML = `
        <h3 class="tarot-reading-title">✧ ${cards[0].name} ✧</h3>
        <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">
          ${cards[0].isReversed ? cards[0].reversed : cards[0].upright}
        </p>
      `;
    }
    reading.classList.add('show');

    drawBtn.disabled = false;
    drawBtn.textContent = '🃏 再次抽牌';
  });
}

function renderTarotBack(count) {
  return Array(count).fill(`
    <div class="tarot-card" style="opacity: 0;">
      <div class="tarot-back">
        <div class="tarot-back-pattern">✧</div>
      </div>
    </div>
  `).join('');
}

// --- COMPATIBILITY PAGE ---
async function renderCompatibility() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container page-enter">
      <section class="section-title">
        <h2>星座配对</h2>
        <p>探索两个星座之间的化学反应</p>
      </section>

      <div class="compat-container">
        <div class="card compat-form">
          <div class="compat-form-row">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">你的星座</label>
              <select class="form-input form-select" id="compat1">
                <option value="">选择星座</option>
                ${ZODIACS.map(z => `<option value="${z.name}">${z.icon} ${z.name}</option>`).join('')}
              </select>
            </div>
            <div class="compat-vs">×</div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">对方星座</label>
              <select class="form-input form-select" id="compat2">
                <option value="">选择星座</option>
                ${ZODIACS.map(z => `<option value="${z.name}">${z.icon} ${z.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <button class="btn btn-primary" id="compatSubmit" style="width: 100%; margin-top: 16px;">
            ✧ 查看配对结果
          </button>
        </div>

        <div id="compatResult" class="compat-result"></div>
      </div>
    </div>
  `;

  document.getElementById('compatSubmit').addEventListener('click', async () => {
    const sign1 = document.getElementById('compat1').value;
    const sign2 = document.getElementById('compat2').value;

    if (!sign1 || !sign2) {
      alert('请选择两个星座');
      return;
    }

    const resultDiv = document.getElementById('compatResult');
    resultDiv.innerHTML = '<div class="skeleton" style="height: 300px;"></div>';
    resultDiv.classList.add('show');

    const data = await API.getCompatibility(sign1, sign2);
    resultDiv.innerHTML = renderCompatResult(sign1, sign2, data);
    animateCompatScore(data.score);
  });
}

function renderCompatResult(sign1, sign2, data) {
  return `
    <div class="card">
      <div class="compat-score-section">
        <div class="compat-score-circle">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="compatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6"/>
                <stop offset="100%" stop-color="#22d3ee"/>
              </linearGradient>
            </defs>
            <circle cx="90" cy="90" r="80" fill="none" stroke="var(--bg-tertiary)" stroke-width="10"/>
            <circle cx="90" cy="90" r="80" fill="none" stroke="url(#compatGradient)" stroke-width="10"
              stroke-linecap="round" id="compatCircle"
              stroke-dasharray="502.65" stroke-dashoffset="502.65"
              style="transform: rotate(-90deg); transform-origin: center;"/>
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 2.5rem; font-weight: 700; color: var(--accent-gold);" id="compatScoreNum">0</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">配对指数</div>
          </div>
        </div>
        <h3 style="color: var(--text-secondary);">${sign1} × ${sign2}</h3>
      </div>

      <div class="compat-details">
        <div class="compat-detail-card">
          <div class="compat-detail-label">💕 爱情指数</div>
          <div class="compat-detail-value" data-target="${data.love}">${data.love}</div>
        </div>
        <div class="compat-detail-card">
          <div class="compat-detail-label">💬 沟通指数</div>
          <div class="compat-detail-value" data-target="${data.communication}">${data.communication}</div>
        </div>
        <div class="compat-detail-card">
          <div class="compat-detail-label">🤝 信任指数</div>
          <div class="compat-detail-value" data-target="${data.trust}">${data.trust}</div>
        </div>
        <div class="compat-detail-card">
          <div class="compat-detail-label">⭐ 综合评分</div>
          <div class="compat-detail-value" data-target="${data.score}">${data.score}</div>
        </div>
      </div>

      <div class="compat-analysis">
        <h3>✧ 关系分析</h3>
        <p><strong style="color: var(--success);">优势:</strong> ${data.strengths}</p>
        <p><strong style="color: var(--warning);">挑战:</strong> ${data.weaknesses}</p>
      </div>
    </div>
  `;
}

function animateCompatScore(score) {
  const circle = document.getElementById('compatCircle');
  const number = document.getElementById('compatScoreNum');
  if (!circle || !number) return;

  const circumference = 502.65;
  const offset = circumference - (score / 100) * circumference;

  setTimeout(() => {
    circle.style.transition = 'stroke-dashoffset 1.5s ease-out';
    circle.style.strokeDashoffset = offset;
  }, 100);

  let current = 0;
  const increment = score / 40;
  const timer = setInterval(() => {
    current += increment;
    if (current >= score) {
      current = score;
      clearInterval(timer);
    }
    number.textContent = Math.round(current);
  }, 40);
}

// --- FORTUNE PAGE ---
async function renderFortune() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="container page-enter">
      <section class="section-title">
        <h2>求签问卜</h2>
        <p>心诚则灵，点击签筒求得一签</p>
      </section>

      <div class="fortune-container">
        <div class="fortune-question">
          <input type="text" class="fortune-question-input" id="fortuneQuestion"
            placeholder="默念你的问题（可选）">
        </div>

        <div class="fortune-bamboo-wrapper">
          <div class="fortune-bamboo" id="fortuneBamboo">
            <div class="fortune-bamboo-body">
              <div class="fortune-bamboo-joint"></div>
              <div class="fortune-bamboo-joint"></div>
            </div>
          </div>
        </div>

        <p class="fortune-instruction" id="fortuneInstruction">
          点击签筒，开始求签
        </p>

        <div id="fortuneResult" class="fortune-stick-result"></div>

        <button class="btn btn-secondary fortune-reset-btn hidden" id="fortuneReset">
          🔄 重新求签
        </button>
      </div>
    </div>
  `;

  let hasDrawn = false;

  const bamboo = document.getElementById('fortuneBamboo');
  const instruction = document.getElementById('fortuneInstruction');
  const result = document.getElementById('fortuneResult');
  const resetBtn = document.getElementById('fortuneReset');

  bamboo.addEventListener('click', async () => {
    if (hasDrawn) return;

    instruction.textContent = '诚心祈求中...';
    bamboo.classList.add('shaking');

    await new Promise(resolve => setTimeout(resolve, 2000));

    bamboo.classList.remove('shaking');

    const question = document.getElementById('fortuneQuestion').value;
    const fortune = await API.drawFortune(question);

    instruction.textContent = '';
    result.className = `fortune-stick-result show ${fortune.class}`;
    result.innerHTML = `
      <div class="result-level">${fortune.level}</div>
      <div class="result-text">${fortune.text}</div>
      ${fortune.question ? `<p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 12px;">关于：${fortune.question}</p>` : ''}
    `;

    resetBtn.classList.remove('hidden');
    hasDrawn = true;
  });

  resetBtn.addEventListener('click', () => {
    hasDrawn = false;
    result.className = 'fortune-stick-result';
    result.innerHTML = '';
    resetBtn.classList.add('hidden');
    instruction.textContent = '点击签筒，开始求签';
  });
}

// ===== FATE PAGE - Fortune Master Chat =====
async function renderFate() {
  const app = document.getElementById('app');

  const isVerified = sessionStorage.getItem('fate_verified');

  if (!isVerified) {
    app.innerHTML = `
      <div class="container page-enter">
        <section class="section-title">
          <h2>命运咨询</h2>
          <p>资深命理师，为你解读人生轨迹</p>
        </section>

        <div class="fate-gate-container">
          <div class="fate-gate-card">
            <div class="fate-master-avatar">🧙</div>
            <h3>命理师·星轨</h3>
            <p class="text-secondary">三合紫微 / 飞星紫微 / 河洛斗数 / 禄马四化</p>

            <div class="fate-invite-form">
              <p class="fate-invite-label">请输入邀请码</p>
              <input type="text" class="form-input fate-invite-input" id="fateInviteCode"
                placeholder="邀请码" maxlength="20" autocomplete="off">
              <div class="fate-invite-error hidden" id="fateInviteError">邀请码错误，请重试</div>
              <button class="btn btn-primary fate-invite-btn" id="fateInviteBtn">
                ✧ 进入咨询
              </button>
            </div>

            <p class="fate-gate-hint text-muted">内测阶段，需要邀请码才能体验</p>
          </div>
        </div>
      </div>
    `;

    addFateGateStyles();

    document.getElementById('fateInviteBtn').addEventListener('click', () => {
      const code = document.getElementById('fateInviteCode').value.trim().toUpperCase();
      if (code === 'XINGGUI2026') {
        sessionStorage.setItem('fate_verified', 'true');
        renderFate();
      } else {
        document.getElementById('fateInviteError').classList.remove('hidden');
        document.getElementById('fateInviteCode').classList.add('error');
      }
    });

    document.getElementById('fateInviteCode').addEventListener('input', () => {
      document.getElementById('fateInviteError').classList.add('hidden');
      document.getElementById('fateInviteCode').classList.remove('error');
    });

    return;
  }

  // ===== Verified: Show chat interface =====
  app.innerHTML = `
    <div class="container page-enter">
      <section class="section-title">
        <h2>命运咨询</h2>
        <p>综合使用三合、飞星、河洛、禄马四化等各流派技法</p>
      </section>

      <div class="fate-chat-container">
        <div class="fate-chat-header">
          <div class="fate-master-avatar">🧙</div>
          <div>
            <div class="fate-master-name">命理师·星轨</div>
            <div class="fate-master-status">在线 · 内测版</div>
          </div>
          <button class="btn btn-ghost fate-exit-btn" id="fateExitBtn" title="退出重试">
            ✕
          </button>
        </div>

        <div class="fate-chat-messages" id="fateMessages">
          <div class="fate-message fate-message-master">
            <div class="fate-message-avatar">🧙</div>
            <div class="fate-message-content">
              <p>善知识，贫道研习易经术数三十余载，精通三合、飞星、河洛、禄马四化等诸家技法。</p>
              <p>今开此坛，愿为有缘人指点迷津。</p>
              <p>请告之命主资讯：</p>
              <ol>
                <li>出生年月日时分（阳历）</li>
                <li>出生地点（省市即可）</li>
                <li>性别</li>
              </ol>
              <p>信息越完整，推算越精准。</p>
            </div>
          </div>
        </div>

        <div class="fate-chat-input-area" id="fateInputArea">
          <textarea class="fate-chat-input" id="fateInput"
            placeholder="输入你的回答..." rows="1"></textarea>
          <button class="btn btn-primary fate-send-btn" id="fateSendBtn">
            发送
          </button>
        </div>

        <div class="fate-thinking hidden" id="fateThinking">
          <span>命理师正在思考...</span>
        </div>
      </div>
    </div>
  `;

  addFateChatStyles();

  let userProfile = {
    birthDate: null,
    birthTime: null,
    birthPlace: null,
    gender: null,
    collected: false
  };

  let conversationHistory = [
    {
      role: 'system',
      content: `你现在是一位资深的国学易经术数领域专家，综合使用三合紫微、飞星紫微、河洛紫微、禄马四化等各流派紫微的分析技法。对盘十二宫星曜分布、限流叠宫和各宫位间的飞宫四化进行细致分析，进而对命主的健康、学业、事业、财运、人际关系、婚姻和感情等各个方面进行全面分析和总结。关键事件需给出发生的时间范围，吉凶属性，事件对命主的影响程度等信息，并结合命主的自身特点给出针对性的解决方案和建议。另外，命盘信息里附带了十二个大限共一百二十个流年的信息，请对前八个的大限的所有流年进行分析，给出每一年需要关注的重大事件和注意事项。你先设置好自身角色，然后向用户提问个人信息，直至你认为可以给命主进行推演。此外，你也精通西方星座和占星术和塔罗牌，可以用生成塔罗牌进行互动占卜。

重要：你是对话形式的算命先生，每次回复控制在合理长度，用温暖专业的语气，像一个真实的算命先生。不要一上来就给完整分析，要先收集信息。`
    }
  ];

  const messagesContainer = document.getElementById('fateMessages');
  const input = document.getElementById('fateInput');
  const sendBtn = document.getElementById('fateSendBtn');
  const thinkingDiv = document.getElementById('fateThinking');

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';

    thinkingDiv.classList.remove('hidden');

    let contextHint = '';
    if (userProfile.birthDate && userProfile.birthTime && userProfile.birthPlace && userProfile.gender) {
      contextHint = `\n\n用户信息已收集：\n- 出生日期：${userProfile.birthDate}\n- 出生时间：${userProfile.birthTime}\n- 出生地点：${userProfile.birthPlace}\n- 性别：${userProfile.gender}\n\n如果信息足够，请开始进行命盘分析。`;
    } else {
      const needed = [];
      if (!userProfile.birthDate) needed.push('出生日期');
      if (!userProfile.birthTime) needed.push('出生时间');
      if (!userProfile.birthPlace) needed.push('出生地点');
      if (!userProfile.gender) needed.push('性别');
      contextHint = `\n\n还在收集的信息：${needed.join('、')}`;
    }

    const reply = await callLLM(text, contextHint);

    thinkingDiv.classList.add('hidden');
    addMessage('master', reply);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.getElementById('fateExitBtn').addEventListener('click', () => {
    if (confirm('确定退出吗？重新进入需要再次验证邀请码。')) {
      sessionStorage.removeItem('fate_verified');
      renderFate();
    }
  });

  function parseUserMessage(text) {
    const datePatterns = [
      /(\d{4}[年\-]\d{1,2}[月\-]\d{1,2}[日]?)/,
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/,
      /(\d{1,2})[月\-](\d{1,2})[日]?[,，]?(\d{4})/
    ];
    for (const p of datePatterns) {
      const m = text.match(p);
      if (m) {
        let dateStr = m[1].replace(/[年\-月日]/g, '-').replace(/-$/, '');
        const parts = dateStr.split('-');
        if (parts[0].length === 2) parts.unshift('19');
        userProfile.birthDate = parts.map((v, i) => i === 0 ? v : v.padStart(2, '0')).join('-');
      }
    }

    const timeMatch = text.match(/(\d{1,2})[点时:](\d{1,2})/);
    if (timeMatch) {
      userProfile.birthTime = `${timeMatch[1].padStart(2,'0')}:${timeMatch[2].padStart(2,'0')}`;
    }

    const placeMatch = text.match(/(?:出生地|地点|在哪|来自)[：:\s]*(.+?)[，,\n]|$/);
    if (placeMatch && placeMatch[1]) {
      userProfile.birthPlace = placeMatch[1].trim();
    }
    const cities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '西安', '南京', '重庆', '天津', '苏州', '长沙', '郑州', '济南', '青岛', '沈阳', '大连', '厦门', '福州', '珠海', '东莞', '佛山', '中山', '江门', '惠州', '汕头', '湛江', '南宁', '桂林', '昆明', '贵阳', '拉萨', '兰州', '西宁', '银川', '乌鲁木齐', '呼和浩特', '哈尔滨', '长春', '石家庄', '太原', '南昌', '合肥', '海口', '香港', '澳门', '台湾'];
    for (const city of cities) {
      if (text.includes(city) && !userProfile.birthPlace) {
        userProfile.birthPlace = city;
        break;
      }
    }

    if (text.includes('男') || text.includes('male') || text.includes('Male')) {
      userProfile.gender = '男';
    } else if (text.includes('女') || text.includes('female') || text.includes('Female')) {
      userProfile.gender = '女';
    }
  }

  function addMessage(role, content) {
    const div = document.createElement('div');
    div.className = `fate-message fate-message-${role}`;

    if (role === 'user') {
      div.innerHTML = `
        <div class="fate-message-content user">${escapeHtml(content)}</div>
        <div class="fate-message-avatar user">😊</div>
      `;
    } else {
      div.innerHTML = `
        <div class="fate-message-avatar">🧙</div>
        <div class="fate-message-content master">${content}</div>
      `;
    }

    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    conversationHistory.push({ role: role === 'master' ? 'assistant' : 'user', content });
  }

  async function callLLM(userMessage, contextHint) {
    parseUserMessage(userMessage);

    const systemPrompt = conversationHistory.find(m => m.role === 'system')?.content || '';
    const recentMessages = conversationHistory.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const enhancedUserMessage = userMessage + (contextHint || '');

    try {
      const response = await fetch('https://xinggui-chat.yangmingyi1998128.workers.dev/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...recentMessages.filter(m => m.role !== 'system'),
            { role: 'user', content: enhancedUserMessage }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '抱歉，发生了错误，请重试。';
    } catch (error) {
      console.error('LLM API call failed:', error);
      return generateMockResponse(userMessage, contextHint);
    }
  }

  function generateMockResponse(userMessage, contextHint) {
    const msgs = conversationHistory.length;

    if (!userProfile.birthDate) {
      return '请问您的出生年月日是多少？（阳历）例如：1998年1月28日';
    }
    if (!userProfile.birthTime) {
      return `${userProfile.birthDate}，好，请问是几点几分出生？（阳历）例如：下午3点半`;
    }
    if (!userProfile.birthPlace) {
      return `好的，${userProfile.birthDate} ${userProfile.birthTime}，请问出生在哪个城市？`;
    }
    if (!userProfile.gender) {
      return `了解了，请问您的性别是？`;
    }

    if (msgs < 12) {
      return `信息已齐全，正在为您排盘分析...\n\n（当前为内测模拟模式，完整分析功能即将上线。输入"分析"可查看模拟结果。）`;
    }

    if (userMessage.includes('分析')) {
      return `【命盘分析 — 模拟结果】

命主资料：${userProfile.gender}，${userProfile.birthDate} ${userProfile.birthTime}，${userProfile.birthPlace}

## 命局简述
辛金日主，生于丑月，地支寅丑酉三合绊，用神取印比为用。

## 事业财运（2022-2033）
食神生财大运，才华得以施展。2026年（丙午）事业上重大转折，务必把握。

## 感情婚姻
2024-2025年有感情机遇，但需注意沟通方式。

## 注意事项
37岁前不宜冒险投资，以稳为主。

---
*以上为内测模拟数据，仅供体验参考*`;
    }

    return '请输入"分析"查看命盘结果，或继续回答问题以完善信息。';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

function addFateGateStyles() {
  if (document.getElementById('fate-gate-styles')) return;
  const style = document.createElement('style');
  style.id = 'fate-gate-styles';
  style.textContent = `
    .fate-gate-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .fate-gate-card {
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      padding: var(--space-2xl);
      text-align: center;
      max-width: 400px;
      width: 100%;
      border: 1px solid rgba(139, 92, 246, 0.15);
    }
    .fate-master-avatar {
      font-size: 4rem;
      margin-bottom: var(--space-md);
    }
    .fate-invite-form {
      margin: var(--space-xl) 0;
    }
    .fate-invite-label {
      color: var(--text-secondary);
      margin-bottom: var(--space-md);
    }
    .fate-invite-input {
      text-align: center;
      font-size: 1.25rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: var(--space-md);
    }
    .fate-invite-input.error {
      border-color: var(--danger);
    }
    .fate-invite-error {
      color: var(--danger);
      font-size: 0.9rem;
      margin-bottom: var(--space-md);
    }
    .fate-invite-btn {
      width: 100%;
    }
    .fate-gate-hint {
      font-size: 0.85rem;
      margin-top: var(--space-lg);
    }
  `;
  document.head.appendChild(style);
}

function addFateChatStyles() {
  if (document.getElementById('fate-chat-styles')) return;
  const style = document.createElement('style');
  style.id = 'fate-chat-styles';
  style.textContent = `
    .fate-chat-container {
      max-width: 700px;
      margin: 0 auto;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      border: 1px solid rgba(139, 92, 246, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 200px);
      min-height: 500px;
    }
    .fate-chat-header {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      background: var(--bg-tertiary);
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    }
    .fate-chat-header .fate-master-avatar {
      font-size: 2rem;
      margin: 0;
    }
    .fate-master-name {
      font-family: var(--font-display);
      color: var(--accent-purple);
    }
    .fate-master-status {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .fate-exit-btn {
      margin-left: auto;
      padding: var(--space-sm) var(--space-md);
      font-size: 0.85rem;
    }
    .fate-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }
    .fate-message {
      display: flex;
      gap: var(--space-md);
      max-width: 85%;
    }
    .fate-message-master {
      align-self: flex-start;
    }
    .fate-message-user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .fate-message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .fate-message-master .fate-message-avatar {
      background: rgba(139, 92, 246, 0.2);
    }
    .fate-message-user .fate-message-avatar {
      background: rgba(34, 211, 238, 0.2);
    }
    .fate-message-content {
      padding: var(--space-md);
      border-radius: var(--radius-md);
      line-height: 1.7;
    }
    .fate-message-content.master {
      background: var(--bg-tertiary);
      border: 1px solid rgba(139, 92, 246, 0.1);
    }
    .fate-message-content.user {
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.2);
    }
    .fate-message-content p {
      margin-bottom: var(--space-sm);
    }
    .fate-message-content p:last-child {
      margin-bottom: 0;
    }
    .fate-message-content ol {
      margin: var(--space-sm) 0;
      padding-left: var(--space-lg);
    }
    .fate-message-content li {
      margin-bottom: var(--space-xs);
    }
    .fate-chat-input-area {
      display: flex;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      background: var(--bg-tertiary);
      border-top: 1px solid rgba(139, 92, 246, 0.1);
    }
    .fate-chat-input {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: var(--radius-sm);
      padding: var(--space-md);
      color: var(--text-primary);
      resize: none;
      font-family: var(--font-body);
      font-size: 1rem;
      line-height: 1.5;
      max-height: 150px;
    }
    .fate-chat-input:focus {
      outline: none;
      border-color: var(--accent-purple);
    }
    .fate-chat-input::placeholder {
      color: var(--text-muted);
    }
    .fate-send-btn {
      align-self: flex-end;
      padding: var(--space-md) var(--space-xl);
    }
    .fate-thinking {
      padding: var(--space-sm) var(--space-lg);
      color: var(--text-muted);
      font-size: 0.85rem;
      background: var(--bg-tertiary);
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}
