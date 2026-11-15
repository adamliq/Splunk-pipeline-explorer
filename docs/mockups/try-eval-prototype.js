(function(){
/* Build 225: lookups and calculated fields in Try an event.
   - Calculated fields (EVAL-): an eval engine for the expressions add-ons write: literals, fields, arithmetic, string
     joins, comparisons, AND, OR, NOT, LIKE, IN, and the common functions. As Splunk's props.conf says, they "behave as if
     they are run in parallel": each sees the fields as they were before any of them ran. What the engine can't do, or
     what Splunk's docs don't define, is reported on the step, not guessed.
   - Lookups (LOOKUP-): run against the CSV files Build 223 reads, in lexicographic order of their names. Splunk
     "does not support nested automatic lookups", so each sees the fields as they were after the calculated fields.
     OUTPUT writes over the event's fields, and clears them when no row matches; OUTPUTNEW writes only fields the event
     doesn't have. match_type (WILDCARD, CIDR), case_sensitive_match, max_matches, min_matches and default_match are read.
   - INGEST_EVAL, at index time: its assignments in order, = adding a value and := replacing it. index, queue and _raw
     change the event; any other name is an indexed field. */
const T=window.configTools224,cv=window.configView205,pm=state.configView205;if(!T||!cv||!pm)return;
const K=()=>window.configLookups223;
const and=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
const plural=(n,one,many)=>`${n.toLocaleString('en-US')} ${n===1?one:many||one+'s'}`;

// ---- values ----
// A field's value as the data gives it: {fv:'443'} acts as a number where it reads as one, and keeps its own text. A
// literal string stays a string, a literal or computed number a number. Several values are an array.
const NUM=/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;
class Stop extends Error{}
const nc=why=>Object.assign(new Stop(why),{nc:true});
const bad=why=>Object.assign(new Stop(why),{bad:true});
const one=v=>{if(Array.isArray(v)){if(v.length===1)return v[0];throw nc('it reads a field with several values')}return v};
const isNum=v=>{v=one(v);return typeof v==='number'||!!v&&typeof v==='object'&&NUM.test(v.fv)};
const num=v=>{v=one(v);return typeof v==='number'?v:Number(v.fv)};
const fmt=n=>Number.isInteger(n)?String(n):String(Number(n.toPrecision(15)));
function text(v){v=one(v);if(v==null)return null;if(typeof v==='number')return Number.isFinite(v)?fmt(v):null;if(typeof v==='boolean')throw nc('it uses true or false as text');return typeof v==='object'?v.fv:v}
const isStrLit=v=>typeof one(v)==='string';

// ---- reading an expression ----
const WORDS=['AND','OR','NOT','XOR','LIKE','IN'];
function lex(src){const s=String(src),t=[];let i=0;
 while(i<s.length){const c=s[i],r=s.slice(i);
  if(/\s/.test(c)){i++;continue}
  if(c==='"'){let j=i+1,v='';for(;j<s.length&&s[j]!=='"';j++){if(s[j]==='\\'&&j+1<s.length){const n=s[j+1];v+=n==='"'||n==='\\'?n:'\\'+n;j++;continue}v+=s[j]}
   if(j>=s.length)throw bad('a string with no closing quote');t.push({k:'str',v});i=j+1;continue}
  if(c==="'"){const j=s.indexOf("'",i+1);if(j<0)throw bad('a field name with no closing quote');t.push({k:'field',v:s.slice(i+1,j)});i=j+1;continue}
  let m=/^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(r);if(m){t.push({k:'num',v:Number(m[1])});i+=m[1].length;continue}
  m=/^[A-Za-z_][A-Za-z0-9_]*/.exec(r);if(m){const u=m[0].toUpperCase();t.push(WORDS.includes(u)?{k:'op',v:u}:{k:'name',v:m[0]});i+=m[0].length;continue}
  m=/^(:=|==|!=|<=|>=|[=<>+\-*\/%.(),])/.exec(r);if(m){t.push({k:'op',v:m[1]});i+=m[1].length;continue}
  throw bad(`“${c}”, which isn’t read here`)}
 return t}
// Precedence, lowest first: OR and XOR; AND; NOT; comparisons, LIKE and IN; + - and . ; * / %; a sign.
function parser(t){let i=0;const peek=()=>t[i],is=(v,k='op')=>t[i]?.k===k&&t[i].v===v,eat=v=>is(v)?(i++,true):false,need=v=>{if(!eat(v))throw bad(`a “${v}” missing`)};
 const list=()=>{need('(');const out=[];if(!eat(')')){do out.push(or());while(eat(','));need(')')}return out};
 function primary(){const x=t[i++];if(!x)throw bad('an expression that ends too soon');
  if(x.k==='num'||x.k==='str')return {n:'lit',v:x.v};if(x.k==='field')return {n:'field',v:x.v};
  if(x.k==='name')return is('(')?{n:'call',f:x.v.toLowerCase(),args:list()}:{n:'field',v:x.v};
  if(x.k==='op'&&x.v==='('){const e=or();need(')');return e}
  if(x.k==='op'&&(x.v==='LIKE'||x.v==='IN')&&is('('))return {n:'call',f:x.v.toLowerCase(),args:list()};
  throw bad(`“${x.v}” where a value should be`)}
 function unary(){if(eat('-'))return {n:'neg',a:unary()};if(eat('+'))return unary();return primary()}
 function mul(){let a=unary();while(['*','/','%'].some(o=>is(o))){const o=t[i++].v;a={n:'bin',o,a,b:unary()}}return a}
 function add(){let a=mul();while(['+','-','.'].some(o=>is(o))){const o=t[i++].v;a={n:'bin',o,a,b:mul()}}return a}
 function cmp(){let a=add();for(;;){if(['=','==','!=','<','>','<=','>='].some(o=>is(o))){const o=t[i++].v;a={n:'cmp',o:o==='=='?'=':o,a,b:add()};continue}
   const not=is('NOT')&&(t[i+1]?.k==='op'&&['LIKE','IN'].includes(t[i+1].v));if(not)i++;
   if(eat('LIKE')){a={n:'like',a,b:add()};if(not)a={n:'not',a};continue}
   if(eat('IN')){a={n:'in',a,list:list()};if(not)a={n:'not',a};continue}
   if(not)i--;return a}}
 function notx(){if(eat('NOT'))return {n:'not',a:notx()};return cmp()}
 function andx(){let a=notx();while(eat('AND'))a={n:'and',a,b:notx()};return a}
 function or(){let a=andx();for(;;){if(eat('OR'))a={n:'or',a,b:andx()};else if(eat('XOR'))a={n:'xor',a,b:andx()};else return a}}
 return {or,eat,next:()=>t[i++],done:()=>i>=t.length,peek}}
const cache=new Map();
function parse(src){if(cache.has(src))return cache.get(src);const p=parser(lex(src)),e=p.or();if(!p.done())throw bad(`“${p.peek().v}” after the end of the expression`);cache.set(src,e);return e}
// INGEST_EVAL: name=expression or name:=expression, comma-separated.
function assignments(src){const p=parser(lex(src)),out=[];
 do{const n=p.next();if(!n||n.k!=='name'&&n.k!=='field')throw bad('an assignment with no field name');const o=p.next();if(!o||o.k!=='op'||o.v!=='='&&o.v!==':=')throw bad(`${n.v} with no = or :=`);out.push({name:n.v,op:o.v,e:p.or()})}while(p.eat(','));
 if(!p.done())throw bad(`“${p.peek().v}” after the last assignment`);return out}

// ---- evaluating ----
// A condition is true or false; a comparison with a missing value gives no answer, which counts as false.
const truth=v=>{v=one(v);if(v===true)return true;if(v===false||v==null)return false;throw nc('it uses a value as a condition')};
function compare(a,b){if(one(a)==null||one(b)==null)return null;if(isNum(a)&&isNum(b)&&!isStrLit(a)&&!isStrLit(b)){const x=num(a),y=num(b);return x<y?-1:x>y?1:0}const x=text(a),y=text(b);return x<y?-1:x>y?1:0}
const likeRe=(p,flags='')=>new RegExp('^'+[...p].map(c=>c==='%'?'[\\s\\S]*':c==='_'?'[\\s\\S]':c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('')+'$',flags);
function regex(src,flags=''){const r=T.jsRegex(src);if(r.bad)throw nc(`its regular expression can’t be tried here: ${r.bad}`);return new RegExp(r.re.source,[...new Set(r.re.flags+flags)].join(''))}
const ip4=s=>{const m=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(s).trim());if(!m||m.slice(1).some(x=>+x>255))return null;return m.slice(1).reduce((n,x)=>n*256+ +x,0)};
function cidr(range,ip){const [net,bits]=String(range).trim().split('/'),a=ip4(net),b=ip4(ip),n=bits===undefined?32:+bits;if(a==null||b==null||!(n>=0&&n<=32))return null;const m=n===0?0:(0xffffffff<<(32-n))>>>0;return ((a&m)>>>0)===((b&m)>>>0)}
function md5(s){const b=new TextEncoder().encode(s),n=((b.length+8)>>>6)+1,w=new Uint32Array(n*16);
 for(let i=0;i<b.length;i++)w[i>>2]|=b[i]<<(i%4*8);w[b.length>>2]|=0x80<<(b.length%4*8);w[n*16-2]=b.length*8>>>0;w[n*16-1]=Math.floor(b.length/0x20000000);
 const S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21],Kc=[...Array(64)].map((_,i)=>Math.floor(Math.abs(Math.sin(i+1))*2**32)>>>0);let h=[0x67452301,0xefcdab89,0x98badcfe,0x10325476];
 for(let o=0;o<w.length;o+=16){let [A,B,C,D]=h;
  for(let i=0;i<64;i++){const r=i>>4;const f=r===0?(B&C)|(~B&D):r===1?(D&B)|(~D&C):r===2?B^C^D:C^(B|~D),g=r===0?i:r===1?(5*i+1)%16:r===2?(3*i+5)%16:7*i%16,s=S[r*4+i%4],x=(A+f+Kc[i]+w[o+g])>>>0;
   A=D;D=C;C=B;B=(B+((x<<s)|(x>>>(32-s))))>>>0}
  h=[h[0]+A,h[1]+B,h[2]+C,h[3]+D].map(v=>v>>>0)}
 return h.map(v=>[0,8,16,24].map(s=>(v>>>s&255).toString(16).padStart(2,'0')).join('')).join('')}
const many=v=>v==null?[]:Array.isArray(v)?v:[v];
// The functions, by name. Each takes its arguments unevaluated, so if(), case() and coalesce() evaluate only what they need.
const FN={
 if:(a,e)=>{if(a.length!==3)throw nc('if() needs three arguments');return truth(e(a[0]))?e(a[1]):e(a[2])},
 case:(a,e)=>{if(a.length%2)throw nc('case() needs pairs of arguments');for(let i=0;i<a.length;i+=2)if(truth(e(a[i])))return e(a[i+1]);return null},
 coalesce:(a,e)=>{for(const x of a){const v=e(x);if(v!=null&&!(Array.isArray(v)&&!v.length))return v}return null},
 validate:(a,e)=>{for(let i=0;i+1<a.length;i+=2)if(!truth(e(a[i])))return e(a[i+1]);return null},
 nullif:(a,e)=>{const x=e(a[0]),y=e(a[1]);return compare(x,y)===0?null:x},
 null:()=>null,true:()=>true,false:()=>false,
 isnull:(a,e)=>one(e(a[0]))==null,isnotnull:(a,e)=>one(e(a[0]))!=null,
 isnum:(a,e)=>{const v=e(a[0]);return one(v)!=null&&isNum(v)&&!isStrLit(v)},isint:(a,e)=>{const v=e(a[0]);return one(v)!=null&&isNum(v)&&Number.isInteger(num(v))},
 isstr:(a,e)=>{const v=one(e(a[0]));return v!=null&&typeof v!=='boolean'&&!(typeof v==='number'||isNum(v)&&!isStrLit(v))},
 like:(a,e)=>{const x=text(e(a[0])),p=text(e(a[1]));return x==null||p==null?null:likeRe(p).test(x)},
 match:(a,e)=>{const x=text(e(a[0])),p=text(e(a[1]));return x==null||p==null?null:regex(p).test(x)},
 in:(a,e)=>{const x=e(a[0]);if(one(x)==null)return null;return a.slice(1).some(y=>compare(x,e(y))===0)},
 cidrmatch:(a,e)=>{const r=text(e(a[0])),x=text(e(a[1]));if(r==null||x==null)return null;const m=cidr(r,x);if(m==null)throw nc('cidrmatch() is tried here for IPv4 only');return m},
 len:(a,e)=>{const x=text(e(a[0]));return x==null?null:[...x].length},
 lower:(a,e)=>{const x=text(e(a[0]));return x==null?null:x.toLowerCase()},upper:(a,e)=>{const x=text(e(a[0]));return x==null?null:x.toUpperCase()},
 trim:(a,e)=>trimmer(a,e,true,true),ltrim:(a,e)=>trimmer(a,e,true,false),rtrim:(a,e)=>trimmer(a,e,false,true),
 substr:(a,e)=>{const x=text(e(a[0]));if(x==null)return null;const c=[...x],s=num(e(a[1])),n=a[2]?num(e(a[2])):undefined;let i=s>0?s-1:s<0?c.length+s:0;i=Math.max(0,i);return c.slice(i,n===undefined?undefined:i+Math.max(0,n)).join('')},
 replace:(a,e)=>{const x=text(e(a[0])),p=text(e(a[1])),r=text(e(a[2]));if(x==null||p==null||r==null)return null;return x.replace(regex(p,'g'),r.replace(/\$/g,'$$$$').replace(/\\(\d)/g,'$$$1'))},
 split:(a,e)=>{const x=text(e(a[0])),d=text(e(a[1]));return x==null||d==null?null:d===''?[...x]:x.split(d)},
 urldecode:(a,e)=>{const x=text(e(a[0]));if(x==null)return null;try{return decodeURIComponent(x.replace(/\+/g,' '))}catch(err){throw nc('urldecode() finds a broken escape')}},
 tostring:(a,e)=>{if(a.length>1)throw nc('tostring() with a format isn’t computed here');const v=one(e(a[0]));return v==null?null:typeof v==='boolean'?(v?'True':'False'):text(v)},
 tonumber:(a,e)=>{const x=text(e(a[0]));if(x==null)return null;const base=a[1]?num(e(a[1])):10;if(base===10)return NUM.test(x.trim())?Number(x.trim()):null;const ok=new RegExp(`^[+-]?[${'0123456789abcdefghijklmnopqrstuvwxyz'.slice(0,base)}]+$`,'i').test(x.trim());return ok?parseInt(x.trim(),base):null},
 abs:(a,e)=>math(a,e,Math.abs),ceil:(a,e)=>math(a,e,Math.ceil),ceiling:(a,e)=>math(a,e,Math.ceil),floor:(a,e)=>math(a,e,Math.floor),sqrt:(a,e)=>math(a,e,Math.sqrt),exp:(a,e)=>math(a,e,Math.exp),ln:(a,e)=>math(a,e,Math.log),
 round:(a,e)=>{const v=e(a[0]);if(one(v)==null||!isNum(v))return null;const d=a[1]?num(e(a[1])):0,f=10**d;return Math.round(num(v)*f)/f},
 pow:(a,e)=>{const x=e(a[0]),y=e(a[1]);return one(x)==null||one(y)==null||!isNum(x)||!isNum(y)?null:num(x)**num(y)},
 log:(a,e)=>{const x=e(a[0]);if(one(x)==null||!isNum(x))return null;const b=a[1]?num(e(a[1])):10;return Math.log(num(x))/Math.log(b)},
 pi:()=>Math.PI,exact:(a,e)=>e(a[0]),
 min:(a,e)=>extreme(a,e,-1),max:(a,e)=>extreme(a,e,1),
 md5:(a,e)=>{const x=text(e(a[0]));return x==null?null:md5(x)},
 mvappend:(a,e)=>{const out=a.flatMap(x=>many(e(x))).filter(v=>one(v)!=null);return out.length?out:null},
 mvcount:(a,e)=>{const v=e(a[0]);return v==null?null:many(v).length},
 mvindex:(a,e)=>{const v=many(e(a[0]));if(!v.length)return null;const n=v.length,at=x=>x<0?n+x:x,s=at(num(e(a[1]))),t=a[2]?at(num(e(a[2]))):s;if(s<0||s>=n||t<s)return null;const out=v.slice(s,Math.min(t,n-1)+1);return out.length===1?out[0]:out},
 mvjoin:(a,e)=>{const v=many(e(a[0])),d=text(e(a[1]));return v.length?v.map(text).join(d??''):null},
 mvdedup:(a,e)=>{const v=many(e(a[0])).map(text);return v.length?[...new Set(v)]:null},
 length:(a,e)=>FN.len(a,e)};
function trimmer(a,e,l,r){const x=text(e(a[0]));if(x==null)return null;const cs=a[1]?text(e(a[1])):' \t';const set=new Set([...cs]);let s=0,t=[...x],n=t.length;if(l)while(s<n&&set.has(t[s]))s++;if(r)while(n>s&&set.has(t[n-1]))n--;return t.slice(s,n).join('')}
function math(a,e,f){const v=e(a[0]);return one(v)==null||!isNum(v)?null:f(num(v))}
function extreme(a,e,sign){const v=a.flatMap(x=>many(e(x))).filter(x=>one(x)!=null);if(!v.length)return null;if(v.every(x=>isNum(x)&&!isStrLit(x)))return v.map(num).reduce((m,x)=>sign*(x-m)>0?x:m);if(v.some(x=>isNum(x)&&!isStrLit(x)))throw nc(`${sign>0?'max':'min'}() mixes numbers and text`);return v.map(text).reduce((m,x)=>sign*(x<m?-1:x>m?1:0)>0?x:m)}
function ev(e,get){switch(e.n){
 case 'lit':return e.v;
 case 'field':{const v=get(e.v);return v===undefined?null:v}
 case 'neg':{const v=ev(e.a,get);return one(v)==null?null:isNum(v)?-num(v):null}
 case 'bin':{const a=ev(e.a,get),b=ev(e.b,get);if(one(a)==null||one(b)==null)return null;
  if(e.o==='.')return text(a)+text(b);
  if(e.o==='+'){const na=isNum(a)&&!isStrLit(a),nb=isNum(b)&&!isStrLit(b);if(na&&nb)return num(a)+num(b);if(!na&&!nb)return text(a)+text(b);throw nc('it adds a number to text with +, which Splunk’s docs don’t define')}
  if(!isNum(a)||!isNum(b))return null;const x=num(a),y=num(b);if(e.o==='-')return x-y;if(e.o==='*')return x*y;if(y===0)return null;return e.o==='/'?x/y:x%y}
 case 'cmp':{const c=compare(ev(e.a,get),ev(e.b,get));if(c==null)return null;return e.o==='='?c===0:e.o==='!='?c!==0:e.o==='<'?c<0:e.o==='>'?c>0:e.o==='<='?c<=0:c>=0}
 case 'like':{const x=text(ev(e.a,get)),p=text(ev(e.b,get));return x==null||p==null?null:likeRe(p).test(x)}
 case 'in':{const x=ev(e.a,get);if(one(x)==null)return null;return e.list.some(y=>compare(x,ev(y,get))===0)}
 case 'not':{const v=ev(e.a,get);return one(v)==null?null:!truth(v)}
 case 'and':{const a=ev(e.a,get);if(one(a)!=null&&!truth(a))return false;const b=ev(e.b,get);if(one(b)!=null&&!truth(b))return false;return one(a)==null||one(b)==null?null:true}
 case 'or':{const a=ev(e.a,get);if(one(a)!=null&&truth(a))return true;const b=ev(e.b,get);if(one(b)!=null&&truth(b))return true;return one(a)==null||one(b)==null?null:false}
 case 'xor':{const a=ev(e.a,get),b=ev(e.b,get);return one(a)==null||one(b)==null?null:truth(a)!==truth(b)}
 case 'call':{const f=FN[e.f];if(!f)throw nc(`it uses ${e.f}(), which isn’t computed here`);return f(e.args,x=>ev(x,get))}}}
// One expression, with the fields get gives. {v} with its value, or {nc} with why it isn't computed.
function run(src,get){try{const v=ev(parse(src),get);if(typeof one(v)==='boolean')return {nc:'it gives true or false, which a field can’t hold'};return {v:v==null?null:Array.isArray(v)?v.map(text):text(v)}}
 catch(e){if(e instanceof Stop)return e.bad?{nc:`its expression can’t be read here: ${e.message}`}:{nc:e.message};throw e}}
// The fields an expression can read: the event's, as the data gives them, and its default fields.
function reader(fields,ctx){return k=>{const f=fields.get(k);if(f)return Array.isArray(f.value)?f.value.map(fv=>({fv})):{fv:f.value};
 if(k==='_raw')return {fv:ctx.raw};if(k==='sourcetype')return ctx.sourcetype!=null?{fv:ctx.sourcetype}:undefined;const m=ctx.meta?.[k];return m!=null&&['host','source','index'].includes(k)?{fv:m}:undefined}}
const show=v=>Array.isArray(v)?v.join(', '):v;
const quote=v=>Array.isArray(v)?v.map(x=>`“${x}”`).join(', '):`“${v}”`;

// ---- calculated fields ----
// Each EVAL- sees the fields as they were before any ran. A null result clears the field; one that isn't computed leaves
// it as it was.
function calculated(evals,fields,steps,ctx){if(!evals.length)return;const get=reader(new Map(fields),ctx);
 const done=evals.map(r=>({r,name:r.key.slice(5),x:run(r.value,get)}));
 for(const {r,name,x} of done){
  if(x.nc){steps.push({at:'search',r,state:'skip',group:'eval',made:[],why:x.nc,say:`${r.key} isn’t computed here: ${x.nc}`});continue}
  if(x.v==null){const had=fields.delete(name);steps.push({at:'search',r,state:'miss',group:'eval',made:[],say:`${r.key} gives no value${had?`, so ${name} is cleared`:''}`});continue}
  fields.set(name,{value:x.v,r,calc:true});steps.push({at:'search',r,state:'hit',group:'eval',made:[name],say:`${r.key} gives ${name} = ${quote(x.v)}`})}}
// The calculated fields' row on the path: how many give values, which, and why any aren't computed.
function row(ev){if(!ev?.length)return null;const hit=ev.filter(s=>s.state==='hit'),none=ev.filter(s=>s.state==='miss'),skip=ev.filter(s=>s.state==='skip'),got=hit.flatMap(s=>s.made),why=[...new Set(skip.map(s=>s.why))];
 const say=[`Calculated fields (EVAL-): ${hit.length} of ${ev.length} ${hit.length===1?'gives':'give'} ${got.length===1?'a value':'values'}${got.length?`: ${got.slice(0,8).join(', ')}${got.length>8?` and ${got.length-8} more`:''}`:''}`];
 if(none.length)say.push(`${none.length} ${none.length===1?'gives':'give'} no value`);
 if(skip.length)say.push(`${skip.length} ${skip.length===1?'isn’t':'aren’t'} computed here: ${why.slice(0,2).join('; ')}${why.length>2?`; and ${why.length-2} more reasons`:''}`);
 return {state:hit.length?'hit':none.length?'miss':'skip',r:null,say:say.join('. ')}}

// ---- lookups ----
// A CSV file's header and records: a quoted value keeps what's inside its quotes; spaces round anything else are left
// out, and the file says so (whether Splunk keeps them isn't settled here, as Build 223's check says).
const tables=new WeakMap();
function csv(text){const recs=[];let rec=[],cur='',q=false,quoted=false,live=false,trimmed=false;
 const end=()=>{const v=quoted?cur:cur.trim();if(!quoted&&v!==cur)trimmed=true;rec.push(v);cur='';quoted=false};
 const s=String(text).replace(/^﻿/,'');
 for(let i=0;i<s.length;i++){const c=s[i];
  if(q){if(c==='"'){if(s[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c;continue}
  if(c==='"'&&!cur.trim()){q=true;quoted=true;live=true;cur='';continue}
  if(c===','){end();live=true;continue}
  if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;if(live||cur.trim()){end();recs.push(rec)}rec=[];cur='';live=false;continue}
  if(quoted){if(c.trim())cur+=c;continue}
  cur+=c;if(c.trim())live=true}
 if(live||cur.trim()){end();recs.push(rec)}
 return {head:recs[0]||[],rows:recs.slice(1),trimmed}}
const tableOf=f=>{if(!tables.has(f))tables.set(f,csv(f.text));return tables.get(f)};
const truthy=v=>!/^(0|f|false|n|no)$/i.test(String(v).trim());
// Each LOOKUP-, in lexicographic order of its name, with the fields as they were after the calculated fields.
function lookups(lines,fields,steps,ctx){if(!lines.length)return;const before=new Map(fields);
 for(const r of lines){const p=K()?.parseLookup?.(r.value)||{bad:'empty'},base={at:'search',r,name:p.table},put=(state,say)=>steps.push({...base,state,say:`${r.key}${say}`});
  if(p.bad){put('missing',' names no field to match on, so it isn’t run');continue}
  const keys=pm.merged?.transforms?.get(p.table);if(!keys){put('missing',`: [${p.table}] isn’t in transforms.conf`);continue}
  const val=k=>String(keys.get(k)?.value??'').trim();
  if(val('collection')){put('skip',`: [${p.table}] is a KV store lookup, which isn’t run here`);continue}
  if(val('external_cmd')){put('skip',`: [${p.table}] is an external lookup, which isn’t run here`);continue}
  if(val('time_field')){put('skip',`: [${p.table}] is a time-based lookup, which isn’t run here`);continue}
  if(!val('filename')){put('skip',`: [${p.table}] names no file`);continue}
  const def=K()?.definitions?.().get(p.table)||{filename:val('filename'),app:null},at=K()?.fileFor?.(def);
  if(!at?.file){put('skip',`: its file, ${val('filename')}, isn’t among the files read`);continue}
  const file=at.file;if(file.text==null){put('skip',`: only the first 20 MB of ${file.name} was read, so it isn’t run`);continue}
  const t=tableOf(file),col=n=>t.head.indexOf(n),spaced=t.trimmed?`. ${file.name} writes spaces round its names or values, which are left out here: to check`:'';
  const match=p.match.map(m=>({col:col(m.field),field:m.field,as:m.as||m.field}));
  const gone=match.filter(m=>m.col<0).map(m=>m.field);if(gone.length){put('missing',`: ${file.name} has no column ${and(gone)}`);continue}
  const outs=(p.output.length?p.output.map(o=>({col:col(o.field),field:o.field,as:o.as||o.field})):t.head.map((h,i)=>({col:i,field:h,as:h})).filter(o=>!match.some(m=>m.col===o.col)));
  const lost=outs.filter(o=>o.col<0).map(o=>o.field);if(lost.length){put('missing',`: ${file.name} has no column ${and(lost)}`);continue}
  const absent=match.filter(m=>before.get(m.as)?.value==null).map(m=>m.as);if(absent.length){put('miss',`: the event has no ${and(absent)}, so it isn’t run`);continue}
  const types=new Map([...val('match_type').matchAll(/(WILDCARD|CIDR|EXACT)\s*\(\s*([^)]*?)\s*\)/gi)].map(m=>[m[2],m[1].toUpperCase()]));
  const cs=!keys.has('case_sensitive_match')||truthy(val('case_sensitive_match')),max=Math.min(1000,Math.max(1,parseInt(val('max_matches'))||100)),min=Math.max(0,parseInt(val('min_matches'))||0),dflt=keys.has('default_match')?val('default_match'):'';
  const same=(cell,v,m)=>{const type=types.get(m.field)||'EXACT';cell=cell??'';
   if(type==='WILDCARD')return new RegExp('^'+cell.split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[\\s\\S]*')+'$',cs?'':'i').test(v);
   if(type==='CIDR'){const c=cidr(cell,v);if(c!=null)return c}
   return cs?cell===v:cell.toLowerCase()===v.toLowerCase()};
  const vals=match.map(m=>many(before.get(m.as).value));
  const rows=t.rows.filter(row=>match.every((m,i)=>vals[i].some(v=>same(row[m.col],v,m)))).slice(0,max);
  const desc=and(match.map((m,i)=>`${m.as} ${quote(vals[i].length===1?vals[i][0]:vals[i])}`)),mode=p.mode||'OUTPUT';
  if(rows.length||min>0){const got=outs.map(o=>{const v=rows.map(row=>row[o.col]??'');while(v.length<min)v.push(dflt);return {o,v:v.length===1?v[0]:v}});
   const wrote=[],kept=[];for(const {o,v} of got){if(mode==='OUTPUTNEW'&&fields.has(o.as)){kept.push(o.as);continue}fields.set(o.as,{value:v,r,lookup:file.name});wrote.push(`${o.as} = ${quote(v)}`)}
   const found=rows.length?`${desc} ${rows.length===1?'is in 1 row':`is in ${rows.length} rows`} of ${file.name}`:`no row of ${file.name} has ${desc}, so min_matches = ${min} gives default_match`;
   put(wrote.length?'hit':'miss',`: ${found}: ${wrote.length?wrote.join(', '):'nothing new'}${kept.length?`. ${and(kept)} ${kept.length===1?'is':'are'} kept, as OUTPUTNEW writes only fields the event doesn’t have`:''}${spaced}`);continue}
  const cleared=mode==='OUTPUTNEW'?[]:outs.filter(o=>fields.delete(o.as)).map(o=>o.as);
  put('miss',`: no row of ${file.name} has ${desc}, so ${cleared.length?`OUTPUT clears ${and(cleared)}`:'it gives nothing'}${spaced}`)}}

// ---- INGEST_EVAL, at index time ----
// Its assignments in order: = adds a value to a field, := replaces it, and null() to a field that isn't there does
// nothing. _raw, queue and index change the event; host, source and sourcetype are read, not set; any other name is an
// indexed field. Returns the step's words and what changed.
function ingest(expr,{raw,meta,queue,fields,r}){let as;try{as=assignments(expr)}catch(e){if(e instanceof Stop)return {state:'skip',say:`evaluates INGEST_EVAL, which can’t be read here: ${e.message}`};throw e}
 const cur={raw,queue,index:meta.index},local=new Map(),cleared=new Set(),unset=[];let qset=false;
 const get=k=>{if(k==='_raw')return {fv:cur.raw};if(k==='queue')return cur.queue!=null?{fv:cur.queue}:undefined;if(k==='index')return cur.index!=null?{fv:cur.index}:undefined;
  if(k==='sourcetype')return {fv:meta.sourcetype};if((k==='host'||k==='source')&&meta[k]!=null)return {fv:meta[k]};if(k==='linecount')return {fv:String(cur.raw.split(/\r\n|\r|\n/).length)};
  const v=local.has(k)?local.get(k):cleared.has(k)?null:fields.get(k)?.value;if(v==null||Array.isArray(v)&&!v.length)return undefined;return Array.isArray(v)?(v.length===1?{fv:v[0]}:v.map(fv=>({fv}))):{fv:v}};
 for(const a of as){let v;try{v=ev(a.e,get);if(typeof one(v)==='boolean')throw nc(`${a.name} gets true or false, which a field can’t hold`)}catch(e){if(e instanceof Stop)return {state:'skip',say:`evaluates INGEST_EVAL, which isn’t tried here: ${e.bad?`it can’t be read: ${e.message}`:e.message}`};throw e}
  const vals=v==null?[]:many(v).map(text);
  if(a.name==='_raw'){if(vals.length)cur.raw=vals[0];continue}
  if(a.name==='queue'){if(vals.length){cur.queue=vals[0];qset=true}continue}
  if(a.name==='index'){if(vals.length)cur.index=vals[0];continue}
  if(['host','source','sourcetype'].includes(a.name)){unset.push(a.name);continue}
  const had=local.has(a.name)?local.get(a.name):cleared.has(a.name)?[]:many(fields.get(a.name)?.value);
  if(!vals.length){if(a.op===':='&&had.length){local.delete(a.name);cleared.add(a.name)}continue}
  local.set(a.name,a.op===':='?vals:[...had,...vals]);cleared.delete(a.name)}
 const say=[];if(cur.raw!==raw)say.push('the event text is rewritten');if(cur.index!==meta.index){meta.index=cur.index;say.push(`the index becomes ${cur.index}`)}
 const wrote=[...local.keys()];for(const k of wrote){const v=local.get(k);fields.set(k,{value:v.length===1?v[0]:v,r})}for(const k of cleared)fields.delete(k);
 if(wrote.length)say.push(`it writes ${and(wrote.map(k=>`${k} = ${quote(local.get(k).length===1?local.get(k)[0]:local.get(k))}`))} as indexed field${wrote.length>1?'s':''}`);
 if(cleared.size)say.push(`it removes ${and([...cleared])}`);
 if(unset.length)say.push(`its ${and([...new Set(unset)])} assignment${unset.length>1?'s aren’t':' isn’t'} tried: Splunk’s docs show INGEST_EVAL setting index, queue, _raw and indexed fields`);
 const q=qset?cur.queue:undefined;if(q!==undefined)say.push(`the event goes to ${q}`);
 return {state:'hit',say:`evaluates INGEST_EVAL: ${say.length?say.join('; '):'nothing changes'}`,raw:cur.raw!==raw?cur.raw:undefined,queue:q}}

window.configEval225={lex,parse,assignments,run,calculated,lookups,ingest,row,show,csv,md5,cidr,likeRe,
 // For a test or a script: one expression, with the fields given as an object.
 evaluate:(src,obj={},ctx={})=>run(src,reader(new Map(Object.entries(obj).map(([k,v])=>[k,{value:v}])),ctx))};
})();
