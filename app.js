/* Межрегионпромстройторгинвестсбервкладбанк — интернет-банк */
const SCRIPT_URL = (window.MRP_CONFIG && window.MRP_CONFIG.scriptUrl) || "";
const STORE_KEY = "mrpstisvb_v2";
const TIME = 600;

/* ===== Утилиты ===== */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const rub = n => Math.round(n).toLocaleString("ru-RU") + " ₽";
const rub2 = n => (Math.round(n*100)/100).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}) + " ₽";
const pct = n => (Math.round(n*100)/100).toLocaleString("ru-RU") + "%";
const num = v => { v = String(v ?? "").replace(/[\s₽%]/g,"").replace("−","-").replace(",","."); return v==="" ? NaN : parseFloat(v); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const near = (v, t, tol) => Number.isFinite(v) && Math.abs(v-t) <= tol;
function hash(str){ let h=1779033703^str.length; for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;} return (h>>>0); }
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function mkRng(seed){
  const r = mulberry(seed);
  return { f:r, int:(a,b)=>a+Math.floor(r()*(b-a+1)), step:(a,b,s)=>a+s*Math.floor(r()*(Math.round((b-a)/s)+1)),
    pick:arr=>arr[Math.floor(r()*arr.length)],
    shuffle:arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;} };
}
function store(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)||"null"); }catch(e){ return null; } }
function fb(ok, title, text){ return `<div class="it ${ok?"":"bad"}"><b>${ok?"✓":"✗"} ${title}</b>${text||""}</div>`; }
function radios(name, opts){ return `<div class="radio">${opts.map(o=>`<label><input type="radio" name="${name}" value="${esc(o.v)}"> ${o.t}</label>`).join("")}</div>`; }
function getRadio(root, name){ const el = $(`input[name="${name}"]:checked`, root); return el ? el.value : null; }
function slider(id, label, min, max, step, val, fmt){ return `<div class="rng"><div class="top"><span>${label}</span><b id="${id}v"></b></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" data-fmt="${fmt||"rub"}"></div>`; }
function showVal(el){ const f=el.dataset.fmt, v=+el.value; $("#"+el.id+"v").textContent = f==="rub"?rub(v):f==="pct"?pct(v):f==="mon"?v+" мес.":f==="yr"?v+(v===1?" год":v<5?" года":" лет"):v; }

/* ===== Формулы вкладов ===== */
function depInc(d, p, Sm, t){
  if(p==="A") return Sm*d.ra*t/1200;
  if(p==="B") return Sm*(Math.pow(1+d.rb/1200,t)-1);
  if(p==="C") return Sm*(Math.pow(1+d.rc/400,Math.floor(t/3))*(1+d.rc/1200*(t%3))-1);
  return Sm*(d.teaser*Math.min(t,3)+d.after*Math.max(0,t-3))/1200;
}

/* ===== Вариант студента ===== */
function genParams(seed){
  const R = mkRng(seed), P = {};
  P.c = { rate:R.step(14,19,0.5), fee:R.pick([490,690,990,1290]), cardLim:R.step(100000,500000,50000), cardFee:R.pick([3900,4900,5900]), term:R.pick([6,12,18,24]) };
  (()=>{ let o, n=0;
    do{
      const S0=R.step(50000,300000,10000), r=R.step(13,19,0.5);
      o={S0, ra:r+R.pick([0.5,1,1.5]), rb:r, rc:r+R.pick([0,0.5]), teaser:r+R.pick([4,5,6]), after:r-R.pick([3,4,5])};
      const v=["A","B","C","D"].map(p=>depInc(o,p,S0,12)).sort((a,b)=>b-a);
      if(v[0]-v[1]>=60) break;
    } while(++n<50);
    o.best=["A","B","C","D"].sort((a,b)=>depInc(o,b,o.S0,12)-depInc(o,a,o.S0,12))[0];
    o.tD=0; for(let t=1;t<=36;t++) if(depInc(o,"D",o.S0,t)>depInc(o,"A",o.S0,t)) o.tD=t;
    o.effB=(Math.pow(1+o.rb/1200,12)-1)*100;
    const Sx=R.step(100000,500000,10000); o.X=Math.round(depInc(o,"C",Sx,12)/1000)*1000;
    o.minC=10000; while(depInc(o,"C",o.minC,12)<o.X) o.minC+=10000;
    P.dep=o;
  })();
  (()=>{ const r1=R.step(8,18,0.5), pi1=Math.max(4,r1-R.step(1,5,0.5));
    const r2=R.step(5,16,0.5), pi2=R.step(5,14,0.5), y2=R.int(2,5);
    const pi3=R.step(6,14,0.5);
    const basket=R.step(20000,80000,1000), r4=R.step(6,16,0.5), pi4=r4+R.pick([-3,-2,-1.5,1.5,2,3]);
    P.inf={r1,pi1,r2,pi2,y2,pi3,basket,r4,pi4,real2:100000*Math.pow((1+r2/100)/(1+pi2/100),y2)};
  })();
  (()=>{ const k=1000, c1=R.step(400,1200,10)*k, c1i=R.step(20,120,5)*k;
    P.ins=[
      {id:"i1", t:`Вклад ${rub(c1)} и начисленные проценты ${rub(c1i)} в одном банке`, a:Math.min(c1+c1i,1400000), e:"Проценты входят в страховую сумму, лимит на один банк — 1,4 млн ₽."},
      {id:"i2", t:`Вклад ${rub(R.step(1600,3500,50)*k)} в одном банке`, a:1400000, e:"Сверх 1,4 млн ₽ АСВ не вернёт. Остаток попадёт в реестр требований к банку."},
      (()=>{const x=R.step(700,1350,10)*k,y=R.step(700,1350,10)*k; return {id:"i3", t:`Вклад ${rub(x)} в банке «Альфа-Омега» и вклад ${rub(y)} в банке «Бета-Гамма». Лицензии отозвали у обоих`, a:x+y, e:"Лимит считается по каждому банку отдельно."};})(),
      (()=>{const x=R.step(700,1300,10)*k,y=R.step(300,900,10)*k; return {id:"i4", t:`В одном банке: вклад ${rub(x)} и накопительный счёт ${rub(y)}`, a:Math.min(x+y,1400000), e:"Все счета в одном банке складываются, лимит 1,4 млн ₽ общий."};})(),
      {id:"i5", t:`Брокерский счёт, на нём акции на ${rub(R.step(100,900,10)*k)}`, a:0, e:"Брокерские счета и ИИС не застрахованы АСВ."},
      {id:"i6", t:`Обезличенный металлический счёт (ОМС): золото на ${rub(R.step(100,800,10)*k)}`, a:0, e:"ОМС не застрахованы."},
      (()=>{const x=R.step(200,1300,10)*k; return {id:"i7", t:`Расчётный счёт индивидуального предпринимателя: ${rub(x)}`, a:x, e:"Деньги ИП застрахованы на тех же условиях."};})(),
      (()=>{const x=R.step(2000,9500,50)*k; return {id:"i8", t:`Месяц назад на счёт поступило наследство — ${rub(x)}`, a:x, e:"Наследство — особый случай, защита до 10 млн ₽ по заявлению с документами."};})(),
      {id:"i9", t:`Вложили ${rub(R.step(100,900,10)*k)} в микрофинансовую организацию под ${R.step(20,30,1)}% годовых`, a:0, e:"Вложения в МФО не страхуются."},
      (()=>{const x=R.step(1500,2800,50)*k; return {id:"i10", t:`Безотзывный сберегательный сертификат на 4 года: ${rub(x)}`, a:x, e:"Сертификаты сроком больше 3 лет страхуются до 2,8 млн ₽."};})()
    ];
  })();
  (()=>{ const k=1000;
    P.fam=[
      {t:"Квартира (рыночная стоимость)", v:R.step(4000,9000,100)*k, c:"a"},
      {t:"Остаток долга по ипотеке", v:R.step(1000,3800,50)*k, c:"l"},
      {t:"Автомобиль (рыночная стоимость)", v:R.step(500,2000,50)*k, c:"a"},
      {t:"Остаток по автокредиту", v:R.step(100,600,10)*k, c:"l"},
      {t:"Банковский вклад", v:R.step(50,600,10)*k, c:"a"},
      {t:"Наличные дома", v:R.step(10,80,5)*k, c:"a"},
      {t:"Долг по кредитной карте", v:R.step(10,120,5)*k, c:"l"},
      {t:"Деньги, занятые у брата", v:R.step(20,200,10)*k, c:"l"},
      {t:"Облигации федерального займа", v:R.step(50,300,10)*k, c:"a"},
      {t:"Зарплата родителей за месяц", v:R.step(90,200,5)*k, c:"n"},
      {t:"Расходы на продукты за месяц", v:R.step(20,45,1)*k, c:"n"}
    ];
  })();
  (()=>{ let b, n=0;
    do{
      b={job:R.step(25000,48000,1000), sch:R.step(2500,6000,500),
        fix:[["Общежитие",R.step(2500,5000,100)],["Транспорт",R.step(1200,2800,100)],["Связь и интернет",R.step(400,900,50)]],
        flex:[["food","Еда",R.step(12000,17000,500),R.step(9000,10500,500)],["clo","Одежда",R.step(2000,4500,500),500],["fun","Развлечения и кафе",R.step(5000,10000,500),1000],["sub","Подписки",R.step(500,1500,100),0]],
        price:R.step(55000,95000,1000), months:R.pick([5,6,7,8])};
      b.inc=b.job+b.sch; b.fixSum=b.fix.reduce((s,e)=>s+e[1],0);
      b.sav0=b.inc-b.fixSum-b.flex.reduce((s,e)=>s+e[2],0);
      b.maxSav=b.inc-b.fixSum-b.flex.reduce((s,e)=>s+e[3],0);
      b.need=Math.ceil(b.price/b.months);
    } while((b.sav0<1500 || b.sav0>=b.need || b.maxSav<b.need+1000) && ++n<200);
    P.bud=b;
  })();
  P.port={S:R.step(80000,200000,10000), pyr:R.pick([25,30,35,40])};
  P.fr={a1:R.step(15000,90000,500), a2:R.step(800,4500,10), a3:R.step(5000,25000,1000), a4:R.step(20000,150000,1000), d:R.int(1,28)};
  P.cmp={fee:R.step(300,4000,50), small:R.step(40000,480000,1000), big:R.step(600000,2500000,10000)};
  (()=>{ const X=R.step(60000,140000,1000), Y=R.step(10000,80000,1000); const ex=Math.min(Y,Math.max(0,X+Y-100000)); P.sbp={X,Y,com:Math.min(ex*0.005,1500)}; })();
  P.order={t1:R.shuffle([...Array(12).keys()]), t5:R.shuffle([...Array(10).keys()]), t6:R.shuffle([...Array(11).keys()]), t9:R.shuffle([...Array(9).keys()]), t10:R.shuffle([...Array(7).keys()]), t11:R.shuffle([...Array(7).keys()])};
  return P;
}

/* ===== Операции ===== */
const T = [];

/* 1 */
T.push({ title:"Проверка контрагентов", sub:"Финансовые институты", memo:1, max:12, build(P){
  const cats=[["bank","Банк"],["ins","Страховая компания"],["npf","Пенсионный фонд (НПФ)"],["mfo","МФО"],["brk","Брокер"],["reg","Регулятор"],["ill","Нелегальная организация"]];
  const it=[
    ["Сберегательный дом «Копейка»","принимает вклады граждан, открывает счета, выдаёт кредиты","bank",1],
    ["Уральский расчётный","ведёт счета предпринимателей, выдаёт ипотеку, участвует в системе страхования вкладов","bank",1],
    ["Надёжный щит","продаёт полисы ОСАГО и страхования жизни","ins",1],
    ["Автостраж","страхует автомобили по КАСКО и квартиры от пожара","ins",1],
    ["Пенсионный резерв","копит пенсионные накопления и выплачивает негосударственную пенсию","npf",1],
    ["Будущее+","принимает взносы по программе долгосрочных сбережений","npf",1],
    ["Быстрозайм","выдаёт займы до 30 000 ₽ на две недели под 0,8% в день","mfo",1],
    ["Кредит на карту 24","займы онлайн за 5 минут, микрофинансовая компания","mfo",1],
    ["ИнвестКурс","открывает брокерские счета и ИИС, покупает акции по поручению клиента","brk",1],
    ["Банк России","выдаёт и отзывает лицензии, устанавливает ключевую ставку","reg",2],
    ["Финансовый прорыв","обещает 30% в месяц и бонус за каждого приглашённого друга","ill",0],
    ["Крипто-Миллион","гарантирует 5% в день от «торговли криптовалютой», зарегистрирован за границей","ill",0]
  ];
  const html=`<p>Прежде чем работать с организацией, банк проверяет её. Определите тип каждой организации. Чтобы отличить законную от нелегальной, пользуйтесь поиском по справочнику.</p>
  <div class="calc"><b>🔍 Справочник участников финансового рынка</b>
  <div style="display:flex;gap:6px;margin-top:6px"><input id="sq" placeholder="Название организации"><button class="btn" id="sb" style="margin:0">Найти</button></div>
  <div id="sr" class="hint" style="margin-top:6px">Введите название и нажмите «Найти».</div></div>
  ${P.order.t1.map(i=>`<div class="q"><div class="qt">«${it[i][0].replace(/[«»]/g,"")}»: ${it[i][1]}</div><select data-i="${i}"><option value="">— выберите тип —</option>${cats.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join("")}</select></div>`).join("")}`;
  return { html, init(root){
    const go=()=>{ const q=$("#sq",root).value.trim().toLowerCase().replace(/[«»"]/g,""); const out=$("#sr",root);
      if(q.length<3){ out.textContent="Введите хотя бы 3 буквы."; return; }
      const f=it.filter(x=>x[0].toLowerCase().replace(/[«»]/g,"").includes(q));
      out.innerHTML = !f.length ? `<span style="color:#c00;font-weight:bold">По запросу «${esc(q)}» ничего не найдено. Лицензии у такой организации нет.</span>` :
        f.map(x=>x[3]===1?`<span style="color:#2a8a2a;font-weight:bold">«${x[0].replace(/[«»]/g,"")}» — лицензия Банка России действует.</span>`:x[3]===2?`<b>Банк России сам ведёт этот справочник.</b>`:`<span style="color:#c00;font-weight:bold">«${x[0].replace(/[«»]/g,"")}» — в справочнике не значится.</span>`).join("<br>"); };
    $("#sb",root).onclick=go; $("#sq",root).addEventListener("keydown",e=>{ if(e.key==="Enter") go(); });
  }, check(root){
    let s=0, f="", ans={};
    P.order.t1.forEach(i=>{ const v=$(`select[data-i="${i}"]`,root).value; ans[i]=v; if(v===it[i][2]) s++; else f+=fb(false,it[i][0],`Правильно: ${cats.find(c=>c[0]===it[i][2])[1]}.`); });
    if(!f) f=fb(true,"Все организации определены верно","");
    return {score:s, ans, fb:f};
  }};
}});

/* 2 */
T.push({ title:"Договор мелким шрифтом", sub:"Права потребителя, навязанные услуги", memo:3, max:12, build(P){
  const c=P.c;
  const cls=[
    [`Банк принимает денежные средства Вкладчика во вклад «Долгий-Предолгий» на срок ${c.term} месяцев.`,0],
    [`Процентная ставка по вкладу — ${pct(c.rate)} годовых. Проценты капитализируются ежемесячно.`,0],
    [`Вклад можно пополнять в течение первых 30 дней срока.`,0],
    [`Банк является участником системы обязательного страхования вкладов.`,0],
    [`Банк вправе в одностороннем порядке снизить процентную ставку по вкладу в любой момент срока, уведомив Вкладчика сообщением в мобильном приложении.`,1,"Банк не вправе в одностороннем порядке уменьшать проценты по срочному вкладу гражданина (ст. 838 ГК РФ)."],
    [`При досрочном расторжении проценты выплачиваются по ставке 0,01% годовых.`,1,"Это законно, но знать об этом нужно заранее: снимете деньги раньше срока — потеряете почти весь доход."],
    [`За обслуживание вклада Банк ежемесячно списывает комиссию ${rub(c.fee)} с суммы вклада.`,1,"Плата за «обслуживание вклада» съедает доход."],
    [`Налог на доходы по вкладу удерживается в порядке, установленном Налоговым кодексом РФ.`,0],
    [`Подписывая договор, Вкладчик соглашается на выпуск кредитной карты с лимитом ${rub(c.cardLim)} и годовым обслуживанием ${rub(c.cardFee)}.`,1,"Навязанная услуга: кредитку оформляют вместе с вкладом без отдельного согласия."],
    [`Часть суммы размещается по программе инвестиционного страхования жизни «Наследие-Премиум»; на эту часть страхование вкладов не распространяется, доходность не гарантирована.`,1,"Это не вклад, а страховой продукт с риском, АСВ его не страхует."],
    [`По окончании срока вклад переводится на счёт «Пенсионер+» под 0,01% годовых без уведомления Вкладчика.`,1,"Если вовремя не забрать вклад, деньги будут лежать почти без процентов."],
    [`Споры разрешаются путём переговоров, а при недостижении согласия — в порядке, установленном законодательством РФ.`,0]
  ];
  const html=`<p>Менеджер положил перед вами договор: «Подпишите вот здесь, там всё стандартно». Найдите пункты, которые невыгодны клиенту или нарушают его права, и нажмите на них. Повторное нажатие снимает отметку, за лишние отметки снимаются баллы.</p>
  <button class="btn" id="zoom" style="margin:0 0 8px">🔍 Лупа: увеличить мелкий шрифт</button>
  <div class="contract" id="ctr"><h3>ДОГОВОР БАНКОВСКОГО ВКЛАДА № ${100000+c.fee*37}</h3>
  ${cls.map((x,i)=>`<div class="cl ${i>3?"small":""}" data-i="${i}">${x[0]}</div>`).join("")}
  <p style="margin-top:14px">Вкладчик ____________ /подпись/ &nbsp;&nbsp; М.П.</p></div>
  <p class="hint">Отмечено пунктов: <b id="selN">0</b></p>`;
  return { html, init(root){
    $$(".cl",root).forEach(el=>el.onclick=()=>{ el.classList.toggle("sel"); $("#selN",root).textContent=$$(".cl.sel",root).length; });
    $("#zoom",root).onclick=()=>$("#ctr",root).classList.toggle("zoom");
  }, check(root){
    const sel=$$(".cl.sel",root).map(e=>+e.dataset.i); let s=0, f="";
    cls.forEach((x,i)=>{ const m=sel.includes(i);
      if(x[1]&&m){ s+=2; f+=fb(true,`Пункт ${i+1}`,x[2]); }
      else if(x[1]) f+=fb(false,`Пункт ${i+1} пропущен`,x[2]);
      else if(m){ s-=1; f+=fb(false,`Пункт ${i+1} отмечен зря`,"Это обычное условие договора."); } });
    return {score:Math.max(0,s), ans:{sel}, fb:f};
  }};
}});

/* 3 */
T.push({ title:"Депозитный калькулятор", sub:"Банковский вклад, процентная ставка", memo:3, max:10, build(P){
  const d=P.dep;
  const pr={A:["«Простой»",d.ra,"проценты в конце срока, без капитализации"],B:["«Снежный ком»",d.rb,"капитализация каждый месяц"],C:["«Квартальный»",d.rc,"капитализация раз в квартал"],D:[`«До ${String(d.teaser).replace(".",",")}%»`,d.teaser,`${pct(d.teaser)} первые 3 месяца, затем ${pct(d.after)}, без капитализации`]};
  const html=`<p>Это калькулятор вкладов банка. Выберите вклад, двигайте ползунки и отвечайте на вопросы. Все расчёты — без налога.</p>
  <div class="calc"><div class="tabs">${Object.keys(pr).map(k=>`<button data-p="${k}" class="${k==="A"?"on":""}">${k}: ${pr[k][0]}</button>`).join("")}</div>
  <p id="pd" style="margin:8px 0" class="hint"></p>
  ${slider("ds","Сумма вклада",10000,1000000,10000,d.S0)}
  ${slider("dt","Срок",1,36,1,12,"mon")}
  <div class="res"><div><small>Доход</small><b id="r1"></b></div><div><small>Сумма в конце срока</small><b id="r2"></b></div><div><small>Эффективная ставка</small><b id="r3"></b></div></div>
  <div class="growth" id="gr"></div><p class="hint">Синее — ваши деньги, жёлтое — начисленные проценты, по месяцам.</p></div>
  <div class="q"><div class="qt">1. Сумма ${rub(d.S0)}, срок 12 месяцев. Какой вклад принесёт больше всего?</div>${radios("q1",["A","B","C","D"].map(k=>({v:k,t:"Вклад "+k})))}</div>
  <div class="q"><div class="qt">2. Сколько рублей принесёт этот вклад за 12 месяцев?</div><input inputmode="decimal" id="q2"></div>
  <div class="q"><div class="qt">3. Какая эффективная ставка у вклада B за 12 месяцев, %? (два знака после запятой)</div><input inputmode="decimal" id="q3"></div>
  <div class="q"><div class="qt">4. Сумма ${rub(d.S0)}. При каком наибольшем сроке (в месяцах) вклад D приносит больше, чем вклад A?</div><input inputmode="numeric" id="q4"></div>
  <div class="q"><div class="qt">5. Какую наименьшую сумму (кратную 10 000 ₽) нужно положить на вклад C на 12 месяцев, чтобы получить доход не меньше ${rub(d.X)}?</div><input inputmode="numeric" id="q5"></div>`;
  return { html, init(root){
    let p="A";
    const upd=()=>{ const Sm=+$("#ds",root).value, t=+$("#dt",root).value; showVal($("#ds",root)); showVal($("#dt",root));
      const inc=depInc(d,p,Sm,t); $("#pd",root).textContent=`${pr[p][0]}: ${pct(pr[p][1])} годовых, ${pr[p][2]}.`;
      $("#r1",root).textContent=rub(inc); $("#r2",root).textContent=rub(Sm+inc); $("#r3",root).textContent=pct((Math.pow(1+inc/Sm,12/t)-1)*100);
      const mx=Sm+depInc(d,p,Sm,36)*1.02;
      $("#gr",root).innerHTML=[...Array(t)].map((_,m)=>{const v=depInc(d,p,Sm,m+1);return `<span style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><i style="height:${v/mx*100}%;flex:none"></i><i class="base" style="height:${Sm/mx*100}%;flex:none"></i></span>`;}).join(""); };
    $$(".tabs button",root).forEach(b=>b.onclick=()=>{ p=b.dataset.p; $$(".tabs button",root).forEach(x=>x.classList.toggle("on",x===b)); upd(); });
    $$("input[type=range]",root).forEach(r=>r.addEventListener("input",upd)); upd();
  }, check(root){
    let s=0, f="", ans={}; const best=depInc(d,d.best,d.S0,12);
    const a1=getRadio(root,"q1"), a2=num($("#q2",root).value), a3=num($("#q3",root).value), a4=num($("#q4",root).value), a5=num($("#q5",root).value);
    const o1=a1===d.best, o2=near(a2,best,5), o3=near(a3,d.effB,0.06), o4=a4===d.tD, o5=a5===d.minC;
    s=(o1?2:0)+(o2?2:0)+(o3?2:0)+(o4?2:0)+(o5?2:0);
    f+=fb(o1,`1. Самый выгодный — вклад ${d.best}`,"Вклад D заманивает высокой ставкой, но она действует только три месяца.");
    f+=fb(o2,`2. Доход: ${rub(best)}`,"");
    f+=fb(o3,`3. Эффективная ставка вклада B: ${pct(d.effB)}`,`Номинальная ставка ${pct(d.rb)}, капитализация добавляет сверху.`);
    f+=fb(o4,`4. Вклад D выгоднее до ${d.tD} мес. включительно`,"Дальше низкая ставка после первых трёх месяцев тянет доход вниз.");
    f+=fb(o5,`5. Минимум на вклад C: ${rub(d.minC)}`,"");
    Object.assign(ans,{a1,a2,a3,a4,a5});
    return {score:s, ans, fb:f};
  }};
}});

/* 4 */
T.push({ title:"Машина времени для денег", sub:"Инфляция, реальная доходность", memo:4, max:8, build(P){
  const f=P.inf;
  const real1=((1+f.r1/100)/(1+f.pi1/100)-1)*100, dep4=f.basket*(1+f.r4/100), price4=f.basket*(1+f.pi4/100);
  const html=`<p>Калькулятор показывает, сколько будут стоить ваши 100 000 ₽ через несколько лет, если пересчитать их в сегодняшние цены. Вклад с ежегодной капитализацией.</p>
  <div class="calc">${slider("ir","Ставка по вкладу",0,25,0.5,10,"pct")}${slider("ip","Инфляция в год",0,25,0.5,8,"pct")}${slider("iy","Срок",1,10,1,3,"yr")}
  <div class="res"><div><small>На счёте</small><b id="o1"></b></div><div><small>В сегодняшних ценах</small><b id="o2"></b></div><div><small>Реальная ставка</small><b id="o3"></b></div></div>
  <p style="margin:8px 0 3px" id="o4"></p><div class="meter" id="om"><i></i></div></div>
  <div class="q"><div class="qt">1. Ставка ${pct(f.r1)}, инфляция ${pct(f.pi1)}. Какая реальная ставка, %?</div><input inputmode="decimal" id="q1"></div>
  <div class="q"><div class="qt">2. 100 000 ₽ положили на ${f.y2} ${f.y2<5?"года":"лет"} под ${pct(f.r2)} при инфляции ${pct(f.pi2)} в год. Сколько это будет в сегодняшних ценах, ₽?</div><input inputmode="decimal" id="q2"></div>
  <div class="q"><div class="qt">3. Инфляция ${pct(f.pi3)} в год. Подберите на калькуляторе наименьшую ставку (шаг 0,5), при которой сбережения не теряют покупательную способность. Ставка, %:</div><input inputmode="decimal" id="q3"></div>
  <div class="q"><div class="qt">4. Ноутбук стоит ${rub(f.basket)}. Вы кладёте эту сумму на год под ${pct(f.r4)}, цены за год растут на ${pct(f.pi4)}. Хватит ли через год денег со вклада на такой же ноутбук?</div>${radios("q4",[{v:"yes",t:"хватит"},{v:"no",t:"не хватит"}])}</div>`;
  return { html, init(root){
    const upd=()=>{ $$("input[type=range]",root).forEach(showVal); const r=+$("#ir",root).value, p=+$("#ip",root).value, y=+$("#iy",root).value;
      const nom=100000*Math.pow(1+r/100,y), real=nom/Math.pow(1+p/100,y), rr=((1+r/100)/(1+p/100)-1)*100;
      $("#o1",root).textContent=rub(nom); $("#o2",root).textContent=rub(real); $("#o3",root).textContent=pct(rr);
      $("#o4",root).textContent=`Сегодня на 100 000 ₽ можно купить 500 чашек кофе по 200 ₽. Через ${y} ${y===1?"год":y<5?"года":"лет"} на деньги со вклада — ${Math.floor(real/200)} таких чашек.`;
      const m=$("#om",root); m.classList.toggle("red",real<100000); $("i",m).style.width=Math.min(100,real/2000)+"%"; };
    $$("input[type=range]",root).forEach(r=>r.addEventListener("input",upd)); upd();
  }, check(root){
    let s=0, F="", ans={};
    const a1=num($("#q1",root).value), a2=num($("#q2",root).value), a3=num($("#q3",root).value), a4=getRadio(root,"q4");
    const o1=near(a1,real1,0.15)||near(a1,f.r1-f.pi1,0.15), o2=near(a2,f.real2,60), o3=near(a3,f.pi3,0.01), r4=dep4>=price4?"yes":"no", o4=a4===r4;
    s=(o1?2:0)+(o2?2:0)+(o3?2:0)+(o4?2:0);
    F+=fb(o1,`1. ≈ ${pct(f.r1-f.pi1)} (точно ${pct(real1)})`,"");
    F+=fb(o2,`2. ≈ ${rub(f.real2)}`,f.r2<f.pi2?"Ставка ниже инфляции: в рублях денег больше, а купить на них можно меньше.":"Ставка выше инфляции, сбережения растут и в реальном выражении.");
    F+=fb(o3,`3. ${pct(f.pi3)}`,"Ставка должна быть не ниже инфляции.");
    F+=fb(o4,`4. ${r4==="yes"?"Хватит":"Не хватит"}`,`Через год на вкладе ${rub(dep4)}, ноутбук будет стоить ${rub(price4)}.`);
    Object.assign(ans,{a1,a2,a3,a4});
    return {score:s, ans, fb:F};
  }};
}});

/* 5 */
T.push({ title:"Застрахован или нет?", sub:"Государственное страхование вкладов", memo:5, max:10, build(P){
  const it=P.ins;
  const html=`<p class="box y">⚠ Срочное сообщение: у ряда банков отозвана лицензия. Все они участвовали в системе страхования вкладов. Сколько вернёт Агентство по страхованию вкладов в каждом случае? Если ничего — пишите 0.</p>
  ${P.order.t5.map(i=>`<div class="q"><div class="qt">${it[i].t}</div><input inputmode="decimal" data-i="${i}" placeholder="Сумма, ₽"></div>`).join("")}`;
  return { html, check(root){
    let s=0, f="", ans={};
    P.order.t5.forEach(i=>{ const v=num($(`input[data-i="${i}"]`,root).value); ans[it[i].id]=v; const ok=near(v,it[i].a,1); if(ok) s++; f+=fb(ok,`${it[i].t} → ${rub(it[i].a)}`,it[i].e); });
    return {score:s, ans, fb:f};
  }};
}});

/* 6 */
T.push({ title:"Баланс семьи", sub:"Финансовые активы и обязательства", memo:6, max:15, build(P){
  const it=P.fam, A=it.filter(x=>x.c==="a").reduce((s,x)=>s+x.v,0), L=it.filter(x=>x.c==="l").reduce((s,x)=>s+x.v,0);
  const html=`<p>Семья Длинноименовых пришла за ипотекой, и банку нужен их баланс. Разложите каждую строку: актив, обязательство или ни то ни другое. Табло сверху считает суммы по вашей раскладке.</p>
  <div class="ledger"><div class="A">Активы<b id="sA">0 ₽</b></div><div class="L">Обязательства<b id="sL">0 ₽</b></div></div>
  ${P.order.t6.map(i=>`<div class="sortcard" data-i="${i}"><b>${it[i].t}</b>: ${rub(it[i].v)}<div class="row"><button data-c="a" class="a">Актив</button><button data-c="l" class="l">Обязательство</button><button data-c="n" class="n">Ни то ни другое</button></div></div>`).join("")}
  <div class="q"><div class="qt">Чистый капитал семьи, ₽</div><input inputmode="decimal" id="net"></div>
  <div class="q"><div class="qt">Долговая нагрузка (обязательства / активы × 100), % с точностью до десятых</div><input inputmode="decimal" id="dl"></div>`;
  return { html, init(root){
    const pick={}; root._pick=pick;
    $$(".sortcard",root).forEach(c=>$$("button",c).forEach(b=>b.onclick=()=>{ pick[c.dataset.i]=b.dataset.c; $$("button",c).forEach(x=>x.classList.toggle("on",x===b));
      let a=0,l=0; Object.entries(pick).forEach(([i,v])=>{ if(v==="a")a+=it[i].v; if(v==="l")l+=it[i].v; }); $("#sA",root).textContent=rub(a); $("#sL",root).textContent=rub(l); }));
  }, check(root){
    const pick=root._pick||{}; let s=0, f="", nm={a:"актив",l:"обязательство",n:"ни то ни другое"};
    it.forEach((x,i)=>{ if(pick[i]===x.c) s++; else f+=fb(false,x.t,`Правильно: ${nm[x.c]}.${x.c==="n"?" Это поток денег за месяц, а не имущество или долг.":""}`); });
    const net=num($("#net",root).value), dl=num($("#dl",root).value), o1=near(net,A-L,1), o2=near(dl,L/A*100,0.15);
    if(o1) s+=2; if(o2) s+=2;
    f+=fb(o1,`Чистый капитал: ${rub(A)} − ${rub(L)} = ${rub(A-L)}`,"");
    f+=fb(o2,`Долговая нагрузка: ${pct(Math.round(L/A*1000)/10)}`,"");
    return {score:s, ans:{pick,net,dl}, fb:f};
  }};
}});

/* 7 */
T.push({ title:"Планировщик бюджета", sub:"Сбережения, норма сбережений", memo:7, max:8, build(P){
  const b=P.bud, rate0=b.sav0/b.inc*100;
  const html=`<p>Студентка Ульяна хочет ноутбук за ${rub(b.price)} через ${b.months} мес. Сейчас её бюджет такой:</p>
  <table class="t"><tr><th>Доходы</th><th></th></tr><tr><td>Подработка</td><td class="n">${rub(b.job)}</td></tr><tr><td>Стипендия</td><td class="n">${rub(b.sch)}</td></tr>
  <tr><th>Расходы</th><th></th></tr>${b.fix.map(e=>`<tr><td>${e[0]}</td><td class="n">${rub(e[1])}</td></tr>`).join("")}${b.flex.map(e=>`<tr><td>${e[1]}</td><td class="n">${rub(e[2])}</td></tr>`).join("")}</table>
  <div class="q"><div class="qt">1. Какая у Ульяны сейчас норма сбережений, %? (с точностью до десятых)</div><input inputmode="decimal" id="q1"></div>
  <div class="q"><div class="qt">2. Сколько нужно откладывать в месяц, чтобы купить ноутбук вовремя, ₽? (округлите вверх до рубля)</div><input inputmode="decimal" id="q2"></div>
  <div class="q"><div class="qt">3. Перестройте бюджет ползунками так, чтобы Ульяна успела накопить на ноутбук. Ниже нижней границы ползунок не опустится: меньше на еду она тратить не может, а без одежды и развлечений долго не выдержит.</div>
  <div class="calc">${b.flex.map(e=>slider("b_"+e[0],e[1],e[3],e[2]+3000,100,e[2])).join("")}
  <div class="res"><div><small>Расходы</small><b id="x1"></b></div><div><small>Сбережения в месяц</small><b id="x2"></b></div><div><small>Норма сбережений</small><b id="x3"></b></div><div><small>Накопит на ноутбук за</small><b id="x4"></b></div></div>
  <p style="margin:8px 0 3px">Прогресс к цели за ${b.months} мес.:</p><div class="meter" id="xm"><i></i></div></div></div>`;
  const cur=root=>b.flex.reduce((s,e)=>s+(+$("#b_"+e[0],root).value),0);
  return { html, init(root){
    const upd=()=>{ $$("input[type=range]",root).forEach(showVal); const ex=b.fixSum+cur(root), sav=b.inc-ex;
      $("#x1",root).textContent=rub(ex); $("#x2",root).textContent=rub(sav); $("#x3",root).textContent=pct(Math.round(sav/b.inc*1000)/10);
      $("#x4",root).textContent= sav>0 ? Math.ceil(b.price/sav)+" мес." : "никогда";
      const pr=Math.max(0,Math.min(100,sav*b.months/b.price*100)); const m=$("#xm",root); m.classList.toggle("red",pr<100); $("i",m).style.width=pr+"%"; };
    $$("input[type=range]",root).forEach(r=>r.addEventListener("input",upd)); upd();
  }, check(root){
    let s=0, f=""; const a1=num($("#q1",root).value), a2=num($("#q2",root).value), sav=b.inc-b.fixSum-cur(root);
    const o1=near(a1,rate0,0.15), o2=near(a2,b.need,1), o3=sav>=b.need;
    s=(o1?2:0)+(o2?2:0)+(o3?4:0);
    f+=fb(o1,`1. Норма сбережений сейчас: ${pct(Math.round(rate0*10)/10)}`,`${rub(b.sav0)} / ${rub(b.inc)} × 100.`);
    f+=fb(o2,`2. Нужно откладывать ${rub(b.need)} в месяц`,`${rub(b.price)} / ${b.months}.`);
    f+=fb(o3,`3. По новому бюджету Ульяна откладывает ${rub(sav)} в месяц`, o3?"Успевает к сроку.":"Не успевает: сократите необязательные расходы сильнее.");
    const vals={}; b.flex.forEach(e=>vals[e[0]]=+$("#b_"+e[0],root).value);
    return {score:s, ans:{a1,a2,vals}, fb:f};
  }};
}});

/* 8 */
T.push({ title:"Инвестиционный портфель", sub:"Риск финансовых вложений", memo:8, max:15, build(P){
  const S0=P.port.S;
  const ins=[["dep","Банковский вклад"],["ofz","Облигации федерального займа"],["stk","Акции"],["cry","Криптовалюта"],["pyr",`«Проект» под ${P.port.pyr}% в месяц`]];
  const signs=[["Гарантируют доход намного выше ставок по вкладам",1],["Платят бонусы за привлечение новых участников",1],["Нет лицензии Банка России",1],["Торопят: «осталось два места», «только сегодня»",1],["Есть в Справочнике участников финансового рынка",0],["Честно пишут, что доходность не гарантирована",0]];
  const html=`<div class="q"><div class="qt">1. Расставьте инструменты по риску: 1 — самый низкий, 5 — самый высокий.</div>
  ${ins.map(x=>`<div style="display:grid;grid-template-columns:minmax(0,1fr) 90px;gap:8px;align-items:center;margin:4px 0"><span>${x[1]}</span><select data-r="${x[0]}"><option value="">—</option>${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join("")}</select></div>`).join("")}</div>
  <div class="q"><div class="qt">2. У вас ${rub(S0)}. Ровно через год этими деньгами нужно оплатить учёбу, терять их нельзя. Распределите всю сумму ползунками и проверьте портфель кнопкой «Прокрутить год».</div>
  <div class="calc">${ins.map(x=>slider("p_"+x[0],x[1],0,S0,1000,0)).join("")}
  <p class="sumline" id="ps" style="font-weight:bold"></p>
  <button class="btn" id="sim" style="margin-top:4px">▶ Прокрутить год</button><div id="simr" class="hint" style="margin-top:6px"></div></div></div>
  <div class="q"><div class="qt">3. Отметьте признаки финансовой пирамиды.</div><div class="chk">${signs.map((x,i)=>`<label><input type="checkbox" data-s="${i}"> ${x[0]}</label>`).join("")}</div></div>`;
  const ret={dep:()=>0.14, ofz:R=>0.08+R()*0.06, stk:R=>-0.3+R()*0.7, cry:R=>-0.7+R()*2.2, pyr:R=>R()<0.75?-1:P.port.pyr*0.12};
  const get=root=>{ const a={}; ins.forEach(x=>a[x[0]]=+$("#p_"+x[0],root).value); return a; };
  return { html, init(root){
    const upd=()=>{ $$("input[type=range]",root).forEach(showVal); const a=get(root), t=Object.values(a).reduce((s,v)=>s+v,0), el=$("#ps",root);
      el.textContent= t===S0?`Распределено ${rub(t)} — вся сумма.`: t<S0?`Осталось распределить ${rub(S0-t)}.`:`Перебор на ${rub(t-S0)}.`; el.style.color=t===S0?"#2a8a2a":"#c00"; };
    $$("input[type=range]",root).forEach(r=>r.addEventListener("input",upd)); upd();
    $("#sim",root).onclick=()=>{ const a=get(root), R=Math.random; const runs=[...Array(5)].map(()=>Object.keys(a).reduce((s,k)=>s+a[k]*(1+ret[k](R)),0));
      const t=Object.values(a).reduce((s,v)=>s+v,0); runs.sort((x,y)=>x-y);
      $("#simr",root).innerHTML=`Пять случайных вариантов года: ${runs.map(v=>`<b style="color:${v<t?"#c00":"#2a8a2a"}">${rub(v)}</b>`).join(", ")}. Худший: ${rub(runs[0])}.`; };
  }, check(root){
    let s=0, f="", ans={rank:{},signs:[]}; const right={dep:1,ofz:2,stk:3,cry:4,pyr:5};
    let rk=0; ins.forEach(x=>{ const v=+$(`select[data-r="${x[0]}"]`,root).value; ans.rank[x[0]]=v; if(v===right[x[0]]) rk++; });
    s+=rk; f+=fb(rk===5,`1. Вклад → ОФЗ → акции → криптовалюта → «проект» (${rk} из 5)`,"");
    const a=get(root); ans.alloc=a; const t=Object.values(a).reduce((x,v)=>x+v,0); let ps=0, notes=[];
    if(t!==S0) notes.push(`Распределено ${rub(t)} вместо ${rub(S0)}, пункт не засчитан.`);
    else{ if(a.pyr===0) ps+=2; else notes.push("В «проект» нельзя вкладывать ничего."); if((a.dep+a.ofz)/S0>=0.8) ps+=3; else notes.push("Деньги, нужные через год, держат в надёжных инструментах: не меньше 80% во вкладе и ОФЗ."); if(a.cry/S0<=0.05) ps+=1; else notes.push("Криптовалюта для такой цели слишком рискованна."); }
    s+=ps; f+=fb(ps===6,`2. Портфель: ${ps} из 6`,notes.join(" "));
    let ss=0; signs.forEach((x,i)=>{ const c=$(`input[data-s="${i}"]`,root).checked; if(c){ ans.signs.push(i); ss+=x[1]?1:-1; } });
    ss=Math.max(0,ss); s+=ss; f+=fb(ss===4,`3. Признаки пирамиды: ${ss} из 4`,"Гарантия высокого дохода, бонусы за приглашённых, нет лицензии, спешка.");
    return {score:s, ans, fb:f};
  }};
}});

/* 9 */
T.push({ title:"Антифрод", sub:"Финансовое мошенничество", memo:9, max:18, build(P){
  const f=P.fr, bank="Межрегионпромстройторгинвестсбервкладбанк";
  const acts=[["hang","Положить трубку, перезвонить в банк по номеру с карты"],["link","Не открывать ссылку, удалить сообщение"],["app","Проверить в официальном приложении банка"],["voice","Связаться с человеком другим способом"],["code","Продиктовать или ввести код"],["pay","Перевести деньги"],["none","Ничего не делать, всё в порядке"]];
  const M=[
    ["📞 Входящий: +7 9xx xxx-xx-xx",`Здравствуйте, служба безопасности ${bank}. С вашей карты пытаются перевести ${rub(f.a1)}. Чтобы отменить операцию, продиктуйте код из СМС.`,"fraud",["hang"],"Сотрудник банка никогда не спрашивает коды из СМС."],
    ["🔔 Приложение банка",`Покупка ${rub(f.a2)}. Продукты «У дома». Баланс обновлён.`,"real",["none","app"],"Уведомление о вашей покупке. Если покупку вы не делали — проверьте в приложении и заблокируйте карту."],
    ["📞 Входящий: «Банк России»",`Я сотрудник Центрального банка. На вас пытаются оформить кредит. Срочно переведите сбережения на безопасный счёт.`,"fraud",["hang"],"У Банка России нет «безопасных счетов» для граждан."],
    ["✉ Мессенджер: Дима (одногруппник)",`Привет, срочно займи ${rub(f.a3)}, завтра верну! Скинь на эту карту, она мамина.`,"fraud",["voice"],"Аккаунт друга могли взломать. Позвоните ему голосом."],
    ["✉ СМС: MRPST-BONUS",`Вам начислена компенсация ${rub(f.a4)}! Получите до конца дня: mrpstisvb-kompensaciya.ru/get`,"fraud",["link"],"Фишинговая ссылка на поддельный сайт."],
    ["🔔 Чат в приложении банка",`Срок вашего вклада «Долгий-Предолгий» заканчивается ${f.d} декабря. Продлить его можно в разделе «Вклады».`,"real",["app","none"],"Сообщение в официальном приложении, ничего срочного не требует."],
    ["📞 Входящий: «Госуслуги»",`Ваш аккаунт на Госуслугах взломали. Чтобы мы его восстановили, назовите код, который сейчас придёт.`,"fraud",["hang"],"Код от Госуслуг даёт доступ к аккаунту, его никому не называют."],
    ["📞 Входящий: «Курьерская служба»",`Вам доставка новой банковской карты. Для подтверждения времени доставки продиктуйте код из СМС.`,"fraud",["hang"],"Это код для входа в ваш банк или Госуслуги."],
    ["📞 Номер с обратной стороны вашей карты",`Мы приостановили перевод ${rub(f.a1)} незнакомому получателю. Если это были вы — подтвердите операцию в приложении. Коды сообщать не нужно.`,"real",["app","hang"],"Банк вправе приостановить подозрительный перевод. Кодов он не просит."]
  ];
  const ord=P.order.t9;
  const html=`<p>Ваш телефон за один день. Для каждого сообщения решите, кто пишет, и что делать. Листайте кнопками ◀ ▶.</p>
  <div class="phone"><div class="meta"><span>МРП-Мобайл</span><span>▂▄▆ 🔋</span></div><div class="prog" id="pg"></div><div class="scr" id="ps"></div>
  <div class="pbtn" id="pv"><button data-v="real">✔ Всё нормально</button><button data-v="fraud">⚠ Мошенники</button></div>
  <div class="acts" id="pa">${acts.map(a=>`<button data-a="${a[0]}">${a[1]}</button>`).join("")}</div>
  <div class="pbtn"><button id="pp">◀ Назад</button><button id="pn">Далее ▶</button></div></div>`;
  return { html, init(root){
    const ans={}; root._ans=ans; let k=0;
    const draw=()=>{ const i=ord[k], m=M[i], a=ans[i]||[];
      $("#pg",root).textContent=`Сообщение ${k+1} из ${ord.length} · отвечено ${Object.values(ans).filter(x=>x[0]&&x[1]).length}`;
      $("#ps",root).innerHTML=`<div style="font-weight:bold;margin-bottom:4px">${m[0]}</div>${m[1]}`;
      $$("#pv button",root).forEach(b=>b.classList.toggle("on",b.dataset.v===a[0]));
      $$("#pa button",root).forEach(b=>b.classList.toggle("on",b.dataset.a===a[1])); };
    $$("#pv button",root).forEach(b=>b.onclick=()=>{ const i=ord[k]; ans[i]=[b.dataset.v,(ans[i]||[])[1]]; draw(); });
    $$("#pa button",root).forEach(b=>b.onclick=()=>{ const i=ord[k]; ans[i]=[(ans[i]||[])[0],b.dataset.a]; draw(); });
    $("#pp",root).onclick=()=>{ k=(k+ord.length-1)%ord.length; draw(); };
    $("#pn",root).onclick=()=>{ k=(k+1)%ord.length; draw(); };
    draw();
  }, check(root){
    const ans=root._ans||{}; let s=0, F="";
    ord.forEach(i=>{ const m=M[i], a=ans[i]||[], o1=a[0]===m[2], o2=m[3].includes(a[1]); s+=(o1?1:0)+(o2?1:0);
      F+=fb(o1&&o2,`${m[0]}: ${m[2]==="fraud"?"мошенники":"настоящее"}`,`${m[4]} Что делать: ${acts.find(x=>x[0]===m[3][0])[1].toLowerCase()}.`); });
    return {score:s, ans, fb:F};
  }};
}});

/* 10 */
T.push({ title:"Куда жаловаться", sub:"Защита прав потребителей", memo:10, max:14, build(P){
  const c=P.cmp;
  const to=[["bank","Претензия в сам банк"],["fu","Финансовый уполномоченный"],["cbr","Интернет-приёмная Банка России"],["court","Сразу в суд"],["fssp","ФССП"],["police","Полиция"]];
  const Q=[
    [`Банк списал с карты комиссию ${rub(c.fee)}, которой нет в тарифах. Вы ещё никуда не обращались.`,"bank","Сначала письменная претензия в банк."],
    [`Вы направили банку претензию о возврате ${rub(c.small)}. Банк отказал.`,"fu","Споры до 500 000 ₽ до суда рассматривает финансовый уполномоченный, бесплатно."],
    [`Банк отказался вернуть ${rub(c.big)}, претензию отклонил.`,"court","Сумма больше 500 000 ₽, можно сразу в суд."],
    ["Банк постоянно звонит с рекламой, сотрудники грубят. Вы хотите, чтобы регулятор проверил банк.","cbr","Жалобы на работу финансовых организаций принимает Банк России."],
    ["Коллекторы звонят в полночь и угрожают родственникам.","fssp","Коллекторов контролирует ФССП. Ночные звонки запрещены законом 230-ФЗ."],
    ["Вы перевели деньги мошеннику. Банку уже позвонили.","police","После звонка в банк — заявление в полицию."],
    ["Компания выдаёт займы, но её нет в реестре Банка России.","cbr","О нелегальных кредиторах сообщают в Банк России."]
  ];
  const html=`<p>Вы работаете в отделе по работе с обращениями. Подскажите каждому клиенту, куда обратиться в первую очередь.</p>${P.order.t10.map(i=>`<div class="q"><div class="qt">${Q[i][0]}</div><select data-i="${i}"><option value="">— выберите —</option>${to.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join("")}</select></div>`).join("")}`;
  return { html, check(root){
    let s=0, f="", ans={};
    P.order.t10.forEach(i=>{ const v=$(`select[data-i="${i}"]`,root).value; ans[i]=v; const ok=v===Q[i][1]; if(ok) s+=2; f+=fb(ok,to.find(t=>t[0]===Q[i][1])[1],Q[i][2]); });
    return {score:s, ans, fb:f};
  }};
}});

/* 11 */
T.push({ title:"Цифровые сервисы", sub:"СБП, цифровой рубль, самозапрет", memo:2, max:9, build(P){
  const Q=[
    ["Сколько можно бесплатно перевести другим людям через СБП из одного банка за календарный месяц?",["100 000 ₽","30 000 ₽","1 000 000 ₽","без ограничений"]],
    ["Сколько можно бесплатно перевести через СБП между своими счетами в разных банках за месяц?",["до 30 млн ₽","до 100 000 ₽","до 1 млн ₽","только 50 000 ₽"]],
    ["Кто ведёт платформу цифрового рубля?",["Банк России","каждый банк свою","Министерство финансов","Агентство по страхованию вкладов"]],
    ["Начисляют ли проценты на цифровые рубли?",["нет","да, как по вкладу","да, по ключевой ставке","только пенсионерам"]],
    ["С какой даты крупнейшие банки обязаны дать клиентам доступ к цифровому рублю?",["1 сентября 2026 года","1 января 2024 года","1 марта 2025 года","1 сентября 2028 года"]],
    ["Где можно установить самозапрет на кредиты?",["на Госуслугах или в МФЦ","только в отделении своего банка","в налоговой","по звонку в банк"]],
    ["На что самозапрет НЕ распространяется?",["на ипотеку и автокредит под залог машины","на кредитные карты","на займы в МФО","на потребительские кредиты"]]
  ];
  const R=mkRng(S.seed+11), sh=Q.map(q=>R.shuffle(q[1].map((t,i)=>({t,i}))));
  const html=`<div class="calc"><b>💸 Перевод по СБП</b><p style="margin:6px 0">В этом месяце вы уже перевели друзьям ${rub(P.sbp.X)}. Сейчас отправляете однокурснику ${rub(P.sbp.Y)}. Какую комиссию возьмёт банк, ₽? (с копейками, если они есть)</p><input inputmode="decimal" id="sbp"></div>
  ${P.order.t11.map(i=>`<div class="q"><div class="qt">${Q[i][0]}</div>${radios("d"+i,sh[i].map(o=>({v:o.i,t:o.t})))}</div>`).join("")}`;
  return { html, check(root){
    let s=0, f="", ans={}; const v=num($("#sbp",root).value), o=near(v,P.sbp.com,0.011); ans.sbp=v; if(o) s+=2;
    f+=fb(o,`Комиссия: ${rub2(P.sbp.com)}`,`Бесплатный лимит — 100 000 ₽ в месяц, сверх него 0,5% от превышения, но не больше 1 500 ₽.`);
    P.order.t11.forEach(i=>{ const a=getRadio(root,"d"+i); ans[i]=a; if(a==="0") s++; else f+=fb(false,Q[i][0],`Правильно: ${Q[i][1][0]}.`); });
    return {score:s, ans, fb:f};
  }};
}});

/* ===== Экраны ===== */
let S = load();
const app=$("#app"), timerEl=$("#timer");
let tick=null, curCheck=null;
const MAX=T.reduce((s,t)=>s+t.max,0);
const memoHTML=()=>$("#memo").innerHTML;
function totals(){ let s=0; T.forEach((t,i)=>{ if(S.res[i]) s+=S.res[i].score; }); return s; }

function openMemo(sec){ $("#mbody").innerHTML=memoHTML(); $("#modal").classList.add("on"); const el=sec&&$("#m"+sec,$("#mbody")); $("#mbody").scrollTop = el ? el.offsetTop-8 : 0; }
$("#mclose").onclick=()=>$("#modal").classList.remove("on");
$("#modal").addEventListener("click",e=>{ const a=e.target.closest("a[href^='#m']"); if(a){ e.preventDefault(); const el=$(a.getAttribute("href"),$("#mbody")); if(el) $("#mbody").scrollTop=el.offsetTop-8; } });

function start(){
  if(S && S.fio){ S.reloads=(S.reloads||0)+1; store(); route(); return; }
  timerEl.textContent="";
  app.innerHTML=`<div class="bar">Вход в систему «Интернет-Банк 2.0»</div>
  <div class="box"><label class="f" for="fio">Фамилия, имя, отчество</label><input id="fio" autocomplete="name" placeholder="Иванов Иван Иванович">
  <label class="f" for="grp">Группа</label><input id="grp" autocomplete="off" placeholder="Например, ЮЗ-101">
  <div class="chk" style="margin-top:8px"><label><input type="checkbox" id="agree"> Я понимаю, что на каждую операцию даётся 10 минут, а вернуться к проведённой операции нельзя</label></div>
  <div class="err" id="err"></div><button class="btn go full" id="go">Войти ▶</button></div>
  <div class="box y"><b>Внимание!</b> Сотрудники банка никогда не спрашивают пароли и коды из СМС. Работайте только с официальным сайтом банка.</div>
  <div class="bar">Что вас ждёт в личном кабинете</div>
  <ul class="ops">${T.map((t,i)=>`<li><div class="no">${i+1}</div><div class="tt"><b>${t.title}</b><span>${t.sub}</span></div></li>`).join("")}</ul>`;
  $("#go").onclick=()=>{
    const fio=$("#fio").value.trim().replace(/\s+/g," "), grp=$("#grp").value.trim().toUpperCase();
    if(fio.split(" ").length<2){ $("#err").textContent="Введите фамилию и имя полностью."; return; }
    if(grp.length<2){ $("#err").textContent="Укажите группу."; return; }
    if(!$("#agree").checked){ $("#err").textContent="Отметьте согласие с условиями."; return; }
    const seed=hash(fio.toLowerCase()+"|"+grp);
    S={fio,grp,seed,id:seed.toString(36)+"-"+Date.now().toString(36),started:Date.now(),cur:0,taskStart:null,res:[],exits:[],reloads:0,finished:false,read:false};
    store(); send(); route();
  };
}

function route(){
  $("#who").textContent = `Клиент: ${S.fio} · ${S.grp}`;
  if(S.finished) return finish();
  if(!S.read) return memoScreen();
  if(S.taskStart) return openTask(S.cur);
  dashboard();
}

function memoScreen(){
  timerEl.textContent="";
  app.innerHTML=`<div class="bar">Памятка клиента</div>
  <div class="box y">Прочитайте памятку перед операциями: в ней всё, что понадобится для заданий. Время на чтение не ограничено. Позже памятку можно открыть кнопкой «📖 Памятка» в любой операции.</div>
  ${memoHTML()}<button class="btn go full" id="rd">Я прочитал(а) памятку, перейти в личный кабинет ▶</button>`;
  $$("a[href^='#m']",app).forEach(a=>a.onclick=e=>{ e.preventDefault(); const el=$(a.getAttribute("href"),app); if(el) el.scrollIntoView({behavior:"smooth"}); });
  $("#rd").onclick=()=>{ S.read=true; S.readAt=Date.now(); store(); dashboard(); };
  window.scrollTo(0,0);
}

function dashboard(){
  clearInterval(tick); timerEl.textContent="";
  app.innerHTML=`<div class="bar">Личный кабинет</div>
  <table class="t"><tr><th>Счёт</th><th>Остаток</th></tr><tr><td>Бонусный счёт № ${String(S.seed).slice(0,4)} ${String(S.seed).slice(4)}</td><td class="n"><b>${totals()} баллов</b> из ${MAX}</td></tr></table>
  <button class="btn" id="mm" style="margin:0 0 10px">📖 Памятка клиента</button>
  <div class="bar">Операции</div>
  <ul class="ops">${T.map((x,i)=>{ const r=S.res[i], c=r?"done":i===S.cur?"cur":"lock"; return `<li class="${c}"><div class="no">${r?"✓":i+1}</div><div class="tt"><b>${x.title}</b><span>${x.sub} · 10 мин</span></div><div class="sc">${r?r.score+"/"+x.max:""}</div></li>`; }).join("")}</ul>
  <button class="btn go full" id="next">${S.cur===0?"Начать первую операцию ▶":"Следующая операция ▶"}</button>`;
  $("#mm").onclick=()=>openMemo();
  $("#next").onclick=()=>{ S.taskStart=Date.now(); store(); openTask(S.cur); };
  window.scrollTo(0,0);
}

function openTask(i){
  const t=T[i], P=genParams(S.seed), b=t.build(P);
  app.innerHTML=`<button class="help" id="hp">📖 Памятка, раздел ${t.memo}</button><div class="bar" style="clear:both">Операция ${i+1} из ${T.length}: ${t.title}</div>
  <div id="tb">${b.html}</div><button class="btn go full" id="sub">Провести операцию ▶</button>`;
  const root=$("#tb"); if(b.init) b.init(root);
  curCheck=()=>b.check(root);
  $("#hp").onclick=()=>openMemo(t.memo);
  $("#sub").onclick=()=>{ if(confirm("Провести операцию? Изменить ответы будет нельзя.")) submitTask(i,false); };
  clearInterval(tick);
  const upd=()=>{ const left=Math.max(0,TIME-Math.floor((Date.now()-S.taskStart)/1000));
    timerEl.textContent=`${String(Math.floor(left/60)).padStart(2,"0")}:${String(left%60).padStart(2,"0")}`; timerEl.classList.toggle("warn",left<=60);
    if(left<=0){ clearInterval(tick); $("#modal").classList.remove("on"); submitTask(i,true); } };
  upd(); tick=setInterval(upd,1000);
  window.scrollTo(0,0);
}

function submitTask(i, timeout){
  if(S.res[i]) return;
  clearInterval(tick); timerEl.textContent="";
  const r=curCheck(); r.sec=Math.round((Date.now()-S.taskStart)/1000); r.timeout=timeout;
  const F=r.fb; delete r.fb; S.res[i]=r; S.cur=i+1; S.taskStart=null; if(S.cur>=T.length) S.finished=true;
  store(); send();
  const mx=T[i].max, ok=r.score===mx;
  app.innerHTML=`<div class="bar">Операция ${i+1} проведена${timeout?" · время сессии истекло":""}</div>
  <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="big">${r.score}/${mx}</span><span class="stamp ${ok?"ok":""}">${ok?"Одобрено":r.score>=mx*0.6?"Исполнено частично":"Отказ"}</span></div>
  <div class="fb">${F}</div><button class="btn go full" id="cont">${S.finished?"Итоговая выписка ▶":"В личный кабинет ▶"}</button>`;
  $("#cont").onclick=()=>route();
  window.scrollTo(0,0);
}

function finish(){
  clearInterval(tick); timerEl.textContent="";
  const s=totals();
  app.innerHTML=`<div class="bar">Выписка по бонусному счёту</div>
  <p><span class="big">${s} из ${MAX}</span> &nbsp; (${Math.round(s/MAX*100)}%)</p>
  <table class="t"><tr><th>Операция</th><th>Баллы</th></tr>${T.map((x,i)=>`<tr><td>${i+1}. ${x.title}</td><td class="n">${S.res[i]?S.res[i].score+"/"+x.max:"—"}</td></tr>`).join("")}</table>
  <p class="hint" id="sendst">${S.sent?"Выписка отправлена преподавателю.":"Отправляем выписку…"}</p>
  <button class="btn go full" id="resend">Отправить ещё раз</button>
  <p class="hint" style="margin-top:10px">Сеанс завершён. Межрегионпромстройторгинвестсбервкладбанк благодарит вас за то, что вы дочитали его название.</p>`;
  $("#resend").onclick=()=>send(true);
  send();
}

/* ===== Отправка в таблицу ===== */
function payload(){
  const s=totals();
  return { id:S.id, fio:S.fio, group:S.grp, seed:S.seed, status:S.finished?"завершено":"в процессе", score:s, max:MAX, percent:Math.round(s/MAX*100),
    tasks:T.map((x,i)=>S.res[i]?`${S.res[i].score}/${x.max}${S.res[i].timeout?" ⏱":""}`:""),
    exits:S.exits.length, exitsLog:S.exits.map(e=>`${new Date(e.t).toLocaleTimeString("ru-RU")} (оп. ${e.task+1}, ${e.sec} с)`).join("; "),
    reloads:S.reloads||0, started:new Date(S.started).toLocaleString("ru-RU"), minutes:Math.round((Date.now()-S.started)/60000),
    details:JSON.stringify({memoMin:S.readAt?Math.round((S.readAt-S.started)/60000):null, r:S.res.map(r=>r&&{s:r.score,sec:r.sec,a:r.ans})}) };
}
function send(){
  if(!S || !S.fio) return;
  const st=$("#sendst");
  if(!SCRIPT_URL){ if(st) st.textContent="Связь с сервером не настроена. Покажите этот экран преподавателю."; return; }
  fetch(SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload())})
    .then(()=>{ if(S.finished){ S.sent=true; store(); } if(st) st.textContent="Выписка отправлена преподавателю."; })
    .catch(()=>{ if(st) st.textContent="Не удалось отправить. Проверьте интернет и нажмите «Отправить ещё раз»."; });
}

/* ===== Защита ===== */
["copy","cut","paste","contextmenu","dragstart","drop","selectstart"].forEach(ev=>document.addEventListener(ev,e=>{
  if(ev==="selectstart" && e.target.closest && e.target.closest("input,textarea")) return;
  e.preventDefault();
},true));
document.addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&["c","v","x","a","p","s","u"].includes(e.key.toLowerCase())) e.preventDefault(); },true);
let hiddenAt=null;
function goneAway(){ if(!S||!S.fio||S.finished||hiddenAt) return; hiddenAt=Date.now(); }
function cameBack(){ if(!hiddenAt) return; const sec=Math.round((Date.now()-hiddenAt)/1000); hiddenAt=null; if(sec<1) return; S.exits.push({t:Date.now(),task:S.cur,sec}); store(); }
document.addEventListener("visibilitychange",()=>document.hidden?goneAway():cameBack());
window.addEventListener("blur",goneAway); window.addEventListener("focus",cameBack);
window.addEventListener("pagehide",goneAway);

start();
