// Manual only: never invoked by build. A changed value needs human IRS verification.
import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../data/irs-tables.json',import.meta.url);
const current=JSON.parse(await readFile(path,'utf8'));
const response=await fetch('https://raw.githubusercontent.com/Lead-partner/retirement-limits-data/main/data/dataset.json');
if(!response.ok) throw new Error(`Table refresh failed: HTTP ${response.status}`);
const dataset=await response.json();
function normalize(block,name) {
  if(!block) throw new Error(`Missing ${name}; upstream must provide both RMD tables. No file was changed.`);
  const rows=Array.isArray(block)?block:block.data ?? block.rows ?? block.values ?? block;
  const result={};
  if(Array.isArray(rows)) for(const r of rows) {
    const age=String(r.age).replace('+','');
    const divisor=Number(r.life_expectancy ?? r.applicable_denominator ?? r.divisor ?? r.value);
    if(!/^\d+$/.test(age) || !Number.isFinite(divisor) || divisor<1) throw new Error(`Unexpected ${name} row: ${JSON.stringify(r)}`);
    result[age]=divisor;
  } else for(const [age,value] of Object.entries(rows)) {
    if(!/^\d+$/.test(age.replace('+','')) || !Number.isFinite(Number(value))) throw new Error(`Unexpected ${name} structure`);
    result[age.replace('+','')]=Number(value);
  }
  return result;
}
const updated={...current};
for(const key of ['rmd_single_life','rmd_uniform_lifetime']) {
  const root=dataset[key] ?? dataset.data?.[key] ?? dataset.datasets?.[key];
  const values=normalize(root,key);
  const differences=[...new Set([...Object.keys(current[key]),...Object.keys(values)])].filter(age=>current[key][age]!==values[age]);
  if(differences.length) throw new Error(`${key} changed unexpectedly at ages ${differences.join(', ')}. Verify against IRS Appendix B and review the baseline manually. No file was changed.`);
  updated[key]=values;
}
updated.retrieved=new Date().toISOString().slice(0,10);
await writeFile(path,JSON.stringify(updated,null,2)+'\n');
console.log('Both tables match the verified baseline. Updated retrieval date.');
