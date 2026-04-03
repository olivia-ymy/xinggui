/**
 * API module
 * Handles all data fetching
 */

const API = {
  // For MVP, we use static data with some randomization
  // Later this will call Cloudflare Workers

  getHoroscope(zodiac, date) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const data = this.generateHoroscope(zodiac, date);
        resolve(data);
      }, 800);
    });
  },

  getNatalChart(birthDate, birthTime, birthCity) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = this.calculateNatalChart(birthDate, birthTime, birthCity);
        resolve(data);
      }, 1200);
    });
  },

  drawTarot(mode) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cards = this.selectTarotCards(mode);
        resolve(cards);
      }, 1000);
    });
  },

  getCompatibility(sign1, sign2) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = this.calculateCompatibility(sign1, sign2);
        resolve(data);
      }, 800);
    });
  },

  drawFortune(question) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = this.selectFortune(question);
        resolve(result);
      }, 600);
    });
  },

  // ===== Data generation methods =====

  generateHoroscope(zodiac, date) {
    const zodiacs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    const tips = [
      '今天适合大胆尝试新事物，木星会给你带来好运。',
      '注意沟通方式，今天容易产生误解。',
      '财务状况需要谨慎处理，避免冲动消费。',
      '人际关系带来惊喜，贵人运旺盛。',
      '工作上会有突破性进展，展现你的实力。',
      '今天适合反思和规划，不要急于行动。',
      '爱情方面有机会遇到心仪的人，敞开心扉。',
      '健康运不错，适合进行体育锻炼。'
    ];

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const score = rand(2, 5);
    const love = rand(60, 100);
    const career = rand(60, 100);
    const wealth = rand(60, 100);

    const colors = ['红色', '蓝色', '绿色', '紫色', '金色', '银色', '黑色', '白色'];
    const numbers = [3, 7, 9, 12, 18, 21, 24, 30];
    const directions = ['东方', '西方', '南方', '北方', '东南', '东北', '西南', '西北'];

    return {
      zodiac,
      date,
      score,
      love,
      career,
      wealth,
      luckyColor: colors[rand(0, colors.length - 1)],
      luckyNumber: numbers[rand(0, numbers.length - 1)],
      luckyDirection: directions[rand(0, directions.length - 1)],
      tip: tips[rand(0, tips.length - 1)]
    };
  },

  calculateNatalChart(birthDate, birthTime, birthCity) {
    const zodiacs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    const planets = ['太阳', '月亮', '水星', '金星', '火星', '木星', '土星'];

    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    return {
      sun: rand(zodiacs),
      moon: rand(zodiacs),
      rising: rand(zodiacs),
      houses: zodiacs.map(z => ({ sign: z, planet: rand(planets) })),
      aspects: [
        { planet1: '太阳', planet2: '月亮', type: '合相' },
        { planet1: '金星', planet2: '火星', type: '刑相位' },
        { planet1: '木星', planet2: '土星', type: '拱相位' }
      ]
    };
  },

  selectTarotCards(mode) {
    const majorArcana = [
      { name: '愚人', upright: '新的开始，自由自在，勇于冒险', reversed: '轻率鲁莽，缺乏责任感，犹豫不决' },
      { name: '魔术师', upright: '创造力，技能，意志力，Intent', reversed: '操控，欺骗，技能不足' },
      { name: '女祭司', upright: '直觉，神秘，智慧，内在知识', reversed: '隐藏的秘密，神秘事物，直觉迟钝' },
      { name: '女皇', upright: '丰饶，温柔，美丽，自然，母性', reversed: '依赖，停滞，空虚' },
      { name: '皇帝', upright: '权威，结构，控制，父亲般的影响力', reversed: '暴政，控制欲强，缺乏纪律' },
      { name: '教皇', upright: '精神指导，传统，信仰，道德', reversed: '叛逆，新方法，另类道路' },
      { name: '恋人', upright: '爱情，联盟，抉择，和谐', reversed: '失衡，不和，错误抉择' },
      { name: '战车', upright: '意志力，成功，控制，决心', reversed: '失控，冲动，缺乏方向' },
      { name: '力量', upright: '勇气，耐心，慈悲，内在力量', reversed: '自我怀疑，软弱，冲动' },
      { name: '隐士', upright: ' introspection，内省，寻找真理', reversed: '孤立，孤独，拒绝帮助' },
      { name: '命运之轮', upright: '转变， cycle，运气，命运', reversed: '挫折，延误，坏的运气' },
      { name: '正义', upright: '公平，因果， truth，法律', reversed: '不公正，缺乏责任感， dishonest' },
      { name: '吊人', upright: '暂停， sacrifice，等待， Pendulum', reversed: '拖延，无谓的牺牲，拒绝改变' },
      { name: '死神', upright: ' endings，转变，过渡', reversed: '抗拒改变，僵硬，恐慧' },
      { name: '节制', upright: '平衡， patience，目的，和平', reversed: '失衡，浪费，不和谐' },
      { name: '恶魔', upright: '束缚，诱惑，物质主义，黑暗', reversed: '释放， break free， regained humanity' },
      { name: '塔', upright: '突然变化，disclosure，觉醒', reversed: '害怕即将发生的变化，inner turmoil' },
      { name: '星星', upright: '希望， inspiration， serenity， faith', reversed: '缺乏信念，绝望，失落' },
      { name: '月亮', upright: ' illusion，恐惧，潜意识，秘密', reversed: '恐惧消退，发现 truth， inner guidance' },
      { name: '太阳', upright: ' joy，成功，活力， vitality', reversed: '暂时的快乐， lost of vitality， clouded joy' },
      { name: '审判', upright: ' rebirth， grace， inner calling', reversed: ' self-doubt， ignored calling， critical judgment' },
      { name: '世界', upright: '完成，integration，accomplishment，travel', reversed: ' lack of completion， stagnation， inner turmoil' }
    ];

    const count = mode === 'three' ? 3 : 1;
    const shuffled = [...majorArcana].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return selected.map(card => ({
      ...card,
      isReversed: Math.random() > 0.6,
      position: mode === 'three' ? ['过去', '现在', '未来'][selected.indexOf(card)] : '当前'
    }));
  },

  calculateCompatibility(sign1, sign2) {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Element-based compatibility base
    const elementScores = {
      '白羊座': { '狮子座': 90, '射手座': 85, '双子座': 70, '天秤座': 50 },
      '金牛座': { '摩羯座': 90, '处女座': 85, '巨蟹座': 75, '天蝎座': 70 },
      '双子座': { '天秤座': 85, '水瓶座': 90, '白羊座': 70, '射手座': 75 },
      '巨蟹座': { '天蝎座': 90, '双鱼座': 85, '金牛座': 75, '摩羯座': 60 },
      '狮子座': { '白羊座': 90, '射手座': 85, '双子座': 70, '水瓶座': 55 },
      '处女座': { '摩羯座': 90, '金牛座': 85, '巨蟹座': 75, '双鱼座': 65 },
      '天秤座': { '双子座': 85, '水瓶座': 90, '狮子座': 75, '白羊座': 60 },
      '天蝎座': { '巨蟹座': 90, '双鱼座': 85, '金牛座': 70, '水瓶座': 55 },
      '射手座': { '白羊座': 85, '狮子座': 85, '双子座': 75, '处女座': 60 },
      '摩羯座': { '金牛座': 90, '处女座': 90, '天蝎座': 75, '白羊座': 55 },
      '水瓶座': { '双子座': 90, '天秤座': 90, '射手座': 75, '金牛座': 60 },
      '双鱼座': { '巨蟹座': 90, '天蝎座': 85, '摩羯座': 70, '双子座': 55 }
    };

    const baseScore = elementScores[sign1]?.[sign2] || 65;
    const finalScore = Math.min(100, Math.max(40, baseScore + rand(-10, 10)));

    const love = rand(50, 100);
    const communication = rand(50, 100);
    const trust = rand(50, 100);

    const strengths = [
      `${sign1}和${sign2}在一起时，你们能够相互理解对方的内心需求。`,
      '你们之间存在一种天然的默契，常常不需要言语就能明白对方。',
      '两个星座的价值观相近，在生活中能够相互支持与鼓励。'
    ];

    const weaknesses = [
      '有时候你们会对同一件事有不同的期待，需要多加沟通。',
      `${sign1}的性格有时候会让${sign2}感到压力，需要互相包容。`,
      '在处理冲突时，你们的应对方式可能完全不同，需要学习对方的优点。'
    ];

    return {
      score: finalScore,
      love: Math.round((love + finalScore) / 2),
      communication: Math.round((communication + finalScore) / 2),
      trust: Math.round((trust + finalScore) / 2),
      strengths: strengths[rand(0, strengths.length - 1)],
      weaknesses: weaknesses[rand(0, weaknesses.length - 1)]
    };
  },

  selectFortune(question) {
    const fortunes = [
      { level: '大吉', text: '吉人自有天相，你的诚意已经传达。放下顾虑，勇往直前吧。', class: 'great-good' },
      { level: '上签', text: '努力终有回报，虽然过程有些曲折，但结果会令你满意。', class: 'good' },
      { level: '中签', text: '事情发展平稳，不要急于求成。静下心来，答案自会出现。', class: 'moderate' },
      { level: '下签', text: '目前运势低迷，建议暂缓重要决策。多做善事，积累福报。', class: 'bad' },
      { level: '大凶', text: '事态严峻，需要谨慎行事。但也不必过度担忧，这只是黎明前的黑暗。', class: 'great-bad' }
    ];

    // Weighted random - less extreme results more likely
    const weights = [1, 2, 3, 2, 1]; // 大吉, 上, 中, 下, 大凶
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const fortune = fortunes[selectedIndex];
    fortune.question = question;
    return fortune;
  }
};
