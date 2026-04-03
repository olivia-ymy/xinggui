/**
 * API - Calls Cloudflare Worker (MiniMax LLM) for real astrological content
 */

var API = {
  WORKER_URL: 'https://xinggui-chat.yangmingyi1998128.workers.dev/chat',

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
        temperature: 0.8
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

  getHoroscope: function(zodiac, date) {
    var sys = '你是一位专业星座运势分析师，用简洁专业的语气回复。';
    var user = zodiac + ' 今日运势分析，日期 ' + date + '。请以 JSON 格式返回，字段：score(3.0-5.0数字), love(0-100整数), career(0-100整数), wealth(0-100整数), luckyColor(颜色), luckyNumber(1-9整数), luckyDirection(方向), tip(一两句运势提示)。只返回 JSON，不要其他内容。';
    return API.callLLM(sys, user, 300).then(function(text) {
      try {
        var data = JSON.parse(text);
        return data;
      } catch(e) {
        // Fallback if JSON parse fails
        return {
          score: 4.0,
          love: 75,
          career: 70,
          wealth: 65,
          luckyColor: '紫色',
          luckyNumber: 7,
          luckyDirection: '东方',
          tip: '今日运势平稳，顺其自然。'
        };
      }
    });
  },

  getNatalChart: function(birthDate, birthTime, birthCity) {
    var sys = '你是一位专业紫微斗数命理师，根据出生信息进行命盘分析。用专业但易懂的语言回复。';
    var user = '请分析以下命盘信息：出生日期 ' + birthDate + ' ' + birthTime + '，出生地点 ' + birthCity + '。请以 JSON 格式返回，字段：sun(太阳星座), moon(月亮星座), rising(上升星座), houses(数组，每项有sign和planet字段，至少3项), aspects(数组，每项有planet1, type, planet2字段，至少2项)。只返回 JSON。';
    return API.callLLM(sys, user, 600).then(function(text) {
      try {
        var data = JSON.parse(text);
        return data;
      } catch(e) {
        return {
          sun: '天秤座',
          moon: '天蝎座',
          rising: '摩羯座',
          houses: [
            { sign: '第一宫', planet: '太阳' },
            { sign: '第二宫', planet: '月亮' },
            { sign: '第三宫', planet: '水星' }
          ],
          aspects: [
            { planet1: '太阳', type: '合', planet2: '月亮' },
            { planet1: '火星', type: '冲', planet2: '木星' }
          ]
        };
      }
    });
  },

  drawTarot: function(mode) {
    var sys = '你是一位专业塔罗占卜师，为用户抽牌并解读。请严谨、专业、简洁。';
    var user = '请为用户抽取三张塔罗牌（过去、现在、未来），每张需要包含：name(牌名), position(位置：过去/现在/未来), upright(正位含义), reversed(逆位含义), isReversed(true或false)。请以 JSON 数组格式返回，每项一个对象，共3项。只返回JSON。';
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

  getCompatibility: function(sign1, sign2) {
    var sys = '你是一位专业星座配对分析师，根据两个星座的性格特质分析配对结果。用专业简洁的语言回复。';
    var user = '请分析 ' + sign1 + ' 和 ' + sign2 + ' 的星座配对结果。请以 JSON 格式返回，字段：score(60-100整数总分), love(0-100爱情指数), communication(0-100沟通指数), trust(0-100信任指数), strengths(一两句话优势描述), weaknesses(一两句话注意事项)。只返回JSON。';
    return API.callLLM(sys, user, 400).then(function(text) {
      try {
        var data = JSON.parse(text);
        return data;
      } catch(e) {
        return {
          score: 72,
          love: 75,
          communication: 70,
          trust: 68,
          strengths: '你们有良好的互补性，沟通顺畅。',
          weaknesses: '在处理冲突时需要多加注意。'
        };
      }
    });
  },

  drawFortune: function(question) {
    var sys = '你是一位专业国学求签分析师，用户心诚求签，请根据用户的问题（如果有）给出签文解读。用词古雅、专业。';
    var user = question ? '用户求签，问题：' + question + '。请以 JSON 格式返回，字段：level(大吉/中吉/小吉/吉/中平/下平/下下), text(一到两句签文，古文风格), class(good或bad)。只返回 JSON。' : '请赐一根签诗，以 JSON 格式返回，字段：level(大吉/中吉/小吉/吉/中平/下平/下下), text(一到两句古文签诗), class(good或bad)。只返回 JSON。';
    return API.callLLM(sys, user, 300).then(function(text) {
      try {
        var data = JSON.parse(text);
        return data;
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
