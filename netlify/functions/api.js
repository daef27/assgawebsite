const {getStore}=require("@netlify/blobs");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const store=getStore("assga-site");
const SECRET=process.env.ASSGA_JWT_SECRET, SETUP=process.env.ASSGA_SETUP_KEY;
const defaults={
 index:{titulo:"ASSGA",texto:"Esporte, integração, acessibilidade e comunidade.",data:"",local:"",vagas:""},
 historia:{titulo:"Sobre a ASSGA",texto:"A ASSGA promove esporte, integração social e fortalecimento da comunidade."},
 esportiva:{titulo:"ASSGA Esportiva",modalidade:"Futsal",texto:"A ASSGA promove atividades esportivas e participação da comunidade."},
 estatuto:{titulo:"Estatuto Social da ASSGA",texto:"Documento oficial para consulta pública.",pdf:""},
 diretoria:{presidente:"Nome do Presidente",vice:"Nome do Vice-Presidente",secretario:"Nome do Secretário",tesoureiro:"Nome do Tesoureiro",texto:"Diretoria responsável pela organização da ASSGA."}
};
const out=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"Content-Type":"application/json"}});
const body=async e=>{try{return await e.json()}catch{return {}}};
async function get(k,d){let v=await store.get(k,{type:"json"});return v===null?d:v}
async function set(k,v){await store.setJSON(k,v)}
async function auth(e){try{let h=e.headers.authorization||"";if(!h.startsWith("Bearer ")||!SECRET)return null;return jwt.verify(h.slice(7),SECRET)}catch{return null}}
exports.handler=async e=>{
 const method=e.httpMethod||"GET", p=e.path.replace(/^\/(.netlify\/functions\/api|api)\/?/,"");
 try{
  if(method==="GET"&&(p===""||p==="publico")){let r={};for(const [k,v] of Object.entries(defaults))r[k]=await get("content:"+k,v);r.eventos=await get("eventos",[]);return out(r)}
  if(method==="POST"&&p==="admin/cadastro"){let b=await body(e);if(!SETUP||b.chave!==SETUP)return out({erro:"Chave de cadastro inválida."},403);if(!b.nome||!b.usuario||!b.senha||b.senha.length<6)return out({erro:"Preencha nome, usuário e senha (mínimo 6 caracteres)."},400);let a=await get("admins",[]);if(a.some(x=>x.usuario.toLowerCase()===b.usuario.toLowerCase()))return out({erro:"Usuário já cadastrado."},409);a.push({id:crypto.randomUUID(),nome:b.nome,usuario:b.usuario,senha:await bcrypt.hash(b.senha,12)});await set("admins",a);return out({ok:true})}
  if(method==="POST"&&p==="admin/login"){let b=await body(e),a=await get("admins",[]),u=a.find(x=>x.usuario.toLowerCase()===String(b.usuario||"").toLowerCase());if(!u||!(await bcrypt.compare(b.senha||"",u.senha)))return out({erro:"Usuário ou senha incorretos."},401);if(!SECRET)return out({erro:"ASSGA_JWT_SECRET não configurado."},500);return out({ok:true,token:jwt.sign({id:u.id,nome:u.nome,usuario:u.usuario},SECRET,{expiresIn:"8h"}),nome:u.nome})}
  const me=await auth(e);if(!me)return out({erro:"Não autorizado."},401);
  if(method==="GET"&&p==="admin/me")return out(me);
  if(method==="GET"&&p==="admin/dashboard"){return out({paginas:6,eventos:(await get("eventos",[])).length,administradores:(await get("admins",[])).length,atualizacoes:5})}
  if(method==="PUT"&&p.startsWith("admin/conteudo/")){let k=p.split("/").pop();if(!defaults[k])return out({erro:"Conteúdo inválido."},400);await set("content:"+k,await body(e));return out({ok:true})}
  if(method==="POST"&&p==="admin/eventos"){let b=await body(e);if(!b.nome)return out({erro:"Nome obrigatório."},400);let a=await get("eventos",[]);let n={id:crypto.randomUUID(),nome:b.nome,data:b.data||"",local:b.local||"",vagas:Number(b.vagas)||0,valor:b.valor||"",status:b.status||"Em breve",descricao:b.descricao||""};a.unshift(n);await set("eventos",a);return out({ok:true,event:n})}
  if(method==="DELETE"&&p.startsWith("admin/eventos/")){let id=p.split("/").pop();await set("eventos",(await get("eventos",[])).filter(x=>x.id!==id));return out({ok:true})}
  return out({erro:"Rota não encontrada."},404)
 }catch(err){console.error(err);return out({erro:"Erro interno.",detalhe:err.message},500)}
}