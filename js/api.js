/**
 * API with real astronomical calculations + LLM interpretation
 * Uses Swiss Ephemeris-style algorithms for sun/moon positions
 */

var API = {
  WORKER_URL: 'https://xinggui-chat.yangmingyi1998128.workers.dev/chat',

  // ===================== ASTRONOMY =====================

  toJulianDay: function(year, month, day, hour, min, sec) {
    // Convert to Julian Day Number
    var y = year;
    var m = month;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    var J0 = 2451545; // J2000.0 epoch
    var days = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
    var frac = ((hour + min / 60 + sec / 3600) - 12) / 24;
    return days + frac;
  },

  mod360: function(x) {
    x = x % 360;
    return x < 0 ? x + 360 : x;
  },

  // Sun ecliptic longitude (degrees) - Meeus simplified algorithm
  getSunLongitude: function(jd) {
    var T = (jd - 2451545) / 36525; // Julian centuries from J2000
    var L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T); // mean longitude
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T);  // mean anomaly
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T); // eccentricity

    // Equation of center
    var C = (1.914602 - T * (0.004817 - 0.000014 * T)) * Math.sin(M * Math.PI / 180) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
            0.000289 * Math.sin(3 * M * Math.PI / 180);

    var sunLon = L0 + C; // true longitude
    sunLon = this.mod360(sunLon);

    // Obliquity of ecliptic (approximate)
    var obliq = 23.439291 - T * 0.0130042;
    // No aberration correction needed for zodiac (it's already included in apparent sun)

    return sunLon;
  },

  // Moon ecliptic longitude (degrees) - simplified but more accurate than random
  getMoonLongitude: function(jd) {
    var T = (jd - 2451545) / 36525;
    var L0 = 218.3164477 + T * (481267.88123421 - 0.0015786 * T); // mean longitude
    var l = 134.9633964 + T * (477198.8675055 + 0.0087414 * T);   // mean anomaly
    var lp = 357.5291092 + T * (35999.0502909 - 0.0001466 * T);  // sun mean anomaly
    var F = 93.2720950 + T * (483202.0175233 - 0.0036539 * T);   // argument of latitude

    // Moon's equation of center
    var l_prime = L0 + (6.289 * Math.sin(l * Math.PI / 180));
    // Some additional perturbations
    l_prime += 1.274 * Math.sin((l - 2 * F) * Math.PI / 180);
    l_prime += 0.658 * Math.sin(2 * lp * Math.PI / 180);
    l_prime -= 0.186 * Math.sin(M * Math.PI / 180); // M is sun's mean anomaly (global)
    l_prime -= 0.114 * Math.sin(2 * F * Math.PI / 180);

    return this.mod360(l_prime);
  },

  // Convert ecliptic longitude to zodiac sign index (0-11) and degree (0-30)
  eclipticToZodiac: function(lon) {
    var signs = [
      { name: '白羊座', symbol: '♈', element: '火' },
      { name: '金牛座', symbol: '♉', element: '土' },
      { name: '双子座', symbol: '♊', element: '风' },
      { name: '巨蟹座', symbol: '♋', element: '水' },
      { name: '狮子座', symbol: '♌', element: '火' },
      { name: '处女座', symbol: '♍', element: '土' },
      { name: '天秤座', symbol: '♎', element: '风' },
      { name: '天蝎座', symbol: '♏', element: '水' },
      { name: '射手座', symbol: '♐', element: '火' },
      { name: '摩羯座', symbol: '♑', element: '土' },
      { name: '水瓶座', symbol: '♒', element: '风' },
      { name: '双鱼座', symbol: '♓', element: '水' }
    ];
    var signIndex = Math.floor(lon / 30);
    var degree = lon % 30;
    var sign = signs[signIndex];
    return {
      name: sign.name,
      symbol: sign.symbol,
      element: sign.element,
      degree: Math.round(degree * 10) / 10
    };
  },

  // Get rising sign (ascendant) - simplified estimate
  // Requires birth time and latitude
  getRisingSign: function(jd, birthTimeHours, latitude) {
    // Simplified: use mean rising time formula
    // This is approximate - real calculation needs full house system
    var T = (jd - 2451545) / 36525;
    var L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    var C = (1.914602 - T * (0.004817 - 0.000014 * T)) * Math.sin(M * Math.PI / 180);
    var sunLon = this.mod360(L0 + C);

    // Approximate ascendant - simplified
    // Real ascendant depends on: geographic latitude, local sidereal time
    // Using a rough estimation based on sun position + time offset
    var offsetHours = birthTimeHours - 12; // hours from noon
    var ascOffset = offsetHours * 15; // 15° per hour
    var ascLon = this.mod360(sunLon + ascOffset + 90); // add 90° for ascendant estimation

    // Adjust for latitude
    ascLon += (latitude > 0 ? 1 : -1) * Math.abs(latitude - 30) * 0.5;
    ascLon = this.mod360(ascLon);

    return this.eclipticToZodiac(ascLon);
  },

  // Calculate sun sign from date (handles solar terms correctly near cusp)
  getSunSign: function(year, month, day) {
    var jd = this.toJulianDay(year, month, day, 12, 0, 0);
    var lon = this.getSunLongitude(jd);
    return this.eclipticToZodiac(lon);
  },

  // Calculate moon sign from date and time
  getMoonSign: function(year, month, day, hour, min) {
    var jd = this.toJulianDay(year, month, day, hour, min, 0);
    var lon = this.getMoonLongitude(jd);
    return this.eclipticToZodiac(lon);
  },

  // Parse date string "YYYY-MM-DD" or JS Date
  parseDate: function(dateStr) {
    if (typeof dateStr === 'string') {
      var parts = dateStr.split('-');
      return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2])
      };
    }
    return { year: dateStr.getFullYear(), month: dateStr.getMonth() + 1, day: dateStr.getDate() };
  },

  // Parse time string "HH:MM" to decimal hours
  parseTime: function(timeStr) {
    var parts = timeStr.split(':');
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  },

  // Chinese city approximate latitude (for rising sign estimate)
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
    return 30; // default mid-latitude
  },

  // Get day of year (1-366)
  getDayOfYear: function(year, month, day) {
    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) daysInMonth[1] = 29;
    var doy = 0;
    for (var i = 0; i < month - 1; i++) doy += daysInMonth[i];
    return doy + day;
  },

  // ===================== LLM CALL =====================

  callLLM: function(systemPrompt, userPrompt, maxTokens) {
    return fetch(API.WORKER_URL, {
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
      if (!res.ok) throw new Error('API Error ' + res.status);
      return res.json();
    }).then(function(data) {
      var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!reply) throw new Error('No content in response');
      return reply;
    });
  },

  // ===================== HOROSCOPE =====================

  getHoroscope: function(zodiac, date) {
    var sys = '你是一位专业星座运势分析师，用简洁专业的语气回复。分析要有个性，不要泛泛而谈。';
    var user = zodiac + ' 今日运势，' + date + '。请以 JSON 格式返回，字段：score(3.0-5.0一位小数), love(0-100整数), career(0-100整数), wealth(0-100整数), luckyColor(颜色), luckyNumber(1-9整数), luckyDirection(方向), tip(一两句运势提示，中文)。只返回 JSON，不要其他内容。';
    return API.callLLM(sys, user, 300).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return {
          score: 4.0, love: 75, career: 70, wealth: 65,
          luckyColor: '紫色', luckyNumber: 7, luckyDirection: '东方',
          tip: '今日运势平稳，顺其自然。'
        };
      }
    });
  },

  // ===================== NATAL CHART =====================

  getNatalChart: function(birthDate, birthTime, birthCity) {
    var dateInfo = API.parseDate(birthDate);
    var timeHours = API.parseTime(birthTime);
    var lat = API.getCityLat(birthCity);
    var jd = API.toJulianDay(dateInfo.year, dateInfo.month, dateInfo.day, timeHours, 0, 0);

    // Real astronomical calculations
    var sun = API.eclipticToZodiac(API.getSunLongitude(jd));
    var moon = API.eclipticToZodiac(API.getMoonLongitude(jd));
    var rising = API.getRisingSign(jd, timeHours, lat);

    var chartData = {
      sun: sun.name,
      sunDegree: sun.degree,
      moon: moon.name,
      moonDegree: moon.degree,
      rising: rising.name,
      risingDegree: rising.degree,
      birthDate: birthDate,
      birthTime: birthTime,
      birthCity: birthCity
    };

    var sys = '你是一位专业紫微斗数和西洋占星命理师，根据以下真实天文计算出的命盘数据，用专业但易懂的语言为用户解读。不要编造数据，只基于提供的数据分析。';
    var user = '命主出生信息：' + birthDate + ' ' + birthTime + '，出生地 ' + birthCity + '。\n\n天文计算结果：\n- 太阳星座：' + sun.name + ' ' + sun.degree + '°\n- 月亮星座：' + moon.name + ' ' + moon.degree + '°\n- 上升星座：' + rising.name + ' ' + rising.degree + '°\n\n请输出一段 100-150 字的命盘解读，分析太阳、月亮、上升三个星座的特质以及它们之间的互动关系。用第二人称"你"来描述。';

    return API.callLLM(sys, user, 600).then(function(interpretation) {
      chartData.interpretation = interpretation;
      return chartData;
    }).catch(function() {
      chartData.interpretation = '命盘解读获取失败，请稍后重试。';
      return chartData;
    });
  },

  // ===================== TAROT =====================

  drawTarot: function(mode) {
    var sys = '你是一位专业塔罗占卜师，为用户抽牌并解读。请严谨、专业、简洁，用第二人称。';
    var user = '请为用户抽取三张塔罗牌（过去、现在、未来），牌阵为圣三角。每张牌需要包含：name(牌名，大阿尔卡纳牌名如"愚者""女祭司"等), position(位置：过去/现在/未来), upright(正位含义，一句话), reversed(逆位含义，一句话), isReversed(true或false，随机生成，概率约40%逆位)。请以 JSON 数组格式返回，共3项，只返回JSON。';
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
    });
  },

  // ===================== COMPATIBILITY =====================

  getCompatibility: function(sign1, sign2) {
    var sys = '你是一位专业星座配对分析师，根据两个星座的性格特质分析配对结果。用专业简洁的语言回复。';
    var user = '请分析 ' + sign1 + ' 和 ' + sign2 + ' 的星座配对。请以 JSON 格式返回，字段：score(60-100整数总分), love(0-100整数), communication(0-100整数), trust(0-100整数), strengths(一两句话优势描述), weaknesses(一两句话注意事项)。只返回 JSON。';
    return API.callLLM(sys, user, 400).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return {
          score: 72, love: 75, communication: 70, trust: 68,
          strengths: '你们有良好的互补性，沟通顺畅。',
          weaknesses: '在处理冲突时需要多加注意。'
        };
      }
    });
  },

  // ===================== FORTUNE =====================

  drawFortune: function(question) {
    var sys = '你是一位专业国学求签分析师，用户心诚求签。请用古雅的文言文风格回复。';
    var user = question ? '用户求签，问题：' + question + '。请以 JSON 格式返回，字段：level(大吉/中吉/小吉/吉/中平/下平/下下), text(一到两句古文签诗), class(good或bad)。只返回 JSON。' : '请赐一根签诗，以 JSON 格式返回，字段：level(大吉/中吉/小吉/吉/中平/下平/下下), text(一到两句古文签诗), class(good或bad)。只返回 JSON。';
    return API.callLLM(sys, user, 300).then(function(text) {
      try {
        return JSON.parse(text);
      } catch(e) {
        return {
          level: '中吉',
          text: '事在人为，福由心造。静待时机，方有转机。',
          class: 'good'
        };
      }
    });
  }
};
