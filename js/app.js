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
      resultDiv.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-muted);">正在加载...</p></div>';
      // Simple mock response for now
      setTimeout(function() {
        resultDiv.innerHTML = '<div class="card"><h3 style="color:var(--accent-purple);text-align:center;">' + zodiac + ' 今日运势</h3><p style="color:var(--text-secondary);text-align:center;">综合运势★★★☆☆</p><p style="color:var(--text-muted);font-size:0.9rem;text-align:center;">完整功能内测中...</p></div>';
      }, 500);
    });
  });
}

// ==================== PAGES (stubs) ====================
function renderChart() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>星盘分析</h2><p>输入出生信息，探索你的宇宙密码</p></section><div class="card" style="text-align:center;padding:60px;"><p style="color:var(--text-muted);">星盘分析功能内测中...</p></div></div>';
}

function renderTarot() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>塔罗占卜</h2><p>让牌卡指引你的困惑</p></section><div class="card" style="text-align:center;padding:60px;"><p style="color:var(--text-muted);">塔罗占卜功能内测中...</p></div></div>';
}

function renderCompatibility() {
  var app = document.getElementById('app');
  var options = ZODIACS.map(function(z) {
    return '<option value="' + z.name + '">' + z.icon + ' ' + z.name + '</option>';
  }).join('');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>星座配对</h2><p>探索两个星座之间的化学反应</p></section>' +
    '<div class="card"><div style="display:flex;gap:20px;justify-content:center;align-items:center;flex-wrap:wrap;">' +
    '<select class="form-input form-select" id="compat1" style="width:150px;"><option value="">选择星座</option>' + options + '</select>' +
    '<span style="color:var(--accent-purple);font-size:1.5rem;">×</span>' +
    '<select class="form-input form-select" id="compat2" style="width:150px;"><option value="">选择星座</option>' + options + '</select>' +
    '</div><button class="btn btn-primary" id="compatBtn" style="margin-top:20px;width:100%;">✧ 查看配对结果</button>' +
    '<div id="compatResult" style="margin-top:20px;"></div></div></div>';
  document.getElementById('compatBtn').addEventListener('click', function() {
    var s1 = document.getElementById('compat1').value;
    var s2 = document.getElementById('compat2').value;
    if (!s1 || !s2) { alert('请选择两个星座'); return; }
    document.getElementById('compatResult').innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-muted);">配对功能内测中...</p></div>';
  });
}

function renderFortune() {
  var app = document.getElementById('app');
  app.innerHTML = '<div class="container page-enter"><section class="section-title"><h2>求签问卜</h2><p>心诚则灵，点击签筒求得一签</p></section>' +
    '<div class="card" style="text-align:center;padding:60px;"><p style="color:var(--text-muted);">求签功能内测中...</p></div></div>';
}

// ==================== FATE ====================
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
    '<div style="display:flex;gap:12px;max-width:85%;"><span style="width:36px;height:36px;border-radius:50%;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">🧙</span>' +
    '<div style="padding:12px;border-radius:12px;background:var(--bg-tertiary);border:1px solid rgba(139,92,246,0.1);line-height:1.7;">' +
    '<p>善知识，贫道已收到您的命盘资讯。</p>' +
    '<p><strong>命主：</strong>' + genderText + '，' + profile.birthDate + ' ' + profile.birthTime + '，' + profile.birthPlace + '（' + calText + '）</p>' +
    '<p>正在为您排盘分析，请稍候...</p></div></div></div>' +
    '<div style="display:flex;gap:12px;padding:16px 24px;background:var(--bg-tertiary);border-top:1px solid rgba(139,92,246,0.1);">' +
    '<textarea id="fateInput" placeholder="输入您想咨询的问题..." rows="1" style="flex:1;background:var(--bg-primary);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:12px;color:var(--text-primary);resize:none;font-family:inherit;font-size:1rem;line-height:1.5;max-height:150px;"></textarea>' +
    '<button class="btn btn-primary" id="fateSendBtn" style="padding:12px 24px;align-self:flex-end;">发送</button></div></div></div>';

  addChatStyles();

  var systemPrompt = '你现在是一位资深的国学易经术数领域专家，综合使用三合紫微、飞星紫微、河洛紫微、禄马四化等各流派紫微的分析技法。\n\n命主信息：\n- 性别：' + genderText + '\n- 出生日期：' + profile.birthDate + ' ' + profile.birthTime + '\n- 出生地点：' + profile.birthPlace + '\n- 历法：' + calText + '\n\n你扮演一位对话形式的算命先生，用温暖专业的语气与用户交流。可以先简单寒暄，然后开始分析命盘。';

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

    // Call API
    fetch('https://xinggui-chat.yangmingyi1998128.workers.dev/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory.concat([{ role: 'user', content: text }]),
        max_tokens: 2000,
        temperature: 0.7
      })
    }).then(function(res) { return res.json(); })
      .then(function(data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (reply) {
          conversationHistory.push({ role: 'user', content: text });
          conversationHistory.push({ role: 'assistant', content: reply });
          var thinkEl = document.getElementById('thinking');
          if (thinkEl) thinkEl.remove();
          addMsg('master', reply);
        }
      })
      .catch(function(err) {
        console.error(err);
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
      div.innerHTML = '<span style="width:36px;height:36px;border-radius:50%;background:rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">🧙</span><div style="padding:12px;border-radius:12px;background:var(--bg-tertiary);border:1px solid rgba(139,92,246,0.1);line-height:1.7;">' + content + '</div>';
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function escHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
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
