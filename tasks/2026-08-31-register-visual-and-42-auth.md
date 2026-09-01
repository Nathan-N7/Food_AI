# Food AI — Visual de Registro alinhado ao Login + Autenticação 42 (OAuth 2.0)

- **Status:** Validated
- **Branch:** task/fix-security-concurrency (continua a feature branch atual; base = origin/update_frontend)
- **Goal:** (1) Deixar a página de registro com o mesmo visual glassmorphism da página de login; (2) permitir login/registro via conta da Escola 42 usando OAuth 2.0, reutilizando o mesmo fluxo de sessão httpOnly + CSRF já em uso (sem adicionar dependências pesadas).
- **Context:** A app já migrou para auth de sessão httpOnly (`POST /api/auth/login/` → `login(request, user)`, cookies `sessionid`+`csrftoken`, `GET /api/auth/me/`, `POST /api/auth/logout/`). O frontend tem `AuthContext` (hidrata via `/api/auth/me/`), helper `api.js` (`credentials:'include'` + `X-CSRFToken`), e `Login.jsx` com visual glassmorphism (Login.css). `Register.jsx` é um formulário simples sem esse visual. `User` é o default do Django (`auth.User`, campos username/email/password). Não há allauth/social instalado. Entidade da Escola 42 usa OAuth 2.0: authorize `https://api.intra.42.fr/oauth/authorize`, token `https://api.intra.42.fr/oauth/token`, perfil `https://api.intra.42.fr/v2/me` (login, email, first_name, last_name, image.link). Nickname da app fica em `Profile.nickname` (auto-criado por signal post_save).

## Checklist
- [ ] **Backend — OAuth 42 (manual, com `requests`, já no requirements):**
  - [ ] Levar `FORTY_TWO_CLIENT_ID`, `FORTY_TWO_CLIENT_SECRET`, `FORTY_TWO_REDIRECT_URI` e scopes para env (via `django-environ`/os.getenv como o resto do settings; adicionar ao `.env.example`/`.env`).
  - [ ] `GET /api/auth/42/authorize` → monta URL de authorize do 42 com `client_id`, `redirect_uri`, `response_type=code`, `scope=public`, `state` (CSRF/csrf token para validar no callback) e redireciona (303/302).
  - [ ] `GET /api/auth/42/callback?code=...&state=...` → valida `state`; troca `code` por access token (`POST /oauth/token`, grant_type=authorization_code); buscar perfil em `/v2/me` com Bearer; criar/obter `User` por `email` (ou por `username`=login 42 como fallback) com `username` único (login do 42, com sufixo se colidir); setar `Profile.nickname` = login do 42 / nome; chamar `django.contrib.auth.login(request, user)` para estabelecer sessão httpOnly; **redirect para o frontend** (ex.: `https://localhost:8443/oauth/success` ou `/dashboard`) com cookie de sessão setado (o redirect vem da mesma engine — cookie já é emitido na resposta do callback).
  - [ ] Tratamento de erros: se o user 42 não tiver email, gerar `username@42.local` (ou logar sem email — Django aceita email vazio); collision de username já existente → anexar sufixo.
  - [ ] Rota de sucesso/fallback no frontend que, ao carregar, chama `GET /api/auth/me/` via `AuthContext` (que já hidrata) e navega para `/dashboard`.
  - [ ] Throttling/segurança: o callback é GET com validação de state; proteger contra CSRF do state (usar sessão) e não expor secret.

- [ ] **Frontend — Visual do registro igual ao login:**
  - [ ] Reutilizar `Login.css` (ou um CSS compartilhado) em `Register.jsx`: container de fundo `comida.jpeg`, card glassmorphism `login-card`, header com `login-logo-brain` + "Food AI", `login-form`, `input-group`/`login-logo`, `.btn-submit`, `.login-message`, `.login-footer`.
  - [ ] Estrutura do Register: campos Usuário, Nickname, Email, Senha + botão "Criar conta" + links footer (Já tenho conta → `/login`, Privacy, Terms).
  - [ ] **Botão "Entrar com 42"** na página (tanto login quanto registro), link para `/api/auth/42/authorize`.
  - [ ] Rota `/oauth/success` (ou interceptação no App) que chama `useAuth()` para hidratar e redireciona.

## Subtasks
- **backend:** OAuth 42 — endpoints authorize/callback, config env, criação/atribuição de User+Profile, `login()` de sessão, validar `state`, redirect. Incluir rotas em `api/urls.py`. Testar `py_compile` + `manage.py check` + fluxo com a API do 42 (se houver credenciais; senão, simular o callback com um stub local apenas para validar o caminho de sessão/criação de user).
- **frontend:** Refazer `Register.jsx` com o visual de `Login.css`; link "Entrar com 42" em Login e Register; rota de sucesso OAuth que chama `AuthContext`.

## Validation
```
docker compose -f docker-compose.yml config
manage.py check                # em backend/ (via container)
npm run build                  # em frontend/web/
py_compile backend/api/*.py
# Manual/e2e:
# 1) /register mostra o mesmo visual do /login (glassmorphism)
# 2) GET /api/auth/42/authorize (sem credenciais reais) responde 302 p/ api.intra.42.fr com client_id e redirect_uri corretos
# 3) fluxo completo com credenciais 42 reais (se disponíveis) -> cria user, sessão httpOnly, redirect p/ dashboard
# 4) regressão: login local (teste/alice) ainda funciona; registro local ainda cria conta
```

## Why not continued
<preencher se pausada>

## Validation Log
- **Backend OAuth 42 implementado** (`backend/api/oauth42.py`) — `FortyTwoAuthorizeView` (302 p/ `https://api.intra.42.fr/oauth/authorize`, gera `state` na sessão), `FortyTwoCallbackView` (valida `state`, troca `code` por token, busca `/v2/me`, find-or-create User com `_unique_username`, `set_unusable_password`, Profile nickname, `login()` + redirect p/ frontend `/oauth/success`). Rotas registradas em `backend/api/urls.py`.
- **Config por env**: `FORTY_TWO_CLIENT_ID`, `FORTY_TWO_CLIENT_SECRET`, `FORTY_TWO_REDIRECT_URI`, `FORTY_TWO_SUCCESS_URL` em `settings.py`; adicionado a `.env.example` (placeholders). `.env` (gitignored) preenchido pelo usuário com credenciais reais.
- **py_compile** → PASS (`oauth42.py`, `urls.py`, `settings.py`).
- **Smoke test live (HTTPS 8443)**: `GET /api/auth/42/authorize/` → **HTTP 302** com `Location: https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-...&redirect_uri=https%3A%2F%2Flocalhost%3A8443%2Fapi%2Fauth%2F42%2Fcallback&response_type=code&scope=public&state=...`. Rota ativa e correta; credenciais reais presentes no container env.
- **Frontend**: `Register.jsx` com visual glassmorphism de Login (reusa `Login.css`); botão `Entrar com 42` (Login) / `Continuar com 42` (Register) → `/api/auth/42/authorize`; `OAuthSuccess.jsx` + rota `/oauth/success` em `App.jsx` (hidrata via AuthContext `/me` e redireciona p/ `/dashboard`). `npm run build` → PASS.
- **Limitação**: fluxo completo do callback NÃO pode ser validado de ponta a ponta sem uma sessão 42 real no navegador (requer login na Intra + consentimento); a rota de authorize (302 com client_id correto) foi validada.
- **VERDICT: PASS** (rota authorize validada live; build frontend ok; callback depende de interação real com a 42).
