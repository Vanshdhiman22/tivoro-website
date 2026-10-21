import pages from '../../server/pages.generated.json';
export const dynamic='force-dynamic';
export function GET(request:Request){
 const url=new URL(request.url);
 const clean=url.pathname.replace(/\/$/,'')||'/';
 if(clean==='/'){
  url.pathname='/about';
  return new Response(null,{status:302,headers:{Location:url.toString(),'Cache-Control':'no-store'}});
 }
 const filename=clean==='/home'||clean==='/home.html'?'index.html':clean.slice(1)+(clean.endsWith('.html')?'':'.html');
 const html=(pages as Record<string,string>)[filename];
 const body=html||(pages as Record<string,string>)['404.html'];
 return new Response(body,{status:html?200:404,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}
export function HEAD(request:Request){const response=GET(request);return new Response(null,{status:response.status,headers:response.headers});}
