/**
 * Main App - Minimal Diagnostic Version
 * Only renders home page with zodiac grid
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

// Simple router
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
    this.updateNav(hash);
    const route = this.routes[hash];
    if (route) route();
    else this.renderHome();
  }

  updateNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + hash);
    });
  }
}

const router = new Router();

// Mobile nav
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('mainNav').classList.toggle('active');
});

// ==================== HOME ====================
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="home-hero"><h1>星轨 XingGui</h1><p>仰望星空，读懂自己的轨迹</p></section><section class="home-content"><div class="home-zodiac-select"><p class="home-zodiac-label">选择你的星座，查看今日运势</p><div class="zodiac-grid" id="homeZodiacGrid">' + ZODIACS.map((z, i) => '<div class="zodiac-item" data-zodiac="' + z.name + '" data-index="' + i + '"><span class="zodiac-icon">' + z.icon + '</span><span class="zodiac-name">' + z.name + '</span></div>').join('') + '</div></div><div id="homeFortuneResult"></div></section></div>';

  let selectedZodiac = null;
  document.querySelectorAll('#homeZodiacGrid .zodiac-item').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelectorAll('#homeZodiacGrid .zodiac-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedZodiac = item.dataset.zodiac;
      const resultDiv = document.getElementById('homeFortuneResult');
      resultDiv.innerHTML = '<div class="card"><div class="skeleton" style="height:200px;margin-bottom:16px;"></div><div class="skeleton" style="height:100px;"></div></div>';
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

function renderFortuneCard(data) {
  return '<div class="card"><div class="fortune-score"><div class="score-circle"><svg width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#22d3ee"/></linearGradient></defs><circle class="score-circle-bg" cx="60" cy="60" r="54"/><circle class="score-circle-fill" id="scoreFill" cx="60" cy="60" r="54"/></svg><div class="score-number" id="scoreNumber">0</div></div><span class="score-label">今日综合运势</span></div><div class="stars" id="stars" style="justify-content:center;margin-bottom:24px;">' + [1,2,3,4,5].map(i => '<span class="star" data-index="' + i + '">★</span>').join('') + '</div><div style="display:grid;gap:16px;margin-bottom:24px;"><div class="progress-item"><div class="progress-header"><span class="progress-label">💕 爱情运势</span><span class="progress-value" id="loveValue">0%</span></div><div class="progress-bar"><div class="progress-fill" id="loveFill" data-target="' + data.love + '"></div></div></div><div class="progress-item"><div class="progress-header"><span class="progress-label">💼 事业运势</span><span class="progress-value" id="careerValue">0%</span></div><div class="progress-bar"><div class="progress-fill" id="careerFill" data-target="' + data.career + '"></div></div></div><div class="progress-item"><div class="progress-header"><span class="progress-label">💰 财运</span><span class="progress-value" id="wealthValue">0%</span></div><div class="progress-bar"><div class="progress-fill" id="wealthFill" data-target="' + data.wealth + '"></div></div></div></div><div class="lucky-info"><div class="lucky-item"><span class="lucky-icon">🎨</span><span class="lucky-label">幸运色</span><span class="lucky-value">' + data.luckyColor + '</span></div><div class="lucky-item"><span class="lucky-icon">🔢</span><span class="lucky-label">幸运数</span><span class="lucky-value">' + data.luckyNumber + '</span></div><div class="lucky-item"><span class="lucky-icon">🧭</span><span class="lucky-label">幸运方位</span><span class="lucky-value">' + data.luckyDirection + '</span></div></div><div class="fortune-tip">✧ ' + data.tip + '</div></div>';
}

function animateFortuneScore(score) {
  const percentage = (score / 5) * 100;
  const circle = document.getElementById('scoreFill');
  const number = document.getElementById('scoreNumber');
  if (!circle || !number) return;
  const circumference = 339.292;
  const offset = circumference - (percentage / 100) * circumference;
  setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);
  let current = 0;
  const increment = score / 30;
  const timer = setInterval(() => {
    current += increment;
    if (current >= score) { current = score; clearInterval(timer); }
    number.textContent = Math.round(current);
  }, 50);
  const stars = document.querySelectorAll('#stars .star');
  stars.forEach((star, i) => {
    setTimeout(() => { if (i < score) star.classList.add('filled'); }, 500 + i * 150);
  });
}

function animateProgressBars(data) {
  ['love', 'career', 'wealth'].forEach((type, i) => {
    const fill = document.getElementById(type + 'Fill');
    const value = document.getElementById(type + 'Value');
    if (!fill || !value) return;
    setTimeout(() => {
      const target = parseInt(fill.dataset.target);
      fill.style.width = target + '%';
      let current = 0;
      const increment = target / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { current = target; clearInterval(timer); }
        value.textContent = Math.round(current) + '%';
      }, 50);
    }, 300 + i * 200);
  });
}

// ==================== CHART ====================
async function renderChart() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>星盘分析</h2><p>输入出生信息，探索你的宇宙密码</p></section><div class="chart-container"><div class="card chart-form"><div class="form-group"><label class="form-label">出生日期</label><input type="date" class="form-input" id="chartDate"></div><div class="form-group"><label class="form-label">出生时间（精确到小时）</label><input type="time" class="form-input" id="chartTime"></div><div class="form-group"><label class="form-label">出生城市</label><input type="text" class="form-input" id="chartCity" placeholder="例如：北京、上海、纽约"></div><button class="btn btn-primary" id="chartSubmit" style="width:100%;">✧ 计算我的星盘</button></div><div id="chartResult" class="chart-result"></div></div></div>';
  document.getElementById('chartSubmit').addEventListener('click', async () => {
    const date = document.getElementById('chartDate').value;
    const time = document.getElementById('chartTime').value;
    const city = document.getElementById('chartCity').value;
    if (!date || !time) { alert('请填写出生日期和时间'); return; }
    const resultDiv = document.getElementById('chartResult');
    resultDiv.innerHTML = '<div class="skeleton" style="height:300px;"></div>';
    resultDiv.classList.add('show');
    const data = await API.getNatalChart(date, time, city);
    resultDiv.innerHTML = '<div class="card"><div class="chart-main-signs"><div class="main-sign"><div class="main-sign-icon">☀️</div><div class="main-sign-label">太阳星座</div><div class="main-sign-value">' + data.sun + '</div></div><div class="main-sign"><div class="main-sign-icon">🌙</div><div class="main-sign-label">月亮星座</div><div class="main-sign-value">' + data.moon + '</div></div><div class="main-sign"><div class="main-sign-icon">⬆️</div><div class="main-sign-label">上升星座</div><div class="main-sign-value">' + data.rising + '</div></div></div></div>';
  });
}

// ==================== TAROT ====================
async function renderTarot() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>塔罗占卜</h2><p>让牌卡指引你的困惑</p></section><div class="tarot-layout"><div class="tarot-mode-select"><button class="tarot-mode-btn active" data-mode="single">单张抽牌</button><button class="tarot-mode-btn" data-mode="three">三张牌阵</button></div><div class="tarot-container" id="tarotContainer"><div class="tarot-card" style="opacity:0;"><div class="tarot-back"><div class="tarot-back-pattern">✧</div></div></div></div><button class="btn btn-primary tarot-draw-btn" id="tarotDraw">🃏 洗牌并抽牌</button><div id="tarotReading" class="tarot-reading"></div></div></div>';
  let currentMode = 'single';
  document.querySelectorAll('.tarot-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tarot-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      document.getElementById('tarotReading').classList.remove('show');
      document.getElementById('tarotReading').innerHTML = '';
    });
  });
  document.getElementById('tarotDraw').addEventListener('click', async () => {
    const drawBtn = document.getElementById('tarotDraw');
    drawBtn.disabled = true;
    drawBtn.textContent = '🃏 洗牌中...';
    await new Promise(r => setTimeout(r, 1500));
    const cards = await API.drawTarot(currentMode);
    document.getElementById('tarotReading').innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-muted);">塔罗牌功能内测中...</p></div>';
    document.getElementById('tarotReading').classList.add('show');
    drawBtn.disabled = false;
    drawBtn.textContent = '🃏 再次抽牌';
  });
}

// ==================== COMPATIBILITY ====================
async function renderCompatibility() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>星座配对</h2><p>探索两个星座之间的化学反应</p></section><div class="compat-container"><div class="card compat-form"><div class="compat-form-row"><div class="form-group" style="margin-bottom:0;"><label class="form-label">你的星座</label><select class="form-input form-select" id="compat1"><option value="">选择星座</option>' + ZODIACS.map(z => '<option value="' + z.name + '">' + z.icon + ' ' + z.name + '</option>').join('') + '</select></div><div class="compat-vs">×</div><div class="form-group" style="margin-bottom:0;"><label class="form-label">对方星座</label><select class="form-input form-select" id="compat2"><option value="">选择星座</option>' + ZODIACS.map(z => '<option value="' + z.name + '">' + z.icon + ' ' + z.name + '</option>').join('') + '</select></div></div><button class="btn btn-primary" id="compatSubmit" style="width:100%;margin-top:16px;">✧ 查看配对结果</button></div><div id="compatResult" class="compat-result"></div></div></div>';
  document.getElementById('compatSubmit').addEventListener('click', async () => {
    const sign1 = document.getElementById('compat1').value;
    const sign2 = document.getElementById('compat2').value;
    if (!sign1 || !sign2) { alert('请选择两个星座'); return; }
    const resultDiv = document.getElementById('compatResult');
    resultDiv.innerHTML = '<div class="skeleton" style="height:300px;"></div>';
    resultDiv.classList.add('show');
    const data = await API.getCompatibility(sign1, sign2);
    resultDiv.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-muted);">配对功能内测中...</p></div>';
  });
}

// ==================== FORTUNE ====================
async function renderFortune() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>求签问卜</h2><p>心诚则灵，点击签筒求得一签</p></section><div class="fortune-container"><div class="fortune-question"><input type="text" class="fortune-question-input" id="fortuneQuestion" placeholder="默念你的问题（可选）"></div><div class="fortune-bamboo-wrapper"><div class="fortune-bamboo" id="fortuneBamboo"><div class="fortune-bamboo-body"><div class="fortune-bamboo-joint"></div><div class="fortune-bamboo-joint"></div></div></div></div><p class="fortune-instruction" id="fortuneInstruction">点击签筒，开始求签</p><div id="fortuneResult" class="fortune-stick-result"></div><button class="btn btn-secondary fortune-reset-btn hidden" id="fortuneReset">🔄 重新求签</button></div></div>';
  let hasDrawn = false;
  const bamboo = document.getElementById('fortuneBamboo');
  const instruction = document.getElementById('fortuneInstruction');
  const result = document.getElementById('fortuneResult');
  const resetBtn = document.getElementById('fortuneReset');
  bamboo.addEventListener('click', async () => {
    if (hasDrawn) return;
    instruction.textContent = '诚心祈求中...';
    bamboo.classList.add('shaking');
    await new Promise(r => setTimeout(r, 2000));
    bamboo.classList.remove('shaking');
    instruction.textContent = '';
    result.className = 'fortune-stick-result show';
    result.innerHTML = '<div class="result-level">中签</div><div class="result-text">事在人为，修德自安。静待时机，方有转机。</div>';
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

// ==================== FATE ====================
async function renderFate() {
  const app = document.getElementById('app');
  const isVerified = sessionStorage.getItem('fate_verified');

  if (!isVerified) {
    app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>命运咨询</h2><p>资深命理师，为你解读人生轨迹</p></section><div class="fate-gate-container"><div class="fate-gate-card"><div class="fate-master-avatar">🧙</div><h3>命理师·星轨</h3><p class="text-secondary">三合紫微 / 飞星紫微 / 河洛斗数 / 禄马四化</p><div class="fate-invite-form"><p class="fate-invite-label">请输入邀请码</p><input type="text" class="form-input fate-invite-input" id="fateInviteCode" placeholder="邀请码" maxlength="20" autocomplete="off"><div class="fate-invite-error hidden" id="fateInviteError">邀请码错误，请重试</div><button class="btn btn-primary fate-invite-btn" id="fateInviteBtn">✧ 进入咨询</button></div><p class="fate-gate-hint text-muted">内测阶段，需要邀请码才能体验</p></div></div></div>';
    addFateGateStyles();
    document.getElementById('fateInviteBtn').addEventListener('click', () => {
      const code = document.getElementById('fateInviteCode').value.trim().toUpperCase();
      if (code === 'XINGGUI2026') { sessionStorage.setItem('fate_verified', 'true'); renderFate(); }
      else { document.getElementById('fateInviteError').classList.remove('hidden'); document.getElementById('fateInviteCode').classList.add('error'); }
    });
    document.getElementById('fateInviteCode').addEventListener('input', () => {
      document.getElementById('fateInviteError').classList.add('hidden');
      document.getElementById('fateInviteCode').classList.remove('error');
    });
    return;
  }

  // Step 2: Profile form
  const hasProfile = sessionStorage.getItem('fate_profile');
  if (!hasProfile) {
    renderProfileForm();
    return;
  }

  // Step 3: Chat
  renderChat();

  function renderProfileForm() {
    app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>命运咨询</h2><p>请填写命主基本信息</p></section><div class="fate-profile-container"><div class="card fate-profile-card"><div class="fate-profile-header"><span class="fate-master-avatar" style="font-size:2rem;">🧙</span><div><div style="color:var(--accent-purple);font-weight:600;">命理师·星轨</div><div style="color:var(--text-muted);font-size:0.85rem;">请提供以下信息以启动命盘分析</div></div></div><form id="fateProfileForm" class="fate-profile-form"><div class="form-group"><label class="form-label">出生日期 <span style="color:var(--danger);">*</span></label><input type="date" class="form-input" id="profileBirthDate" required></div><div class="form-group"><label class="form-label">出生时间 <span style="color:var(--danger);">*</span></label><input type="time" class="form-input" id="profileBirthTime" required></div><div class="form-group"><label class="form-label">历法 <span style="color:var(--danger);">*</span></label><select class="form-input form-select" id="profileCalendar" required><option value="solar">阳历（公历）</option><option value="lunar">阴历（农历）</option></select></div><div class="form-group"><label class="form-label">出生城市 <span style="color:var(--danger);">*</span></label><input type="text" class="form-input" id="profileBirthPlace" placeholder="例如：北京、上海、成都" required></div><div class="form-group"><label class="form-label">性别 <span style="color:var(--danger);">*</span></label><div class="gender-select"><label class="gender-option"><input type="radio" name="profileGender" value="male" required><span>♂ 男</span></label><label class="gender-option"><input type="radio" name="profileGender" value="female"><span>♀ 女</span></label></div></div><button type="submit" class="btn btn-primary" style="width:100%;">✧ 提交信息，开始分析</button></form><p style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-top:16px;">信息提交后可随时重新输入</p></div></div></div>';
    addFateProfileStyles();
    document.getElementById('fateProfileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const profile = {
        birthDate: document.getElementById('profileBirthDate').value,
        birthTime: document.getElementById('profileBirthTime').value,
        calendar: document.getElementById('profileCalendar').value,
        birthPlace: document.getElementById('profileBirthPlace').value,
        gender: document.querySelector('input[name="profileGender"]:checked').value
      };
      if (!profile.birthDate || !profile.birthTime || !profile.birthPlace || !profile.gender) { alert('请填写完整信息'); return; }
      sessionStorage.setItem('fate_profile', JSON.stringify(profile));
      renderFate();
    });
  }

  function renderChat() {
    const profile = JSON.parse(sessionStorage.getItem('fate_profile') || '{}');
    const genderText = profile.gender === 'male' ? '男' : '女';
    const calendarText = profile.calendar === 'lunar' ? '阴历' : '阳历';

    app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>命运咨询</h2><p>综合使用三合、飞星、河洛、禄马四化等各流派技法</p></section><div class="fate-chat-container"><div class="fate-chat-header"><div class="fate-master-avatar">🧙</div><div><div class="fate-master-name">命理师·星轨</div><div class="fate-master-status">在线 · 内测版</div></div><div style="margin-left:auto;display:flex;gap:8px;align-items:center;"><button class="btn btn-ghost fate-reset-btn" id="fateResetBtn" title="重新输入信息">🔄 重填</button><button class="btn btn-ghost fate-exit-btn" id="fateExitBtn" title="退出">✕</button></div></div><div class="fate-chat-messages" id="fateMessages"><div class="fate-message fate-message-master"><div class="fate-message-avatar">🧙</div><div class="fate-message-content"><p>善知识，贫道已收到您的命盘资讯。</p><p><strong>命主：</strong>' + genderText + '，' + profile.birthDate + ' ' + profile.birthTime + '，' + profile.birthPlace + '（' + calendarText + '）</p><p>正在为您排盘分析，请稍候...</p></div></div></div><div class="fate-chat-input-area"><textarea class="fate-chat-input" id="fateInput" placeholder="输入您想咨询的问题..." rows="1"></textarea><button class="btn btn-primary fate-send-btn" id="fateSendBtn">发送</button></div><div class="fate-thinking hidden" id="fateThinking"><span>命理师正在思考...</span></div></div></div>';

    addFateChatStyles();

    const systemPrompt = '你现在是一位资深的国学易经术数领域专家，综合使用三合紫微、飞星紫微、河洛紫微、禄马四化等各流派紫微的分析技法。对盘十二宫星曜分布、限流叠宫和各宫位间的飞宫四化进行细致分析，进而对命主的健康、学业、事业、财运、人际关系、婚姻和感情等各个方面进行全面分析和总结。关键事件需给出发生的时间范围，吉凶属性，事件对命主的影响程度等信息，并结合命主的自身特点给出针对性的解决方案和建议。\n\n命主信息：\n- 性别：' + genderText + '\n- 出生日期：' + profile.birthDate + ' ' + profile.birthTime + '\n- 出生地点：' + profile.birthPlace + '\n- 历法：' + calendarText + '\n\n你扮演一位对话形式的算命先生，用温暖专业的语气，像真实的算命先生一样与用户交流。可以先简单寒暄，然后开始分析命盘。';

    let conversationHistory = [{ role: 'system', content: systemPrompt }];
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
      const reply = await callLLM(text);
      thinkingDiv.classList.add('hidden');
      addMessage('master', reply);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    document.getElementById('fateExitBtn').addEventListener('click', () => {
      if (confirm('确定退出吗？重新进入需要再次输入邀请码。')) {
        sessionStorage.removeItem('fate_verified');
        sessionStorage.removeItem('fate_profile');
        renderFate();
      }
    });

    document.getElementById('fateResetBtn').addEventListener('click', () => {
      if (confirm('确定要重新填写信息吗？')) {
        sessionStorage.removeItem('fate_profile');
        renderFate();
      }
    });

    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = 'fate-message fate-message-' + role;
      if (role === 'user') {
        div.innerHTML = '<div class="fate-message-content user">' + escapeHtml(content) + '</div><div class="fate-message-avatar user">😊</div>';
      } else {
        div.innerHTML = '<div class="fate-message-avatar">🧙</div><div class="fate-message-content master">' + content + '</div>';
      }
      messagesContainer.appendChild(div);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      conversationHistory.push({ role: role === 'master' ? 'assistant' : 'user', content });
    }

    async function callLLM(userMessage) {
      const recentMessages = conversationHistory.slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
      try {
        const response = await fetch('https://xinggui-chat.yangmingyi1998128.workers.dev/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentMessages.filter(m => m.role !== 'system'),
              { role: 'user', content: userMessage }
            ],
            max_tokens: 2000,
            temperature: 0.7
          })
        });
        if (!response.ok) throw new Error('API error: ' + response.status);
        const data = await response.json();
        return data.choices[0].message.content || '抱歉，发生了错误，请重试。';
      } catch (error) {
        console.error('LLM API call failed:', error);
        return '抱歉，服务暂时不可用，请稍后再试。（内测阶段）';
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }
}

// ==================== STYLES ====================
function addFateGateStyles() {
  if (document.getElementById('fate-gate-styles')) return;
  const s = document.createElement('style');
  s.id = 'fate-gate-styles';
  s.textContent = '.fate-gate-container{display:flex;justify-content:center;align-items:center;min-height:60vh}.fate-gate-card{background:var(--bg-secondary);border-radius:var(--radius-md);padding:var(--space-2xl);text-align:center;max-width:400px;width:100%;border:1px solid rgba(139,92,246,0.15)}.fate-master-avatar{font-size:4rem;margin-bottom:var(--space-md)}.fate-invite-form{margin:var(--space-xl) 0}.fate-invite-label{color:var(--text-secondary);margin-bottom:var(--space-md)}.fate-invite-input{text-align:center;font-size:1.25rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:var(--space-md)}.fate-invite-input.error{border-color:var(--danger)}.fate-invite-error{color:var(--danger);font-size:0.9rem;margin-bottom:var(--space-md)}.fate-invite-btn{width:100%}.fate-gate-hint{font-size:0.85rem;margin-top:var(--space-lg)}';
  document.head.appendChild(s);
}

function addFateProfileStyles() {
  if (document.getElementById('fate-profile-styles')) return;
  const s = document.createElement('style');
  s.id = 'fate-profile-styles';
  s.textContent = '.fate-profile-container{display:flex;justify-content:center;align-items:flex-start;padding:20px 0}.fate-profile-card{max-width:480px;width:100%}.fate-profile-header{display:flex;gap:16px;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(139,92,246,0.1)}.fate-profile-form{display:flex;flex-direction:column;gap:16px}.gender-select{display:flex;gap:16px}.gender-option{flex:1;display:flex;align-items:center;justify-content:center;padding:12px;background:var(--bg-tertiary);border-radius:8px;cursor:pointer;border:1px solid transparent;transition:all 0.2s}.gender-option:hover{border-color:var(--accent-purple)}.gender-option input{display:none}.gender-option:has(input:checked){background:rgba(139,92,246,0.15);border-color:var(--accent-purple);color:var(--accent-purple)}';
  document.head.appendChild(s);
}

function addFateChatStyles() {
  if (document.getElementById('fate-chat-styles')) return;
  const s = document.createElement('style');
  s.id = 'fate-chat-styles';
  s.textContent = '.fate-chat-container{max-width:700px;margin:0 auto;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid rgba(139,92,246,0.15);overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 200px);min-height:500px}.fate-chat-header{display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md) var(--space-lg);background:var(--bg-tertiary);border-bottom:1px solid rgba(139,92,246,0.1)}.fate-chat-header .fate-master-avatar{font-size:2rem;margin:0}.fate-master-name{font-family:var(--font-display);color:var(--accent-purple)}.fate-master-status{font-size:0.8rem;color:var(--text-muted)}.fate-exit-btn{margin-left:auto;padding:var(--space-sm) var(--space-md);font-size:0.85rem}.fate-chat-messages{flex:1;overflow-y:auto;padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-lg)}.fate-message{display:flex;gap:var(--space-md);max-width:85%}.fate-message-master{align-self:flex-start}.fate-message-user{align-self:flex-end;flex-direction:row-reverse}.fate-message-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0}.fate-message-master .fate-message-avatar{background:rgba(139,92,246,0.2)}.fate-message-user .fate-message-avatar{background:rgba(34,211,238,0.2)}.fate-message-content{padding:var(--space-md);border-radius:var(--radius-md);line-height:1.7}.fate-message-content.master{background:var(--bg-tertiary);border:1px solid rgba(139,92,246,0.1)}.fate-message-content.user{background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.2)}.fate-chat-input-area{display:flex;gap:var(--space-md);padding:var(--space-md) var(--space-lg);background:var(--bg-tertiary);border-top:1px solid rgba(139,92,246,0.1)}.fate-chat-input{flex:1;background:var(--bg-primary);border:1px solid rgba(139,92,246,0.2);border-radius:var(--radius-sm);padding:var(--space-md);color:var(--text-primary);resize:none;font-family:var(--font-body);font-size:1rem;line-height:1.5;max-height:150px}.fate-chat-input:focus{outline:none;border-color:var(--accent-purple)}.fate-chat-input::placeholder{color:var(--text-muted)}.fate-send-btn{align-self:flex-end;padding:var(--space-md) var(--space-xl)}.fate-thinking{padding:var(--space-sm) var(--space-lg);color:var(--text-muted);font-size:0.85rem;background:var(--bg-tertiary);text-align:center}';
  document.head.appendChild(s);
}
