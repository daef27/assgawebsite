async function api(url,opts){const r=await fetch(url,opts);const d=await r.json();if(!r.ok)throw Error(d.erro||"Erro");return d}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
async function carregar(){
 try{
  const d=await api("/api/publico");
  if(location.pathname.endsWith("index.html")||location.pathname==="/"){titulo.textContent=d.index.titulo;texto.textContent=d.index.texto;destaque.innerHTML=d.eventos[0]?eventoCard(d.eventos[0]):"<p>Nenhum evento publicado.</p>"}
  if(location.pathname.includes("historia")){titulo.textContent=d.historia.titulo;texto.innerHTML=d.historia.texto.split(/\n+/).map(x=>`<p>${esc(x)}</p>`).join("")}
  if(location.pathname.includes("esportiva")){titulo.textContent=d.esportiva.titulo;modalidade.textContent=d.esportiva.modalidade;texto.textContent=d.esportiva.texto}
  if(location.pathname.includes("evento")){eventos.innerHTML=d.eventos.map(eventoCard).join("")||'<section class="panel"><p>Nenhum evento publicado.</p></section>'}
  if(location.pathname.includes("estatuto")){titulo.textContent=d.estatuto.titulo;texto.textContent=d.estatuto.texto;if(d.estatuto.pdf){pdf.href=d.estatuto.pdf;pdf.style.display="inline-block"}}
  if(location.pathname.includes("diretoria")){for(const k of ["presidente","vice","secretario","tesoureiro","texto"])$(k).textContent=d.diretoria[k]||""}
 }catch(e){console.error(e)}
}
function $(id){return document.getElementById(id)}
function eventoCard(e){return `<section class="panel event"><h2><i class="fas fa-calendar-days"></i> ${esc(e.nome)}</h2><div class="meta"><div><b>Data</b><br>${esc(e.data)}</div><div><b>Local</b><br>${esc(e.local)}</div><div><b>Vagas</b><br>${esc(e.vagas)}</div><div><b>Valor</b><br>${esc(e.valor)}</div><div><b>Status</b><br>${esc(e.status)}</div></div><p>${esc(e.descricao)}</p></section>`}
carregar();