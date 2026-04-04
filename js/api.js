/**
 * API with real astronomical calculations + LLM interpretation
 */

// Server-synced date to avoid client clock issues
var SERVER_DATE = null;
var MAJOR_ARCANA = [
  { name: '愚人', upright: '新的开始，自由的冒险，可能性。', reversed: '冲动，轻率，方向迷失。' },
  { name: '魔术师', upright: '创造力，行动力，意志力，自信。', reversed: '计划拖延，技能不足，沟通不良。' },
  { name: '女祭司', upright: '直觉，神秘，内在智慧，隐藏的信息。', reversed: '秘密，欺骗，直觉被压制。' },
  { name: '皇后', upright: '丰收，创造力，自然，丰盛，母性。', reversed: '依附他人，缺乏成长，财务上的损失。' },
  { name: '皇帝', upright: '权威，结构，掌控，父亲般的保护。', reversed: '控制欲过强，缺少自律，硬件。' },
  { name: '教皇', upright: '信仰，灵性，传统，群体，道德。', reversed: '权威冲突，个人信仰被压制，过度依赖传统。' },
  { name: '恋人', upright: '爱，魅力，选择，和谐，关系。', reversed: '不和谐，失衡，价值冲突，不当的结合。' },
  { name: '战车', upright: '意志力，成功，控制，决心，胜利。', reversed: '失控，缺乏方向，冲突，军事。' },
  { name: '力量', upright: '勇气，毅力，善良，压力下的优雅。', reversed: '自我怀疑，脆弱，焦虑，内心冲突。' },
  { name: '隐者', upright: '内省，探索，沉思，独处，精神的指引。', reversed: '孤立，孤独，拒绝独处，失去方向。' },
  { name: '命运之轮', upright: '运气，命运，转折点， Cycles，意外事件。', reversed: '阻滞，厄运，意外的延误， Cycle 延迟。' },
  { name: '正义', upright: '公正，诚信，因果，真相，法律的指示。', reversed: '不公正，不诚实，缺乏责任感，报复。' },
  { name: '倒吊人', upright: '等待，心甘情愿的牺牲，新的观点，悬而未决。', reversed: '拖延，无意义的牺牲，拒绝改变，不愿意。' },
  { name: '死神', upright: '结束，蜕变，转变，清算， Doorway。', reversed: '抗拒结束，拖延，负隅顽抗，当前的终结。' },
  { name: '节欲', upright: '平衡，耐心，方法，节制，目的。', reversed: '失衡，逸轨，强迫行为，不良习惯。' },
  { name: '恶魔', upright: '束缚，诱惑，物质主义，灰暗。', reversed: '打破束缚，释放，放下，解放。' },
  { name: '塔', upright: '突变，破坏，解放，觉醒，冲击。', reversed: '压抑的灾难，内部冲突，恐惧变化。' },
  { name: '星星', upright: '希望，信念，目的， seren ，宇宙的恩赐。', reversed: '绝望，信念丧失，缺乏目标，不协调。' },
  { name: '月亮', upright: '错觉，恐惧，焦虑，无意识，困惑。', reversed: '恐惧消散，幻灭，摆脱欺骗， inner 混乱。' },
  { name: '太阳', upright: '喜悦，成功，活力，生命力，温暖。', reversed: '情绪低落，成功暂时，情绪萎靡，过度兴奋。' },
  { name: '审判', upright: '复兴， reevaluation ，内省，宽恕，更新。', reversed: '自我怀疑，遗憾， reevaluation 延迟，缺乏信心。' },
  { name: '世界', upright: '完成，整合，成就感， Travel， Cycles 的完成。', reversed: '缺乏完成感，失望，目标未达成，感觉被困。' },
  { name: '愚人', upright: '新的开始，可能性，纯洁，天真。', reversed: '冲动，冒险， Reckless ，鲁莽。' }
];
// Remove duplicate last entry
MAJOR_ARCANA.pop();
function shuffleArray(arr) {
  var result = arr.slice();
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
function pickRandomCards(n) {
  var shuffled = shuffleArray(MAJOR_ARCANA);
  return shuffled.slice(0, n);
}
function getServerDateSync() {
  return SERVER_DATE;
}
function fetchServerDate(callback) {
  if (SERVER_DATE) { callback(SERVER_DATE); return; }
  fetch('https://worldtimeapi.org/api/timezone/Asia/Shanghai').then(function(r) { return r.json(); }).then(function(data) {
    SERVER_DATE = new Date(data.datetime);
    callback(SERVER_DATE);
  }).catch(function() {
    SERVER_DATE = new Date();
    callback(SERVER_DATE);
  });
}
function getDateStr() {
  var d = SERVER_DATE || new Date();
  return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
}


var API = {
  WORKER_URL: 'https://model.imfan.top/v1/chat/completions',
  API_KEY: 'sk-6gpgNC8L2b2GFebjIeKqnDo5j4zKtWa3Jylv5Pm59GLRApkU',

  // ===================== ASTRONOMY ENGINE =====================

  mod360: function(x) {
    x = x % 360;
    return x < 0 ? x + 360 : x;
  },

  toJulianDay: function(year, month, day, hour, min, sec) {
    var y = year, m = month;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5 +
           ((hour + min / 60 + sec / 3600) - 12) / 24;
  },

  // Sun ecliptic longitude - Meeus algorithm
  getSunLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    var C = (1.914602 - T * (0.004817 - 0.000014 * T)) * Math.sin(M * Math.PI / 180) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
            0.000289 * Math.sin(3 * M * Math.PI / 180);
    return this.mod360(L0 + C);
  },

  // Moon ecliptic longitude
  getMoonLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L0 = 218.3164477 + T * (481267.88123421 - 0.0015786 * T);
    var l = 134.9633964 + T * (477198.8675055 + 0.0087414 * T);
    var lp = 357.5291092 + T * (35999.0502909 - 0.0001466 * T);
    var F = 93.2720950 + T * (483202.0175233 - 0.0036539 * T);
    var l_prime = L0 + 6.289 * Math.sin(l * Math.PI / 180);
    l_prime += 1.274 * Math.sin((l - 2 * F) * Math.PI / 180);
    l_prime += 0.658 * Math.sin(2 * lp * Math.PI / 180);
    l_prime -= 0.214 * Math.sin(2 * F * Math.PI / 180);
    l_prime += 0.186 * Math.sin(357.52911 * Math.PI / 180);
    return this.mod360(l_prime);
  },

  // Inner planets (Mercury, Venus) - simplified
  getMercuryLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L = 252.250906 + T * 149474.072249; // mean longitude
    var l = 174.350794 + T * 4850.494102;   // mean anomaly
    var C = 0.370 + 0.980 * Math.sin(l * Math.PI / 180) + 0.360 * Math.sin(2 * l * Math.PI / 180);
    return this.mod360(L + C);
  },

  getVenusLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L = 181.979801 + T * 58517.815674;
    var l = 50.407990 + T * 22518.443300;
    var C = 0.770 + 1.200 * Math.sin(l * Math.PI / 180) + 0.480 * Math.sin(2 * l * Math.PI / 180);
    return this.mod360(L + C);
  },

  // Mars
  getMarsLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L = 355.432999 + T * 19140.299336;
    var l = 25.941742 + T * 19139.854858;
    var C = 0.770 + 1.980 * Math.sin(l * Math.PI / 180) + 0.620 * Math.sin(2 * l * Math.PI / 180);
    return this.mod360(L + C);
  },

  // Jupiter
  getJupiterLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L = 34.351519 + T * 3034.905338;
    var l = 20.773939 + T * 1222.113794;
    var C = 0.660 + 4.830 * Math.sin(l * Math.PI / 180) + 0.320 * Math.sin(2 * l * Math.PI / 180);
    return this.mod360(L + C);
  },

  // Saturn
  getSaturnLon: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L = 50.077444 + T * 1222.113738;
    var l = 290.821127 + T * 758.230275;
    var C = 0.510 + 4.630 * Math.sin(l * Math.PI / 180) + 0.240 * Math.sin(2 * l * Math.PI / 180);
    return this.mod360(L + C);
  },

  // Zodiac sign from ecliptic longitude
  lonToSign: function(lon) {
    var signs = [
      { name: '白羊座', element: '火', planet: '火星' },
      { name: '金牛座', element: '土', planet: '金星' },
      { name: '双子座', element: '风', planet: '水星' },
      { name: '巨蟹座', element: '水', planet: '月亮' },
      { name: '狮子座', element: '火', planet: '太阳' },
      { name: '处女座', element: '土', planet: '水星' },
      { name: '天秤座', element: '风', planet: '金星' },
      { name: '天蝎座', element: '水', planet: '冥王星' },
      { name: '射手座', element: '火', planet: '木星' },
      { name: '摩羯座', element: '土', planet: '土星' },
      { name: '水瓶座', element: '风', planet: '天王星' },
      { name: '双鱼座', element: '水', planet: '海王星' }
    ];
    var idx = Math.floor(lon / 30);
    var deg = lon % 30;
    var s = signs[idx];
    return { name: s.name, symbol: '♈♉♊♋♌♍♎♏♐♑♒♓'[idx], element: s.element, ruler: s.planet, degree: Math.round(deg * 10) / 10 };
  },

  // Aspect orb check (degrees)
  aspectOrb: 8, // degrees

  getAspect: function(lon1, lon2) {
    var diff = Math.abs(this.mod360(lon1 - lon2));
    if (diff > 180) diff = 360 - diff;
    var aspects = [
      { name: '合相', symbol: '☌', orb: 0, effect: '融合、强化' },
      { name: '六分', symbol: '⚹', orb: 6, effect: '和谐、顺畅' },
      { name: '四分', symbol: '□', orb: 4, effect: '挑战、压力' },
      { name: '三分', symbol: '△', orb: 0, effect: '顺利、和谐' },
      { name: '二分', symbol: '☍', orb: 6, effect: '对冲、张力' }
    ];
    for (var i = 0; i < aspects.length; i++) {
      var a = aspects[i];
      var target = [0, 60, 90, 120, 180][i];
      if (Math.abs(diff - target) <= this.aspectOrb) {
        return { name: a.name, symbol: a.symbol, effect: a.effect, exact: diff === target };
      }
    }
    return null;
  },

  // Get all planetary positions for a given date
  getDayPositions: function(year, month, day) {
    var jd = this.toJulianDay(year, month, day, 12, 0, 0);
    var planets = [
      { name: '太阳', lon: this.getSunLon(jd) },
      { name: '月亮', lon: this.getMoonLon(jd) },
      { name: '水星', lon: this.getMercuryLon(jd) },
      { name: '金星', lon: this.getVenusLon(jd) },
      { name: '火星', lon: this.getMarsLon(jd) },
      { name: '木星', lon: this.getJupiterLon(jd) },
      { name: '土星', lon: this.getSaturnLon(jd) }
    ];
    var signs = {};
    var aspects = [];

    for (var i = 0; i < planets.length; i++) {
      planets[i].sign = this.lonToSign(planets[i].lon);
      signs[planets[i].name] = planets[i].sign;
    }

    // Calculate aspects between planets
    for (var i = 0; i < planets.length; i++) {
      for (var j = i + 1; j < planets.length; j++) {
        var asp = this.getAspect(planets[i].lon, planets[j].lon);
        if (asp) {
          aspects.push({
            p1: planets[i].name,
            p2: planets[j].name,
            name: asp.name,
            symbol: asp.symbol,
            effect: asp.effect
          });
        }
      }
    }

    return { planets: planets, aspects: aspects, signs: signs, date: year + '-' + month + '-' + day };
  },

  // Build astrological context for a zodiac sign for a specific date
  getSignContext: function(signName, year, month, day) {
    var dp = this.getDayPositions(year, month, day);
    var signOrder = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    var signIdx = signOrder.indexOf(signName);
    var signLon = signIdx * 30; // start longitude of the sign

    // Find planets in this sign
    var inSign = [];
    var nearSign = [];
    for (var i = 0; i < dp.planets.length; i++) {
      var p = dp.planets[i];
      var diff = Math.abs(p.lon - signLon);
      if (diff > 180) diff = 360 - diff;
      if (diff < 30) {
        inSign.push({ name: p.name, sign: p.sign });
      }
    }

    // Find aspects to planets in this sign
    var relevantAspects = [];
    for (var i = 0; i < dp.aspects.length; i++) {
      var a = dp.aspects[i];
      var p1In = dp.signs[a.p1] && dp.signs[a.p1].name === signName;
      var p2In = dp.signs[a.p2] && dp.signs[a.p2].name === signName;
      if (p1In || p2In) {
        relevantAspects.push(a);
      }
    }

    // Today's overall energy
    var sunSign = dp.signs['太阳'].name;
    var moonSign = dp.signs['月亮'].name;

    var context = {
      date: dp.date,
      signName: signName,
      planetsInSign: inSign,
      aspects: relevantAspects,
      sunSign: sunSign,
      moonSign: moonSign,
      allPlanets: dp.planets
    };

    return context;
  },

  // Convert context to readable string for LLM
  formatContext: function(ctx) {
    var lines = [];
    lines.push('日期：' + ctx.date);
    lines.push('太阳所在星座：' + ctx.sunSign);
    lines.push('月亮所在星座：' + ctx.moonSign);

    if (ctx.planetsInSign.length > 0) {
      lines.push('今日进入' + ctx.signName + '的行星：');
      ctx.planetsInSign.forEach(function(p) {
        lines.push('  - ' + p.name + '（' + p.sign.name + p.sign.degree + '°，' + p.sign.element + '相）');
      });
    } else {
      lines.push('今日无行星进入' + ctx.signName + '。');
    }

    if (ctx.aspects.length > 0) {
      lines.push('与' + ctx.signName + '相关的相位：');
      ctx.aspects.forEach(function(a) {
        lines.push('  - ' + a.p1 + ' ' + a.symbol + ' ' + a.p2 + '（' + a.name + '：' + a.effect + '）');
      });
    }

    return lines.join('\n');
  },

  // ===================== LLM CALL =====================

  callLLM: function(systemPrompt, userPrompt, maxTokens) {
    return new Promise(function(resolve, reject) {
      var done = false;
      var timer = setTimeout(function() {
        if (!done) { done = true; reject(new Error('timeout')); }
      }, 25000);
      fetch(API.WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API.API_KEY
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.7-highspeed',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: maxTokens || 800,
          temperature: 0.7
        })
      }).then(function(res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('API Error ' + res.status);
        return res.json();
      }).then(function(data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!reply) throw new Error('Empty');
        done = true;
        resolve(reply);
      }).catch(function(err) {
        clearTimeout(timer);
        if (!done) { done = true; reject(err); }
      });
    });
  },

  // ===================== FEATURES =====================

  getHoroscope: function(zodiac, date) {
    var cacheKey = 'hg_' + zodiac + '_' + date;
    var cached = null;
    try { cached = localStorage.getItem(cacheKey); } catch(e) {}
    if (cached) {
      try { return Promise.resolve(JSON.parse(cached)); } catch(e) {}
    }

    // Build real astrological context
    var parts = date.split('-');
    var year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]);
    var ctx = API.getSignContext(zodiac, year, month, day);
    var data = API.computeHoroscopeFromContext(zodiac, ctx);
    data._context = ctx;

    // Try LLM for richer content, but don't block
    var currentDate = getDateStr();
    API.callLLM(
      '你是一位说话直接、实战经验深厚的占星师。你说的每句话都要扎到人心里，不废话，不恭维，不两面讨好。当前日期是' + currentDate + '，今天行星的位置都基于这个日期。你的读者是25-40岁的都市人，他们每天被工作、感情、生活压得喘不过气，他们需要听到真话，不是一堆"今日运势不错"之类的废话。格式：用第二人称，简洁有力。输出JSON，包含字段：rating（一句话今日定性，如"今天适合躺平"、"今天是破局日"、"小心，今天有坑"）, love（爱情方面一句具体提醒或肯定，60字以内）, career（事业/工作一句具体提醒，60字以内）, wealth（财运一句具体提醒，60字以内）, warning（今天最需要警惕的一件事，一句话，40字以内，如果今日确实没什么风险可以写"无特殊预警，顺势而为"）, action（一件今天最值得做的事，一句话，40字以内）。全部字段都要填，不要省略。',
      zodiac + ' 今日运势，日期：' + date + '。星象数据：' + API.formatContext(ctx) + '。请根据以上真实天文数据，输出一段针对' + zodiac + '今日的综合运势分析。要求：1）直接说人话，不要官话套话；2）有褒有贬，不只说好听的；3）结合真实星象给出分析依据；4）给出可操作的建议。输出JSON格式。',
      400
    ).then(function(text) {
      try {
        var rich = JSON.parse(text);
        data.rating = rich.rating || data.tip;
        data.loveTip = rich.love || '';
        data.careerTip = rich.career || '';
        data.wealthTip = rich.wealth || '';
        data.warning = rich.warning || '';
        data.action = rich.action || '';
        data.tip = rich.rating || data.tip;
      } catch(e) {
        // keep computed defaults
      }
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e) {}
    }).catch(function() {});

    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e) {}
    return Promise.resolve(data);
  },

  computeHoroscopeFromContext: function(zodiac, ctx) {
    var has = function(name) {
      return ctx.planetsInSign.some(function(p){ return p.name === name; });
    };
    var hasAny = function() {
      for (var i = 0; i < arguments.length; i++) {
        if (has(arguments[i])) return true;
      }
      return false;
    };

    // Base scores from element of the sign
    var elemScores = { '火': { base: 72, love: 68, career: 80, wealth: 65 },
                       '土': { base: 65, love: 70, career: 75, wealth: 80 },
                       '风': { base: 75, love: 80, career: 70, wealth: 60 },
                       '水': { base: 68, love: 85, career: 65, wealth: 70 } };
    var signElem = ctx.planetsInSign.length > 0 ? ctx.planetsInSign[0].sign.element :
                   (['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'][Math.floor(Math.random()*12)]);
    var elem = { '白羊': '火','金牛': '土','双子': '风','巨蟹': '水','狮子': '火','处女': '土','天秤': '风','天蝎': '水','射手': '火','摩羯': '土','水瓶': '风','双鱼': '水' }[zodiac] || '火';
    var base = elemScores[elem] || { base: 70, love: 70, career: 70, wealth: 70 };

    // Adjust by planets in sign
    var bonus = 0;
    var love = base.love;
    var career = base.career;
    var wealth = base.wealth;

    if (has('太阳')) { career += 8; wealth += 5; }
    if (has('月亮')) { love += 10; career -= 3; }
    if (has('水星')) { career += 5; love += 3; }
    if (has('金星')) { love += 15; wealth += 8; }
    if (has('火星')) { career += 10; love -= 5; wealth += 3; }
    if (has('木星')) { love += 8; wealth += 10; career += 5; }
    if (has('土星')) { career += 5; love -= 8; wealth += 3; }

    // Aspect effects
    ctx.aspects.forEach(function(a) {
      if (a.name === '三分' || a.name === '六分') { love += 3; career += 3; }
      if (a.name === '四分') { career += 5; love -= 5; }
      if (a.name === '二分') { love -= 5; career += 3; }
      if (a.name === '合相') { career += 5; love += 5; }
    });

    // Moon sign affects today's mood
    var moonBonus = { '金牛': 'love', '巨蟹': 'love', '天蝎': 'love', '双鱼': 'love',
                       '白羊': 'career', '狮子': 'career', '射手': 'career',
                       '双子': 'wealth', '处女': 'wealth', '水瓶': 'wealth' };
    var moonBoost = moonBonus[ctx.moonSign] || '';
    if (moonBoost === 'love') love += 5;
    if (moonBoost === 'career') career += 5;
    if (moonBoost === 'wealth') wealth += 5;

    love = Math.min(99, Math.max(40, love));
    career = Math.min(99, Math.max(40, career));
    wealth = Math.min(99, Math.max(40, wealth));
    var score = Math.round(((love + career + wealth) / 3 / 100 * 5) * 10) / 10;
    score = Math.min(5, Math.max(3, score));

    // Lucky things - deterministic from planetary positions
    var colorMap = { '太阳': '金色','月亮': '银色','水星': '蓝绿','金星': '粉白','火星': '红色','木星': '紫色','土星': '黑色' };
    var colors = ['红色','橙色','黄色','绿色','蓝色','紫色','金色','白色'];
    var color = has('太阳') ? '金色' : has('金星') ? '粉白' : has('木星') ? '紫色' : has('火星') ? '红色' : colors[ctx.planetsInSign.length % colors.length];
    var nums = [1,2,3,4,5,6,7,8,9];
    var num = nums[ctx.planetsInSign.length % 9];
    var dirs = ['东方','西方','南方','北方','东南','西南','东北','西北'];
    var dir = dirs[Math.floor((ctx.planetsInSign.length * 3 + ctx.aspects.length) % 8)];

    // Generate tip from real conditions
    var tips = [];
    if (has('火星') && has('木星')) tips.push('木火相生，行动力与好运并存，大胆推进。');
    else if (has('火星')) tips.push('火星行运，注意控制冲动，三思而后行。');
    else if (has('金星')) tips.push('金星眷顾，感情人际顺利，桃花运佳。');
    else if (has('木星')) tips.push('木星加持，运势上扬，利于学习、旅行和扩张。');
    else if (has('土星')) tips.push('土星考验，压力与机遇并存，耐心应对可有所成。');
    else if (has('太阳')) tips.push('日照事业，贵人相助，工作上表现机会多。');
    else if (has('月亮')) tips.push('月耀情感，内心感受丰富，适合与家人相处。');
    else tips.push('星象平稳，稳中求进，把握当下，顺势而为。');

    if (ctx.aspects.length >= 3) tips.push('今日相位丰富，能量活跃，适合多尝试新事物。');

    return {
      score: score,
      love: love,
      career: career,
      wealth: wealth,
      luckyColor: color,
      luckyNumber: num,
      luckyDirection: dir,
      tip: tips[0]
    };
  },

  // Add a method to get raw context (for display purposes)
  getHoroscopeContext: function(zodiac, date) {
    var parts = date.split('-');
    return API.getSignContext(zodiac, parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  },

  getNatalChart: function(birthDate, birthTime, birthCity) {
    var dateInfo = API.parseDate(birthDate);
    var timeHours = API.parseTime(birthTime);
    var lat = API.getCityLat(birthCity);
    var jd = API.toJulianDay(dateInfo.year, dateInfo.month, dateInfo.day, timeHours, 0, 0);

    var sun = API.lonToSign(API.getSunLon(jd));
    var moon = API.lonToSign(API.getMoonLon(jd));

    // Ascending - simplified
    var sunLon = API.getSunLon(jd);
    var ascLon = API.mod360(sunLon + (timeHours - 12) * 15 + 90 + (lat > 30 ? 5 : -5));
    var rising = API.lonToSign(ascLon);

    var chartData = {
      sun: sun.name, sunDegree: sun.degree,
      moon: moon.name, moonDegree: moon.degree,
      rising: rising.name, risingDegree: rising.degree,
      birthDate: birthDate, birthTime: birthTime, birthCity: birthCity
    };

    var currentDate = getDateStr();
    var sys = '你是一位资深的紫微斗数和西洋占星命理师。你说话直接，不回避尖锐的结论。你解读命盘时，先给出整体概述（2-3句话，把性格、事业、感情的关键点串联起来，给命主一个清晰的画像），再说各维度细节，最后给出最需要关注的一件事和建议。用第二人称，有信息量，不要废话。当前日期：' + currentDate + '。';
    var user = '命主出生信息：' + birthDate + ' ' + birthTime + '，出生地 ' + birthCity + '。\n\n天文计算结果：\n- 太阳星座：' + sun.name + ' ' + sun.degree + '°\n- 月亮星座：' + moon.name + ' ' + moon.degree + '°\n- 上升星座：' + rising.name + ' ' + rising.degree + '°\n\n请输出一段命盘解读，JSON格式：overview(100字以内整体概述，串联性格、事业、感情的关键点，给命主一个清晰的核心画像), personality(80字以内核心性格描述，要直接说优点也说缺点), career(60字以内事业/财富先天格局), love(60字以内感情先天格局), warning(一句话，说这个命盘最需要警惕或关注的一件事), advice(一句话，说现在最值得做的一件事)。全部字段都要填。';

    return API.callLLM(sys, user, 600).then(function(text) {
      try {
        var rich = JSON.parse(text);
        chartData.overview = rich.overview || '';
        chartData.personality = rich.personality || '';
        chartData.career = rich.career || '';
        chartData.love = rich.love || '';
        chartData.warning = rich.warning || '';
        chartData.advice = rich.advice || '';
        chartData.interpretation = rich.overview || rich.personality || rich.career || rich.love || text.substring(0, 100);
      } catch(e) {
        chartData.interpretation = text.substring(0, 200);
      }
      return chartData;
    }).catch(function() {
      chartData.interpretation = '命盘解读获取失败，请稍后重试。';
      return chartData;
    });
  },

  drawTarot: function(mode, question) {
    var currentDate = getDateStr();
    var cards = pickRandomCards(3);
    var positions = ['过去', '现在', '未来'];
    var drawn = cards.map(function(card, i) {
      var isReversed = Math.random() < 0.35;
      return {
        name: card.name,
        position: positions[i],
        upright: card.upright,
        reversed: card.reversed,
        isReversed: isReversed
      };
    });

    var sys = '你是一位说话犀利的塔罗占卜师。你不回避坏消息，也不粉饰现实。你的解读要直指人心，让用户感受到牌卡在说他自己的故事。用第二人称，简洁有力。当前日期：' + currentDate + '。';
    var user = question ? ('用户问题：' + question + '。\n三张牌（随机抽取）：\n1. ' + drawn[0].name + ' - ' + drawn[0].position + ' - ' + (drawn[0].isReversed ? '逆位' : '正位') + '：' + (drawn[0].isReversed ? drawn[0].reversed : drawn[0].upright) + '\n2. ' + drawn[1].name + ' - ' + drawn[1].position + ' - ' + (drawn[1].isReversed ? '逆位' : '正位') + '：' + (drawn[1].isReversed ? drawn[1].reversed : drawn[1].upright) + '\n3. ' + drawn[2].name + ' - ' + drawn[2].position + ' - ' + (drawn[2].isReversed ? '逆位' : '正位') + '：' + (drawn[2].isReversed ? drawn[2].reversed : drawn[2].upright) + '\n\n请根据以上牌面，结合用户问题，给出每张牌的解读（每个position一段，80字以内，要结合牌义和问题展开，不要泛泛而谈），最后给出一段综合解读（100字以内），把三张牌串联起来，直接回答用户的问题。只返回JSON，格式：{interpretations:[每张牌的解读字符串，3项],analysis:综合解读字符串}。') : ('三张牌（随机抽取）：\n1. ' + drawn[0].name + ' - ' + drawn[0].position + ' - ' + (drawn[0].isReversed ? '逆位' : '正位') + '：' + (drawn[0].isReversed ? drawn[0].reversed : drawn[0].upright) + '\n2. ' + drawn[1].name + ' - ' + drawn[1].position + ' - ' + (drawn[1].isReversed ? '逆位' : '正位') + '：' + (drawn[1].isReversed ? drawn[1].reversed : drawn[1].upright) + '\n3. ' + drawn[2].name + ' - ' + drawn[2].position + ' - ' + (drawn[2].isReversed ? '逆位' : '正位') + '：' + (drawn[2].isReversed ? drawn[2].reversed : drawn[2].upright) + '\n\n请给出每张牌的解读（每个position一段，80字以内，要结合牌义展开，不要泛泛而谈），最后给出一段综合解读（100字以内），把三张牌串联起来。只返回JSON，格式：{interpretations:[每张牌的解读字符串，3项],analysis:综合解读字符串}。');

    return API.callLLM(sys, user, 1200).then(function(text) {
      try {
        var parsed = JSON.parse(text);
        var interpretations = Array.isArray(parsed.interpretations) ? parsed.interpretations : [];
        drawn.forEach(function(card, i) {
          card.meaning = interpretations[i] || (card.isReversed ? card.reversed : card.upright);
        });
        if (parsed.analysis) {
          drawn[2].analysis = parsed.analysis;
        }
        return drawn;
      } catch(e) {
        // Fallback: use the card's built-in meaning
        drawn.forEach(function(card) {
          card.meaning = card.isReversed ? card.reversed : card.upright;
        });
        return drawn;
      }
    }).catch(function() {
      drawn.forEach(function(card) {
        card.meaning = card.isReversed ? card.reversed : card.upright;
      });
      return drawn;
    });
  },

  getCompatibility: function(sign1, sign2) {
    var currentDate = getDateStr();
    var sys = '你是一位说话直接、实战经验深厚的星座配对分析师。你不只说好听的话，也会直接指出两个人之间最可能的冲突点、谁更容易在关系中吃亏、哪一方需要更多包容。用专业但不说教的口吻。当前日期：' + currentDate + '。';
    var user = '请深度分析 ' + sign1 + ' 和 ' + sign2 + ' 的星座配对。用JSON格式返回：score(60-98整数总分), love(0-100整数爱情指数), communication(0-100整数沟通指数), trust(0-100整数信任指数), strengths(两句话，说这段关系最核心的1-2个优势，要具体不要套话), weaknesses(两句话，直接说这段关系最需要警惕的问题，要具体不要套话), whoBetter(一句话，说明在这段关系中谁相对更占优势或更主动), danger(一句话，说明这段关系最大的潜在风险)。只返回JSON。';
    return API.callLLM(sys, user, 500).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return { score: 72, love: 75, communication: 70, trust: 68, strengths: '你们有良好的互补性，沟通顺畅。', weaknesses: '在处理冲突时需要多加注意。' };
      }
    }).catch(function() {
      return { score: 72, love: 75, communication: 70, trust: 68, strengths: '你们有良好的互补性，沟通顺畅。', weaknesses: '在处理冲突时需要多加注意。', whoBetter: '双方各有优势，主动权取决于具体情况', danger: '沟通不畅时容易冷战，积压矛盾。' };
    });
  },



  // ===================== FORTUNE SLIPS (100) =====================
  FORTUNE_SLIPS: [
    {level:'大吉',text:'春雷一震万物苏，枯木逢春吐新芽',interp:'运势如春雷般苏醒，之前停滞的事开始有了转机。',advice:'把握时机，主动出击'},
    {level:'大吉',text:'宝镜高悬照九州，光明璀璨入琼楼',interp:'心明眼亮，目标明确，前路清晰可见。',advice:'乘胜追击，莫失良机'},
    {level:'大吉',text:'龙腾四海展宏图，鹏程万里冲天途',interp:'有贵人相助，正是大展身手的时候。',advice:'勇往直前，勿犹豫'},
    {level:'大吉',text:'花开富贵满堂春，枝繁叶茂果自成',interp:'付出开始有回报，一切水到渠成。',advice:'继续耕耘，静待丰收'},
    {level:'大吉',text:'珠玉在侧映光辉，良缘天定自相随',interp:'有意外的好机缘，或遇命中贵人。',advice:'广结善缘，多向外走'},
    {level:'中吉',text:'行船走马三分命，顺风扬帆待此时',interp:'时机已到，但还差最后一步。',advice:'耐心等待，蓄势待发'},
    {level:'中吉',text:'山重水复疑无路，柳暗花明又一村',interp:'看似走进死胡同，转角有惊喜。',advice:'别放弃，再坚持一下'},
    {level:'中吉',text:'风吹云散见天日，枯木逢春再发芽',interp:'阴霾即将过去，曙光就在眼前。',advice:'咬牙挺过这一关'},
    {level:'中吉',text:'十年寒窗无人问，一朝成名天下知',interp:'积累已久的努力即将被看见。',advice:'继续沉淀，不要急'},
    {level:'中吉',text:'良辰美景奈何天，赏心乐事在眼前',interp:'眼前一切刚刚好，珍惜当下。',advice:'活在当下，享受过程'},
    {level:'中吉',text:'青灯黄卷伴书生，金榜题名会有时',interp:'学业或事业有进步，但还需努力。',advice:'加倍用功，莫松懈'},
    {level:'中吉',text:'风生水起运当兴，正是男儿立志时',interp:'整体运势上升，适合订立新目标。',advice:'抓住机遇，乘势而为'},
    {level:'中吉',text:'春雨润物细无声，花开时节又逢君',interp:'有悄然发生的好事，或偶遇故人。',advice:'留心身边的变化'},
    {level:'中吉',text:'孤帆远影碧空尽，唯见长江天际流',interp:'某个阶段即将结束，新篇章将开始。',advice:'放下过去，迎接新生'},
    {level:'中吉',text:'采得百花成蜜后，为谁辛苦为谁甜',interp:'付出很多但收获不归自己，需调整策略。',advice:'别只顾埋头干活'},
    {level:'小吉',text:'路遥知马力不足，日久见人心深浅',interp:'有人在考验你，也有人在观察你。',advice:'保持本色，不卑不亢'},
    {level:'小吉',text:'月有阴晴圆有缺，此事古难全',interp:'世间难有完美事，需接受不圆满。',advice:'放下执念，接受现实'},
    {level:'小吉',text:'风起于青萍之末，浪成于微澜之间',interp:'大变动前的小征兆，要见微知著。',advice:'留意细节信号'},
    {level:'小吉',text:'寒潭映月分外清，孤雁哀鸣两三声',interp:'表面平静，内里暗流涌动。',advice:'谨慎行事，防患未然'},
    {level:'小吉',text:'山雨欲来风满楼，黑云压城城欲摧',interp:'风暴将至，要有心理准备。',advice:'提前布局，以待时机'},
    {level:'小吉',text:'蝉噪林逾静，鸟鸣山更幽',interp:'喧闹中的寂静，反而更需警醒。',advice:'别被表面平静迷惑'},
    {level:'小吉',text:'年年岁岁花相似，岁岁年年人不同',interp:'事过境迁，人已非昨。',advice:'放下过去向前看'},
    {level:'小吉',text:'无可奈何花落去，似曾相识燕归来',interp:'失去的同时也有回归，循环往复。',advice:'随缘而行'},
    {level:'小吉',text:'夕阳无限好，只是近黄昏',interp:'美景将尽，且行且珍惜。',advice:'抓紧时间，莫负时光'},
    {level:'小吉',text:'纸上得来终觉浅，绝知此事要躬行',interp:'理论够了，缺的是实践。',advice:'走出舒适区，去做'},
    {level:'吉',text:'平步青云路坦荡，一帆风顺入明堂',interp:'眼前路比较顺，但别得意忘形。',advice:'稳扎稳打，保持清醒'},
    {level:'吉',text:'水深水浅东西涧，云去云来远近山',interp:'情况有些模糊，需要更多信息。',advice:'多观察，慎行动'},
    {level:'吉',text:'秤砣虽小压千斤，螺丝无悔锁乾坤',interp:'你小看了自己的影响力。',advice:'相信自己的价值'},
    {level:'吉',text:'莫愁前路无知己，天下谁人不识君',interp:'你的人脉即将发挥作用。',advice:'多联系老朋友'},
    {level:'吉',text:'两岸猿声啼不住，轻舟已过万重山',interp:'已经过了最难的坎，前路渐宽。',advice:'乘势继续前进'},
    {level:'吉',text:'问渠那得清如许，为有源头活水来',interp:'需要新来源才能保持活力。',advice:'开拓新渠道'},
    {level:'吉',text:'人生得意须尽欢，莫使金樽空对月',interp:'该放松时且放松，别太紧绷。',advice:'给自己放个假'},
    {level:'吉',text:'醉翁之意不在酒，山高水长在心头',interp:'你的真实意图别人未必理解。',advice:'想清楚再说出口'},
    {level:'吉',text:'桃花潭水深千尺，不及汪伦送我情',interp:'有人默默关心你，珍惜这份情。',advice:'回应那些在乎你的人'},
    {level:'中平',text:'风平浪静海面宽，前路漫漫待何时',interp:'表面平静，实则迷茫。',advice:'停下来想清楚方向'},
    {level:'中平',text:'水能载舟亦覆舟，谨慎驶得万年船',interp:'成也萧何败也萧何，小心驶得万年船。',advice:'凡事三思而后行'},
    {level:'中平',text:'机关算尽太聪明，反误了卿卿性命',interp:'想太多了，有时候简单直接更好。',advice:'少算计，多真诚'},
    {level:'中平',text:'山高路远步难行，水深流急舟难渡',interp:'阻碍很大，时机未到。',advice:'养精蓄锐，等待时机'},
    {level:'中平',text:'人心不足蛇吞象，贪心不足吃月亮',interp:'欲望太多，反而会失去更多。',advice:'知足常乐'},
    {level:'中平',text:'画龙画虎难画骨，知人知面不知心',interp:'人心难测，不要太相信表面。',advice:'多留个心眼'},
    {level:'中平',text:'树大招风风撼树，人为名高名丧人',interp:'太出头容易招麻烦，低调些。',advice:'收敛锋芒'},
    {level:'中平',text:'有心栽花花不开，无心插柳柳成荫',interp:'刻意追求的得不到，无意中的反而成。',advice:'放松心态，顺其自然'},
    {level:'中平',text:'山穷水尽疑无路，柳暗花明又一村',interp:'绝境中藏着转机。',advice:'别放弃最后一下'},
    {level:'中平',text:'长江后浪推前浪，浮世新人换旧人',interp:'新事物正在取代旧事物，适应变化。',advice:'与时俱进'},
    {level:'中平',text:'人面不知何处去，桃花依旧笑春风',interp:'有些人已经走了，但风景依旧。',advice:'向前看'},
    {level:'中平',text:'万事俱备只欠东风，纵里寻她千百度',interp:'什么都准备好了，就差一个契机。',advice:'主动制造机会'},
    {level:'中平',text:'屋漏偏逢连夜雨，船迟又遇打头风',interp:'祸不单行，要稳住。',advice:'咬牙撑住，别崩'},
    {level:'中平',text:'时运不济命途多舛，冯唐易老李广难封',interp:'时机不对，强求无益。',advice:'蛰伏等待'},
    {level:'下平',text:'冰冻三尺非一日之寒，水滴石穿非一日之功',interp:'问题积累已久，不可能一日解决。',advice:'有耐心，慢慢来'},
    {level:'下平',text:'明枪易躲暗箭难防，背后小人需提防',interp:'有人在暗中捣鬼，谨慎行事。',advice:'注意身边的人'},
    {level:'下平',text:'春宵一刻值千金，花有清香月有阴',interp:'时光短暂，不要浪费在无意义的事上。',advice:'珍惜时间'},
    {level:'下平',text:'青山遮不住，毕竟东流去',interp:'大势已去，逆天而行无意义。',advice:'审时度势'},
    {level:'下平',text:'抽刀断水水更流，举杯消愁愁更愁',interp:'用错误的方式解决问题，只会更糟。',advice:'停止内耗'},
    {level:'下平',text:'出师未捷身先死，长使英雄泪满襟',interp:'壮志未酬，但这就是人生。',advice:'总结经验，再来'},
    {level:'下平',text:'同行之间多嫉妒，木秀于林风必摧',interp:'你太优秀了，招人眼红。',advice:'低调行事'},
    {level:'下平',text:'运去黄金失色，时来铁也生光',interp:'运势低迷，但要相信会回来。',advice:'保存实力'},
    {level:'下平',text:'门前冷落车马稀，老大嫁作商人妇',interp:'繁华退去，回归平淡。',advice:'接受现实'},
    {level:'下平',text:'曾经沧海难为水，除却巫山不是云',interp:'见过了最好的，就难再满足。',advice:'放下过去'},
    {level:'下平',text:'夕阳西下几时回，无可奈何花落去',interp:'逝去的不会再回来。',advice:'珍惜眼前'},
    {level:'下下',text:'屋漏偏逢连夜雨，破船又遇打头风',interp:'屋漏偏遭连夜雨，极度不顺。',advice:'止损出局'},
    {level:'下下',text:'鱼跃龙门过不得，浅滩困住强龙手',interp:'实力不够，时机不到。',advice:'韬光养晦'},
    {level:'下下',text:'明珠暗投贾人腹，碧玉蒙尘在暗室',interp:'才华被埋没，没人看到你的价值。',advice:'主动展示自己'},
    {level:'下下',text:'斩蛇不成反被咬，赔了夫人又折兵',interp:'行动失败，损失惨重。',advice:'慎动，考虑清楚'},
    {level:'下下',text:'船漏又遇顶头风，祸不单行至今日',interp:'祸事连连，要高度警惕。',advice:'以退为进'},
    {level:'下下',text:'飞蛾扑火甘如饴，玉石俱焚悔已迟',interp:'明知危险还要往前冲，必遭祸患。',advice:'及时止损'},
    {level:'下下',text:'盲人骑瞎马，夜半临深渊',interp:'完全在盲目行动，危险之极。',advice:'立即停下'},
    {level:'下下',text:'一场欢喜忽悲辛，叹人世终难定',interp:'欢喜变悲辛，世事无常。',advice:'保持平常心'},
    {level:'下下',text:'时来运转总成空，梦里不知身是客',interp:'看似有机会，实则一场空。',advice:'不要抱幻想'},
    {level:'下下',text:'浮云蔽日终有散，繁华散尽是苍凉',interp:'好景不长，要为以后打算。',advice:'留有余地'},
    {level:'下下',text:'当局者迷旁观者清，固执己见恐招损',interp:'你陷进去了，听不进意见。',advice:'听听别人怎么说'},
    {level:'大吉',text:'凤鸣朝阳冲霄汉，龙腾盛世照乾坤',interp:'紫气东来，将有大事发生。',advice:'做好准备迎接机遇'},
    {level:'大吉',text:'三顾频繁天下计，两朝开济老臣心',interp:'有贵人三顾茅庐，或得老臣相助。',advice:'广结善缘'},
    {level:'大吉',text:'春风得意马蹄疾，一日看尽长安花',interp:'正是踌躇满志之时。',advice:'趁势而上'},
    {level:'大吉',text:'会当凌绝顶，一览众山小',interp:'站得高看得远，目标即将达成。',advice:'坚持到底'},
    {level:'大吉',text:'长风破浪会有时，直挂云帆济沧海',interp:'必有突破困境的那一天。',advice:'保持信心'},
    {level:'大吉',text:'千淘万漉虽辛苦，吹尽狂沙始到金',interinterp:'历经磨炼，终得真金。',advice:'咬牙坚持'},
    {level:'大吉',text:'桃花流水窅然去，别有天地非人间',interp:'别有洞天，将进入新境界。',advice:'拓展新方向'},
    {level:'中吉',text:'两句三年得，一吟双泪流',interp:'下了一番苦功，终得佳句。',advice:'继续精进'},
    {level:'中吉',text:'海阔凭鱼跃，天高任鸟飞',interp:'舞台很大，尽情施展。',advice:'放手去做'},
    {level:'中吉',text:'欲把西湖比西子，淡妆浓抹总相宜',interp:'恰到好处，一切刚刚好。',advice:'保持现状'},
    {level:'中吉',text:'明月松间照，清泉石上流',interp:'内心平静，万物皆美。',advice:'回归本心'},
    {level:'中吉',text:'大漠孤烟直，长河落日圆',interp:'孤独但坚定，这是你的路。',advice:'享受孤独'},
    {level:'中吉',text:'空山不见人，但闻人语响',interp:'表面空旷，实则有人支持。',advice:'不孤单'},
    {level:'中吉',text:'返景入深林，复照青苔上',interp:'光亮终究会照进来。',advice:'耐心等待'},
    {level:'小吉',text:'松下问童子，言师采药去',interp:'要找的人不在，但会有线索。',advice:'继续探寻'},
    {level:'小吉',text:'只在此山中，云深不知处',interp:'目标模糊，需要更细心寻找。',advice:'多下功夫'},
    {level:'小吉',text:'借问酒家何处有，牧童遥指杏花村',interp:'答案就在前方不远处。',advice:'再坚持一步'},
    {level:'小吉',text:'千里黄云白日曛，北风吹雁雪纷纷',interp:'前路艰难，但有人同行。',advice:'找同伴'},
    {level:'小吉',text:'莫愁前路无知己，天下谁人不识君',interp:'不必担心孤单，知音自会来。',advice:'真诚待人'},
    {level:'小吉',text:'林花谢了春红，太匆匆',interp:'美好总是短暂的。',advice:'珍惜当下'}
  ],

  // Pick a random slip
  pickRandomSlip: function() {
    var slips = API.FORTUNE_SLIPS;
    return slips[Math.floor(Math.random() * slips.length)];
  },

  drawFortune: function(question) {
    var currentDate = getDateStr();
    var slip = API.pickRandomSlip();
    var sys = '你是一位洞察世事的求签解签师。已求得签诗如下，请根据用户的问题进行解签。你的解签要有画面感、有情绪、有余韵，不是说了等于没说的废话。解签时要直接说出用户心里其实已经知道但不愿面对的事。用古雅的文言文风格，但意思要现代人能懂。当前日期：' + currentDate + '。';
    var user = '签诗：' + slip.text + '（' + slip.level + '）\n用户问题：' + (question || '无特定问题，求签问事') + '\n请解签，JSON格式：{interpretation:你这句签对用户意味着什么，100字以内，要直接扎心，不要套话; advice:用户现在最应该做的一件事，20字以内，要具体可操作}。只返回JSON。';
    return API.callLLM(sys, user, 400).then(function(text) {
      try {
        var parsed = JSON.parse(text);
        return {
          level: slip.level,
          text: slip.text,
          interpretation: parsed.interpretation || slip.interp,
          advice: parsed.advice || slip.advice,
          slipLevel: slip.level
        };
      } catch(e) {
        return { level: slip.level, text: slip.text, interpretation: slip.interp, advice: slip.advice, slipLevel: slip.level };
      }
    }).catch(function() {
      return { level: slip.level, text: slip.text, interpretation: slip.interp, advice: slip.advice, slipLevel: slip.level };
    });
  },  },

  // ===================== HELPERS =====================

  parseDate: function(dateStr) {
    if (typeof dateStr === 'string') {
      var parts = dateStr.split('-');
      return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
    }
    return { year: dateStr.getFullYear(), month: dateStr.getMonth() + 1, day: dateStr.getDate() };
  },

  parseTime: function(timeStr) {
    var parts = timeStr.split(':');
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  },

  cityLatitudes: {
    '北京': 39.9, '上海': 31.2, '广州': 23.1, '深圳': 22.5, '成都': 30.6,
    '杭州': 30.3, '南京': 32.0, '武汉': 30.6, '西安': 34.3, '重庆': 29.5,
    '天津': 39.1, '苏州': 31.3, '郑州': 34.7, '长沙': 28.2, '沈阳': 41.8,
    '青岛': 36.1, '济南': 36.6, '大连': 38.9, '厦门': 24.5, '福州': 26.1,
    '昆明': 25.0, '贵阳': 26.6, '南宁': 22.8, '海口': 20.0, '拉萨': 29.7,
    '乌鲁木齐': 43.8, '兰州': 36.1, '银川': 38.5, '西宁': 36.6, '呼和浩特': 40.8
  },

  getCityLat: function(city) {
    for (var key in this.cityLatitudes) {
      if (city.indexOf(key) !== -1) return this.cityLatitudes[key];
    }
    return 30;
  }
};
