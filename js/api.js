/**
 * API with real astronomical calculations + LLM interpretation
 */

// Server-synced date to avoid client clock issues
var SERVER_DATE = null;
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
    var sys = '你是一位资深的紫微斗数和西洋占星命理师。你说话直接，不回避尖锐的结论。你解读命盘时，先说用户最核心的性格特征（不要只说优点，也要说缺点和盲点），再说事业/财富/感情的先天格局，最后给出最需要关注的一个问题或建议。用第二人称，150-200字，要有信息量，不要废话。当前日期：' + currentDate + '。';
    var user = '命主出生信息：' + birthDate + ' ' + birthTime + '，出生地 ' + birthCity + '。\n\n天文计算结果：\n- 太阳星座：' + sun.name + ' ' + sun.degree + '°\n- 月亮星座：' + moon.name + ' ' + moon.degree + '°\n- 上升星座：' + rising.name + ' ' + rising.degree + '°\n\n请输出一段命盘解读，JSON格式：personality(80字以内核心性格描述，要直接说优点也说缺点), career(60字以内事业/财富先天格局), love(60字以内感情先天格局), warning(一句话，说这个命盘最需要警惕或关注的一件事), advice(一句话，说现在最值得做的一件事)。全部字段都要填。';

    return API.callLLM(sys, user, 600).then(function(text) {
      try {
        var rich = JSON.parse(text);
        chartData.personality = rich.personality || '';
        chartData.career = rich.career || '';
        chartData.love = rich.love || '';
        chartData.warning = rich.warning || '';
        chartData.advice = rich.advice || '';
        chartData.interpretation = rich.personality || rich.career || rich.love || text.substring(0, 100);
      } catch(e) {
        chartData.interpretation = text.substring(0, 200);
      }
      return chartData;
    }).catch(function() {
      chartData.interpretation = '命盘解读获取失败，请稍后重试。';
      return chartData;
    });
  },

  drawTarot: function(mode) {
    var currentDate = getDateStr();
    var sys = '你是一位说话犀利的塔罗占卜师。你不回避坏消息，也不粉饰现实。你的解读要直指人心，让用户感受到牌卡在说他自己的故事。用第二人称，简洁有力。当前日期：' + currentDate + '。';
    var user = '请为用户抽取三张塔罗牌（过去、现在、未来），牌阵为圣三角。每张牌需要包含：name(牌名，大阿尔卡纳), position(过去/现在/未来), upright(正位含义，80字以内，要具体，不要套话), reversed(逆位含义，80字以内，要具体，不要套话), isReversed(true或false，约35%概率逆位)。输出JSON数组格式，共3项，只返回JSON，不要任何解释文字。';
    return API.callLLM(sys, user, 800).then(function(text) {
      try {
        var data = JSON.parse(text);
        return Array.isArray(data) ? data : [data];
      } catch(e) {
        return [
          { name: '命运之轮', position: '过去', upright: '过去的关键转折点已发生，命运之轮正在转动。', reversed: '时机未到，或错过了某个重要的转折机会。', isReversed: false },
          { name: '死神', position: '现在', upright: '某个阶段正在结束，抗拒没有意义，拥抱变化才能重生。', reversed: '你不愿放手的东西正在以更痛苦的方式迫使你放下。', isReversed: true },
          { name: '高塔', position: '未来', upright: '即将有冲击，但这是打破幻象、重建真实的机会。', reversed: '潜在的危机被拖延或掩盖，没有真正解决问题。', isReversed: false }
        ];
      }
    }).catch(function() {
      return [
        { name: '命运之轮', position: '过去', upright: '过去的关键转折点已发生，命运之轮正在转动。', reversed: '时机未到，或错过了某个重要的转折机会。', isReversed: false },
        { name: '死神', position: '现在', upright: '某个阶段正在结束，抗拒没有意义，拥抱变化才能重生。', reversed: '你不愿放手的东西正在以更痛苦的方式迫使你放下。', isReversed: true },
        { name: '高塔', position: '未来', upright: '即将有冲击，但这是打破幻象、重建真实的机会。', reversed: '潜在的危机被拖延或掩盖，没有真正解决问题。', isReversed: false }
      ];
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

  drawFortune: function(question) {
    var currentDate = getDateStr();
    var sys = '你是一位洞察世事的求签解签师。你的签诗要有画面感、有情绪、有余韵，不是那种说了等于没说的废话。解签时你要直接说出用户心里其实已经知道但不愿面对的事。用古雅的文言文风格，但意思要现代人能懂。当前日期：' + currentDate + '。';
    var user = question ? '用户心诚求签，问题：' + question + '。请输出一根签诗，JSON格式：level(大吉/中吉/小吉/吉/中平/下平/下下), text(两句古文签诗，每句7字，要有画面感，不要空洞), interpretation(40字以内的签解，说清楚这句签对提问者意味着什么，不要套话), advice(一件事的建议，20字以内，说用户现在最应该做的一件具体的事)。只返回JSON。' : '请赐一根签诗，JSON格式：level(大吉/中吉/小吉/吉/中平/下平/下下), text(两句古文签诗，每句7字，要有画面感，不要空洞), interpretation(40字以内的签解，说清楚这句签意味着什么，不要套话), advice(一件事的建议，20字以内，说用户现在最应该做的一件具体的事)。只返回JSON。';
    return API.callLLM(sys, user, 400).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return { level: '中吉', text: '事在人为，福由心造。静待时机，方有转机。', class: 'good' };
      }
    }).catch(function() {
      return { level: '中平', text: '山高路远，水深流急。事在人为，莫问归期。', interpretation: '事情比想象中复杂，不要急于求成，耐心等待时机。', advice: '停止内耗，专注眼前能做的事。', class: 'mid' };
    });
  },

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
