# ASSGA — Netlify
Site público + painel administrativo + Netlify Functions + Netlify Blobs.

## Publicação
1. Envie a pasta para GitHub ou faça deploy pelo Netlify.
2. Em Netlify > Project configuration > Environment variables, crie:
   ASSGA_JWT_SECRET = chave longa e aleatória
   ASSGA_SETUP_KEY = chave temporária para cadastro inicial
3. Faça o deploy.
4. Abra /admin-cadastro.html e crie o primeiro administrador usando ASSGA_SETUP_KEY.
5. Entre em /admin-login.html e depois /management.html.

Não coloque essas chaves no código ou no netlify.toml.
