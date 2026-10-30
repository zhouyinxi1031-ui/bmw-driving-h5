import { SEED_ORDERS, DEMO_PROFILE, getCourse, getSessions } from './data.js';

export const STORAGE_KEY = 'bmw-driving-preview-v1';
export function createInitialState() { return { orders: structuredClone(SEED_ORDERS), profile: { ...DEMO_PROFILE }, saved: [], draft: {} }; }
export function readState(storage = globalThis.localStorage) {
  try { const saved = JSON.parse(storage.getItem(STORAGE_KEY)); return saved && Array.isArray(saved.orders) ? { ...createInitialState(), ...saved } : createInitialState(); } catch { return createInitialState(); }
}
export function saveState(state, storage = globalThis.localStorage) { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Private browsing may disable persistence. */ } }
export const maskPhone = phone => phone ? String(phone).slice(0, 3) + ' **** ' + String(phone).slice(-4) : '未填写';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function validateRegistration(input) {
  if (!input.name?.trim()) return { field: 'name', message: '请填写参加者姓名' };
  if (!/^1[3-9]\d{9}$/.test(input.mobile || '')) return { field: 'mobile', message: '请填写有效的 11 位手机号' };
  if (!/^\d{17}[\dXx]$/.test(input.idCard || '')) return { field: 'idCard', message: '请填写 18 位身份证号；预览请使用示例信息' };
  const sessions = getSessions(input.courseId);
  if (!sessions.some(s => s.id === input.sessionId && s.seats > 0)) return { field: 'sessionId', message: '请选择可报名的课程档期' };
  if (!input.agreed) return { field: 'agreed', message: '请阅读并同意报名须知与隐私说明' };
  return null;
}

export function createOrder(input, now = new Date()) {
  const course = getCourse(input.courseId);
  const session = getSessions(course.id).find(s => s.id === input.sessionId);
  if (validateRegistration(input)) throw new Error('报名资料未完成');
  return {
    id: `BMW${now.getTime()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    courseId: course.id, sessionId: session.id, sessionDate: session.date,
    participantName: input.name.trim(), mobile: input.mobile, forOther: !!input.forOther,
    status: 'waiting_sign', signed: false, price: course.price,
    created: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
    documentNo: `BMW-DEMO-${now.getTime().toString().slice(-6)}`,
  };
}

export function transitionOrder(order, action) {
  if (action === 'sign' && order.status === 'waiting_sign') return { ...order, signed: true, status: 'waiting_pay' };
  if (action === 'pay' && order.status === 'waiting_pay' && order.signed) return { ...order, status: 'paid' };
  if (action === 'cancel' && ['waiting_sign', 'waiting_pay'].includes(order.status)) return { ...order, status: 'cancelled' };
  throw new Error('当前订单状态不支持此操作');
}
