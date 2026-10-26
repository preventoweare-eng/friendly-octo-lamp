import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, normalize, extname } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const cache = new Map();
const cleanText = value => String(value || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
function resultId(url){return createHash('sha1').update(url).digest('hex').slice(0,12)}
async function searchTavily(query){
  if(!process.env.TAVILY_API_KEY) return null;
  const response=await fetch('https://api.tavily.com/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({api_key:process.env.TAVILY_API_KEY,query,max_results:8,search_depth:'advanced',include_answer:false})});
  if(!response.ok) throw new Error(`Tavily ${response.status}`);
  const data=await response.json();
  return (data.results||[]).map(item=>({id:resultId(item.url),title:item.title,url:item.url,source:new URL(item.url).hostname,excerpt:item.content||'',publishedAt:item.published_date||null,provider:'Tavily'}));
}
async function searchDuckDuckGo(query){
  const rows=[];
  try{
    const response=await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,{headers:{'user-agent':'Tracework Research/1.0'}});
    if(response.ok){const data=await response.json();if(data.AbstractURL)rows.push({title:data.Heading||query,url:data.AbstractURL,source:new URL(data.AbstractURL).hostname,excerpt:data.AbstractText||'',provider:'DuckDuckGo'});const flatten=items=>(items||[]).forEach(item=>{if(item.FirstURL)rows.push({title:cleanText(item.Text)||query,url:item.FirstURL,source:new URL(item.FirstURL).hostname,excerpt:cleanText(item.Text),provider:'DuckDuckGo'});flatten(item.Topics)});flatten(data.RelatedTopics)}
  }catch{}
  if(rows.length<3)try{const response=await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,{headers:{'user-agent':'Mozilla/5.0 Tracework Research/1.0'}});const html=response.ok?await response.text():'';for(const match of html.matchAll(/result__a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)){let href=match[1];if(href.startsWith('//'))href='https:'+href;try{const parsed=new URL(href);if(!parsed.hostname.includes('duckduckgo.com'))rows.push({title:cleanText(match[2]),url:href,source:parsed.hostname,excerpt:'来自网页搜索结果，打开原文后请人工审核。',provider:'DuckDuckGo Web'})}catch{}}}catch{}
  return [...new Map(rows.map(item=>[item.url,item])).values()].slice(0,8).map(item=>({...item,id:resultId(item.url)}));
}
async function searchBing(query){const response=await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`,{headers:{'user-agent':'Mozilla/5.0 Tracework Research/1.0'}});if(!response.ok)throw new Error(`Bing ${response.status}`);const html=await response.text();const rows=[];for(const match of html.matchAll(/<li class="b_algo"[\s\S]*?<h2><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>[\s\S]*?<p>([\s\S]*?)<\/p>/g)){try{const parsed=new URL(match[1]);rows.push({id:resultId(match[1]),title:cleanText(match[2]),url:match[1],source:parsed.hostname,excerpt:cleanText(match[3]),provider:'Bing Web'})}catch{}}return rows.slice(0,8)}
async function handleSearch(req,res,url){
  const query=(url.searchParams.get('q')||'').trim();
  if(query.length<2){res.writeHead(400,{'content-type':'application/json'});return res.end(JSON.stringify({error:'请输入至少 2 个字符的研究主题'}));}
  const key=query.toLowerCase();if(cache.has(key)){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});return res.end(JSON.stringify({...cache.get(key),cached:true}));}
  try{const results=await searchTavily(query)||await searchDuckDuckGo(query);const finalResults=results?.length?results:await searchBing(query);const payload={query,provider:finalResults?.[0]?.provider||'Bing Web',results:finalResults||[],searchedAt:new Date().toISOString(),live:true};cache.set(key,payload);res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(payload));}
  catch(error){res.writeHead(502,{'content-type':'application/json'});res.end(JSON.stringify({error:'搜索服务暂时不可用',detail:error.message,configured:Boolean(process.env.TAVILY_API_KEY)}));}
}
async function serve(req,res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname==='/api/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,searchProvider:process.env.TAVILY_API_KEY?'Tavily':'DuckDuckGo'}))}if(url.pathname==='/api/search')return handleSearch(req,res,url);let pathname=decodeURIComponent(url.pathname);if(pathname==='/'||pathname==='')pathname='/index.html';const file=normalize(join(root,pathname));if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}try{const info=await stat(file);if(!info.isFile())throw new Error('not file');res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}}
createServer((req,res)=>serve(req,res).catch(error=>{res.writeHead(500);res.end('Server error');console.error(error)})).listen(port,'0.0.0.0',()=>console.log(`Tracework running at http://127.0.0.1:${port}`));
