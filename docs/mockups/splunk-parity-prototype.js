(function(){
/* Build 226: Try an event as Splunk 10.6.1.1 runs it. Build 225's lookups and calculated fields, with each rule checked
   against Splunk Enterprise 10.6.1.1 in Docker (docs/splunk-checks.md has the searches and their results).
   - Calculated fields (EVAL-): Splunk checks an expression's types before it runs any of it. A number and a string
     where Splunk can see both types (5 + "abc", s1 - "1", a sum compared with "6") reject the whole expression. A
     field's value acts as a number where it reads as one and as text always, so + adds two numbers and joins two
     strings: n + t gives "5abc". Comparisons work the same way, and event text against a number gives no answer.
     true and false are stored as 1 and 0. NOT, AND, OR and XOR count a missing condition as false. tostring() gives
     Null, True and False. Fields with several values follow Splunk's rules per function. Numbers written with a
     decimal point keep their precision: + and - the fewest decimal places, * / % and the functions the fewest
     significant figures. As props.conf says, they "behave as if they are run in parallel": each sees the fields as
     they were before any of them ran.
   - Lookups (LOOKUP-): run one after another in order of their names, each on the fields the earlier ones wrote, as
     Splunk 10.6.1.1 does, although the Knowledge Manager Manual says nested automatic lookups aren't supported. OUTPUT
     writes over the event's fields, and clears them when no row matches; OUTPUTNEW writes only fields the event doesn't
     have. match_type (WILDCARD, CIDR), case_sensitive_match, max_matches, min_matches and default_match are read.
     Spaces round a CSV value or name that isn't quoted are left out, as Splunk leaves them out.
   - INGEST_EVAL, at index time: its assignments in order, = adding a value and := replacing it. index, queue, _raw,
     host, source and sourcetype change the event; any other name is an indexed field. A type error stops all of it.
     Numbers lose the zeros Splunk shows after a point at search time: 1.5+1.5 is 3. */
const T=window.configTools224,cv=window.configView205,pm=state.configView205;if(!T||!cv||!pm)return;
const K=()=>window.configLookups223;
const and=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
const plural=(n,one,many)=>`${n.toLocaleString('en-US')} ${n===1?one:many||one+'s'}`;

// ---- values ----
// A field's value as the data gives it, {fv:'443'}: a number where it reads as one, and text always, keeping its own
// text. A literal string is text. A number is a JS number when it's exact, or {dec, nv, dp, sf, s} when it carries the
// precision of a number written with a decimal point: nv its value, dp its decimal places, sf its significant figures
// (null for no limit) and s how Splunk shows it. Several values are an array; true and false are booleans.
const NUM=/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;
class Stop extends Error{}
const nc=why=>Object.assign(new Stop(why),{nc:true});
const bad=why=>Object.assign(new Stop(why),{bad:true});
const typeErr=why=>Object.assign(new Stop(why),{type:true});
const isFv=v=>v!=null&&typeof v==='object'&&!Array.isArray(v)&&v.fv!==undefined;
const isDec=v=>v!=null&&typeof v==='object'&&v.dec===true;
const isMany=v=>Array.isArray(v)&&v.length>1;
// Where one value is needed, several act as none.
const one=v=>Array.isArray(v)?(v.length===1?v[0]:null):v;
const present=v=>v!=null&&!(Array.isArray(v)&&!v.length);
const canNum=v=>{v=one(v);return typeof v==='number'||isDec(v)||isFv(v)&&NUM.test(v.fv)};
const canText=v=>{v=one(v);return typeof v==='string'||isFv(v)};
const num=v=>{v=one(v);return typeof v==='number'?v:isDec(v)?v.nv:Number(v.fv)};
// A number as plain digits, as Splunk shows it: never with an exponent.
function plain(n){let s=String(n);if(!/e/i.test(s))return s;const neg=s[0]==='-';if(neg)s=s.slice(1);
 const [m,ex]=s.split(/e/i),e=Number(ex),[ip,fp='']=m.split('.'),d=ip+fp,p=ip.length+e;
 return (neg?'-':'')+(p<=0?'0.'+'0'.repeat(-p)+d:p>=d.length?d+'0'.repeat(p-d.length):d.slice(0,p)+'.'+d.slice(p))}
// Plain digits rounded half away from zero to k places after the point; a negative k rounds to tens, hundreds, ...
function roundAt(s,k){const neg=s[0]==='-';if(neg)s=s.slice(1);const [ip0,fp='']=s.split('.'),ip=ip0||'0',d=[...ip+fp].map(Number),p=ip.length,n=p+k;
 if(n<0)return '0';
 const kept=d.slice(0,n);while(kept.length<n)kept.push(0);let carry=n<d.length&&d[n]>=5?1:0;
 for(let i=kept.length-1;carry&&i>=0;i--){const x=kept[i]+1;kept[i]=x%10;carry=x>9?1:0}
 const all=(carry?'1':'')+kept.join(''),ipLen=p+(carry?1:0);
 let I=k>=0?all.slice(0,ipLen):all+'0'.repeat(-k),F=k>0?all.slice(ipLen):'';I=I.replace(/^0+(?=\d)/,'')||'0';
 const out=F?I+'.'+F:I;return (neg&&/[1-9]/.test(out)?'-':'')+out}
// Significant figures written in a plain number: leading zeros don't count; a number with no figure but 0 has as many
// as its decimal places, and at least one.
function sigs(s){s=String(s).replace(/^[+-]/,'');const d=s.replace('.',''),first=d.search(/[1-9]/);return first<0?Math.max(1,(s.split('.')[1]||'').length):d.length-first}
// How exactly a number written as text is known: with a point, its decimal places and figures; with an exponent and no
// point, decimal places only; a whole number is exact (null).
function precText(t){const m=/^[+-]?(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(String(t).trim());if(!m)return null;const [,ip,fp,ex]=m;
 if(ex!==undefined)return {dp:Math.max(0,(fp||'').length-Number(ex)),sf:fp===undefined?null:sigs((ip||'0')+'.'+fp)};
 return fp===undefined?null:{dp:fp.length,sf:sigs((ip||'0')+'.'+fp)}}
const precOf=v=>{v=one(v);if(isDec(v))return v.dp==null&&v.sf==null?null:{dp:v.dp,sf:v.sf};return isFv(v)?precText(v.fv):null};
// A number to the decimal places given (+ and -), or to the significant figures given (* / % and the functions).
const decFixed=(n,dp)=>{const s=roundAt(plain(n),dp);return {dec:true,nv:n,dp,sf:sigs(s),s}};
function decSig(n,sf){const s=plain(n),lead=x=>{const [a,b='']=x.replace(/^-/,'').split('.'),d=a+b,f=d.search(/[1-9]/);return f<0?-Infinity:a.length-f};
 if(lead(s)===-Infinity){const k=Math.max(0,sf-1);return {dec:true,nv:n,dp:k,sf,s:roundAt(s,k)}}
 let k=sf-lead(s),r=roundAt(s,k);if(lead(r)>lead(s)){k--;r=roundAt(s,k)}return {dec:true,nv:n,dp:Math.max(0,k),sf,s:r}}
const bySig=(n,ps)=>{if(!Number.isFinite(n))return null;const sf=ps.map(p=>p?.sf).filter(x=>x!=null);return sf.length?decSig(n,Math.min(...sf)):n};
// A number written as text: a whole number is exact; one with a point or an exponent keeps its precision, and shows as
// written, an exponent spelled out.
function decText(t){t=String(t).trim();const p=precText(t),n=Number(t);if(!p)return n;
 const s=p.sf==null?roundAt(plain(n),p.dp):t.replace(/^\+/,'').replace(/^(-?)\./,'$10.').replace(/\.$/,'');return {dec:true,nv:n,dp:p.dp,sf:p.sf,s}}
function text(v){v=one(v);if(v==null)return null;if(typeof v==='string')return v;if(typeof v==='number')return Number.isFinite(v)?plain(v):null;if(isDec(v))return v.s;if(isFv(v))return v.fv;return null}

// ---- reading an expression ----
const WORDS=['AND','OR','NOT','XOR','LIKE','IN'];
function lex(src){const s=String(src),t=[];let i=0;
 while(i<s.length){const c=s[i],r=s.slice(i);
  if(/\s/.test(c)){i++;continue}
  if(c==='"'){let j=i+1,v='';for(;j<s.length&&s[j]!=='"';j++){if(s[j]==='\\'&&j+1<s.length){const n=s[j+1];v+=n==='"'||n==='\\'?n:'\\'+n;j++;continue}v+=s[j]}
   if(j>=s.length)throw bad('a string with no closing quote');t.push({k:'str',v});i=j+1;continue}
  if(c==="'"){const j=s.indexOf("'",i+1);if(j<0)throw bad('a field name with no closing quote');t.push({k:'field',v:s.slice(i+1,j)});i=j+1;continue}
  let m=/^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(r);if(m){t.push({k:'num',v:Number(m[1]),s:m[1]});i+=m[1].length;continue}
  m=/^[A-Za-z_][A-Za-z0-9_]*/.exec(r);if(m){const u=m[0].toUpperCase();t.push(WORDS.includes(u)?{k:'op',v:u}:{k:'name',v:m[0]});i+=m[0].length;continue}
  m=/^(:=|==|!=|<=|>=|[=<>+\-*\/%.(),])/.exec(r);if(m){t.push({k:'op',v:m[1]});i+=m[1].length;continue}
  throw bad(`“${c}”, which isn’t read here`)}
 return t}
// Precedence, lowest first: OR and XOR; AND; NOT; comparisons, LIKE and IN; + - and . ; * / %; a sign.
function parser(t){let i=0;const peek=()=>t[i],is=(v,k='op')=>t[i]?.k===k&&t[i].v===v,eat=v=>is(v)?(i++,true):false,need=v=>{if(!eat(v))throw bad(`a “${v}” missing`)};
 const list=()=>{need('(');const out=[];if(!eat(')')){do out.push(or());while(eat(','));need(')')}return out};
 function primary(){const x=t[i++];if(!x)throw bad('an expression that ends too soon');
  if(x.k==='num')return {n:'lit',v:x.v,s:x.s};if(x.k==='str')return {n:'lit',v:x.v};if(x.k==='field')return {n:'field',v:x.v};
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

// ---- Splunk's type check ----
// Before an expression runs, Splunk checks the types it can see: a number written or computed, a string written or a
// function's string, true or false. Fields could be either (any). A clash rejects the whole expression.
const U=(a,b)=>a==='null'?b:b==='null'?a:a===b?a:'any';
const RET={len:'num',length:'num',abs:'num',ceil:'num',ceiling:'num',floor:'num',round:'num',sqrt:'num',exp:'num',ln:'num',log:'num',pow:'num',pi:'num',exact:'num',tonumber:'num',mvcount:'num',
 lower:'str',upper:'str',trim:'str',ltrim:'str',rtrim:'str',substr:'str',replace:'str',urldecode:'str',tostring:'str',md5:'str',mvjoin:'str',mvindex:'str',validate:'str',
 isnull:'bool',isnotnull:'bool',isnum:'bool',isint:'bool',isstr:'bool',like:'bool',match:'bool',in:'bool',cidrmatch:'bool',true:'bool',false:'bool',null:'null'};
const NOBOOL=new Set(['lower','upper','trim','ltrim','rtrim','len','length','substr','replace','urldecode','md5','split','like','match','abs','ceil','ceiling','floor','round','sqrt','exp','ln','log','pow']);
function typeOf(e){switch(e.n){
 case 'lit':return typeof e.v==='number'?'num':'str';
 case 'field':return 'any';
 case 'neg':{const t=typeOf(e.a);if(t==='str'||t==='bool')throw typeErr('- takes a number');return 'num'}
 case 'bin':{const a=typeOf(e.a),b=typeOf(e.b);if(a==='bool'||b==='bool')throw typeErr(`${e.o} can’t take true or false`);
  if(e.o==='.')return 'str';
  if(e.o==='+'){if(a==='num'&&b==='str'||a==='str'&&b==='num')throw typeErr('+ takes two numbers or two strings');return a==='num'||b==='num'?'num':a==='str'||b==='str'?'str':a==='null'&&b==='null'?'null':'any'}
  if(a==='str'||b==='str')throw typeErr(`${e.o} takes two numbers`);return 'num'}
 case 'cmp':{const a=typeOf(e.a),b=typeOf(e.b);if(a==='num'&&b==='str'||a==='str'&&b==='num')throw typeErr(`${e.o==='='?'==':e.o} compares a number with a string`);return 'bool'}
 case 'like':typeOf(e.a);typeOf(e.b);return 'bool';
 case 'in':typeOf(e.a);e.list.forEach(typeOf);return 'bool';
 case 'not':typeOf(e.a);return 'bool';
 case 'and':case 'or':case 'xor':typeOf(e.a);typeOf(e.b);return 'bool';
 case 'call':{const ts=e.args.map(typeOf);if(NOBOOL.has(e.f)&&ts.includes('bool'))throw typeErr(`${e.f}() can’t take true or false`);
  if(e.f==='if')return U(ts[1]??'null',ts[2]??'null');
  if(e.f==='case'){let t='null';for(let i=1;i<ts.length;i+=2)t=U(t,ts[i]);return t}
  if(e.f==='coalesce'||e.f==='min'||e.f==='max')return ts.reduce(U,'null');
  if(e.f==='nullif')return ts[0]??'null';
  return RET[e.f]||'any'}}}

// ---- evaluating ----
// A condition is true or false; a comparison with a missing value gives no answer, and NOT, AND, OR, XOR, if(), case()
// and validate() count no answer as false.
const truth=v=>{v=one(v);if(v===true)return true;if(v===false||v==null)return false;throw nc('it uses a value as a condition')};
// Two values compared: as numbers when both can be, else as text when both can be; a number against text has no
// answer.
function cmpv(a,b){a=one(a);b=one(b);if(a==null||b==null)return null;
 if(canNum(a)&&canNum(b)){const x=num(a),y=num(b);return x<y?-1:x>y?1:0}
 if(canText(a)&&canText(b)){const x=text(a),y=text(b);return x<y?-1:x>y?1:0}return null}
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
// A text function on each of several values, or on the one.
const each=(v,f)=>{if(isMany(v))return v.map(x=>{const t=text(x);return t==null?null:f(t)}).filter(x=>x!=null);const t=text(v);return t==null?null:f(t)};
// abs() and a sign keep a number's precision.
const signed=(v,f)=>{if(!canNum(v))return null;const p=precOf(v),n=f(num(v));if(!p)return n;const r=decFixed(n,p.dp??0);r.sf=p.sf;return r};
const math1=(v,f)=>{if(!canNum(v))return null;const n=f(num(v));return Number.isFinite(n)?bySig(n,[precOf(v)]):null};
// The functions, by name. Each takes its arguments unevaluated, so if(), case() and coalesce() evaluate only what they need.
const FN={
 if:(a,e)=>{if(a.length!==3)throw nc('if() needs three arguments');return truth(e(a[0]))?e(a[1]):e(a[2])},
 case:(a,e)=>{if(a.length%2)throw nc('case() needs pairs of arguments');for(let i=0;i<a.length;i+=2)if(truth(e(a[i])))return e(a[i+1]);return null},
 coalesce:(a,e)=>{for(const x of a){const v=e(x);if(present(v))return v}return null},
 validate:(a,e)=>{for(let i=0;i+1<a.length;i+=2)if(!truth(e(a[i])))return e(a[i+1]);return null},
 nullif:(a,e)=>{const x=e(a[0]),y=e(a[1]);if(isMany(x))return x;return cmpv(x,y)===0?null:x},
 null:()=>null,true:()=>true,false:()=>false,
 isnull:(a,e)=>!present(e(a[0])),isnotnull:(a,e)=>present(e(a[0])),
 isnum:(a,e)=>{const v=e(a[0]);return !isMany(v)&&one(v)!=null&&canNum(v)},isint:(a,e)=>{const v=e(a[0]);return !isMany(v)&&one(v)!=null&&canNum(v)&&Number.isInteger(num(v))},
 isstr:(a,e)=>{const v=e(a[0]);if(isMany(v))return false;const x=one(v);return x!=null&&(typeof x==='string'||isFv(x)&&!NUM.test(x.fv))},
 like:(a,e)=>{const v=e(a[0]),p=text(e(a[1]));if(p==null)return null;const re=likeRe(p);if(isMany(v))return v.some(x=>re.test(text(x)));const x=text(v);return x==null?null:re.test(x)},
 match:(a,e)=>{const v=e(a[0]),p=text(e(a[1]));if(p==null)return null;const re=regex(p);if(isMany(v))return v.some(x=>re.test(text(x)));const x=text(v);return x==null?null:re.test(x)},
 in:(a,e)=>{const x=e(a[0]),vals=a.slice(1).map(e);if(isMany(x))return x.some(v=>vals.some(y=>cmpv(v,y)===0));if(one(x)==null)return null;return vals.some(y=>cmpv(x,y)===0)},
 cidrmatch:(a,e)=>{const r=text(e(a[0])),v=e(a[1]);if(isMany(v))return false;const x=text(v);if(r==null||x==null)return null;const m=cidr(r,x);if(m==null)throw nc('cidrmatch() is tried here for IPv4 only');return m},
 len:(a,e)=>{const x=text(e(a[0]));return x==null?null:[...x].length},
 lower:(a,e)=>each(e(a[0]),x=>x.toLowerCase()),upper:(a,e)=>each(e(a[0]),x=>x.toUpperCase()),
 trim:(a,e)=>trimmer(a,e,true,true),ltrim:(a,e)=>trimmer(a,e,true,false),rtrim:(a,e)=>trimmer(a,e,false,true),
 substr:(a,e)=>{const x=text(e(a[0]));if(x==null)return null;const c=[...x],s=num(e(a[1])),n=a[2]?num(e(a[2])):undefined;let i=s>0?s-1:s<0?c.length+s:0;i=Math.max(0,i);return c.slice(i,n===undefined?undefined:i+Math.max(0,n)).join('')},
 replace:(a,e)=>{const x=text(e(a[0])),p=text(e(a[1])),r=text(e(a[2]));if(x==null||p==null||r==null)return null;return x.replace(regex(p,'g'),r.replace(/\$/g,'$$$$').replace(/\\(\d)/g,'$$$1'))},
 split:(a,e)=>{const x=text(e(a[0])),d=text(e(a[1]));return x==null||d==null?null:d===''?[...x]:x.split(d)},
 urldecode:(a,e)=>{const x=text(e(a[0]));if(x==null)return null;try{return decodeURIComponent(x.replace(/\+/g,' '))}catch(err){throw nc('urldecode() finds a broken escape')}},
 tostring:(a,e)=>{if(a.length>1)throw nc('tostring() with a format isn’t computed here');const v=e(a[0]);if(!present(v))return 'Null';if(isMany(v))return v.map(text).join(' ');const x=one(v);return typeof x==='boolean'?(x?'True':'False'):text(x)},
 tonumber:(a,e)=>{const x=text(e(a[0]));if(x==null)return null;const base=a[1]?num(e(a[1])):10,t=x.trim();if(base===10)return NUM.test(t)?decText(t):null;const ok=new RegExp(`^[+-]?(0x)?[${'0123456789abcdefghijklmnopqrstuvwxyz'.slice(0,base)}]+$`,'i').test(t);return ok?parseInt(t,base):null},
 abs:(a,e)=>signed(e(a[0]),Math.abs),
 ceil:(a,e)=>{const v=e(a[0]);return canNum(v)?Math.ceil(num(v)):null},floor:(a,e)=>{const v=e(a[0]);return canNum(v)?Math.floor(num(v)):null},
 sqrt:(a,e)=>math1(e(a[0]),Math.sqrt),exp:(a,e)=>math1(e(a[0]),Math.exp),ln:(a,e)=>math1(e(a[0]),Math.log),
 round:(a,e)=>{const v=e(a[0]);if(!canNum(v))return null;const d=a[1]?num(e(a[1])):0,n=Math.round(num(v)*10**d)/10**d;return d>0?decFixed(n,d):n},
 pow:(a,e)=>{const x=e(a[0]),y=e(a[1]);if(!canNum(x)||!canNum(y))return null;return bySig(num(x)**num(y),[precOf(x),precOf(y)])},
 log:(a,e)=>{const x=e(a[0]);if(!canNum(x))return null;const b=a[1]?e(a[1]):null;if(b!=null&&!canNum(b))return null;const v=num(x),base=b==null?10:num(b);
  return bySig(base===10?Math.log10(v):base===2?Math.log2(v):Math.log(v)/Math.log(base),[precOf(x),b==null?null:precOf(b)])},
 pi:()=>({dec:true,nv:Math.PI,dp:11,sf:12,s:'3.14159265358'}),exact:(a,e)=>{const v=e(a[0]);return isDec(one(v))?one(v).nv:v},
 min:(a,e)=>extreme(a,e,-1),max:(a,e)=>extreme(a,e,1),
 md5:(a,e)=>{const x=text(e(a[0]));return x==null?null:md5(x)},
 mvappend:(a,e)=>{const out=a.flatMap(x=>many(e(x))).filter(v=>v!=null);return out.length?out:null},
 mvcount:(a,e)=>{const v=e(a[0]);return v==null?null:many(v).length},
 mvindex:(a,e)=>{const v=many(e(a[0]));if(!v.length)return null;const n=v.length,at=x=>x<0?n+x:x,s=at(num(e(a[1]))),t=a[2]?at(num(e(a[2]))):s;if(s<0||s>=n||t<s)return null;const out=v.slice(s,Math.min(t,n-1)+1);return out.length===1?out[0]:out},
 mvjoin:(a,e)=>{const v=many(e(a[0])),d=text(e(a[1]));return v.length?v.map(text).join(d??''):null},
 mvdedup:(a,e)=>{const v=many(e(a[0])).map(text);return v.length?[...new Set(v)]:null},
 length:(a,e)=>FN.len(a,e),ceiling:(a,e)=>FN.ceil(a,e)};
function trimmer(a,e,l,r){const cs=a[1]?text(e(a[1])):' \t',set=new Set([...(cs??'')]);
 return each(e(a[0]),x=>{let s=0,t=[...x],n=t.length;if(l)while(s<n&&set.has(t[s]))s++;if(r)while(n>s&&set.has(t[n-1]))n--;return t.slice(s,n).join('')})}
// min() and max() return the value itself, so 1.50 stays 1.50; of equal values, the first.
function extreme(a,e,sign){const v=a.flatMap(x=>many(e(x))).filter(x=>one(x)!=null);if(!v.length)return null;
 if(v.every(canNum))return v.reduce((m,x)=>sign*(num(x)-num(m))>0?x:m);
 if(v.some(x=>canNum(x)&&!canText(x)))throw nc(`${sign>0?'max':'min'}() mixes numbers and text`);
 return v.reduce((m,x)=>{const a=text(x),b=text(m);return sign*(a<b?-1:a>b?1:0)>0?x:m})}
function arith(o,a,b){if(!canNum(a)||!canNum(b))return null;const x=num(a),y=num(b),pa=precOf(a),pb=precOf(b);let n;
 if(o==='+')n=x+y;else if(o==='-')n=x-y;else if(o==='*')n=x*y;else{if(y===0)return null;n=o==='/'?x/y:x%y}
 if(!Number.isFinite(n))return null;
 if(o==='+'||o==='-'){const dp=[pa?.dp,pb?.dp].filter(d=>d!=null);return dp.length?decFixed(n,Math.min(...dp)):n}
 return bySig(n,[pa,pb])}
const OPS={'=':c=>c===0,'!=':c=>c!==0,'<':c=>c<0,'>':c=>c>0,'<=':c=>c<=0,'>=':c=>c>=0};
function ev(e,get){switch(e.n){
 case 'lit':return typeof e.v==='number'&&e.s&&/[.eE]/.test(e.s)?decText(e.s):e.v;
 case 'field':{const v=get(e.v);return v===undefined?null:v}
 case 'neg':return signed(ev(e.a,get),x=>-x);
 case 'bin':{const a=ev(e.a,get),b=ev(e.b,get);if(one(a)==null||one(b)==null)return null;
  if(e.o==='.')return text(a)+text(b);
  if(e.o==='+'){if(canNum(a)&&canNum(b))return arith('+',a,b);if(canText(a)&&canText(b))return text(a)+text(b);return null}
  return arith(e.o,a,b)}
 case 'cmp':{const a=ev(e.a,get),b=ev(e.b,get);
  // Several values: == finds any of them equal to text; anything else is false.
  if(isMany(a)||isMany(b)){if(e.o!=='=')return false;const [m,o]=isMany(a)?[a,b]:[b,a];if(isMany(o)||!canText(o))return false;const t=text(o);return m.some(x=>canText(x)&&text(x)===t)}
  const c=cmpv(a,b);return c==null?null:OPS[e.o](c)}
 case 'like':{const v=ev(e.a,get),p=text(ev(e.b,get));if(p==null)return null;const re=likeRe(p);if(isMany(v))return v.some(x=>re.test(text(x)));const x=text(v);return x==null?null:re.test(x)}
 case 'in':{const x=ev(e.a,get),vals=e.list.map(y=>ev(y,get));if(isMany(x))return x.some(v=>vals.some(y=>cmpv(v,y)===0));if(one(x)==null)return null;return vals.some(y=>cmpv(x,y)===0)}
 case 'not':return !truth(ev(e.a,get));
 case 'and':return truth(ev(e.a,get))&&truth(ev(e.b,get));
 case 'or':return truth(ev(e.a,get))||truth(ev(e.b,get));
 case 'xor':return truth(ev(e.a,get))!==truth(ev(e.b,get));
 case 'call':{const f=FN[e.f];if(!f)throw nc(`it uses ${e.f}(), which isn’t computed here`);return f(e.args,x=>ev(x,get))}}}
// A value as a field holds it: true and false as 1 and 0; at index time, numbers without the zeros after a point.
const strip=s=>s.includes('.')?s.replace(/0+$/,'').replace(/\.$/,''):s;
const held=(x,index)=>typeof x==='boolean'?(x?'1':'0'):index&&isDec(x)?strip(x.s):text(x);
const out=(v,index)=>{if(v==null)return null;if(Array.isArray(v)){const a=v.map(x=>held(x,index)).filter(x=>x!=null);return a.length?(a.length===1?a[0]:a):null}return held(v,index)};
// One expression, with the fields get gives: {v} with its value, {rejected} with why Splunk's type check rejects it, or
// {nc} with why it isn't computed here.
function run(src,get){try{const e=parse(src);typeOf(e);return {v:out(ev(e,get),false)}}
 catch(err){if(err instanceof Stop)return err.type?{rejected:err.message}:err.bad?{nc:`its expression can’t be read here: ${err.message}`}:{nc:err.message};throw err}}
// The fields an expression can read: the event's, as the data gives them, and its default fields.
function reader(fields,ctx){return k=>{const f=fields.get(k);if(f)return Array.isArray(f.value)?f.value.map(fv=>({fv})):{fv:f.value};
 if(k==='_raw')return {fv:ctx.raw};if(k==='sourcetype')return ctx.sourcetype!=null?{fv:ctx.sourcetype}:undefined;const m=ctx.meta?.[k];return m!=null&&['host','source','index'].includes(k)?{fv:m}:undefined}}
const show=v=>Array.isArray(v)?v.join(', '):v;
const quote=v=>Array.isArray(v)?v.map(x=>`“${x}”`).join(', '):`“${v}”`;

// ---- calculated fields ----
// Each EVAL- sees the fields as they were before any ran. A null result clears the field; one the type check rejects,
// or that isn't computed, leaves it as it was.
function calculated(evals,fields,steps,ctx){if(!evals.length)return;const get=reader(new Map(fields),ctx);
 const done=evals.map(r=>({r,name:r.key.slice(5),x:run(r.value,get)}));
 for(const {r,name,x} of done){
  if(x.nc){steps.push({at:'search',r,state:'skip',group:'eval',made:[],why:x.nc,say:`${r.key} isn’t computed here: ${x.nc}`});continue}
  if(x.rejected){steps.push({at:'search',r,state:'miss',group:'eval',made:[],rejected:true,say:`${r.key} is rejected by Splunk’s type check: ${x.rejected}${fields.has(name)?`, so ${name} stays as it was`:''}`});continue}
  if(x.v==null){const had=fields.delete(name);steps.push({at:'search',r,state:'miss',group:'eval',made:[],say:`${r.key} gives no value${had?`, so ${name} is cleared`:''}`});continue}
  fields.set(name,{value:x.v,r,calc:true});steps.push({at:'search',r,state:'hit',group:'eval',made:[name],say:`${r.key} gives ${name} = ${quote(x.v)}`})}}
// The calculated fields' row on the path: how many give values, which, and why any don't.
function row(ev){if(!ev?.length)return null;const hit=ev.filter(s=>s.state==='hit'),none=ev.filter(s=>s.state==='miss'&&!s.rejected),rej=ev.filter(s=>s.rejected),skip=ev.filter(s=>s.state==='skip'),got=hit.flatMap(s=>s.made),why=[...new Set(skip.map(s=>s.why))];
 const say=[`Calculated fields (EVAL-): ${hit.length} of ${ev.length} ${hit.length===1?'gives':'give'} ${got.length===1?'a value':'values'}${got.length?`: ${got.slice(0,8).join(', ')}${got.length>8?` and ${got.length-8} more`:''}`:''}`];
 if(none.length)say.push(`${none.length} ${none.length===1?'gives':'give'} no value`);
 if(rej.length)say.push(`${rej.length} ${rej.length===1?'is':'are'} rejected by Splunk’s type check`);
 if(skip.length)say.push(`${skip.length} ${skip.length===1?'isn’t':'aren’t'} computed here: ${why.slice(0,2).join('; ')}${why.length>2?`; and ${why.length-2} more reasons`:''}`);
 return {state:hit.length?'hit':none.length||rej.length?'miss':'skip',r:null,say:say.join('. ')}}

// ---- lookups ----
// A CSV file's header and records: a quoted value keeps what's inside its quotes; spaces round anything else are left
// out, as Splunk leaves them out.
const tables=new WeakMap();
function csv(text){const recs=[];let rec=[],cur='',q=false,quoted=false,live=false;
 const end=()=>{rec.push(quoted?cur:cur.trim());cur='';quoted=false};
 const s=String(text).replace(/^﻿/,'');
 for(let i=0;i<s.length;i++){const c=s[i];
  if(q){if(c==='"'){if(s[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c;continue}
  if(c==='"'&&!cur.trim()){q=true;quoted=true;live=true;cur='';continue}
  if(c===','){end();live=true;continue}
  if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;if(live||cur.trim()){end();recs.push(rec)}rec=[];cur='';live=false;continue}
  if(quoted){if(c.trim())cur+=c;continue}
  cur+=c;if(c.trim())live=true}
 if(live||cur.trim()){end();recs.push(rec)}
 return {head:recs[0]||[],rows:recs.slice(1)}}
const tableOf=f=>{if(!tables.has(f))tables.set(f,csv(f.text));return tables.get(f)};
const truthy=v=>!/^(0|f|false|n|no)$/i.test(String(v).trim());
// Each LOOKUP-, in order of its name, on the fields as the earlier ones left them.
function lookups(lines,fields,steps,ctx){if(!lines.length)return;
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
  const t=tableOf(file),col=n=>t.head.indexOf(n);
  const match=p.match.map(m=>({col:col(m.field),field:m.field,as:m.as||m.field}));
  const gone=match.filter(m=>m.col<0).map(m=>m.field);if(gone.length){put('missing',`: ${file.name} has no column ${and(gone)}`);continue}
  const outs=(p.output.length?p.output.map(o=>({col:col(o.field),field:o.field,as:o.as||o.field})):t.head.map((h,i)=>({col:i,field:h,as:h})).filter(o=>!match.some(m=>m.col===o.col)));
  const lost=outs.filter(o=>o.col<0).map(o=>o.field);if(lost.length){put('missing',`: ${file.name} has no column ${and(lost)}`);continue}
  const absent=match.filter(m=>fields.get(m.as)?.value==null).map(m=>m.as);if(absent.length){put('miss',`: the event has no ${and(absent)}, so it isn’t run`);continue}
  // A match field an earlier lookup wrote: lookups run one after another, in order of their names.
  const chained=match.map(m=>({as:m.as,f:fields.get(m.as)})).filter(x=>x.f?.lookup&&x.f.r).map(x=>`${x.as} is ${x.f.r.key}’s output`);
  const after=chained.length?`. ${and(chained)}, as lookups run one after another, in order of their names`:'';
  const types=new Map([...val('match_type').matchAll(/(WILDCARD|CIDR|EXACT)\s*\(\s*([^)]*?)\s*\)/gi)].map(m=>[m[2],m[1].toUpperCase()]));
  const cs=!keys.has('case_sensitive_match')||truthy(val('case_sensitive_match')),max=Math.min(1000,Math.max(1,parseInt(val('max_matches'))||100)),min=Math.max(0,parseInt(val('min_matches'))||0),dflt=keys.has('default_match')?val('default_match'):'';
  const same=(cell,v,m)=>{const type=types.get(m.field)||'EXACT';cell=cell??'';
   if(type==='WILDCARD')return new RegExp('^'+cell.split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[\\s\\S]*')+'$',cs?'':'i').test(v);
   if(type==='CIDR'){const c=cidr(cell,v);if(c!=null)return c}
   return cs?cell===v:cell.toLowerCase()===v.toLowerCase()};
  const vals=match.map(m=>many(fields.get(m.as).value));
  const rows=t.rows.filter(row=>match.every((m,i)=>vals[i].some(v=>same(row[m.col],v,m)))).slice(0,max);
  const desc=and(match.map((m,i)=>`${m.as} ${quote(vals[i].length===1?vals[i][0]:vals[i])}`)),mode=p.mode||'OUTPUT';
  if(rows.length||min>0){const got=outs.map(o=>{const v=rows.map(row=>row[o.col]??'');while(v.length<min)v.push(dflt);return {o,v:v.length===1?v[0]:v}});
   const wrote=[],kept=[];for(const {o,v} of got){if(mode==='OUTPUTNEW'&&fields.has(o.as)){kept.push(o.as);continue}fields.set(o.as,{value:v,r,lookup:file.name});wrote.push(`${o.as} = ${quote(v)}`)}
   const found=rows.length?`${desc} ${rows.length===1?'is in 1 row':`is in ${rows.length} rows`} of ${file.name}`:`no row of ${file.name} has ${desc}, so min_matches = ${min} gives default_match`;
   put(wrote.length?'hit':'miss',`: ${found}: ${wrote.length?wrote.join(', '):'nothing new'}${kept.length?`. ${and(kept)} ${kept.length===1?'is':'are'} kept, as OUTPUTNEW writes only fields the event doesn’t have`:''}${after}`);continue}
  const cleared=mode==='OUTPUTNEW'?[]:outs.filter(o=>fields.delete(o.as)).map(o=>o.as);
  put('miss',`: no row of ${file.name} has ${desc}, so ${cleared.length?`OUTPUT clears ${and(cleared)}`:'it gives nothing'}${after}`)}}

// ---- INGEST_EVAL, at index time ----
// Splunk compiles it first: a type error anywhere and none of it runs. Then its assignments in order: = adds a value to
// a field, := replaces it, and null() to a field that isn't there does nothing. _raw, queue, index, host, source and
// sourcetype change the event (for the last three, either sign replaces, and the last one wins); any other name is an
// indexed field. Returns the step's words and what changed; meta takes the new index, host, source and source type.
function ingest(expr,{raw,meta,queue,fields,r}){let as;try{as=assignments(expr)}catch(e){if(e instanceof Stop)return {state:'skip',say:`evaluates INGEST_EVAL, which can’t be read here: ${e.message}`};throw e}
 try{as.forEach(a=>typeOf(a.e))}catch(e){if(e instanceof Stop&&e.type)return {state:'miss',say:`evaluates INGEST_EVAL, which Splunk can’t compile, as ${e.message}: none of its assignments run`};if(!(e instanceof Stop))throw e}
 const cur={raw,queue,index:meta.index,host:meta.host,source:meta.source,sourcetype:meta.sourcetype},local=new Map(),cleared=new Set();let qset=false;
 const get=k=>{if(k==='_raw')return {fv:cur.raw};if(['queue','index','host','source','sourcetype'].includes(k))return cur[k]!=null?{fv:cur[k]}:undefined;if(k==='linecount')return {fv:String(cur.raw.split(/\r\n|\r|\n/).length)};
  const v=local.has(k)?local.get(k):cleared.has(k)?null:fields.get(k)?.value;if(v==null||Array.isArray(v)&&!v.length)return undefined;return Array.isArray(v)?(v.length===1?{fv:v[0]}:v.map(fv=>({fv}))):{fv:v}};
 for(const a of as){let v;try{v=ev(a.e,get)}catch(e){if(e instanceof Stop)return {state:'skip',say:`evaluates INGEST_EVAL, which isn’t tried here: ${e.bad?`it can’t be read: ${e.message}`:e.message}`};throw e}
  const vals=v==null?[]:many(v).map(x=>held(x,true)).filter(x=>x!=null);
  if(a.name==='_raw'){if(vals.length)cur.raw=vals[0];continue}
  if(a.name==='queue'){if(vals.length){cur.queue=vals[0];qset=true}continue}
  if(['index','host','source','sourcetype'].includes(a.name)){if(vals.length)cur[a.name]=vals[0];continue}
  const had=local.has(a.name)?local.get(a.name):cleared.has(a.name)?[]:many(fields.get(a.name)?.value);
  if(!vals.length){if(a.op===':='&&had.length){local.delete(a.name);cleared.add(a.name)}continue}
  local.set(a.name,a.op===':='?vals:[...had,...vals]);cleared.delete(a.name)}
 const say=[];if(cur.raw!==raw)say.push('the event text is rewritten');
 for(const [k,name] of [['index','index'],['host','host'],['source','source'],['sourcetype','source type']])if(cur[k]!==meta[k]){meta[k]=cur[k];say.push(`the ${name} becomes ${cur[k]}`)}
 const wrote=[...local.keys()];for(const k of wrote){const v=local.get(k);fields.set(k,{value:v.length===1?v[0]:v,r})}for(const k of cleared)fields.delete(k);
 if(wrote.length)say.push(`it writes ${and(wrote.map(k=>`${k} = ${quote(local.get(k).length===1?local.get(k)[0]:local.get(k))}`))} as ${wrote.length>1?'indexed fields':'an indexed field'}`);
 if(cleared.size)say.push(`it removes ${and([...cleared])}`);
 const q=qset?cur.queue:undefined;if(q!==undefined)say.push(`the event goes to ${q}`);
 return {state:'hit',say:`evaluates INGEST_EVAL: ${say.length?say.join('; '):'nothing changes'}`,raw:cur.raw!==raw?cur.raw:undefined,queue:q}}

// The engine keeps Build 225's name, which Build 225's edits read; configEval226 names the same object.
window.configEval225=window.configEval226={lex,parse,assignments,run,calculated,lookups,ingest,row,show,csv,md5,cidr,likeRe,typeOf,plain,roundAt,decSig,decFixed,decText,
 // For a test or a script: one expression, with the fields given as an object.
 evaluate:(src,obj={},ctx={})=>run(src,reader(new Map(Object.entries(obj).map(([k,v])=>[k,{value:v}])),ctx))};
})();
