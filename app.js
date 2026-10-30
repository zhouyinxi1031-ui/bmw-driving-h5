import { STATIONS, COURSES, getCourse, getStation, getSessions, money, STATUS } from './data.js';
import { readState, saveState, createInitialState, maskPhone, escapeHtml as esc, validateRegistration, createOrder, transitionOrder } from './model.js';
import { initMotion, mountMotion, playIntro, toggleMotion } from './motion.js?v=20261030-r2';

const app = document.querySelector('#app');
let state = readState();
const ui = { stationFilter: 'all', courseFilter: 'all', drafts: {}, selectedSessions: {}, toastTimer: null, scrollPositions:{}, lastRoute:null, restoreNext:false };
const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6', back: 'm14 6-6 6 6 6', chevron: 'm9 6 6 6-6 6', down: 'm6 9 6 6 6-6',
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  calendar: 'M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 9h1m3 0h1m3 0h1m-9 3h1m3 0h1',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  support: 'M4 13v-3a8 8 0 0 1 16 0v3M4 11H2v7h4v-7ZM20 11h2v7h-4v-7Zm0 7a4 4 0 0 1-4 4h-3',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  file: 'M14 2H5v20h14V7Zm0 0v6h5M8 12h8m-8 4h6',
  wallet: 'M3 6h17v15H3V6Zm0 0V4l14-2v4m3 5h-6v5h6m-3-2.5h.01',
  share: 'M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7',
  shield: 'm12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5Zm-4 9 3 3 5-6',
  copy: 'M8 8h13v13H8ZM16 8V3H3v13h5',
  phone: 'm7 3 3 5-3 3a14 14 0 0 0 6 6l3-3 5 3-2 4C10 23 1 14 3 5Z',
  mail: 'M3 5h18v14H3Zm0 0 9 8 9-8',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  star: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',
  flag: 'M5 22V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0',
  car: 'm4 10 2-6h12l2 6M3 10h18v8H3Zm2 8v3m14-3v3M6 14h2m8 0h2',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.arrow}"/></svg>`;
const mMark = () => '<img class="m-mark" src="assets/bmw-m-mark.svg" alt="BMW M" />';
const brand = () => `<a class="brand" href="#/" aria-label="BMW 精英驾驶首页"><img class="roundel" src="assets/bmw-roundel.svg" alt="BMW" /><span class="brand-divider"></span>${mMark()}<span class="brand-name">BMW 精英驾驶培训<small>BMW DRIVING EXPERIENCE</small></span></a>`;
const track = s => s.trackImage ? `<span class="track-outline" role="img" aria-label="${s.venue}，${s.trackLayout}" title="${s.trackLayout}"><span class="track-map-shape" style="--track-map:url('${s.trackImage}?v=20261030-r2')"></span></span>` : `<span class="track-outline track-pending" role="img" aria-label="冰雪驾驶场地尚待公布"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M24 5v38M7.5 14.5l33 19M7.5 33.5l33-19M18 9l6 6 6-6M18 39l6-6 6 6M8 22l8-2-2-8M40 26l-8 2 2 8M8 26l8 2-2 8M40 22l-8-2 2-8"/></svg><small>场地待公布</small></span>`;
const circuitReference = s => !s.trackImage ? '' : `<details class="circuit-reference"><summary><span>${icon('flag')}真实赛道布局<small>${s.trackLayout}</small></span>${icon('down')}</summary><div class="circuit-map-expanded">${track(s)}<p>按场馆公开完整布局展示。具体培训使用全长、短版或局部训练区域，以活动安排为准。</p><a class="text-link" href="${s.trackSource}" target="_blank" rel="noopener noreferrer">${s.trackSourceName}${icon('arrow')}</a>${s.trackCredit?'<small class="circuit-credit">轮廓改编自 <a href="https://commons.wikimedia.org/wiki/File:Shanghai_International_Racing_Circuit_track_map.svg" target="_blank" rel="noopener noreferrer">Will Pittenger</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a></small>':''}</div></details>`;
const href = path => `#${path}`;
const link = (path, text, cls = 'primary-button') => `<a class="${cls}" href="${href(path)}">${text}${icon('arrow')}</a>`;
const button = (action, text, cls = 'primary-button', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}>${text}${icon('arrow')}</button>`;
const sectionHead = (en, title, extra = '') => `<div class="section-heading"><div><span class="eyebrow">${en}</span><h2>${title}</h2></div>${extra}</div>`;
const header = (title, back = '/', overlay = false) => `<header class="app-header ${overlay ? 'overlay-header' : ''}"><a class="icon-button" href="${href(back)}" data-action="restore-scroll" aria-label="返回">${icon('back')}</a><span>${title}</span><a class="icon-button" href="#/support" aria-label="联系客服">${icon('support')}</a></header>`;
const pageIntro = (en, title, description = '') => `<div class="page-intro"><span class="eyebrow">${en}</span><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>`;
const steps = active => `<div class="steps" aria-label="报名进度">${['登记信息', '合同签署', '确认付款'].map((s, i) => `<div class="step ${i + 1 === active ? 'active' : i + 1 < active ? 'done' : ''}"><span>${i + 1 < active ? icon('check') : '0' + (i + 1)}</span><b>${s}</b></div>`).join('')}</div>`;
const infoRow = (key, value, cls = '') => `<div class="info-row ${cls}"><span>${key}</span><strong>${value}</strong></div>`;
const previewNote = () => '<p class="preview-note">2027 体验预览 · 排期、名额与价格为演示数据</p>';
const getOrder = id => state.orders.find(o => o.id === id);
const orderDestination = o => o.status === 'waiting_sign' ? `${o.forOther ? '/invite/' : '/sign/'}${o.id}` : o.status === 'waiting_pay' ? `/payment/${o.id}` : `/order/${o.id}`;
const empty = (title, text, path = '/schedule', cta = '探索课程') => `<div class="empty-state">${icon('flag')}<h2>${title}</h2><p>${text}</p>${link(path, cta, 'outline-button')}</div>`;

const driveModes = {
  circuit: { index:'01', en:'CIRCUIT', title:'找准每一个弯心。', description:'从走线到制动，在专业赛道感受精准驾控。', image:'assets/course-track.jpg', car:'BMW M2 CS / M3 Touring / M4', detail:'2 天 · 专业赛道驾控', path:'/course/circuit-tianjin' },
  drift: { index:'02', en:'DRIFT', title:'掌控，发生在临界点。', description:'读懂重心，感受后驱，与每一次侧滑默契配合。', image:'assets/course-drift.jpg', car:'BMW M3 / M4', detail:'2 天 · 漂移定制体验', path:'/course/drift-tianjin' },
  ice: { index:'03', en:'ICE', title:'在冰雪间，找到从容。', description:'探索低附着力路面的驾驶乐趣，期待冬日相见。', image:'assets/ice-driving.jpg', car:'冰雪课程与体验车型待公布', detail:'冬季 · 敬请期待', path:'/station/ice' },
};
function driveModePanel(mode='circuit') {
  const d=driveModes[mode]||driveModes.circuit;
  return `<div class="drive-visual"><img src="${d.image}" alt="${d.en} BMW M 驾驶体验" loading="lazy"/><span class="drive-mode-no">${d.index}<small>/ 03</small></span><span class="drive-mode-word">${d.en}</span>${mMark()}</div><div class="drive-panel-body"><div class="drive-panel-meta"><span>${d.detail}</span><span>2027 SEASON</span></div><h3>${d.title}</h3><p>${d.description}</p><div class="drive-panel-car">${icon('car')}<span>${d.car}</span></div>${link(d.path,mode==='ice'?'了解冰雪体验':'探索这项课程','drive-panel-link')}</div>`;
}
function driveSelector() {
  return `<section class="content-section drive-selector">${sectionHead('FIND YOUR M', '你的热爱，哪一种姿态？')}<div class="drive-mode-tabs" role="tablist" aria-label="驾驶体验类型">${[['circuit','赛道驾控'],['drift','漂移体验'],['ice','冰雪驾趣']].map(([key,label],i)=>`<button id="drive-tab-${key}" role="tab" data-action="drive-mode" data-value="${key}" aria-selected="${i===0}" tabindex="${i===0?'0':'-1'}" aria-controls="drive-mode-panel"><span>0${i+1}</span>${label}</button>`).join('')}</div><div id="drive-mode-panel" role="tabpanel" aria-labelledby="drive-tab-circuit">${driveModePanel()}</div></section>`;
}

function courseCard(c, compact = false) {
  return `<a class="course-card ${compact ? 'compact' : ''}" href="#/course/${c.id}"><div class="course-photo"><img src="${c.image}" alt="${c.type === 'drift' ? '蓝色 BMW M3 在赛道漂移' : '青色 BMW M4 驶过赛道'}" loading="lazy" /><span class="photo-tag">${c.tag}</span><span class="photo-corner">${mMark()}</span></div><div class="course-card-body"><span class="eyebrow">${c.en}</span><h3>${c.name}</h3><p>${c.intro}</p><div class="course-meta"><span>${icon('clock')}${c.duration}</span><span>${icon('pin')}${c.station}</span><span>${icon('car')}M 家族车型</span></div><div class="course-price"><div><span class="currency">¥</span><strong>${money(c.price)}</strong><small>/ 人 / 期</small></div><span class="circle-arrow">${icon('arrow')}</span></div></div></a>`;
}

function stationCard(s) {
  return `<a class="station-card ${s.status === 'soon' ? 'is-soon' : ''}" href="#/station/${s.id}"><div class="station-topline"><span class="eyebrow">ROUND ${s.no} / ${s.month}</span><span class="availability ${s.status === 'soon' ? 'muted' : ''}">${s.status === 'soon' ? '即将揭晓' : '<i></i>开放报名'}</span></div><div class="station-card-center"><div><h3>${s.name}</h3><span>${s.en}</span></div>${track(s)}</div><div class="station-card-bottom"><div><p>${icon('calendar')}${s.dates}</p><p>${icon('pin')}${s.venue}</p></div>${icon('arrow')}</div></a>`;
}

function renderHome() {
  return `<section class="home-hero"><img class="hero-photo" src="assets/hero-track.jpg" alt="BMW M 车队集结赛道" fetchpriority="high" /><div class="hero-shade"></div><header class="home-header">${brand()}<span class="season-label">2027<small>SEASON</small></span></header><div class="hero-edition" aria-hidden="true"><span>01 / FEEL THE M</span><span class="edition-rule"></span></div><div class="hero-content"><span class="eyebrow light"><i class="m-slashes" aria-hidden="true"><i></i><i></i><i></i></i> THIS IS YOUR MOMENT.</span><h1>把热爱<br />驶上赛道<span class="blue-dot">.</span></h1><p>2027 BMW 精英驾驶培训<span>纯粹驾趣，由你掌控。</span></p>${link('/schedule', '开启驾驭之旅')}<div class="hero-bottom"><button data-action="replay-intro" class="intro-replay"><span class="play-mini" aria-hidden="true"></span>播放 M 启动序章</button><span>SCROLL TO EXPLORE ${icon('down')}</span></div></div><span class="hero-side-label">PRECISION. PASSION. PERFORMANCE.</span></section><div class="experience-strip"><span>BMW M</span><span>赛车基因，驾驶本能。</span><i class="m-slashes" aria-hidden="true"><i></i><i></i><i></i></i></div>${driveSelector()}<section class="content-section calendar-preview">${sectionHead('2027 SEASON CALENDAR', '下一站，由你决定。', '<a class="text-link" href="#/schedule">全部排期'+icon('arrow')+'</a>')}<div class="home-stations" aria-label="左右滑动查看活动站点">${STATIONS.map(stationCard).join('')}</div><div class="calendar-rail-footer"><span>左右滑动，探索四站驾趣</span><span aria-hidden="true">01 — 04 ${icon('arrow')}</span></div></section><section class="content-section selected-courses">${sectionHead('THE NEXT LEVEL', '进阶，从此刻开始。')}<div class="course-list">${[getCourse('circuit-tianjin'), getCourse('drift-tianjin')].map(c => courseCard(c)).join('')}</div></section><section class="m-heritage"><img src="assets/m3-e30-heritage.jpg" alt="红色第一代 BMW M3 E30 经典车型" loading="lazy"/><div class="heritage-caption"><span class="eyebrow">THE ORIGINAL SPIRIT.</span><h2>热爱，从来一脉相承。</h2><p>从经典 M3 E30，到你即将驶入的赛道。<br/>时代向前，驾驶的热爱始终如一。</p><button data-action="replay-intro" class="text-link">重温 M 启动序章<span class="play-mini" aria-hidden="true"></span></button><small>经典车型为品牌传承展示，非本期课程用车。</small></div></section><section class="brand-statement"><img src="assets/fleet-track.jpg" alt="BMW M 赛道车队" loading="lazy" /><div>${mMark()}<h2>每一次出发，<br />更接近驾驶的本能。</h2><p>BEYOND THE ORDINARY.</p>${link('/support', '与我们联系', 'text-link')}</div></section>${previewNote()}<div class="page-bottom-space"></div>`;
}

function renderSchedule() {
  const stations = STATIONS.filter(s => ui.stationFilter === 'all' || (ui.stationFilter === 'ice' ? s.id === 'ice' : s.id !== 'ice'));
  return `${header('活动排期')}${pageIntro('2027 SEASON CALENDAR', '驾趣，<br />即将发生。', '从专业赛道到冰雪天地，找到属于你的驾驶时刻。')}<div class="filter-tabs">${[['all','全部站点'],['track','赛道体验'],['ice','冰雪体验']].map(([v,l])=>`<button data-action="station-filter" data-value="${v}" class="${ui.stationFilter===v?'active':''}">${l}</button>`).join('')}</div><div class="content-section schedule-list">${stations.map(stationCard).join('')}</div><div class="season-caption"><b>2027</b><span>THE ROAD IS YOURS.<br />每一站，都是全新挑战。</span></div>${previewNote()}`;
}

function renderStation(id) {
  const s = getStation(id);
  return `${header(s.name, '/schedule', true)}
    <div class="station-hero"><img src="assets/${s.id === 'ice' ? 'ice-driving.jpg' : 'header-track.jpg'}" alt="${s.id === 'ice' ? 'BMW M 冰雪驾驶体验' : 'BMW M 赛道车队'}" /><div class="image-shade"></div><div><span class="eyebrow">ROUND ${s.no} / 2027</span><h1>${s.name}</h1><p>${s.en}</p></div>${track(s)}</div>
    <div class="station-facts"><span>${icon('calendar')}${s.dates}</span><span>${icon('pin')}${s.venue}</span>${circuitReference(s)}</div>
    <section class="content-section">${sectionHead(s.id === 'ice' ? 'WINTER IS CALLING' : 'CHOOSE YOUR EXPERIENCE', s.id === 'ice' ? '冰雪之间，尽情释放。' : '选择你的驾驭方式。')}<p class="section-description">${s.desc}</p>${s.id === 'ice' ? `<div class="winter-note"><span class="eyebrow">COMING THIS WINTER</span><h3>冬日驾趣，蓄势待发。</h3><p>冰雪课程及具体档期将陆续揭晓。<br />先从一场赛道体验，开启你的驾驶旅程。</p>${link('/courses', '探索赛道课程', 'outline-button')}</div>` : `<div class="course-list">${COURSES.filter(c => c.stationId === id).map(c => courseCard(c)).join('')}</div>`}</section>${previewNote()}`;
}

function renderCourses() {
  const courses = COURSES.filter(c => ui.courseFilter === 'all' || c.stationId === ui.courseFilter);
  return `${header('探索课程', '/schedule')}${pageIntro('FIND YOUR EXPERIENCE', '为热爱，<br />多进一步。', '驾控进阶与漂移体验，每一程都有新的可能。')}<div class="filter-tabs scroll-tabs">${[['all','全部课程'], ...STATIONS.filter(s => s.id !== 'ice').map(s=>[s.id,s.name])].map(([v,l])=>`<button data-action="course-filter" data-value="${v}" class="${ui.courseFilter===v?'active':''}">${l}</button>`).join('')}</div><section class="content-section course-list">${courses.map(c => courseCard(c)).join('')}</section>${previewNote()}`;
}

function sessionOptions(courseId, selected, inForm = false) {
  return `<div class="session-options" role="group" aria-label="选择课程档期">${getSessions(courseId).map(s => `<button type="button" class="session-option ${s.id === selected ? 'selected' : ''}" ${s.seats === 0 ? 'disabled' : ''} data-action="select-session" data-value="${s.id}" data-course="${courseId}" data-form="${inForm}" aria-pressed="${s.id === selected}"><span><b>${s.date}</b><small>${s.label} · ${s.seats ? `余 ${s.seats} 席` : '已满员'}</small></span><span class="radio-mark">${icon('check')}</span></button>`).join('')}</div>`;
}

function renderCourse(id) {
  const c = getCourse(id), s = getStation(c.stationId);
  const selected = ui.selectedSessions[c.id] || getSessions(c.id)[0].id;
  return `${header('课程详情', '/station/'+s.id, true)}<div class="course-detail-hero"><img src="${c.image}" alt="${c.name} BMW M 赛道摄影" /><div class="image-shade"></div><div><span class="eyebrow">${c.en}</span><h1>${c.name}</h1><p>${c.intro}</p></div></div><div class="course-facts"><span><b>${c.duration}</b><small>沉浸式体验</small></span><span><b>${c.station}</b><small>2027 SEASON</small></span><span><b>${'▰'.repeat(c.level)}<i>▱</i></b><small>驾趣指数</small></span></div><section class="content-section detail-section">${sectionHead('THE HIGHLIGHTS', '驾趣，从每一处展开。')}<div class="highlights">${c.highlights.map(([title,desc],i)=>`<div><span class="highlight-index">0${i+1}</span><h3>${title}</h3><p>${desc}</p></div>`).join('')}</div><div class="car-line">${icon('car')}<span>体验车型<small>${c.cars}</small></span></div></section><section class="content-section detail-section">${sectionHead('YOUR DRIVING MOMENT', '选择你的赛道时刻。')}${sessionOptions(c.id,selected)}<p class="micro-copy">${icon('pin')}${s.venue} <span>· 演示名额</span></p></section><section class="content-section detail-section">${sectionHead('TWO DAYS. MORE POSSIBILITIES.', '两天，沉浸于驾驶。')}<div class="timeline"><div><span>DAY 01</span><h3>建立节奏，感受驾控。</h3><p>签到与课程介绍 / 驾驶理论 / 分组专项训练</p></div><div><span>DAY 02</span><h3>进阶挑战，尽情释放。</h3><p>进阶训练 / 驾驶体验 / 课程回顾</p></div></div><div class="quiet-panel">${icon('support')}<div><b>关于食宿与行程</b><p>具体训练、车辆及食宿安排以活动确认信息为准。</p></div></div></section><section class="content-section detail-section">${sectionHead('BEFORE YOU DRIVE', '报名须知')}<details class="faq"><summary>参加课程需要什么条件？${icon('down')}</summary><p>请在报名前确认具体课程的驾驶资质及参加要求。正式活动须知将由主办方提供，预览版本使用示例内容。</p></details><details class="faq"><summary>可以为朋友报名吗？${icon('down')}</summary><p>可以。选择“为他人报名”，填写参加者资料后分享邀请。参加者本人完成签署，再由购买者付款。</p></details><details class="faq"><summary>如何咨询退款与改期？${icon('down')}</summary><p>请从客服中心联系活动服务人员，具体政策以正式课程协议为准。</p></details></section><div class="booking-bar"><div><small>课程价格 / 人 / 期</small><b><i>¥</i>${money(c.price)}</b></div>${link('/register/'+c.id,'燃擎启动')}</div>`;
}

function draftFor(id) {
  if (!ui.drafts[id]) ui.drafts[id] = { courseId: id, name: '', mobile: '', idCard: '', sessionId: ui.selectedSessions[id] || '', forOther: false, agreed: false };
  return ui.drafts[id];
}
const courseSummary = c => `<div class="small-course"><img src="${c.image}" alt="${c.name}" /><div><span>${c.station} / ${c.duration}</span><h3>${c.name}</h3><b>¥ ${money(c.price)} <small>/ 人 / 期</small></b></div></div>`;

function renderRegister(id) {
  const c = getCourse(id), d = draftFor(c.id);
  return `${header('课程报名', '/course/'+c.id)}${steps(1)}<section class="content-section registration-section">${courseSummary(c)}<div class="form-section-heading"><h2>这次，为谁出发？</h2><span>PARTICIPANT</span></div><div class="segmented-control"><button type="button" class="${!d.forOther?'active':''}" data-action="for-whom" data-course="${c.id}" data-value="self">本人参加</button><button type="button" class="${d.forOther?'active':''}" data-action="for-whom" data-course="${c.id}" data-value="other">为他人报名</button></div>${d.forOther?'<p class="inline-tip">'+icon('share')+'填写参加者资料后，分享邀请由其本人完成签署。</p>':''}<form id="registration-form" data-course="${c.id}" novalidate><div class="form-title-row"><h3>参加者信息</h3><button type="button" class="text-link" data-action="fill-demo" data-course="${c.id}">填入示例信息</button></div><div class="form-fields"><label for="participant-name"><span>姓名</span><input id="participant-name" name="name" autocomplete="off" placeholder="请输入参加者真实姓名" value="${esc(d.name)}" maxlength="30" required /></label><label for="participant-mobile"><span>手机号</span><input id="participant-mobile" name="mobile" autocomplete="off" type="tel" inputmode="numeric" maxlength="11" placeholder="用于接收活动及签署信息" value="${esc(d.mobile)}" required /></label><label for="participant-idCard"><span>身份证号</span><input id="participant-idCard" name="idCard" autocomplete="off" maxlength="18" placeholder="请输入 18 位身份证号" value="${esc(d.idCard)}" required /></label></div><p class="privacy-hint">${icon('shield')}界面预览请使用示例信息，请勿填写真实身份证号。</p><div class="form-title-row"><h3>选择课程档期</h3><span>北京时间</span></div>${sessionOptions(c.id,d.sessionId,true)}<label class="checkbox-line"><input id="registration-agreement" type="checkbox" name="agreed" ${d.agreed?'checked':''}/><span>我已阅读并同意<button type="button" class="inline-link" data-action="terms">《报名须知》</button>与<button type="button" class="inline-link" data-action="privacy">《隐私说明》</button></span></label><button class="primary-button full-width" type="submit">${d.forOther?'确认信息，生成签署邀请':'确认信息，前往签署'}${icon('arrow')}</button><p class="micro-copy centered">提交后进入预览流程，不会产生真实订单或扣款。</p></form></section>`;
}

function renderInvite(o, claim = false) {
  const c = getCourse(o.courseId);
  if (o.status !== 'waiting_sign') return renderOrder(o);
  return `${header(claim?'参加者邀请':'邀请参加者签署', '/order/'+o.id)}${steps(2)}<section class="content-section"><div class="journey-icon">${icon(claim?'flag':'share')}</div><div class="centered-intro"><span class="eyebrow">${claim?'YOUR NEXT DRIVE':'SHARE THE EXPERIENCE'}</span><h1>${claim?'你的赛道之约，<br />已为你准备。':'把这份驾趣，<br />分享给 TA。'}</h1><p>${claim?'请确认以下资料，由你本人完成课程签署。':'参加者完成实名签署后，你就可以继续付款。'}</p></div><div class="invite-ticket">${mMark()}<span class="ticket-label">DRIVING INVITATION</span><h2>${esc(o.participantName)}，赛道见。</h2>${courseSummary(c)}${infoRow('课程档期',o.sessionDate)}${infoRow('参加者手机号',maskPhone(o.mobile))}<div class="ticket-perf"></div><p>${claim?'确认资料后，前往签署界面预览。':'邀请仅用于参加者确认资料及签署。'}</p></div>${claim?link('/sign/'+o.id,'确认资料，前往签署'):button('copy-invite','复制邀请链接','primary-button full-width',`data-id="${o.id}"`)}${claim?'':link('/claim/'+o.id,'预览参加者视角','outline-button full-width')}<p class="micro-copy centered">此预览无需真实登录或短信验证。</p></section>`;
}

function documentContent(o) {
  const c = getCourse(o.courseId);
  return `<article class="contract-document"><div class="document-watermark">PREVIEW</div><div class="document-brand">BMW DRIVING EXPERIENCE <span>2027</span></div><span class="eyebrow">ENROLLMENT CONFIRMATION</span><h2>课程报名确认书</h2><p class="document-id">文件编号 ${esc(o.documentNo)}</p><div class="document-rule"></div><h3>01 / 课程信息</h3><p>课程名称：${c.name}<br />活动站点：${c.station}<br />课程档期：${o.sessionDate}<br />课程金额：人民币 ${money(o.price)} 元</p><h3>02 / 参加者信息</h3><p>参加者：${esc(o.participantName)}<br />联系手机：${maskPhone(o.mobile)}</p><h3>03 / 活动安排</h3><p>本课程包含驾驶理论与专项体验。具体车辆、训练内容及集合安排，以主办方正式确认信息为准。</p><h3>04 / 预览说明</h3><p>本文件仅用于展示报名与合同页面效果，不构成真实合同。当前未调用易签宝实名认证、电子签署或支付服务。</p><div class="document-signature"><span>参加者签署${o.signed?' · 已模拟完成':''}</span><strong>${o.signed?esc(o.participantName):'待签署'}</strong><small>界面演示 / 非有效电子签章</small></div></article>`;
}

function renderSign(o) {
  if (o.signed) return renderSigned(o);
  if (o.status === 'cancelled') return renderOrder(o);
  return `${header('合同签署',o.forOther?'/claim/'+o.id:'/register/'+o.courseId)}${steps(2)}<section class="content-section sign-section"><div class="form-title-row"><h2>阅读并确认课程信息</h2><span class="status-tag">签署预览</span></div><p class="section-description">正式版本将由易签宝完成参加者身份核验与签署。</p>${documentContent(o)}<label class="checkbox-line"><input id="sign-agreement" type="checkbox" /><span>我已阅读以上预览文件，确认课程及参加者信息。</span></label>${button('simulate-sign','模拟完成签署','primary-button full-width',`data-id="${o.id}"`)}<p class="micro-copy centered">本操作仅切换演示状态，不产生真实签署。</p></section>`;
}

function renderSigned(o) {
  if (!o.signed) return renderSign(o);
  return `${header('签署完成','/order/'+o.id)}<section class="content-section result-section"><div class="success-symbol">${icon('check')}</div><span class="eyebrow">ONE STEP CLOSER</span><h1>签署已完成。<br />驾趣，即将开启。</h1><p>${o.forOther?'参加者已模拟完成签署。<br />切换回购买者视角，继续确认付款。':'你的课程确认信息已保存，下一步即可确认付款。'}</p>${courseSummary(getCourse(o.courseId))}${link('/payment/'+o.id,o.forOther?'返回购买者视角，继续付款':'继续确认付款')}<a class="text-link centered-link" href="#/contract/${o.id}">查看预览文件${icon('arrow')}</a></section>`;
}

function renderPayment(o) {
  if (o.status === 'paid') return renderResult(o);
  if (!o.signed || o.status === 'cancelled') return renderOrder(o);
  return `${header('订单确认','/order/'+o.id)}${steps(3)}<section class="content-section"><div class="payment-intro"><span class="eyebrow">READY TO DRIVE</span><h1>最后一步，<br />即刻赴约。</h1></div>${courseSummary(getCourse(o.courseId))}<div class="info-panel">${infoRow('课程档期',o.sessionDate)}${infoRow('参加者',esc(o.participantName))}${infoRow('手机号码',maskPhone(o.mobile))}${infoRow('合同状态','<span class="positive">'+icon('check')+'已模拟签署</span>')}</div><div class="payment-method"><span class="wechat-mark">${icon('wallet')}</span><span><b>微信支付</b><small>支付方式界面预览</small></span><span class="radio-mark selected">${icon('check')}</span></div><div class="payment-total"><span>应付金额<small>订单 ${esc(o.id)}</small></span><b><i>¥</i>${money(o.price)}</b></div>${button('simulate-pay','模拟付款，查看报名结果','primary-button full-width',`data-id="${o.id}"`)}<p class="privacy-hint centered">${icon('shield')}体验预览不会打开收银台，也不会实际扣款。</p></section>`;
}

function ticket(o) {
  const c = getCourse(o.courseId);
  return `<div class="boarding-pass"><div class="pass-top"><span>YOUR DRIVING PASS</span>${mMark()}</div><h2>${c.name}</h2><span class="pass-station">${c.station} / ${getStation(c.stationId).en}</span><div class="pass-details"><div><small>DATE / 课程时间</small><b>${o.sessionDate}</b></div><div><small>PARTICIPANT / 参加者</small><b>${esc(o.participantName)}</b></div></div><div class="ticket-perf"></div><div class="barcode" aria-hidden="true"></div><p class="pass-id">${esc(o.id)}<span>演示凭证</span></p></div>`;
}

function renderResult(o) {
  if (o.status !== 'paid') return renderOrder(o);
  return `${header('报名完成','/mine')}<section class="content-section result-section"><div class="success-symbol">${icon('check')}</div><span class="eyebrow">SEE YOU ON THE TRACK</span><h1>赛道见。</h1><p>你的驾驶旅程，已在此刻启程。<br />期待与你一起，释放纯粹驾趣。</p>${ticket(o)}${link('/order/'+o.id,'查看订单','primary-button full-width')}${link('/schedule','探索更多课程','outline-button full-width')}<p class="micro-copy centered">此为模拟报名成功效果，无真实交易。</p></section>`;
}

function orderCard(o) {
  const c = getCourse(o.courseId), status = STATUS[o.status];
  return `<article class="order-card"><div class="order-card-top"><span>${c.station} / 2027</span><span class="status-tag ${o.status==='paid'?'success':o.status==='cancelled'?'muted':''}">${status.text}</span></div><a class="order-course-link" href="#/order/${o.id}">${courseSummary(c)}</a><div class="order-card-info"><p>${icon('calendar')}${o.sessionDate}</p><p>${icon('user')}${esc(o.participantName)}${o.forOther?'<span class="tiny-label">代报名</span>':''}</p></div><div class="order-card-bottom"><span>合计 <b>¥ ${money(o.price)}</b></span><a class="small-button ${o.status==='paid'?'quiet':''}" href="${href(orderDestination(o))}">${o.status==='waiting_sign'?'继续签署':o.status==='waiting_pay'?'继续付款':'查看详情'}${icon('arrow')}</a></div></article>`;
}

function renderMine() {
  const paid = state.orders.filter(o=>o.status==='paid'), pending=state.orders.filter(o=>['waiting_sign','waiting_pay'].includes(o.status)), signed=state.orders.filter(o=>o.signed);
  return `<div class="mine-hero"><img src="assets/header-track.jpg" alt="BMW M 赛道车队"/><div class="image-shade"></div><header>${brand()}<a class="icon-button" href="#/profile" aria-label="编辑个人资料">${icon('settings')}</a></header><div class="mine-greeting"><span class="eyebrow">YOUR NEXT DRIVE</span><h1>你好，${esc(state.profile.name)}。</h1><p>热爱驾驶的你，下一站见。</p></div><div class="avatar">${mMark()}</div></div><div class="account-stats"><a href="#/orders?tab=paid"><b>${String(paid.length).padStart(2,'0')}</b><span>已购课程</span></a><a href="#/orders?tab=pending"><b>${String(pending.length).padStart(2,'0')}</b><span>我的预约</span>${pending.length?'<i></i>':''}</a><a href="#/contracts"><b>${String(signed.length).padStart(2,'0')}</b><span>我的合同</span></a></div><section class="content-section">${sectionHead('UP NEXT',pending.length?'继续你的驾驶旅程。':'下一程，即将启幕。','<a class="text-link" href="#/orders">全部订单'+icon('arrow')+'</a>')}${pending.length?orderCard(pending[0]):paid.length?orderCard(paid[0]):empty('准备好出发了吗？','发现适合你的驾驶课程。')}<div class="account-menu">${[['flag','我的参训','查看本人课程安排','/participations'],['file','我的合同','课程签署及报名文件','/contracts'],['user','个人资料','管理姓名与联系信息','/profile'],['support','客服中心','每段驾趣，都有我们相伴','/support']].map(([i,t,d,l])=>`<a href="#${l}">${icon(i)}<span><b>${t}</b><small>${d}</small></span>${icon('chevron')}</a>`).join('')}</div><div class="member-note">${mMark()}<span>PASSION CONNECTS US.<br /><small>因热爱，相聚于此。</small></span></div><p class="micro-copy centered">演示账号 · 购买与签署记录仅保存在当前浏览器</p></section>`;
}

function renderOrders(tab = 'all') {
  const filtered=state.orders.filter(o=>tab==='paid'?o.status==='paid':tab==='pending'?['waiting_sign','waiting_pay'].includes(o.status):true);
  return `${header('我的订单与预约','/mine')}${pageIntro('YOUR DRIVING JOURNEY','每一程，<br />都值得期待。')}<div class="filter-tabs">${[['all','全部记录'],['pending','我的预约'],['paid','已购课程']].map(([v,l])=>`<a href="#/orders?tab=${v}" class="${tab===v?'active':''}">${l}</a>`).join('')}</div><section class="content-section orders-list">${filtered.length?filtered.map(orderCard).join(''):empty('下一段驾趣，等你开启。','当前分类下还没有课程记录。')}</section>`;
}

function renderOrder(o) {
  const status = STATUS[o.status];
  return `${header('订单详情','/orders')}<div class="order-status-band ${o.status==='paid'?'is-paid':''}"><div class="status-symbol">${icon(status.icon)}</div><div><h1>${status.text}</h1><p>${status.hint}</p></div></div><section class="content-section">${courseSummary(getCourse(o.courseId))}<div class="info-panel">${infoRow('课程档期',o.sessionDate)}${infoRow('参加者',esc(o.participantName)+(o.forOther?' <span class="tiny-label">代报名</span>':''))}${infoRow('联系手机',maskPhone(o.mobile))}${infoRow('课程地点',getCourse(o.courseId).venue)}${infoRow('订单金额',`¥ ${money(o.price)}`)}${infoRow('创建时间',o.created)}${infoRow('订单编号',esc(o.id),'order-id-row')}</div><div class="document-access">${icon('file')}<div><b>课程签署文件</b><small>${o.signed?'已模拟完成签署':'等待参加者本人确认签署'}</small></div>${o.signed?`<a href="#/contract/${o.id}" class="text-link">查看${icon('arrow')}</a>`:'<span class="muted-text">待签署</span>'}</div>${o.status==='paid'?ticket(o):''}${['waiting_sign','waiting_pay'].includes(o.status)?`${link(orderDestination(o),o.status==='waiting_sign'?(o.forOther?'邀请参加者签署':'继续签署'):'继续确认付款','primary-button full-width')}<button class="text-button full-width" data-action="cancel-order" data-id="${o.id}">取消本次预约</button>`:link('/schedule','探索更多课程','outline-button full-width')}<a class="order-support" href="#/support">${icon('support')}需要帮助？联系活动客服${icon('chevron')}</a></section>`;
}

function renderParticipations() {
  const orders=state.orders.filter(o=>!o.forOther&&o.status==='paid');
  return `${header('我的参训','/mine')}${pageIntro('YOUR NEXT EXPERIENCE','下一站，<br />驾驶主场。','在这里查看本人已确认的课程安排。')}<section class="content-section">${orders.length?orders.map(ticket).join(''):empty('你的主场，等你到来。','报名完成后，课程安排将在这里展示。')}${link('/schedule','探索其他站点','outline-button full-width')}</section>`;
}

function renderContracts() {
  const orders = state.orders.filter(o=>o.signed);
  return `${header('我的合同','/mine')}${pageIntro('YOUR DOCUMENTS','每一份期待，<br />都有迹可循。','查看课程签署状态与报名确认文件。')}<section class="content-section contracts-list">${orders.length?orders.map(o=>`<a class="contract-card" href="#/contract/${o.id}"><div class="file-tile">${icon('file')}<span>PDF</span></div><div><span class="status-tag success">已模拟签署</span><h3>${getCourse(o.courseId).name}</h3><p>${o.sessionDate} · ${esc(o.participantName)}</p><small>${esc(o.documentNo)}</small></div>${icon('chevron')}</a>`).join(''):empty('还没有签署文件','完成课程确认后，可在这里查看文件。')}<p class="privacy-hint">${icon('shield')}以上为演示文件，不包含真实电子签章。</p></section>`;
}

function renderContract(o) {
  return `${header('课程签署文件','/contracts')}<section class="content-section sign-section"><div class="form-title-row"><span class="eyebrow">YOUR DOCUMENT</span><span class="status-tag ${o.signed?'success':''}">${o.signed?'已模拟签署':'待签署'}</span></div>${documentContent(o)}${button('download-contract','导出预览确认书','outline-button full-width',`data-id="${o.id}"`)}${!o.signed&&o.status==='waiting_sign'?link('/sign/'+o.id,'前往签署预览','primary-button full-width'):''}</section>`;
}

function renderProfile() {
  return `${header('个人资料','/mine')}${pageIntro('YOUR PROFILE','让每次相见，<br />都更熟悉。')}<section class="content-section"><div class="profile-avatar">${mMark()}</div><form id="profile-form" novalidate><div class="form-fields"><label for="profile-name"><span>姓名</span><input id="profile-name" name="name" value="${esc(state.profile.name)}" maxlength="30" placeholder="请输入姓名" /></label><label for="profile-mobile"><span>手机号</span><input id="profile-mobile" name="mobile" type="tel" inputmode="numeric" value="${esc(state.profile.mobile)}" maxlength="11" placeholder="请输入手机号" /></label></div><p class="privacy-hint">${icon('shield')}资料仅保存在当前浏览器，请使用示例信息。</p><button class="primary-button full-width" type="submit">保存资料${icon('check')}</button></form></section>`;
}

function renderSupport() {
  return `${header('客服中心')}<div class="support-intro">${mMark()}<span class="eyebrow">WE ARE HERE FOR YOU</span><h1>每一段驾趣，<br />都有我们相伴。</h1><p>选课、报名或行程咨询，我们乐意为你解答。</p></div><section class="content-section"><div class="contact-options"><button data-action="contact" data-value="在线客服">${icon('support')}<span><b>在线咨询</b><small>让每一个疑问，都得到回应</small></span>${icon('arrow')}</button><button data-action="contact" data-value="电话咨询">${icon('phone')}<span><b>电话咨询</b><small>与活动服务团队直接沟通</small></span>${icon('arrow')}</button><button data-action="contact" data-value="邮件联系">${icon('mail')}<span><b>邮件联系</b><small>课程与合作事宜咨询</small></span>${icon('arrow')}</button></div><p class="micro-copy">客服渠道为界面预览，正式联系方式由客户提供。</p>${sectionHead('GOOD TO KNOW','出发前，你可能想知道。')}<details class="faq" open><summary>如何完成课程报名？${icon('down')}</summary><p>选择活动站点和课程，填写参加者信息与档期，完成参加者本人签署后，由购买者付款确认。</p></details><details class="faq"><summary>可以为家人或朋友报名吗？${icon('down')}</summary><p>可以。选择“为他人报名”，填写参加者资料并分享邀请，由对方本人确认并签署，再由你完成付款。</p></details><details class="faq"><summary>如何查看已报名的课程？${icon('down')}</summary><p>进入“我的”，已付款课程在“已购课程”中展示，未完成的报名在“我的预约”中继续操作。</p></details><details class="faq"><summary>合同与报名资料在哪里查看？${icon('down')}</summary><p>在个人中心进入“我的合同”，或从订单详情查看对应的课程签署文件。</p></details><details class="faq"><summary>需要退款或者更改课程日期怎么办？${icon('down')}</summary><p>请联系活动客服协助处理，具体条件以正式报名须知及课程协议为准。</p></details></section><div class="support-footer">${brand()}<p>POWER. PRECISION. PASSION.</p></div>`;
}

function route() {
  const raw = location.hash.slice(1) || '/';
  const [path, search = ''] = raw.split('?');
  return { path: path.replace(/\/$/,'') || '/', segments: path.split('/').filter(Boolean), query: new URLSearchParams(search) };
}

function render({ keepScroll = false } = {}) {
  const r = route(); const scroll = window.scrollY;
  const routeKey=location.hash||'#/';
  if(ui.lastRoute&&ui.lastRoute!==routeKey)ui.scrollPositions[ui.lastRoute]=scroll;
  const restoreTo=ui.restoreNext?(ui.scrollPositions[routeKey]||0):0;ui.restoreNext=false;ui.lastRoute=routeKey;
  const focused=document.activeElement?.closest('[data-action]');
  const focusKey=keepScroll&&focused?{action:focused.dataset.action,value:focused.dataset.value}:null;
  const [page, id] = r.segments;
  document.body.dataset.page = page || 'home';
  document.body.classList.toggle('has-booking-bar', page === 'course');
  let html, title = 'BMW 精英驾驶 · 2027';
  const orderPages = ['invite','claim','sign','signed','payment','result','order','contract'];
  if (orderPages.includes(page) && !getOrder(id)) html = `${header('记录暂未找到','/mine')}${empty('这段旅程暂未找到。','当前预览记录可能已重置，请重新选择课程。')}`;
  else {
    const o = getOrder(id);
    switch (page) {
      case undefined: html=renderHome(); break;
      case 'schedule': html=renderSchedule();title='活动排期';break;
      case 'station': html=renderStation(id);title=getStation(id).name;break;
      case 'courses': html=renderCourses();title='探索课程';break;
      case 'course': html=renderCourse(id);title=getCourse(id).name;break;
      case 'register': html=renderRegister(id);title='课程报名';break;
      case 'invite': html=renderInvite(o);title='邀请参加者签署';break;
      case 'claim': html=renderInvite(o,true);title='参加者邀请';break;
      case 'sign': html=renderSign(o);title='合同签署';break;
      case 'signed': html=renderSigned(o);title='签署完成';break;
      case 'payment': html=renderPayment(o);title='订单确认';break;
      case 'result': html=renderResult(o);title='报名完成';break;
      case 'mine': html=renderMine();title='个人中心';break;
      case 'orders': html=renderOrders(r.query.get('tab')||'all');title='我的订单与预约';break;
      case 'order': html=renderOrder(o);title='订单详情';break;
      case 'participations': html=renderParticipations();title='我的参训';break;
      case 'contracts': html=renderContracts();title='我的合同';break;
      case 'contract': html=renderContract(o);title='课程签署文件';break;
      case 'profile': html=renderProfile();title='个人资料';break;
      case 'support': html=renderSupport();title='客服中心';break;
      default: html=`${header('探索驾趣')}${empty('换一条路，继续出发。','这个页面暂未找到。')}`;
    }
  }
  app.innerHTML=html;
  document.title=title.includes('BMW')?title:`${title} · BMW 精英驾驶`;
  renderNavigation(r);
  window.scrollTo({top:keepScroll?scroll:restoreTo,behavior:'instant'});
  if(focusKey) [...app.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusKey.action&&el.dataset.value===focusKey.value)?.focus({preventScroll:true});
  mountMotion(app,{quiet:keepScroll,page:page||'home'});
}

function renderNavigation(r) {
  const [page] = r.segments;
  const active = ['mine','orders','order','contracts','contract','participations','profile'].includes(page)?'mine':page==='support'?'support':['schedule','station','courses','course','register','invite','claim','sign','signed','payment','result'].includes(page)?'schedule':'home';
  document.querySelector('#bottom-nav').innerHTML=[['home','/','home','首页'],['schedule','/schedule','calendar','活动排期'],['mine','/mine','user','我的'],['support','/support','support','客服']].map(([key,path,i,label])=>`<a href="#${path}" class="${active===key?'active':''}" ${active===key?'aria-current="page"':''}>${icon(i)}<span>${label}</span></a>`).join('');
  const pending=state.orders.find(o=>o.status==='waiting_sign')||state.orders[0];
  const paid=state.orders.find(o=>o.status==='paid')||state.orders[0];
  const payable=state.orders.find(o=>o.status==='waiting_pay')||paid;
  const links=[['01','品牌与探索',[['/','品牌首页'],['/schedule','活动排期'],['/courses','课程列表'],['/course/circuit-tianjin','课程详情']]],['02','报名旅程',[['/register/circuit-tianjin','信息登记'],['/invite/'+pending.id,'代报名邀请'],['/sign/'+pending.id,'签约界面'],['/payment/'+payable.id,'订单确认'],['/result/'+paid.id,'报名结果']]],['03','个人与服务',[['/mine','个人中心'],['/orders?tab=pending','我的预约'],['/orders?tab=paid','已购课程'],['/contracts','我的合同'],['/support','客服中心']]]];
  document.querySelector('#preview-nav').innerHTML=`<div class="preview-nav-title"><span class="live-dot"></span>界面预览<span>H5</span></div>${links.map(([n,t,items])=>`<div class="preview-nav-group"><h2><span>${n}</span>${t}</h2>${items.map(([p,l])=>`<a href="#${p}" class="${(location.hash||'#/')==='#'+p?'active':''}">${l}${icon('arrow')}</a>`).join('')}</div>`).join('')}<div class="preview-nav-end"><p>可以直接切换页面，或在手机界面<br />从首页体验完整报名旅程。</p><button data-action="reset-demo">重置演示记录${icon('settings')}</button><a href="https://h5.topdriving.cn/#/welcome" target="_blank" rel="noopener noreferrer">参考 H5${icon('arrow')}</a></div>`;
}

function navigate(path) { if (location.hash === '#'+path) render(); else location.hash=path; }
function persist() { saveState(state); }
function toast(message) { const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(ui.toastTimer);ui.toastTimer=setTimeout(()=>el.classList.remove('visible'),3000); }
function updateOrder(id,action) { const index=state.orders.findIndex(o=>o.id===id);if(index<0)return false;try{state.orders[index]=transitionOrder(state.orders[index],action);persist();return true;}catch(e){toast(e.message);return false;} }
function showModal(title,body,onConfirm,confirmText='知道了') {
  const root=document.querySelector('#modal-root');
  root.innerHTML=`<dialog class="modal"><button class="icon-button modal-close" aria-label="关闭">${icon('close')}</button><span class="eyebrow">BMW DRIVING EXPERIENCE</span><h2>${title}</h2><div class="modal-body">${body}</div><button class="primary-button full-width modal-confirm">${confirmText}${icon('arrow')}</button></dialog>`;
  const dialog=root.querySelector('dialog');
  const close=()=>{dialog.close();root.innerHTML='';};
  root.querySelector('.modal-close').addEventListener('click',close);
  root.querySelector('.modal-confirm').addEventListener('click',()=>{close();onConfirm?.();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  dialog.showModal();
}

document.addEventListener('input',event=>{
  const form=event.target.closest('#registration-form');
  if(form&&['name','mobile','idCard'].includes(event.target.name))draftFor(form.dataset.course)[event.target.name]=event.target.value;
});
document.addEventListener('change',event=>{
  const form=event.target.closest('#registration-form');
  if(form&&event.target.name==='agreed')draftFor(form.dataset.course).agreed=event.target.checked;
});

document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target)return;
  const {action,value,course,id}=target.dataset;
  switch(action){
    case 'restore-scroll':ui.restoreNext=true;break;
    case 'replay-intro':playIntro();break;
    case 'toggle-motion':toggleMotion();break;
    case 'drive-mode':{
      document.querySelectorAll('.drive-mode-tabs [role="tab"]').forEach(el=>{const selected=el===target;el.setAttribute('aria-selected',String(selected));el.tabIndex=selected?0:-1;});
      const panel=document.querySelector('#drive-mode-panel');panel.setAttribute('aria-labelledby',target.id);panel.innerHTML=driveModePanel(value);mountMotion(panel,{quiet:true,page:'drive-mode'});break;
    }
    case 'station-filter':ui.stationFilter=value;render({keepScroll:true});break;
    case 'course-filter':ui.courseFilter=value;render({keepScroll:true});break;
    case 'select-session':ui.selectedSessions[course]=value;if(target.dataset.form==='true')draftFor(course).sessionId=value;render({keepScroll:true});break;
    case 'for-whom':draftFor(course).forOther=value==='other';render({keepScroll:true});break;
    case 'fill-demo':Object.assign(draftFor(course),{name:draftFor(course).forOther?'李昊':state.profile.name,mobile:draftFor(course).forOther?'13900000000':state.profile.mobile,idCard:'11010519491231002X'});render({keepScroll:true});toast('已填入界面预览用示例信息');break;
    case 'terms':showModal('报名须知 · 预览', '<p>请在报名时确认课程、参加者资料和档期。为他人报名时，需由参加者本人确认并完成签署。</p><p>本版本的排期、名额、价格和课程安排仅为页面演示。正式须知及协议以客户确认内容为准。</p>');break;
    case 'privacy':showModal('隐私说明 · 预览','<p>本前端预览未连接账号、签约或支付服务。演示订单与资料保存在当前浏览器，可使用“重置演示记录”清除。</p><p>请使用示例信息。身份证输入不会保存到演示订单或浏览器持久存储。</p>');break;
    case 'copy-invite':{
      const url=location.href.split('#')[0]+'#/claim/'+id;
      try{if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(url);toast('邀请链接已复制，可预览参加者认领页面');}catch{showModal('分享签署邀请',`<p>复制下方链接，可打开参加者视角：</p><input class="share-input" readonly value="${esc(url)}" aria-label="邀请链接"/><p>也可以点击页面上的“预览参加者视角”继续。</p>`);document.querySelector('.share-input')?.select();}break;
    }
    case 'simulate-sign':if(!document.querySelector('#sign-agreement')?.checked){toast('请先阅读并确认预览文件');break;}if(updateOrder(id,'sign'))navigate('/signed/'+id);break;
    case 'simulate-pay':if(updateOrder(id,'pay'))navigate('/result/'+id);break;
    case 'cancel-order':showModal('取消本次预约？','<p>取消后，本次演示报名将关闭。你仍可以重新选择课程开启新的旅程。</p>',()=>{if(updateOrder(id,'cancel')){navigate('/order/'+id);toast('本次预约已取消');}},'确认取消');break;
    case 'reset-demo':showModal('重置演示记录？','<p>清除当前浏览器中新增的演示订单和个人资料，恢复初始示例。</p>',()=>{state=createInitialState();ui.drafts={};ui.selectedSessions={};persist();navigate('/');toast('演示记录已重置');},'确认重置');break;
    case 'contact':showModal(value+' · 界面预览','<p>正式版本将在这里接入客户确认的活动客服渠道。</p><p>本次可先展开下方常见问题，了解选课、代报名、签署与订单查询方式。</p>');break;
    case 'download-contract':{
      const o=getOrder(id);if(!o)break;
      const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>BMW 课程报名确认书（演示）</title><style>body{max-width:700px;margin:60px auto;padding:24px;font:16px/1.9 sans-serif;color:#222}h2{font-size:30px}.document-watermark{color:#bbb;letter-spacing:8px}.document-brand{border-bottom:2px solid #2467bf;padding-bottom:20px}.document-brand span{float:right}.eyebrow{font-size:11px;color:#666}.document-signature{border-top:1px solid #ddd;padding-top:20px;margin-top:30px}.document-signature>*{display:block}p{color:#444}</style>${documentContent(o)}</html>`;
      const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`BMW-报名确认书-${o.documentNo}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('预览确认书已导出');break;
    }
  }
});

document.addEventListener('submit',event=>{
  if(event.target.id==='registration-form'){
    event.preventDefault();const d=draftFor(event.target.dataset.course),error=validateRegistration(d);
    if(error){toast(error.message);document.querySelector(error.field==='agreed'?'#registration-agreement':error.field==='sessionId'?'.session-option:not(:disabled)':`#participant-${error.field}`)?.focus();return;}
    const o=createOrder(d);state.orders.unshift(o);persist();delete ui.drafts[d.courseId];navigate(`${o.forOther?'/invite/':'/sign/'}${o.id}`);
  }
  if(event.target.id==='profile-form'){
    event.preventDefault();const data=new FormData(event.target),name=String(data.get('name')||'').trim(),mobile=String(data.get('mobile')||'');
    if(!name){toast('请填写姓名');document.querySelector('#profile-name').focus();return;}
    if(!/^1[3-9]\d{9}$/.test(mobile)){toast('请填写有效的手机号');document.querySelector('#profile-mobile').focus();return;}
    state.profile={name,mobile};persist();navigate('/mine');toast('演示资料已保存');
  }
});

window.addEventListener('hashchange',()=>render());
document.addEventListener('keydown',event=>{
  const tab=event.target.closest('.drive-mode-tabs [role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[role="tab"]')],index=tabs.indexOf(tab);
  const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[next].focus();tabs[next].click();
});
initMotion();
render();
