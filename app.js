const start = new Date('2027-03-09T00:00:00');
const end = new Date('2028-01-25T00:00:00');
const STORAGE_KEY = 'haircut-log-2027-v2';
if (location.search.includes('reset=1')) localStorage.removeItem(STORAGE_KEY);
const fmt = d => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
const lunarHints = ['二月初二','二月廿三','三月十四','四月初五','四月廿六','五月十八','六月初九','六月三十','七月廿一','八月十三','九月初五','九月廿六','十月十七','冬月初八','腊月初九','腊月三十'];
const today = () => { const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()); };
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { actualBase:iso(start), completed:[], adjusted:[], cycleDays:21 };
let actualBase = new Date(`${state.actualBase}T00:00:00`), completed = new Set(state.completed || []), adjusted = new Set(state.adjusted || []), lastAction = null;
let cycleDays = Number(state.cycleDays) || 21;
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({actualBase:iso(actualBase),completed:[...completed],adjusted:[...adjusted],cycleDays}));
function buildDates(){
  const dates=[]; let d=new Date(actualBase);
  while(d<=end){dates.push(new Date(d)); d.setDate(d.getDate()+cycleDays);}
  // 周期改变后，把历史已完成日期合并回来，避免它们被新周期覆盖。
  completed.forEach(key=>{const doneDate=new Date(`${key}T00:00:00`); if(doneDate>=start&&doneDate<=end) dates.push(doneDate);});
  return [...new Map(dates.map(item=>[iso(item),item])).values()].sort((a,b)=>a-b);
}
function render(){
  const dates=buildDates(), next=dates.find(d=>!completed.has(iso(d))) || dates[dates.length-1];
  document.querySelector('#nextDate').textContent=fmt(next);
  document.querySelector('#nextMeta').textContent=`${weekdays[next.getDay()]}　${dates.indexOf(next)===0?'农历二月初二　（龙抬头）':'按周期计算的计划日'}`;
  document.querySelector('#summary').textContent=`共 ${dates.length} 次计划　|　最后一次：${fmt(dates[dates.length-1])}`;
  document.querySelector('#timeline').innerHTML=dates.map((d,i)=>{const key=iso(d), done=completed.has(key), missed=!done&&d<today(), wasAdjusted=adjusted.has(key), active=key===iso(next), status=done?'已完成':missed?'已错过':'待进行'; return `<article class="date-card ${done?'completed':''} ${missed?'missed':''} ${wasAdjusted?'adjusted':''}" data-date="${key}"><div class="month">${d.getMonth()+1}月</div><div class="status">${status}</div><div class="day">${String(d.getDate()).padStart(2,'0')}</div><div class="weekday">${weekdays[d.getDay()]}</div><div class="lunar">${i===0?'农历二月初二':'按周期'}</div><div class="tag">${i===0?'龙抬头':i===dates.length-1?'除夕':i===1?'好发型':''}</div>${done?'<button class="cancel-record" type="button">取消记录</button>':''}</article>`}).join('');
}
document.querySelector('#completeBtn').addEventListener('click',()=>{if(lastAction)return; const next=buildDates().find(d=>!completed.has(iso(d))); if(next){const key=iso(next); completed.add(key); lastAction={key}; save(); document.querySelector('#successNote').hidden=false; render();}});
document.querySelector('#undoBtn').addEventListener('click',()=>{if(lastAction){completed.delete(lastAction.key); lastAction=null; save(); document.querySelector('#successNote').hidden=true; render();}});
document.querySelector('#recordBtn').addEventListener('click',()=>{const input=document.querySelector('#actualDate'), note=document.querySelector('#recordNote'), val=input.value; if(!val){input.setAttribute('aria-invalid','true'); note.textContent='请选择实际理发日期。'; note.hidden=false; return;} if(val<'2027-03-09'||val>'2028-01-25'){input.setAttribute('aria-invalid','true'); note.textContent='日期需在 2027 年 3 月 9 日至 2028 年 1 月 25 日之间。'; note.hidden=false; return;} input.removeAttribute('aria-invalid'); actualBase=new Date(`${val}T00:00:00`); completed.add(val); adjusted.add(val); save(); note.textContent=`已从 ${fmt(actualBase)} 重新安排后续计划。`; note.hidden=false; render();});
document.querySelector('#helpBtn').addEventListener('click',()=>{const el=document.querySelector('#helpNote'); el.hidden=!el.hidden;});
document.querySelector('#cycleBtn').addEventListener('click',()=>{const input=document.querySelector('#cycleDays'), note=document.querySelector('#cycleNote'), value=Number(input.value); if(!Number.isInteger(value)||value<1||value>365){input.setAttribute('aria-invalid','true'); note.textContent='请输入 1 到 365 之间的整数天数。'; note.hidden=false; return;} input.removeAttribute('aria-invalid'); cycleDays=value; const latest=[...completed].sort().at(-1); actualBase=latest?new Date(`${latest}T00:00:00`):new Date(start); lastAction=null; save(); note.textContent=`已更新为每 ${cycleDays} 天理发一次，已完成记录保留，后续计划已重新安排。`; note.hidden=false; render();});
document.querySelector('#cycleDays').value=cycleDays;
document.querySelector('#timeline').addEventListener('click',event=>{const button=event.target.closest('.cancel-record'); if(!button)return; const card=button.closest('.date-card'), key=card.dataset.date; completed.delete(key); adjusted.delete(key); lastAction=null; save(); document.querySelector('#successNote').hidden=true; document.querySelector('#recordNote').hidden=true; render();});
render();
