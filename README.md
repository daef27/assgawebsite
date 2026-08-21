# ASSGA - Site completo

## Estrutura
- 6 páginas públicas: index, historia, esportiva, evento, estatuto, diretoria
- admin-login.html
- admin-cadastro.html
- management.html
- API Node/Express
- banco SQLite persistente em data/assga.db
- autenticação JWT + senha com bcrypt
- CRUD de conteúdos e eventos

## Rodar
1. Instale Node.js 18+.
2. Abra o terminal nesta pasta.
3. Execute:
   npm install
   npm start
4. Abra:
   http://localhost:3000/admin-cadastro.html
5. Crie o primeiro administrador.
6. Entre em:
   http://localhost:3000/admin-login.html
7. Edite o site no painel.

## Produção
Defina uma chave forte:
JWT_SECRET="uma-chave-secreta-forte" npm start

O banco é criado automaticamente em data/assga.db.
