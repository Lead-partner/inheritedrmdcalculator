const escapeText=s=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
export function foldLine(line) {
  const lines=[];let part='',bytes=0;
  for(const char of line) {
    const size=new TextEncoder().encode(char).length;
    if(bytes+size>75) {lines.push(part);part=' ';bytes=1;}
    part+=char;bytes+=size;
  }
  lines.push(part);return lines.join('\r\n');
}
export function makeCalendar({date,description,uid='rmd-'+date+'@inheritedrmdcalculator.com',now=new Date()}) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Calendar deadline must be an ISO date');
  const start=date.replaceAll('-',''), next=new Date(date+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Inherited RMD Calculator//Deadline//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${escapeText(uid)}`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${next.toISOString().slice(0,10).replaceAll('-','')}`,'SUMMARY:Inherited IRA withdrawal deadline',`DESCRIPTION:${escapeText(description)}`,'BEGIN:VALARM','TRIGGER:-P14D','ACTION:DISPLAY','DESCRIPTION:Inherited IRA withdrawal deadline in 14 days','END:VALARM','END:VEVENT','END:VCALENDAR'].map(foldLine).join('\r\n')+'\r\n';
}
