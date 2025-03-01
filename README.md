# Reddit Research

Aplicação para coletar e agregar comentários do Reddit sobre temas específicos.

## Descrição

Este projeto é uma prova de conceito que permite:
1. Receber um tema de pesquisa (ex: "animes com personagens fracos que ficam overpower")
2. Pesquisar esse tema no Reddit
3. Coletar comentários de usuários em postagens relacionadas
4. Criar um texto agregado com base nos comentários coletados

## Instalação

```bash
# Clonar o repositório
git clone [url-do-repositório]
cd reddit-research

# Instalar dependências
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
REDDIT_CLIENT_ID=seu_client_id
REDDIT_CLIENT_SECRET=seu_client_secret
REDDIT_USERNAME=seu_username
REDDIT_PASSWORD=sua_senha
```

Para obter as credenciais do Reddit:
1. Acesse https://www.reddit.com/prefs/apps
2. Clique em "create app" ou "create another app"
3. Preencha as informações necessárias
4. Selecione "script" como tipo de aplicação
5. Após criar, você terá acesso ao Client ID e Client Secret

## Uso

```bash
# Iniciar o servidor
npm start

# Ou para desenvolvimento com reinicialização automática
npm run dev
```

Acesse a aplicação em http://localhost:3000

## Abordagens

Este projeto utiliza a API oficial do Reddit através da biblioteca `snoowrap` para Node.js. Esta abordagem é gratuita para uso pessoal, respeitando os limites de taxa da API do Reddit. 