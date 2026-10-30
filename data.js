export const STATIONS = [
  { id: 'chengdu', name: '成都站', en: 'CHENGDU', no: '01', venue: '成都天府国际赛道', dates: '05.22 — 05.23', dateLabel: '2027年5月22日—23日', month: 'MAY', status: 'open', desc: '在天府之国，唤醒每一分驾驶本能。', trackImage:'assets/tracks/chengdu-tianfu.svg', trackLayout:'西赛道完整布局 · 3.265 km', trackSource:'https://www.fiatcrworldtour.com/images/2026/Circuits_new/Maps/FIA-TCR-WT_2026_Circuit_CHINA_1.pdf', trackSourceName:'TCR World Tour 官方赛道图' },
  { id: 'shanghai', name: '上海站', en: 'SHANGHAI', no: '02', venue: '上海国际赛车场', dates: '07.16 — 07.19', dateLabel: '2027年7月16日—19日', month: 'JUL', status: 'open', desc: '驶入传奇赛道，让热爱与速度同频。', trackImage:'assets/tracks/shanghai-international.svg', trackLayout:'大奖赛完整布局 · 5.451 km', trackSource:'https://www.formula1.com/en/racing/2026/china/circuit', trackSourceName:'Formula 1 官方赛道资料', trackCredit:true },
  { id: 'tianjin', name: '天津站', en: 'TIANJIN', no: '03', venue: '天津 V1 国际赛车场', dates: '09.10 — 09.15', dateLabel: '2027年9月10日—15日', month: 'SEP', status: 'open', desc: '直道释放锋芒，弯道见证实力。', trackImage:'assets/tracks/tianjin-v1-full.png', trackLayout:'场馆全长布局 · 4.29 km', trackSource:'https://www.v1aw.com.cn/circuit', trackSourceName:'天津 V1 汽车世界官方赛道资料' },
  { id: 'ice', name: '冰雪驾趣', en: 'ICE EXPERIENCE', no: '04', venue: '冰雪驾驶场地 · 待公布', dates: '12月 · 敬请期待', dateLabel: '2027年12月 · 档期待公布', month: 'DEC', status: 'soon', desc: '在冰雪之间，探索掌控的另一种可能。' },
];

const base = {
  circuit: { name: '专业赛道驾控课程', en: 'CIRCUIT EXPERIENCE', tag: '赛道进阶', intro: '每一个弯心，都是新的起点。', image: 'assets/course-track.jpg', price: 25800, duration: '2 天', cars: 'BMW M2 CS / M3 Touring / M4', level: 4, seats: 12, highlights: [ ['M 家族强势集结', '在不同车型之间，感受 BMW M 的纯粹驾趣。'], ['1V1 追锋体验', '培训师针对性指导，探索更精准的赛道走线。'], ['VBOX 数据分析', '以数据回看每一次制动、转向与加速。'], ['专业车手分享', '从驾驶经验到赛道思路，与热爱同频。'] ] },
  drift: { name: '漂移大师定制课程', en: 'DRIFT MASTERCLASS', tag: '横向掌控', intro: '在失衡的边缘，找到掌控。', image: 'assets/course-drift.jpg', price: 21800, duration: '2 天', cars: 'BMW M3 / M4', level: 4, seats: 8, highlights: [ ['纯粹后驱驾趣', '体验 BMW M 后驱车型的动态表现。'], ['循序渐进训练', '从重心转移到油门控制，建立漂移节奏。'], ['定制化指导', '针对驾驶表现，调整训练节奏与内容。'], ['畅享驾驶时刻', '将技巧与热爱，融入每一次精准操控。'] ] },
};

export const COURSES = STATIONS.filter(s => s.id !== 'ice').flatMap(s => ['circuit', 'drift'].map(type => ({ ...base[type], id: `${type}-${s.id}`, type, stationId: s.id, station: s.name, venue: s.venue, dates: s.dates, datesLabel: s.dateLabel })));
export const getCourse = id => COURSES.find(c => c.id === id) || COURSES.find(c => c.id === 'circuit-tianjin');
export const getStation = id => STATIONS.find(s => s.id === id) || STATIONS[2];
export const money = amount => Number(amount).toLocaleString('zh-CN');

export function getSessions(courseId) {
  const c = getCourse(courseId);
  const dates = c.stationId === 'chengdu' ? ['2027.05.22 — 05.23'] : c.stationId === 'shanghai' ? ['2027.07.16 — 07.17', '2027.07.18 — 07.19'] : ['2027.09.10 — 09.11', '2027.09.12 — 09.13', '2027.09.14 — 09.15'];
  return dates.map((date, i) => ({ id: `${c.id}-${i}`, date, seats: i === 1 ? 0 : i === 2 ? 4 : c.seats, label: `${String(i + 1).padStart(2, '0')} 期` }));
}

export const DEMO_PROFILE = { name: '张驰', mobile: '13800000000' };
export const SEED_ORDERS = [
  { id: 'BMW2027000186', courseId: 'circuit-shanghai', sessionId: 'circuit-shanghai-0', sessionDate: '2027.07.16 — 07.17', participantName: '张驰', mobile: '13800000000', forOther: false, status: 'paid', signed: true, price: 25800, created: '2026.10.28', documentNo: 'BMW-DEMO-0186' },
  { id: 'BMW2027000187', courseId: 'drift-tianjin', sessionId: 'drift-tianjin-0', sessionDate: '2027.09.10 — 09.11', participantName: '李昊', mobile: '13900000000', forOther: true, status: 'waiting_sign', signed: false, price: 21800, created: '2026.10.28', documentNo: 'BMW-DEMO-0187' },
  { id: 'BMW2027000188', courseId: 'circuit-chengdu', sessionId: 'circuit-chengdu-0', sessionDate: '2027.05.22 — 05.23', participantName: '张驰', mobile: '13800000000', forOther: false, status: 'waiting_pay', signed: true, price: 25800, created: '2026.10.28', documentNo: 'BMW-DEMO-0188' },
];

export const STATUS = {
  waiting_sign: { text: '待签署', hint: '参加者完成签署后即可付款', icon: 'file' },
  waiting_pay: { text: '待付款', hint: '合同签署已完成，期待与你赛道相见', icon: 'wallet' },
  paid: { text: '报名成功', hint: '你的驾驶旅程，即将开启', icon: 'check' },
  cancelled: { text: '已取消', hint: '随时回来，开启下一段驾驶旅程', icon: 'close' },
};
