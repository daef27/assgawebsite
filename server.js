const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "ASSGA_TROQUE_ESTA_CHAVE_EM_PRODUCAO";
const dbDir = path.join(__dirname, "data");
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, "assga.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 nome TEXT NOT NULL,
 usuario TEXT NOT NULL UNIQUE,
 senha_hash TEXT NOT NULL,
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conteudos (
 chave TEXT PRIMARY KEY,
 dados TEXT NOT NULL,
 atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS eventos (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 nome TEXT NOT NULL,
 data TEXT,
 local TEXT,
 vagas INTEGER DEFAULT 0,
 valor TEXT,
 status TEXT,
 descricao TEXT,
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const defaults = {
 index: {titulo:"2º HALLOWEEN ASSGA", texto:"Estão abertas as inscrições para o 2º HALLOWEEN ASSGA!", data:"28 e 29 de novembro de 2026", local:"Em breve", vagas:"100"},
 historia: {titulo:"Sobre a ASSGA", texto:"A ASSGA promove esporte, integração social e fortalecimento da comunidade."},
 esportiva: {titulo:"ASSGA Esportiva", modalidade:"Futsal", texto:"A ASSGA promove atividades esportivas e participação da comunidade."},
 estatuto: {titulo:"Estatuto Social da ASSGA", texto:"Documento oficial para consulta pública.", pdf:""},
 diretoria: {presidente:"Nome do Presidente", vice:"Nome do Vice-Presidente", secretario:"Nome do Secretário", tesoureiro:"Nome do Tesoureiro", texto:"Diretoria responsável pela organização da ASSGA."}
};
const insert = db.prepare("INSERT OR IGNORE INTO conteudos(chave,dados) VALUES(?,?)");
for (const [k,v] of Object.entries(defaults)) insert.run(k, JSON.stringify(v));
if (!db.prepare("SELECT id FROM eventos LIMIT 1").get()) {
  db.prepare("INSERT INTO eventos(nome,data,local,vagas,valor,status,descricao) VALUES(?,?,?,?,?,?,?)")
    .run("2º HALLOWEEN ASSGA","28 e 29 de novembro de 2026","Em breve",100,"R$ 100,00","Inscrições abertas","Prepare-se para um evento especial.");
}

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
  try { req.admin=jwt.verify(token,JWT_SECRET); next(); }
  catch { res.status(401).json({erro:"Não autorizado"}); }
}
function getContent(chave){
  const row=db.prepare("SELECT dados FROM conteudos WHERE chave=?").get(chave);
  return row ? JSON.parse(row.dados) : {};
}

app.get("/api/publico", (req,res)=>{
  const conteudos={};
  for(const k of Object.keys(defaults)) conteudos[k]=getContent(k);
  conteudos.eventos=db.prepare("SELECT id,nome,data,local,vagas,valor,status,descricao FROM eventos ORDER BY id DESC").all();
  res.json(conteudos);
});

app.post("/api/admin/cadastro",(req,res)=>{
  const {nome,usuario,senha}=req.body;
  if(!nome||!usuario||!senha||senha.length<6) return res.status(400).json({erro:"Informe nome, usuário e senha com pelo menos 6 caracteres."});
  try{
    const hash=bcrypt.hashSync(senha,12);
    const r=db.prepare("INSERT INTO admins(nome,usuario,senha_hash) VALUES(?,?,?)").run(nome,usuario,hash);
    res.json({ok:true,id:r.lastInsertRowid});
  }catch(e){res.status(409).json({erro:"Usuário já cadastrado."});}
});

app.post("/api/admin/login",(req,res)=>{
  const {usuario,senha}=req.body;
  const a=db.prepare("SELECT * FROM admins WHERE usuario=?").get(usuario);
  if(!a||!bcrypt.compareSync(senha,a.senha_hash)) return res.status(401).json({erro:"Usuário ou senha incorretos."});
  const token=jwt.sign({id:a.id,nome:a.nome,usuario:a.usuario},JWT_SECRET,{expiresIn:"8h"});
  res.json({ok:true,token,nome:a.nome});
});

app.get("/api/admin/me",auth,(req,res)=>res.json(req.admin));

app.put("/api/admin/conteudo/:chave",auth,(req,res)=>{
  const allowed=["index","historia","esportiva","estatuto","diretoria","esportiva"];
  if(!allowed.includes(req.params.chave)) return res.status(400).json({erro:"Conteúdo inválido"});
  db.prepare("INSERT INTO conteudos(chave,dados,atualizado_em) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(chave) DO UPDATE SET dados=excluded.dados, atualizado_em=CURRENT_TIMESTAMP")
    .run(req.params.chave,JSON.stringify(req.body));
  res.json({ok:true,dados:req.body});
});

app.post("/api/admin/eventos",auth,(req,res)=>{
  const {nome,data,local,vagas,valor,status,descricao}=req.body;
  if(!nome) return res.status(400).json({erro:"Nome do evento é obrigatório."});
  const r=db.prepare("INSERT INTO eventos(nome,data,local,vagas,valor,status,descricao) VALUES(?,?,?,?,?,?,?)")
    .run(nome,data||"",local||"",Number(vagas)||0,valor||"",status||"Em breve",descricao||"");
  res.json({ok:true,id:r.lastInsertRowid});
});
app.put("/api/admin/eventos/:id",auth,(req,res)=>{
  const {nome,data,local,vagas,valor,status,descricao}=req.body;
  db.prepare("UPDATE eventos SET nome=?,data=?,local=?,vagas=?,valor=?,status=?,descricao=? WHERE id=?")
    .run(nome,data||"",local||"",Number(vagas)||0,valor||"",status||"Em breve",descricao||"",req.params.id);
  res.json({ok:true});
});
app.delete("/api/admin/eventos/:id",auth,(req,res)=>{
  db.prepare("DELETE FROM eventos WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.get("/api/admin/dashboard",auth,(req,res)=>{
  res.json({
    paginas:6,
    eventos:db.prepare("SELECT COUNT(*) c FROM eventos").get().c,
    administradores:db.prepare("SELECT COUNT(*) c FROM admins").get().c,
    atualizacoes:db.prepare("SELECT COUNT(*) c FROM conteudos").get().c
  });
});

app.get("*",(req,res)=>{
  if(req.path.startsWith("/api/")) return res.status(404).json({erro:"Rota não encontrada"});
  res.sendFile(path.join(__dirname,"public","index.html"));
});
app.listen(PORT,()=>console.log(`ASSGA rodando em http://localhost:${PORT}`));
