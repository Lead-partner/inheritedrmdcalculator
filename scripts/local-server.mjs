import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {pathToFileURL} from 'node:url';

export async function startServer(port=0) {
 const root=resolve('public');
 const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.xml':'application/xml'};
 const server=createServer(async(req,res)=>{
  try {
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
   if(!file.startsWith(root+'/'))throw Error('Invalid path');
   const body=await readFile(file);
   res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain'});res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
 });
 await new Promise(ok=>server.listen(port,'127.0.0.1',ok));
 return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(ok=>server.close(ok))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 const server=await startServer(Number(process.argv[2]||4173));console.log(server.url);
}
