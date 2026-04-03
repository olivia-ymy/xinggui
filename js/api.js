/**
 * API with real astronomical calculations + LLM interpretation
 */

var API = {
  WORKER_URL: 'https://xinggui-chat.yangmingyi1998128.workers.dev/chat',

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
    var ctxStr = API.formatContext(ctx);

    var sys = '你是一位专业占星师，根据以下真实行星位置和相位数据，分析星座运势。回复要专业、有洞见、简洁。用第二人称。';
    var user = '请分析' + zodiac + '今日（' + date + '）运势，基于以下真实星象数据：\n' + ctxStr + '\n\n请以JSON格式返回，字段：score(3.0-5.0一位小数), love(0-100整数), career(0-100整数), wealth(0-100整数), luckyColor(颜色), luckyNumber(1-9整数), luckyDirection(方向), tip(一两句运势提示，中文，基于当日真实星象）。只返回JSON，不要其他内容。';

    return API.callLLM(sys, user, 300).then(function(text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch(e) {
        data = { score: 4.0, love: 75, career: 70, wealth: 65, luckyColor: '紫色', luckyNumber: 7, luckyDirection: '东方', tip: '今日星象平稳，顺势而为。' };
      }
      // Also cache the raw context for display
      data._context = ctx;
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e) {}
      return data;
    });
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

    var sys = '你是一位专业紫微斗数和西洋占星命理师，根据以下真实天文计算出的命盘数据，用专业但易懂的语言为用户解读。不要编造数据，只基于提供的数据分析。用第二人称。';
    var user = '命主出生信息：' + birthDate + ' ' + birthTime + '，出生地 ' + birthCity + '。\n\n天文计算结果：\n- 太阳星座：' + sun.name + ' ' + sun.degree + '°\n- 月亮星座：' + moon.name + ' ' + moon.degree + '°\n- 上升星座：' + rising.name + ' ' + rising.degree + '°\n\n请输出一段 100-150 字的命盘解读。';

    return API.callLLM(sys, user, 600).then(function(interpretation) {
      chartData.interpretation = interpretation;
      return chartData;
    }).catch(function() {
      chartData.interpretation = '命盘解读获取失败，请稍后重试。';
      return chartData;
    });
  },

  drawTarot: function(mode) {
    var sys = '你是一位专业塔罗占卜师。请严谨、专业、简洁，用第二人称。';
    var user = '请为用户抽取三张塔罗牌（过去、现在、未来），牌阵为圣三角。每张牌需要包含：name(牌名，大阿尔卡纳), position(过去/现在/未来), upright(正位含义一句话), reversed(逆位含义一句话), isReversed(true或false，约40%概率逆位)。请以JSON数组格式返回，共3项，只返回JSON。';
    return API.callLLM(sys, user, 800).then(function(text) {
      try {
        var data = JSON.parse(text);
        return Array.isArray(data) ? data : [data];
      } catch(e) {
        return [
          { name: '愚者', position: '过去', upright: '新的开始，可能性。', reversed: '犹豫，方向不明。', isReversed: false },
          { name: '魔术师', position: '现在', upright: '创造力，行动力。', reversed: '计划拖延。', isReversed: true },
          { name: '命运之轮', position: '未来', upright: '转机，好运将至。', reversed: '阻碍，不顺。', isReversed: false }
        ];
      }
    }).catch(function() {
      return [
        { name: '愚者', position: '过去', upright: '新的开始，可能性。', reversed: '犹豫，方向不明。', isReversed: false },
        { name: '魔术师', position: '现在', upright: '创造力，行动力。', reversed: '计划拖延。', isReversed: true },
        { name: '命运之轮', position: '未来', upright: '转机，好运将至。', reversed: '阻碍，不顺。', isReversed: false }
      ];
    });
  },

  getCompatibility: function(sign1, sign2) {
    var sys = '你是一位专业星座配对分析师，根据两个星座的性格特质分析配对结果。用专业简洁的语言回复。';
    var user = '请分析 ' + sign1 + ' 和 ' + sign2 + ' 的星座配对。请以JSON格式返回，字段：score(60-100整数总分), love(0-100整数), communication(0-100整数), trust(0-100整数), strengths(一两句话优势描述), weaknesses(一两句话注意事项)。只返回JSON。';
    return API.callLLM(sys, user, 400).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return { score: 72, love: 75, communication: 70, trust: 68, strengths: '你们有良好的互补性，沟通顺畅。', weaknesses: '在处理冲突时需要多加注意。' };
      }
    }).catch(function() {
      return { score: 72, love: 75, communication: 70, trust: 68, strengths: '你们有良好的互补性，沟通顺畅。', weaknesses: '在处理冲突时需要多加注意。' };
    });
  },

  drawFortune: function(question) {
    var sys = '你是一位专业国学求签分析师，用户心诚求签。请用古雅的文言文风格回复。';
    var user = question ? '用户求签，问题：' + question + '。请以JSON格式返回，字段：level(大吉/中吉/小吉/吉/中平/下平/下下), text(一到两句古文签诗), class(good或bad)。只返回JSON。' : '请赐一根签诗，以JSON格式返回，字段：level(大吉/中吉/小吉/吉/中平/下平/下下), text(一到两句古文签诗), class(good或bad)。只返回JSON。';
    return API.callLLM(sys, user, 300).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return { level: '中吉', text: '事在人为，福由心造。静待时机，方有转机。', class: 'good' };
      }
    }).catch(function() {
      return { level: '中吉', text: '事在人为，福由心造。静待时机，方有转机。', class: 'good' };
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
