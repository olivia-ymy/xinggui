/**
 * Main App - Minimal ES5-compatible version
 */
var ZODIACS = [
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

// Simple router - no class
function initRouter() {
  function handleRoute() {
    var hash = window.location.hash.slice(1) || '/';
    var routes = {
      '/': renderHome,
      '/chart': renderChart,
      '/tarot': renderTarot,
      '/compatibility': renderCompatibility,
      '/fortune': renderFortune,
      '/fate': renderFate
    };
    // Update nav
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + hash);
    });
    var route = routes[hash];
    if (route) { route(); }
    else { renderHome(); }
  }
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('load', handleRoute);
}

// Server-synced date to avoid client clock issues
var SERVER_DATE = null;
function getServerDate(callback) {
  if (SERVER_DATE) { callback(SERVER_DATE); return; }
  fetch('https://worldtimeapi.org/api/timezone/Asia/Shanghai').then(function(r) { return r.json(); }).then(function(data) {
    SERVER_DATE = new Date(data.datetime);
    callback(SERVER_DATE);
  }).catch(function() {
    SERVER_DATE = new Date();
    callback(SERVER_DATE);
  });
}

// Mobile nav
document.getElementById('navToggle').addEventListener('click', function() {
  document.getElementById('mainNav').classList.toggle('active');
});

// ==================== HOME ====================
function renderHome() {
  var app = document.getElementById('app');
  var zodiacHtml = ZODIACS.map(function(z, i) {
    return '<div class="zodiac-item" data-zodiac="' + z.name + '" data-index="' + i + '">' +
           '<span class="zodiac-icon">' + z.icon + '</span>' +
           '<span class="zodiac-name">' + z.name + '</span></div>';
  }).join('');

  app.innerHTML = '<div class="container page-enter">' +
    '<section class="home-hero"><h1>星轨 XingGui</h1><p>仰望星空，读懂自己的轨迹</p></section>' +
    '<section class="home-content"><div class="home-zodiac-select">' +
    '<p class="home-zodiac-label">选择你的星座，查看今日运势</p>' +
    '<div class="zodiac-grid" id="homeZodiacGrid">' + zodiacHtml + '</div></div>' +
    '<div id="homeFortuneResult"></div></section></div>';

  // Add click handlers
  var items = document.querySelectorAll('#homeZodiacGrid .zodiac-item');
  items.forEach(function(item) {
    item.addEventListener('click', function() {
      items.forEach(function(i) { i.classList.remove('selected'); });
      item.classList.add('selected');
      var zodiac = item.dataset.zodiac;
      var resultDiv = document.getElementById('homeFortuneResult');
      resultDiv.innerHTML = '<div class="card" style="padding:30px;text-align:center;"><p style="color:var(--text-muted);">正在读取今日运势...</p></div>';

      API.getHoroscope(zodiac, new Date().toISOString().split('T')[0]).then(function(data) {
        var stars = '★★★★★'.substring(5 - Math.round(data.score));
        var scoreColor = data.score >= 4.5 ? 'var(--accent-gold)' : data.score >= 4 ? 'var(--accent-purple)' : 'var(--text-muted)';

        // Build real astro display
        var astroHtml = '';
        if (data._context) {
          var ctx = data._context;
          var planetList = ctx.planetsInSign.map(function(p) {
            return p.name + '(' + p.sign.name + p.sign.degree + '°)';
          });
          var aspectList = ctx.aspects.map(function(a) {
            return a.p1 + ' ' + a.symbol + ' ' + a.p2;
          });
          astroHtml = '<div style="margin-top:16px;padding:12px;background:rgba(139,92,246,0.05);border-radius:8px;font-size:0.8rem;color:var(--text-muted);line-height:1.8;">' +
            '<div style="margin-bottom:6px;color:var(--accent-cyan);font-weight:600;">✧ 今日星象</div>' +
            '<div>太阳所在：' + ctx.sunSign + ' &nbsp;|&nbsp; 月亮所在：' + ctx.moonSign + '</div>';
          if (planetList.length > 0) {
            astroHtml += '<div>进入' + zodiac + '的行星：' + planetList.join('、') + '</div>';
          }
          if (aspectList.length > 0) {
            astroHtml += '<div>相关相位：' + aspectList.join(' &nbsp;') + '</div>';
          }
          astroHtml += '</div>';
        }

        var d = SERVER_DATE || new Date();
        var y = d.getFullYear();
        var m = d.getMonth() + 1;
        var day = d.getDate();
        var todayStr = y + '年' + m + '月' + day + '日';
        var weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
        var wd = weekDays[d.getDay()];
        resultDiv.innerHTML = '<div class="card" style="padding:24px;">' +
          '<div style="text-align:center;margin-bottom:16px;">' +
          '<div style="font-size:2rem;margin-bottom:4px;">' + ZODIACS.find(function(z){return z.name===zodiac;}).icon + '</div>' +
          '<h3 style="color:var(--accent-purple);">' + zodiac + ' 今日运势</h3>' +
          '<div style="font-size:0.85rem;color:var(--text-muted);margin-top:2px;">' + todayStr + ' ' + wd + '</div>' +
          '<div style="font-size:1.2rem;color:' + scoreColor + ';margin-top:4px;">' + stars + '</div>' +
          '<div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">综合指数 ' + data.score + '/5</div>' +
          (data.rating ? '<div style="margin-top:12px;padding:10px 16px;background:rgba(139,92,246,0.08);border-radius:8px;border-left:3px solid var(--accent-purple);"><span style="color:var(--accent-purple);font-weight:600;">✦ ' + data.rating + '</span></div>' : '') + '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">' +
          '<div style="text-align:center;padding:10px;background:var(--bg-tertiary);border-radius:6px;">' +
          '<div style="font-size:0.75rem;color:var(--text-muted);">爱情</div>' +
          '<div style="color:var(--danger);font-weight:600;">' + data.love + '%</div></div>' +
          '<div style="text-align:center;padding:10px;background:var(--bg-tertiary);border-radius:6px;">' +
          '<div style="font-size:0.75rem;color:var(--text-muted);">事业</div>' +
          '<div style="color:var(--accent-cyan);font-weight:600;">' + data.career + '%</div></div>' +
          '<div style="text-align:center;padding:10px;background:var(--bg-tertiary);border-radius:6px;">' +
          '<div style="font-size:0.75rem;color:var(--text-muted);">财运</div>' +
          '<div style="color:var(--accent-gold);font-weight:600;">' + data.wealth + '%</div></div></div>' +
          (data.warning && data.warning.indexOf('无特殊预警') === -1 ? '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(239,68,68,0.08);border-radius:6px;border-left:3px solid var(--danger);"><span style="color:var(--danger);font-size:0.85rem;">⚠️ ' + data.warning + '</span></div>' : '') +
          '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;font-size:0.85rem;">' +
          '<span style="padding:4px 10px;background:var(--bg-tertiary);border-radius:20px;color:var(--text-secondary);">幸运色：<strong style="color:var(--accent-gold);">' + data.luckyColor + '</strong></span>' +
          '<span style="padding:4px 10px;background:var(--bg-tertiary);border-radius:20px;color:var(--text-secondary);">幸运数：<strong style="color:var(--accent-cyan);">' + data.luckyNumber + '</strong></span>' +
          '<span style="padding:4px 10px;background:var(--bg-tertiary);border-radius:20px;color:var(--text-secondary);">幸运方向：<strong style="color:var(--accent-purple);">' + data.luckyDirection + '</strong></span></div>' +
          (data.action ? '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(34,211,238,0.08);border-radius:6px;border-left:3px solid var(--accent-cyan);"><span style="color:var(--accent-cyan);font-size:0.85rem;">👉 今天值得做：' + data.action + '</span></div>' : '') +
          (data.loveTip || data.careerTip || data.wealthTip ? '<div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:left;">' +
          (data.loveTip ? '<div style="margin-bottom:8px;"><span style="color:var(--danger);font-weight:600;">♡ 爱情：</span><span style="color:var(--text-secondary);font-size:0.9rem;">' + data.loveTip + '</span></div>' : '') +
          (data.careerTip ? '<div style="margin-bottom:8px;"><span style="color:var(--accent-cyan);font-weight:600;">💼 事业：</span><span style="color:var(--text-secondary);font-size:0.9rem;">' + data.careerTip + '</span></div>' : '') +
          (data.wealthTip ? '<div><span style="color:var(--accent-gold);font-weight:600;">💰 财运：</span><span style="color:var(--text-secondary);font-size:0.9rem;">' + data.wealthTip + '</span></div>' : '') +
          '</div>' : '<div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:center;">' +
          '<p style="color:var(--text-secondary);line-height:1.6;font-size:0.9rem;">' + data.tip + '</p></div>') +
          astroHtml + '</div>';
      }).catch(function(err) {
        // Fallback: show real astro data directly without LLM
        var today = new Date().toISOString().split('T')[0];
        var parts = today.split('-');
        var ctx = API.getHoroscopeContext(zodiac, today);
        var planetList = ctx.planetsInSign.map(function(p) { return p.name + '(' + p.sign.name + p.sign.degree + '°)'; });
        var aspectList = ctx.aspects.map(function(a) { return a.p1 + ' ' + a.symbol + ' ' + a.p2; });

        // Derive basic scores from real planetary positions
        var hasMars = ctx.planetsInSign.some(function(p){ return p.name === '火星'; });
        var hasVenus = ctx.planetsInSign.some(function(p){ return p.name === '金星'; });
        var hasJupiter = ctx.planetsInSign.some(function(p){ return p.name === '木星'; });
        var hasSaturn = ctx.planetsInSign.some(function(p){ return p.name === '土星'; });
        var love = hasVenus ? Math.min(95, 65 + Math.round(Math.random()*20)) : 60 + Math.round(Math.random()*15);
        var career = hasMars ? Math.min(95, 65 + Math.round(Math.random()*20)) : 58 + Math.round(Math.random()*15);
        var wealth = hasJupiter ? Math.min(95, 65 + Math.round(Math.random()*20)) : hasSaturn ? 55 + Math.round(Math.random()*15) : 60 + Math.round(Math.random()*15);
        var score = Math.min(5, Math.max(3, (love + career + wealth) / 300 * 5));
        var stars = '★★★★★'.substring(5 - Math.round(score));

        var colors = ['红色','橙色','黄色','绿色','蓝色','紫色','白色','金色'];
        var color = colors[Math.floor(Math.random() * colors.length)];
        var num = Math.floor(Math.random() * 9) + 1;
        var dirs = ['东方','西方','南方','北方','东南','西南','东北','西北'];
        var dir = dirs[Math.floor(Math.random() * dirs.length)];

        var tips = [];
        if (hasMars) tips.push('火星行运，带来行动力和冲劲，但注意避免冲动行事。');
        if (hasVenus) tips.push('金星眷顾，人际关系和谐，利于感情和艺术创作。');
        if (hasJupiter) tips.push('木星加持，运势上扬，适合扩展、学习和旅行。');
        if (hasSaturn) tips.push('土星考验，带来压力和挑战，但也是成长契机。');
        if (tips.length === 0) tips.push('今日星象平稳，顺势而为，稳中求进。');

        var tipText = tips.join(' ');

        resultDiv.innerHTML = '<div class="card" style="padding:24px;">' +
          '<div style="text-align:center;margin-bottom:12px;">' +
          '<div style="font-size:2rem;margin-bottom:4px;">' + ZODIACS.find(function(z){return z.name===zodiac;}).icon + '</div>' +
          '<h3 style="color:var(--accent-purple);">' + zodiac + ' 今日运势</h3>' +
          '<div style="font-size:1.2rem;color:var(--accent-purple);margin-top:4px;">' + stars + '</div>' +
          '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">（离线模式 · 实时天文数据）</div></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">' +
          '<div style="text-align:center;padding:10px;background:var(--bg-tertiary);border-radius:6px;"><div style="font-size:0.75rem;color:var(--text-muted);">爱情</div><div style="color:var(--danger);font-weight:600;">' + love + '%</div></div>' +
          '<div style="text-align:center;padding:10px;background:var(--bg-tertiary);border-radius:6px;"><div style="font-size:0.75rem;color:var(--text-muted);">事业</div><div style="color:var(--accent-cyan);font-weight:600;">' + career + '%</div></div>' +
          '<div style="text-align:center;padding:10px;background:var(--bg-tertiary);border-radius:6px;"><div style="font-size:0.75rem;color:var(--text-muted);">财运</div><div style="color:var(--accent-gold);font-weight:600;">' + wealth + '%</div></div></div>' +
          '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;font-size:0.85rem;">' +
          '<span style="padding:4px 10px;background:var(--bg-tertiary);border-radius:20px;">幸运色：<strong style="color:var(--accent-gold);">' + color + '</strong></span>' +
          '<span style="padding:4px 10px;background:var(--bg-tertiary);border-radius:20px;">幸运数：<strong style="color:var(--accent-cyan);">' + num + '</strong></span>' +
          '<span style="padding:4px 10px;background:var(--bg-tertiary);border-radius:20px;">幸运方向：<strong style="color:var(--accent-purple);">' + dir + '</strong></span></div>' +
          '<div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;text-align:center;">' +
          '<p style="color:var(--text-secondary);line-height:1.6;font-size:0.9rem;">' + tipText + '</p></div>' +
          '<div style="margin-top:16px;padding:12px;background:rgba(139,92,246,0.05);border-radius:8px;font-size:0.8rem;color:var(--text-muted);line-height:1.8;">' +
          '<div style="margin-bottom:6px;color:var(--accent-cyan);font-weight:600;">✧ 今日真实星象</div>' +
          '<div>太阳所在：' + ctx.sunSign + ' &nbsp;|&nbsp; 月亮所在：' + ctx.moonSign + '</div>' +
          (planetList.length > 0 ? '<div>进入' + zodiac + '的行星：' + planetList.join('、') + '</div>' : '<div>今日无主要行星进入' + zodiac + '。</div>') +
          (aspectList.length > 0 ? '<div>相关相位：' + aspectList.join(' &nbsp;') + '</div>' : '') +
          '</div></div>';
      });
    });
  });
}

// ==================== PAGES ====================
function renderChart() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter">' +
    '<section class="section-title"><h2>星盘分析</h2><p>输入出生信息，探索你的宇宙密码</p></section>' +
    '<div class="card" style="max-width:500px;margin:0 auto;">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(139,92,246,0.1);">' +
    '<span style="font-size:2rem;">🔮</span><div><div style="color:var(--accent-purple);font-weight:600;">星盘分析</div><div style="color:var(--text-muted);font-size:0.85rem;">太阳星座 · 月亮星座 · 上升星座</div></div></div>' +
    '<form id="chartForm" style="display:flex;flex-direction:column;gap:16px;">' +
    '<div><label class="form-label">出生日期</label><input type="date" class="form-input" id="cDate" required></div>' +
    '<div><label class="form-label">出生时间</label><input type="time" class="form-input" id="cTime" required></div>' +
    '<div><label class="form-label">出生城市</label><input type="text" class="form-input" id="cCity" placeholder="例如：北京、上海" required></div>' +
    '<button type="submit" class="btn btn-primary" style="width:100%;">✧ 开始分析</button></form>' +
    '<div id="chartResult" style="margin-top:20px;"></div></div></div>';

  document.getElementById('chartForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var date = document.getElementById('cDate').value;
    var time = document.getElementById('cTime').value;
    var city = document.getElementById('cCity').value;
    var resultDiv = document.getElementById('chartResult');
    resultDiv.innerHTML = '<div style="text-align:center;padding:20px;"><p style="color:var(--text-muted);">正在为您排盘...</p></div>';

    API.getNatalChart(date, time, city).then(function(data) {
      resultDiv.innerHTML = '<div style="margin-top:16px;padding:16px;background:var(--bg-tertiary);border-radius:8px;">' +
        '<h4 style="color:var(--accent-purple);margin-bottom:12px;text-align:center;">您的命盘</h4>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">' +
        '<div style="text-align:center;padding:12px;background:var(--bg-primary);border-radius:6px;">' +
        '<div style="font-size:0.8rem;color:var(--text-muted);">太阳星座</div>' +
        '<div style="font-size:1.2rem;color:var(--accent-gold);font-weight:600;">' + data.sun + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">' + (data.sunDegree || '') + '°</div></div>' +
        '<div style="text-align:center;padding:12px;background:var(--bg-primary);border-radius:6px;">' +
        '<div style="font-size:0.8rem;color:var(--text-muted);">月亮星座</div>' +
        '<div style="font-size:1.2rem;color:var(--accent-gold);font-weight:600;">' + data.moon + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">' + (data.moonDegree || '') + '°</div></div>' +
        '<div style="text-align:center;padding:12px;background:var(--bg-primary);border-radius:6px;">' +
        '<div style="font-size:0.8rem;color:var(--text-muted);">上升星座</div>' +
        '<div style="font-size:1.2rem;color:var(--accent-gold);font-weight:600;">' + data.rising + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">' + (data.risingDegree || '') + '°</div></div></div>' +
        (data.overview ? '<div style="margin-bottom:16px;padding:14px 16px;background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(34,211,238,0.06));border-radius:10px;border-left:4px solid var(--accent-purple);">' +
        '<div style="color:var(--accent-cyan);font-size:0.8rem;font-weight:600;margin-bottom:6px;">✦ 整体解读</div>' +
        '<p style="color:var(--text-primary);font-size:0.95rem;line-height:1.7;">' + data.overview + '</p></div>' : '') +
        (data.interpretation ? '<div id="chartInterpretation" style="margin-top:16px;padding:16px;background:var(--bg-primary);border-radius:8px;border-left:3px solid var(--accent-purple);">' +
        (data.personality ? '<div style="margin-bottom:12px;"><span style="color:var(--accent-cyan);font-weight:600;">✦ 性格：</span><span style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">' + data.personality + '</span></div>' : '') +
        (data.career ? '<div style="margin-bottom:12px;"><span style="color:var(--accent-gold);font-weight:600;">💼 事业：</span><span style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">' + data.career + '</span></div>' : '') +
        (data.love ? '<div style="margin-bottom:12px;"><span style="color:var(--danger);font-weight:600;">♡ 感情：</span><span style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">' + data.love + '</span></div>' : '') +
        (data.warning ? '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(239,68,68,0.06);border-radius:6px;border-left:3px solid var(--danger);"><span style="color:var(--danger);font-size:0.85rem;">⚠️ ' + data.warning + '</span></div>' : '') +
        (data.advice ? '<div style="margin-top:8px;padding:10px 12px;background:rgba(34,211,238,0.06);border-radius:6px;border-left:3px solid var(--accent-cyan);"><span style="color:var(--accent-cyan);font-size:0.85rem;">👉 ' + data.advice + '</span></div>' : '') +
        '</div>' : '<div id="chartInterpretation" style="margin-top:16px;padding:16px;background:var(--bg-primary);border-radius:8px;border-left:3px solid var(--accent-purple);">' +
        '<p style="color:var(--text-muted);font-size:0.9rem;line-height:1.6;">' + (data.interpretation || '正在生成命盘解读...') + '</p></div>') +
        '<p style="text-align:center;color:var(--text-muted);font-size:0.8rem;margin-top:12px;">天文数据基于出生时间计算 · AI 解读综合各流派技法</p></div>';
    }).catch(function() {
      resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);">⚠️ 获取失败，请稍后重试（首次需等待 Worker 冷启动）</div>';
    });
  });
}

function renderTarot() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter">' +
    '<section class="section-title"><h2>塔罗占卜</h2><p>让牌卡指引你的困惑</p></section>' +
    '<div class="card" style="max-width:500px;margin:0 auto;text-align:center;">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(139,92,246,0.1);">' +
    '<span style="font-size:2rem;">🃏</span><div style="text-align:left;"><div style="color:var(--accent-purple);font-weight:600;">塔罗牌阵</div><div style="color:var(--text-muted);font-size:0.85rem;">过去 · 现在 · 未来</div></div></div>' +
    '<p style="color:var(--text-secondary);margin-bottom:20px;">默念您的问题，然后抽取三张牌</p>' +
    '<textarea class="form-input" id="tarotQuestion" rows="2" placeholder="（可选）写下您的问题..." style="width:100%;margin-bottom:16px;resize:none;"></textarea>' +
    '<button class="btn btn-primary" id="tarotDrawBtn" style="width:100%;margin-bottom:16px;">🃏 抽取三张牌</button>' +
    '<div id="tarotResult" style="margin-top:20px;"></div></div></div>';

  document.getElementById('tarotDrawBtn').addEventListener('click', function() {
    var question = document.getElementById('tarotQuestion').value;
    var btn = document.getElementById('tarotDrawBtn');
    btn.disabled = true;
    btn.textContent = '洗牌中...';

    API.drawTarot('three', question).then(function(cards) {
      var html = '';
      if (question) {
        html += '<div style="margin-bottom:16px;padding:12px 16px;background:rgba(139,92,246,0.06);border-radius:8px;border-left:3px solid var(--accent-purple);">' +
          '<span style="color:var(--text-muted);font-size:0.85rem;">您的问题：</span>' +
          '<span style="color:var(--text-primary);font-size:0.9rem;margin-left:8px;">' + question + '</span></div>';
      }
      html += '<div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:16px;">';
      cards.forEach(function(card, i) {
        var meanings = card.isReversed ? '<div style="color:var(--danger);font-size:0.8rem;">逆位</div>' : '<div style="color:var(--accent-gold);font-size:0.8rem;">正位</div>';
        html += '<div style="width:100px;text-align:center;">' +
          '<div style="width:80px;height:120px;margin:0 auto;border-radius:8px;border:2px solid ' + (card.isReversed ? 'var(--danger)' : 'var(--accent-purple)') + ';' +
          'display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:700;color:var(--accent-purple);background:var(--bg-tertiary);' +
          (card.isReversed ? 'transform:rotate(180deg);' : '') + '">' + (card.name.charAt(0)) + '</div>' +
          '<div style="font-size:0.85rem;color:var(--text-primary);font-weight:600;margin-top:6px;">' + card.name + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted);">' + card.position + '</div>' +
          meanings + '</div>';
      });
      html += '</div>';
      html += '<div style="margin-top:20px;text-align:left;padding:16px;background:var(--bg-tertiary);border-radius:8px;">';
      cards.forEach(function(card, i) {
        var meaning = card.meaning || (card.isReversed ? card.reversed : card.upright);
        var hasAnalysis = card.analysis && i === cards.length - 1;
        html += '<div style="margin-bottom:' + (hasAnalysis ? '16px' : '12px') + ';"><strong style="color:var(--accent-purple);">' + card.position + '：' + card.name + '</strong>' +
          '<p style="color:var(--text-secondary);font-size:0.9rem;margin:4px 0 0;">' + meaning + '</p></div>';
        if (hasAnalysis) {
          html += '<div style="margin-top:16px;padding:12px;background:rgba(139,92,246,0.08);border-radius:6px;border-left:3px solid var(--accent-cyan);">' +
            '<strong style="color:var(--accent-cyan);font-size:0.9rem;">✦ 综合解读</strong>' +
            '<p style="color:var(--text-primary);font-size:0.9rem;margin:6px 0 0;line-height:1.6;">' + card.analysis + '</p></div>';
        }
      });
      html += '</div>';
      document.getElementById('tarotResult').innerHTML = html;
      btn.disabled = false;
      btn.textContent = '🃏 再抽一次';
    }).catch(function() {
      document.getElementById('tarotResult').innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);">⚠️ 获取失败，请稍后重试</div>';
      btn.disabled = false;
      btn.textContent = '🃏 抽取三张牌';
    });
  });
}

function renderCompatibility() {
  var app = document.getElementById('app');
  var options = ZODIACS.map(function(z) {
    return '<option value="' + z.name + '">' + z.icon + ' ' + z.name + '</option>';
  }).join('');
  app.innerHTML = '<div class="container page-enter">' +
    '<section class="section-title"><h2>星座配对</h2><p>探索两个星座之间的化学反应</p></section>' +
    '<div class="card" style="max-width:500px;margin:0 auto;">' +
    '<div style="display:flex;gap:16px;justify-content:center;align-items:center;flex-wrap:wrap;margin-bottom:20px;">' +
    '<select class="form-input form-select" id="compat1" style="width:150px;"><option value="">选择第一个星座</option>' + options + '</select>' +
    '<span style="color:var(--accent-purple);font-size:1.5rem;">×</span>' +
    '<select class="form-input form-select" id="compat2" style="width:150px;"><option value="">选择第二个星座</option>' + options + '</select>' +
    '</div>' +
    '<button class="btn btn-primary" id="compatBtn" style="width:100%;">✧ 查看配对结果</button>' +
    '<div id="compatResult" style="margin-top:20px;"></div></div></div>';

  document.getElementById('compatBtn').addEventListener('click', function() {
    var s1 = document.getElementById('compat1').value;
    var s2 = document.getElementById('compat2').value;
    if (!s1 || !s2) { alert('请选择两个星座'); return; }
    var resultDiv = document.getElementById('compatResult');
    resultDiv.innerHTML = '<div style="text-align:center;padding:20px;"><p style="color:var(--text-muted);">正在分析...</p></div>';

    API.getCompatibility(s1, s2).then(function(data) {
      var scoreColor = data.score >= 80 ? 'var(--accent-gold)' : data.score >= 60 ? 'var(--accent-purple)' : 'var(--text-muted)';
      var whoBetter = data.whoBetter || '';
      resultDiv.innerHTML = '<div style="margin-top:16px;padding:16px;background:var(--bg-tertiary);border-radius:8px;">' +
        '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:3rem;">' + ZODIACS.find(function(z){return z.name===s1;}).icon + ' ' + ZODIACS.find(function(z){return z.name===s2;}).icon + '</div>' +
        '<div style="font-size:1.2rem;color:var(--accent-purple);font-weight:600;">' + s1 + ' × ' + s2 + '</div>' +
        '<div style="font-size:2rem;color:' + scoreColor + ';font-weight:700;margin-top:4px;">' + data.score + '分</div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">' +
        '<div style="text-align:center;padding:10px;background:var(--bg-primary);border-radius:6px;">' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">爱情</div><div style="color:var(--danger);font-weight:600;">' + data.love + '</div></div>' +
        '<div style="text-align:center;padding:10px;background:var(--bg-primary);border-radius:6px;">' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">沟通</div><div style="color:var(--accent-cyan);font-weight:600;">' + data.communication + '</div></div>' +
        '<div style="text-align:center;padding:10px;background:var(--bg-primary);border-radius:6px;">' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">信任</div><div style="color:var(--accent-gold);font-weight:600;">' + data.trust + '</div></div></div>' +
        '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(34,211,238,0.06);border-radius:6px;border-left:3px solid var(--accent-cyan);">' +
        '<span style="color:var(--accent-cyan);font-size:0.85rem;">✦ 关系主动权：' + whoBetter + '</span></div>' +
        '<div style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;margin-bottom:10px;">' +
        '<p style="margin-bottom:8px;"><strong style="color:var(--accent-gold);">✧ 优势：</strong>' + (data.strengths || '') + '</p>' +
        '<p style="margin-bottom:8px;"><strong style="color:var(--danger);">✧ 注意：</strong>' + (data.weaknesses || '') + '</p></div>' +
        (data.danger ? '<div style="margin-top:10px;padding:10px 12px;background:rgba(239,68,68,0.06);border-radius:6px;border-left:3px solid var(--danger);">' +
        '<span style="color:var(--danger);font-size:0.85rem;">⚠️ 最大风险：' + data.danger + '</span></div>' : '') + '</div>';
    }).catch(function() {
      resultDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);">⚠️ 获取失败，请稍后重试</div>';
    });
  });
}

function renderFortune() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter">' +
    '<section class="section-title"><h2>求签问卜</h2><p>心诚则灵，点击签筒求得一签</p></section>' +
    '<div class="card" style="max-width:500px;margin:0 auto;text-align:center;">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(139,92,246,0.1);">' +
    '<span style="font-size:2rem;">🏺</span><div style="text-align:left;"><div style="color:var(--accent-purple);font-weight:600;">求签问卜</div><div style="color:var(--text-muted);font-size:0.85rem;">摇筒得签，心诚则灵</div></div></div>' +
    '<p style="color:var(--text-secondary);margin-bottom:20px;">心中默念您的问题，然后点击下方签筒</p>' +
    '<textarea class="form-input" id="fortuneQuestion" rows="2" placeholder="（可选）写下您想问的事情..." style="width:100%;margin-bottom:16px;resize:none;"></textarea>' +
    '<button class="btn btn-primary" id="fortuneDrawBtn" style="width:100%;margin-bottom:16px;">🏺 摇筒求签</button>' +
    '<div id="fortuneResult" style="margin-top:20px;"></div></div></div>';

  document.getElementById('fortuneDrawBtn').addEventListener('click', function() {
    var question = document.getElementById('fortuneQuestion').value;
    var btn = document.getElementById('fortuneDrawBtn');
    btn.disabled = true;
    btn.textContent = '求签中...';
    document.getElementById('fortuneResult').innerHTML = '<div style="text-align:center;padding:20px;"><p style="color:var(--text-muted);">签筒摇晃中...</p></div>';

    API.drawFortune(question).then(function(data) {
      var levelColors = { '大吉': 'var(--accent-gold)', '中吉': 'var(--accent-purple)', '小吉': 'var(--accent-cyan)', '吉': 'var(--accent-cyan)', '中平': 'var(--text-muted)', '下平': 'var(--text-muted)', '下下': 'var(--danger)' };
      var levelColor = levelColors[data.level] || 'var(--text-muted)';
      var isGood = data.level.indexOf('吉') !== -1;
      document.getElementById('fortuneResult').innerHTML = '<div style="margin-top:16px;padding:20px;background:var(--bg-tertiary);border-radius:8px;">' +
        '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:4rem;margin-bottom:12px;">' + (isGood ? '✨' : data.level === '下下' ? '⚠️' : '🔮') + '</div>' +
        '<div style="font-size:1.5rem;color:' + levelColor + ';font-weight:700;margin-bottom:8px;">' + data.level + '</div>' +
        '<div style="padding:16px;background:var(--bg-primary);border-radius:8px;margin:12px 0;font-size:1.1rem;color:var(--text-primary);font-style:italic;text-align:center;line-height:1.8;">' + (data.text || data.poem || '签文读取中...') + '</div></div>' +
        (data.interpretation ? '<div style="margin-bottom:12px;padding:12px;background:rgba(139,92,246,0.06);border-radius:6px;border-left:3px solid var(--accent-purple);"><span style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">📝 ' + data.interpretation + '</span></div>' : '') +
        (data.advice ? '<div style="margin-bottom:12px;padding:12px;background:rgba(34,211,238,0.06);border-radius:6px;border-left:3px solid var(--accent-cyan);"><span style="color:var(--accent-cyan);font-size:0.9rem;">👉 ' + data.advice + '</span></div>' : '') +
        '<p style="text-align:center;color:var(--text-muted);font-size:0.85rem;">心诚则灵，签文仅供参考</p></div>';
      btn.disabled = false;
      btn.textContent = '🏺 再求一签';
    }).catch(function() {
      document.getElementById('fortuneResult').innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);">求签失败，请稍后重试</div>';
      btn.disabled = false;
      btn.textContent = '🏺 摇筒求签';
    });
  });
}

// ==================== FATE ====================
  // Format iztro astrolabe data for LLM
  function formatAstrolabe(astrolabe) {
    var lines = [];
    lines.push('=== 紫微斗数星盘 ===');
    lines.push('');
    lines.push('【十二宫】');
    var palaceNames = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'];
    for (var i = 0; i < 12; i++) {
      var p = astrolabe.palace(i);
      if (!p) continue;
      var mainStar = p.mainStar || '无';
      var stars = p.stars ? p.stars.join('、') : '';
      var trans = p.transformations ? p.transformations.join('、') : '';
      var line = palaceNames[i] + '：主星【' + mainStar + '】';
      if (stars) line += ' | 辅星：' + stars;
      if (trans) line += ' | 四化：' + trans;
      lines.push(line);
    }
    lines.push('');
    lines.push('【四化】');
    if (astrolabe.transformations) {
      astrolabe.transformations.forEach(function(t) {
        lines.push(t.star + '化' + t.mutagen + '：' + (t.inPalace || ''));
      });
    }
    lines.push('');
    lines.push('【大限（前八限）】');
    if (astrolabe.horoscopes) {
      var majorCycles = astrolabe.horoscopes.filter(function(h) { return h.type === '大限'; });
      majorCycles.slice(0, 8).forEach(function(h) {
        lines.push(h.startAge + '-' + h.endAge + '岁（第' + h.index + '大限）：' + (h.mainStars ? h.mainStars.join('、') : '') + ' | ' + (h.origin || ''));
      });
    }
    lines.push('');
    lines.push('【流年（前八年）】');
    if (astrolabe.annualFortune) {
      astrolabe.annualFortune.slice(0, 8).forEach(function(a) {
        lines.push(a.age + '岁（' + a.year + '年）：' + (a.stars ? a.stars.join('、') : '') + ' | ' + (a.note || ''));
      });
    }
    return lines.join('\n');
  }

function renderFate() {
  var app = document.getElementById('app');
  var isVerified = sessionStorage.getItem('fate_verified');

  if (!isVerified) {
    app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>命运咨询</h2><p>资深命理师，为你解读人生轨迹</p></section>' +
      '<div style="display:flex;justify-content:center;align-items:center;min-height:50vh;">' +
      '<div class="card" style="text-align:center;max-width:400px;padding:40px;">' +
      '<div style="font-size:4rem;margin-bottom:20px;">🧙</div>' +
      '<h3 style="color:var(--accent-purple);margin-bottom:10px;">命理师·星轨</h3>' +
      '<p style="color:var(--text-muted);margin-bottom:30px;">三合紫微 / 飞星紫微 / 河洛斗数 / 禄马四化</p>' +
      '<div style="margin-bottom:20px;"><p style="color:var(--text-secondary);margin-bottom:10px;">请输入邀请码</p>' +
      '<input type="text" class="form-input" id="fateCode" placeholder="邀请码" style="text-align:center;font-size:1.2rem;letter-spacing:0.2em;text-transform:uppercase;" maxlength="20" autocomplete="off">' +
      '<p id="fateCodeError" style="color:var(--danger);font-size:0.85rem;margin-top:8px;display:none;">邀请码错误</p></div>' +
      '<button class="btn btn-primary" id="fateCodeBtn" style="width:100%;">✧ 进入咨询</button>' +
      '<p style="color:var(--text-muted);font-size:0.85rem;margin-top:20px;">内测阶段，需要邀请码</p></div></div></div>';
    addFateStyles();
    document.getElementById('fateCodeBtn').addEventListener('click', function() {
      var code = document.getElementById('fateCode').value.trim().toUpperCase();
      if (code === 'XINGGUI2026') {
        sessionStorage.setItem('fate_verified', 'true');
        renderFate();
      } else {
        document.getElementById('fateCodeError').style.display = 'block';
        document.getElementById('fateCode').classList.add('error');
      }
    });
    document.getElementById('fateCode').addEventListener('input', function() {
      document.getElementById('fateCodeError').style.display = 'none';
      document.getElementById('fateCode').classList.remove('error');
    });
    return;
  }

  // Check profile
  var hasProfile = sessionStorage.getItem('fate_profile');
  if (!hasProfile) {
    renderProfileForm();
    return;
  }

  renderChat();
}

function renderProfileForm() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>命运咨询</h2><p>请填写命主基本信息</p></section>' +
    '<div style="display:flex;justify-content:center;padding:20px 0;">' +
    '<div class="card" style="max-width:480px;width:100%;">' +
    '<div style="display:flex;gap:16px;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(139,92,246,0.1);">' +
    '<span style="font-size:2rem;">🧙</span><div><div style="color:var(--accent-purple);font-weight:600;">命理师·星轨</div><div style="color:var(--text-muted);font-size:0.85rem;">请提供以下信息以启动命盘分析</div></div></div>' +
    '<form id="profileForm" style="display:flex;flex-direction:column;gap:16px;">' +
    '<div><label class="form-label">出生日期 <span style="color:var(--danger);">*</span></label><input type="date" class="form-input" id="pDate" required></div>' +
    '<div><label class="form-label">出生时间 <span style="color:var(--danger);">*</span></label><input type="time" class="form-input" id="pTime" required></div>' +
    '<div><label class="form-label">历法 <span style="color:var(--danger);">*</span></label><select class="form-input form-select" id="pCal" required><option value="solar">阳历（公历）</option><option value="lunar">阴历（农历）</option></select></div>' +
    '<div><label class="form-label">出生城市 <span style="color:var(--danger);">*</span></label><input type="text" class="form-input" id="pPlace" placeholder="例如：北京、上海、成都" required></div>' +
    '<div><label class="form-label">性别 <span style="color:var(--danger);">*</span></label>' +
    '<div style="display:flex;gap:12px;"><label style="flex:1;display:flex;align-items:center;justify-content:center;padding:12px;background:var(--bg-tertiary);border-radius:8px;cursor:pointer;border:1px solid transparent;"><input type="radio" name="pGender" value="male" required style="display:none;"><span>♂ 男</span></label>' +
    '<label style="flex:1;display:flex;align-items:center;justify-content:center;padding:12px;background:var(--bg-tertiary);border-radius:8px;cursor:pointer;border:1px solid transparent;"><input type="radio" name="pGender" value="female" style="display:none;"><span>♀ 女</span></label></div></div>' +
    '<button type="submit" class="btn btn-primary" style="width:100%;">✧ 提交信息，开始分析</button></form>' +
    '<p style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-top:16px;">信息提交后可随时重新输入</p></div></div></div>';

  addProfileStyles();
  // Style checked gender labels
  document.querySelectorAll('input[name="pGender"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      document.querySelectorAll('input[name="pGender"]').forEach(function(r) {
        r.parentElement.style.background = 'var(--bg-tertiary)';
        r.parentElement.style.borderColor = 'transparent';
        r.parentElement.style.color = 'var(--text-primary)';
      });
      if (radio.checked) {
        radio.parentElement.style.background = 'rgba(139,92,246,0.15)';
        radio.parentElement.style.borderColor = 'var(--accent-purple)';
        radio.parentElement.style.color = 'var(--accent-purple)';
      }
    });
  });

  document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var profile = {
      birthDate: document.getElementById('pDate').value,
      birthTime: document.getElementById('pTime').value,
      calendar: document.getElementById('pCal').value,
      birthPlace: document.getElementById('pPlace').value,
      gender: document.querySelector('input[name="pGender"]:checked') ? document.querySelector('input[name="pGender"]:checked').value : ''
    };
    if (!profile.birthDate || !profile.birthTime || !profile.birthPlace || !profile.gender) {
      alert('请填写完整信息');
      return;
    }
    sessionStorage.setItem('fate_profile', JSON.stringify(profile));
    renderFate();
  });
}

function renderChat() {
  var app = document.getElementById('app');
  var profile = JSON.parse(sessionStorage.getItem('fate_profile') || '{}');
  var genderText = profile.gender === 'male' ? '男' : '女';
  var calText = profile.calendar === 'lunar' ? '阴历' : '阳历';

  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>命运咨询</h2><p>综合使用三合、飞星、河洛、禄马四化等各流派技法</p></section>' +
    '<div style="max-width:700px;margin:0 auto;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid rgba(139,92,246,0.15);overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 200px);min-height:400px;">' +
    '<div style="display:flex;align-items:center;gap:16px;padding:16px 24px;background:var(--bg-tertiary);border-bottom:1px solid rgba(139,92,246,0.1);">' +
    '<span style="font-size:2rem;">🧙</span><div><div style="color:var(--accent-purple);font-weight:600;">命理师·星轨</div><div style="color:var(--text-muted);font-size:0.8rem;">在线 · 内测版</div></div>' +
    '<div style="margin-left:auto;display:flex;gap:8px;"><button class="btn btn-ghost" id="fateResetBtn" style="padding:6px 12px;font-size:0.85rem;">🔄 重填</button>' +
    '<button class="btn btn-ghost" id="fateExitBtn" style="padding:6px 12px;font-size:0.85rem;">✕</button></div></div>' +
    '<div id="fateMsgs" style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px;">' +
    '<div id="fateInitMsg" style="display:flex;gap:12px;max-width:85%;">' +
    '<span style="width:36px;height:36px;border-radius:50%;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">🧙</span>' +
    '<div style="padding:12px;border-radius:12px;background:var(--bg-tertiary);border:1px solid rgba(139,92,246,0.1);line-height:1.7;">' +
    '<p>正在读取命盘信息...</p></div></div></div>' +
    '<div style="display:flex;gap:12px;padding:16px 24px;background:var(--bg-tertiary);border-top:1px solid rgba(139,92,246,0.1);">' +
    '<textarea id="fateInput" placeholder="输入您想咨询的问题..." rows="1" style="flex:1;background:var(--bg-primary);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:12px;color:var(--text-primary);resize:none;font-family:inherit;font-size:1rem;line-height:1.5;max-height:150px;" disabled></textarea>' +
    '<button class="btn btn-primary" id="fateSendBtn" style="padding:12px 24px;align-self:flex-end;" disabled>发送</button></div></div></div>';

  addChatStyles();

  // Generate real Zi Wei Dou Shu astrolabe
  var astrolabeStr = '';
  try {
    var birthDateStr = profile.birthDate; // YYYY-MM-DD
    var timeHour = parseInt(profile.birthTime.split(':')[0]);
    var genderStr = profile.gender === 'male' ? '男' : '女';
    var isLunar = profile.calendar === 'lunar';
    var astrolabe;
    if (isLunar) {
      // For lunar calendar, need to convert... use byLunar
      astrolabe = window.iztro && window.iztro.astro && window.iztro.astro.byLunar(birthDateStr, timeHour, false, genderStr, 'zh-CN');
    } else {
      astrolabe = window.iztro && window.iztro.astro && window.iztro.astro.bySolar(birthDateStr, timeHour, genderStr, true, 'zh-CN');
    }
    if (astrolabe) {
      astrolabeStr = '\n\n' + formatAstrolabe(astrolabe);
    }
  } catch(e) {}

  // Get server-synced date for LLM context
  var fateNow = SERVER_DATE || new Date();
  var fateY = fateNow.getFullYear();
  var fateM = fateNow.getMonth() + 1;
  var fateD = fateNow.getDate();
  var currentDate = fateY + '年' + fateM + '月' + fateD + '日';
  var systemPrompt = '你现在是资深的国学易经术数领域专家，综合使用三合紫微、飞星紫微、河洛紫微、禄马四化等各流派紫微的分析技法。对盘十二宫星曜分布、限流叠宫和各宫位间的飞宫四化进行细致分析，进而对命主的健康、学业、事业、财运、人际关系、婚姻和感情等各个方面进行全面分析和总结，关键事件需给出发生的时间范围、吉凶属性、事件对命主的影响程度等信息，并结合命主的自身特点给出针对性的解决方案和建议。另外，命盘信息里附带了十二个大限共一百二十个流年的信息，请对前八个大限的所有流年进行分析，给出每一年需要关注的重大事件和注意事项。你先设置好自身角色，然后向我提问我的个人信息，直至你认为可以给我推演。此外，你也精通西方星座和占星术和塔罗牌，可以用生成塔罗牌进行互动占卜。当前日期：' + currentDate + '。\n\n命主信息：\n- 性别：' + genderText + '\n- 出生日期：' + profile.birthDate + ' ' + profile.birthTime + '\n- 出生地点：' + profile.birthPlace + '\n- 历法：' + calText + astrolabeStr + '\n\n你扮演一位对话形式的命理师，用温暖专业、耐心真诚的语气与用户交流。语气不油腻、不浮夸，真心希望通过命理分析帮助用户更好地了解自己、面对人生选择。不急于下结论，先倾听，再细致分析。';

  var conversationHistory = [{ role: 'system', content: systemPrompt }];

  document.getElementById('fateSendBtn').addEventListener('click', sendMsg);
  document.getElementById('fateInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  document.getElementById('fateExitBtn').addEventListener('click', function() {
    if (confirm('确定退出吗？重新进入需要再次输入邀请码。')) {
      sessionStorage.removeItem('fate_verified');
      sessionStorage.removeItem('fate_profile');
      renderFate();
    }
  });
  document.getElementById('fateResetBtn').addEventListener('click', function() {
    if (confirm('确定要重新填写信息吗？')) {
      sessionStorage.removeItem('fate_profile');
      renderFate();
    }
  });

  function sendMsg() {
    var input = document.getElementById('fateInput');
    var text = input.value.trim();
    if (!text) return;
    addMsg('user', text);
    input.value = '';
    input.style.height = 'auto';
    // Show thinking
    var msgs = document.getElementById('fateMsgs');
    var thinking = document.createElement('div');
    thinking.id = 'thinking';
    thinking.style.cssText = 'padding:8px 16px;color:var(--text-muted);font-size:0.85rem;';
    thinking.innerHTML = '命理师正在思考...';
    msgs.appendChild(thinking);
    msgs.scrollTop = msgs.scrollHeight;

    // Call API with timeout
    var done = false;
    var timer = setTimeout(function() {
      if (!done) {
        done = true;
        var thinkEl = document.getElementById('thinking');
        if (thinkEl) thinkEl.remove();
        addMsg('master', '抱歉，服务响应超时。请检查网络后重试，或稍等几秒后再次发送。（内测阶段 Worker 可能正在冷启动）');
      }
    }, 45000);

    fetch('https://api.oyummy.top/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: conversationHistory.concat([{ role: 'user', content: text }]),
        max_tokens: 3500,
        temperature: 0.7
      })
    }).then(function(res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    }).then(function(data) {
      if (done) return;
      var finishReason = data.choices && data.choices[0] && data.choices[0].finish_reason;
      var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (reply) {
        conversationHistory.push({ role: 'user', content: text });
        conversationHistory.push({ role: 'assistant', content: reply });
        var thinkEl = document.getElementById('thinking');
        if (thinkEl) thinkEl.remove();
        addMsg('master', reply);
        if (finishReason === 'length') {
          // Show "continue" prompt
          var continueDiv = document.createElement('div');
          continueDiv.style.cssText = 'text-align:center;margin-top:8px;';
          continueDiv.innerHTML = '<button class="btn btn-ghost" id="fateContinueBtn" style="font-size:0.85rem;">📜 内容较长，继续生成 ↓</button>';
          document.getElementById('fateMsgs').appendChild(continueDiv);
          document.getElementById('fateContinueBtn').addEventListener('click', function() {
            continueDiv.remove();
            var lastReply = conversationHistory[conversationHistory.length - 1].content;
            fetch('https://api.oyummy.top/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'MiniMax-M2.7-highspeed', messages: conversationHistory.concat([{ role: 'user', content: '请继续上一条回复的未尽之处。' }]), max_tokens: 3500, temperature: 0.7 })
            }).then(function(res) { return res.json(); }).then(function(data2) {
              var more = data2.choices && data2.choices[0] && data2.choices[0].message && data2.choices[0].message.content;
              if (more) {
                conversationHistory[conversationHistory.length - 1].content += '\n\n' + more;
                var lastMsg = document.querySelector('#fateMsgs > div:last-child');
                if (lastMsg) {
                  var rendered = lastMsg.innerHTML;
                  try { if (typeof marked !== 'undefined') more = marked.parse(more); } catch(e) {}
                  try { if (typeof DOMPurify !== 'undefined') more = DOMPurify.sanitize(more); } catch(e) {}
                  lastMsg.innerHTML = rendered + more;
                }
              }
            }).catch(function() {});
          });
        }
      } else {
        throw new Error('empty');
      }
    }).catch(function(err) {
      if (done) return;
      clearTimeout(timer);
      done = true;
      var thinkEl = document.getElementById('thinking');
      if (thinkEl) thinkEl.remove();
      addMsg('master', '抱歉，服务暂时不可用，请稍后再试。（内测阶段）');
    });
  }

  function addMsg(role, content) {
    var msgs = document.getElementById('fateMsgs');
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:12px;max-width:85%;' + (role === 'user' ? 'align-self:flex-end;flex-direction:row-reverse;' : 'align-self:flex-start;');
    if (role === 'user') {
      div.innerHTML = '<div style="padding:12px;border-radius:12px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.2);line-height:1.7;">' + escHtml(content) + '</div><span style="width:36px;height:36px;border-radius:50%;background:rgba(34,211,238,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">😊</span>';
    } else {
      // Render markdown for AI responses
      var rendered = content;
      try { if (typeof marked !== 'undefined') { rendered = marked.parse(content); } } catch(e) {}
      try { if (typeof DOMPurify !== 'undefined') { rendered = DOMPurify.sanitize(rendered); } } catch(e) {}
      div.innerHTML = '<span style="width:36px;height:36px;border-radius:50%;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">🧙</span><div style="padding:12px;border-radius:12px;background:var(--bg-tertiary);border:1px solid rgba(139,92,246,0.1);line-height:1.7;">' + rendered + '</div>';
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function escHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // Auto-init: send profile to LLM on page load
  function autoInit() {
    var initMsg = document.getElementById('fateInitMsg');
    if (initMsg) {
      initMsg.innerHTML =
        '<span style="width:36px;height:36px;border-radius:50%;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">🧙</span>' +
        '<div style="padding:12px;border-radius:12px;background:var(--bg-tertiary);border:1px solid rgba(139,92,246,0.1);line-height:1.7;">' +
        '<p>善知识，贫道已收到您的命盘资讯。</p>' +
        '<p><strong>命主：</strong>' + genderText + '，' + profile.birthDate + ' ' + profile.birthTime + '，' + profile.birthPlace + '（' + calText + '）</p>' +
        '<p id="fateThinking">正在为您排盘分析，请稍候...</p></div>';
    }

    var input = document.getElementById('fateInput');
    var btn = document.getElementById('fateSendBtn');
    input.disabled = true;
    btn.disabled = true;

    var initText = '命主信息：' + genderText + '，' + profile.birthDate + ' ' + profile.birthTime + '，' + profile.birthPlace + '（' + calText + '）' + (astrolabeStr ? '\n\n' + astrolabeStr : '') + '\n\n请根据以上命盘信息，用温暖专业的语气与命主交流，寒暄后开始分析命盘。';

    var done = false;
    var timer = setTimeout(function() {
      if (!done) { done = true; var t = document.getElementById('fateThinking'); if (t) t.outerHTML = '<p style="color:var(--danger);">服务响应超时，请刷新页面重试。</p>'; input.disabled = false; btn.disabled = false; }
    }, 30000);

    fetch('https://api.oyummy.top/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'MiniMax-M2.7-highspeed', messages: conversationHistory.concat([{ role: 'user', content: initText }]), max_tokens: 3500, temperature: 0.7 })
    }).then(function(res) { clearTimeout(timer); if (!res.ok) throw new Error('err'); return res.json(); })
      .then(function(data) {
        if (done) return;
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (reply) { done = true; conversationHistory.push({ role: 'user', content: initText }); conversationHistory.push({ role: 'assistant', content: reply }); var t = document.getElementById('fateThinking'); if (t) t.remove(); addMsg('master', reply); input.disabled = false; btn.disabled = false; input.focus(); }
      })
      .catch(function() { if (done) return; clearTimeout(timer); done = true; var t = document.getElementById('fateThinking'); if (t) t.outerHTML = '<p style="color:var(--danger);">抱歉，服务暂时不可用，请刷新页面重试。</p>'; input.disabled = false; btn.disabled = false; });
  }

  setTimeout(autoInit, 300);
}

// ==================== STYLES ====================
function addFateStyles() {
  if (document.getElementById('fate-styles')) return;
  var s = document.createElement('style');
  s.id = 'fate-styles';
  s.textContent = '.fate-gate-container{display:flex;justify-content:center;align-items:center;min-height:50vh}.fate-gate-card{background:var(--bg-secondary);border-radius:var(--radius-md);padding:40px;text-align:center;max-width:400px;width:100%;border:1px solid rgba(139,92,246,0.15)}.fate-master-avatar{font-size:4rem;margin-bottom:var(--space-md)}.fate-invite-form{margin:var(--space-xl) 0}.fate-invite-label{color:var(--text-secondary);margin-bottom:var(--space-md)}.fate-invite-input{text-align:center;font-size:1.25rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:var(--space-md)}.fate-invite-error{color:var(--danger);font-size:0.9rem;margin-bottom:var(--space-md)}.fate-invite-btn{width:100%}';
  document.head.appendChild(s);
}

function addProfileStyles() {
  if (document.getElementById('profile-styles')) return;
  var s = document.createElement('style');
  s.id = 'profile-styles';
  s.textContent = '.fate-profile-container{display:flex;justify-content:center;align-items:flex-start;padding:20px 0}.fate-profile-card{max-width:480px;width:100%}.fate-profile-header{display:flex;gap:16px;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(139,92,246,0.1)}';
  document.head.appendChild(s);
}

function addChatStyles() {
  if (document.getElementById('chat-styles')) return;
  var s = document.createElement('style');
  s.id = 'chat-styles';
  s.textContent = '.fate-chat-container{max-width:700px;margin:0 auto;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid rgba(139,92,246,0.15);overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 200px);min-height:400px}.fate-chat-header{display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md) var(--space-lg);background:var(--bg-tertiary);border-bottom:1px solid rgba(139,92,246,0.1)}.fate-chat-input-area{display:flex;gap:var(--space-md);padding:var(--space-md) var(--space-lg);background:var(--bg-tertiary);border-top:1px solid rgba(139,92,246,0.1)}.fate-chat-input{flex:1;background:var(--bg-primary);border:1px solid rgba(139,92,246,0.2);border-radius:var(--radius-sm);padding:var(--space-md);color:var(--text-primary);resize:none;font-family:var(--font-body);font-size:1rem;line-height:1.5;max-height:150px}.fate-chat-input:focus{outline:none;border-color:var(--accent-purple)}';
  document.head.appendChild(s);
}

// Init
initRouter();
