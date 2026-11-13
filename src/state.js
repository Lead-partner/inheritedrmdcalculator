import {validYear,parseBalance} from './rules.js';
export const fields=['r','t','ob','od','b','early','rbd','gap','bal','g'];
export function encodeState(a) {
  const p=new URLSearchParams();
  for(const k of fields) if(a[k]!==undefined && a[k]!==null && a[k]!=='') p.set(k,String(a[k]));
  if(a.bal===null) p.set('bal','skip');
  return p.toString();
}
export function decodeState(query,today=new Date()) {
  const p=new URLSearchParams(query), a={},Y=today.getFullYear();
  for(const k of ['r','t','early','rbd','gap']) {
    const options=k==='r'?['parent','spouse','other','trust']:k==='t'?['ira','roth','plan']:['yes','no','unsure'];
    if(options.includes(p.get(k))) a[k]=p.get(k);
  }
  for(const k of ['ob','od','b']) if(validYear(p.get(k),Y)) a[k]=p.get(k);
  if(p.get('bal')==='skip') a.bal=null;
  else if(p.has('bal') && p.get('bal')!=='' && Number.isFinite(parseBalance(p.get('bal')))) a.bal=parseBalance(p.get('bal'));
  if(['0','0.03','0.05','0.07'].includes(p.get('g'))) a.g=+p.get('g');
  return a;
}
