/**
 * API - Mock data and utilities
 */

var API = {
  getHoroscope: function(zodiac, date) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        var scores = { '白羊座': 4.2, '金牛座': 3.8, '双子座': 4.5, '巨蟹座': 3.5, '狮子座': 4.8, '处女座': 3.9, '天秤座': 4.1, '天蝎座': 4.3, '射手座': 4.0, '摩羯座': 3.6, '水瓶座': 4.4, '双鱼座': 3.7 };
        var tips = {
          '白羊座': '今日行动力十足，但注意不要冲动行事。',
          '金牛座': '财运不错，适合处理财务问题。',
          '双子座': '沟通运佳，有利洽谈合作。',
          '巨蟹座': '家庭运上升，多陪伴家人。',
          '狮子座': '事业运势强劲，注意休息。',
          '处女座': '适合处理细节事务，注意健康。',
          '天秤座': '人际运上升，贵人相助。',
          '天蝎座': '感情运佳，魅力四射。',
          '射手座': '旅行运不错，出行顺利。',
          '摩羯座': '事业稳扎稳打，耐心等待。',
          '水瓶座': '创意十足，利创新项目。',
          '双鱼座': '直觉敏锐，适合反思规划。'
        };
        var colors = ['紫色', '金色', '蓝色', '绿色', '红色', '粉色', '银色', '白色'];
        var score = scores[zodiac] || 4.0;
        resolve({
          score: score,
          love: Math.min(5, Math.round(score * 10 - 5)),
          career: Math.min(5, Math.round(score * 10 - 3)),
          wealth: Math.min(5, Math.round(score * 10 - 4)),
          luckyColor: colors[zodiac.charCodeAt(0) % colors.length],
          luckyNumber: Math.floor(Math.random() * 9) + 1,
          luckyDirection: ['东方', '西方', '南方', '北方', '东南', '西南', '东北', '西北'][Math.floor(Math.random() * 8)],
          tip: tips[zodiac] || '今日运势平稳，顺其自然。'
        });
      }, 800);
    });
  },

  getNatalChart: function(date, time, city) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        var suns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
        var moons = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
        resolve({
          sun: suns[Math.floor(Math.random() * 12)],
          moon: moons[Math.floor(Math.random() * 12)],
          rising: suns[Math.floor(Math.random() * 12)],
          houses: [
            { sign: '第一宫', planet: '太阳' },
            { sign: '第二宫', planet: '月亮' },
            { sign: '第三宫', planet: '水星' }
          ],
          aspects: [
            { planet1: '太阳', type: '合', planet2: '月亮' },
            { planet1: '火星', type: '冲', planet2: '木星' }
          ]
        });
      }, 1200);
    });
  },

  drawTarot: function(mode) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        var cards = mode === 'three' ? 3 : 1;
        var results = [];
        var positions = ['过去', '现在', '未来'];
        var names = ['愚者', '魔术师', '女祭司', '女皇', '皇帝', '教皇', '恋人', '战车', '力量', '隐士', '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '塔', '星星', '月亮', '太阳', '审判', '世界'];
        for (var i = 0; i < cards; i++) {
          var idx = Math.floor(Math.random() * names.length);
          results.push({
            name: names[idx],
            position: mode === 'three' ? positions[i] : '单张',
            upright: '正面意义：代表新的开始、自由、可能性。',
            reversed: '逆位意义：代表延迟、犹豫、方向不明。',
            isReversed: Math.random() > 0.6
          });
        }
        resolve(results);
      }, 1000);
    });
  },

  getCompatibility: function(sign1, sign2) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        var score = Math.floor(Math.random() * 40) + 60;
        resolve({
          score: score,
          love: Math.floor(Math.random() * 30) + 70,
          communication: Math.floor(Math.random() * 30) + 60,
          trust: Math.floor(Math.random() * 30) + 55,
          strengths: '你们有良好的互补性，沟通顺畅，互相理解。',
          weaknesses: '在处理冲突时需要多加注意，避免固执己见。'
        });
      }, 800);
    });
  },

  drawFortune: function(question) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        var levels = ['大吉', '中吉', '小吉', '吉', '中平', '下平', '下下'];
        var texts = [
          '事在人为，福由心造。静待时机，方有转机。',
          '贵人相助，运势上扬。把握机会，事半功倍。',
          '平稳推进，守成为上。不宜冒险，稳中求进。',
          '运势平平，蓄势待发。多充实自己，等待时机。',
          '困中有机，危中有福。耐心等待，自有转机。'
        ];
        resolve({
          level: levels[Math.floor(Math.random() * levels.length)],
          text: texts[Math.floor(Math.random() * texts.length)],
          question: question || null,
          class: Math.random() > 0.5 ? 'good' : 'bad'
        });
      }, 1500);
    });
  }
};
