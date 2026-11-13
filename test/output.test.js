import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeState,decodeState} from '../src/state.js';
import {makeCalendar,foldLine} from '../src/calendar.js';
test('URL state round trips example, follow-ups, growth, skipped balance',()=>{
 // Exact query values survive encode/decode; dates remain four-digit strings.
 const a={r:'parent',t:'ira',ob:'1944',od:'2023',b:'1971',bal:412600,g:.05,early:'no',rbd:'no',gap:'yes'};
 assert.deepEqual(decodeState(encodeState(a)),a);assert.equal(decodeState(encodeState({...a,bal:null})).bal,null);
});
test('URL ignores hostile or invalid values instead of putting them into HTML',()=>{
 // Only enumerated strings, 1900..current years and finite positive balances survive.
 assert.deepEqual(decodeState('?r=<script>&t=other&ob=9999&od=-1&b=hello&bal=-10&g=Infinity&gap=oops'),{});
 assert.deepEqual(decodeState('?bal='),{});
});
test('Calendar: all-day deadline, next-day end, CRLF, UID, timestamp, 14-day alarm',()=>{
 // Dec31 all-day DTSTART20261231 -> exclusive DTEND20270101; alarm14 days before.
 const ics=makeCalendar({date:'2026-12-31',description:'Take out $13,140.13, then verify; with custodian.\nA new line.',now:new Date('2026-11-13T15:04:05Z')});
 assert.match(ics,/BEGIN:VCALENDAR\r\nVERSION:2.0/);assert.match(ics,/DTSTART;VALUE=DATE:20261231/);assert.match(ics,/DTEND;VALUE=DATE:20270101/);assert.match(ics,/UID:.+@inheritedrmdcalculator.com/);assert.match(ics,/DTSTAMP:20261113T150405Z/);assert.match(ics,/BEGIN:VALARM\r\nTRIGGER:-P14D/);assert.ok(ics.endsWith('END:VCALENDAR\r\n'));assert.equal(ics.replaceAll('\r\n','').includes('\n'),false);
 assert.match(ics.replaceAll('\r\n ',''),/13\\,140.13\\, then verify\\;/);
});
test('ICS UTF-8 folding never exceeds 75 octets and unfolds losslessly',()=>{
 // Each é=2bytes, emoji=4bytes; continuation starts with a single space counted in75.
 const line='DESCRIPTION:'+('é🙂'.repeat(65));const folded=foldLine(line);
 for(const part of folded.split('\r\n'))assert.ok(Buffer.byteLength(part)<=75);
 assert.equal(folded.replaceAll('\r\n ',''),line);
});
