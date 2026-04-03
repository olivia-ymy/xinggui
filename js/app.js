/**
 * Minimal app.js - diagnostic version
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
    this.routes = { '/': this.renderHome.bind(this) };
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    console.log('Router initialized');
  }
  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    console.log('Route changed:', hash);
    const route = this.routes[hash];
    if (route) route();
  }
  renderHome() {
    console.log('renderHome called');
    const app = document.getElementById('app');
    if (!app) { console.error('app element not found'); return; }
    app.innerHTML = '<div style="padding:40px;color:#8b5cf6;text-align:center;"><h1>星轨 XingGui</h1><p>加载成功！</p><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px;">' + ZODIACS.map(z => '<div style="padding:10px 16px;background:rgba(139,92,246,0.2);border-radius:8px;">' + z.icon + ' ' + z.name + '</div>').join('') + '</div></div>';
    console.log('Home rendered, ZODIACS count:', ZODIACS.length);
  }
}

// Init
console.log('app.js starting...');
const router = new Router();
console.log('app.js loaded');
