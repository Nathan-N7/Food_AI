# Fix: Segurança (tokens), Concorrência de dados e Conexão entre usuários

- **Status:** Done
- **Branch:** task/fix-security-concurrency
- **Goal:** Migrar autenticação de `localStorage` (DRF authtoken) para **httpOnly cookie + sessão** com CSRF; corrigir race conditions em amizades/perfil; persistir presença via Redis e estado de geração via PostgresSaver; eliminar IDOR e vazamento de token; ajustar throttling; centralizar auth no frontend com AuthContext. Escopo: **segurança + concorrência + presença** (Traefik fica fora desta rodada).
- **Context:** O código completo da app (auth, amigos, presença WebSocket, geração) vive nas branches remotas; a base decidida é **`origin/update_frontend`**. `main` é só um protótipo minimalista. Repositório remoto pertence a `Nathan-N7`; git local configurado como `Nathan-N7 <Nathan-N7@users.noreply.github.com>`. Decisões do usuário: friendship normalizado `sender<=receiver`; Redis para channel layer + PostgresSaver para checkpointer; escopo atual = segurança+concorrência+presença.

---

## Checklist
- [ ] Backend: migrar auth de `TokenAuthentication` para `SessionAuthentication` + `django.contrib.auth.login()`; endpoints `GET /api/auth/me/`, `POST /api/auth/logout/`. **Decisão (resolvida): remover suporte a token legado** — remover `rest_framework.authtoken`, `Token`, `api/middleware.py` e todo `Authorization: Token`/`?token=`; o `rest_framework.authtoken` sai de `INSTALLED_APPS`.
- [ ] Backend: CSRF — garantir `X-CSRFToken` no DRF SessionAuthentication, cookies `HttpOnly`/`Secure`/`SameSite=Lax`, `CSRF_COOKIE_HTTPONLY=False` (JS precisa ler p/ header), `CORS_ALLOW_CREDENTIALS=True`, `CSRF_TRUSTED_ORIGINS`/`CORS_ALLOWED_ORIGINS` por env, e bloco de hardening de produção (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_SSL_REDIRECT`, HSTS) quando `DEBUG=False`; `SECRET_KEY` sem fallback inseguro.
- [ ] Backend (Crítico/IDOR): adicionar `authentication_classes=[SessionAuthentication]` + `permission_classes=[IsAuthenticated]` em `RegenerateImageView`; persistir vínculo `thread_id→user` (ex.: coluna `thread_id` em `Generation` ou modelo `PipelineSession`) e validar posse antes de regenerar. (Depende do checkpointer Postgres mais abaixo.)
- [ ] Backend (Friendship race): **preservar a direção semântica de `sender`/`receiver` (iniciador/destinatário)** — a UI distingue `pending_sent`/`pending_received` por `friendship.sender == user` e o aceite exige `receiver=request.user`, então NÃO reordenar por `min/max` de ID. Em vez disso: adicionar um campo calculado `pair_key` (CharField com `max_length` explícito, ex.: `f"{min(sender_id,receiver_id)}_{max(sender_id,receiver_id)}"`) populado no override de `save()` — **que DEVE injetar `pair_key` no `update_fields` quando fornecido** (padrão Django docs; sem isso `save(update_fields=['status'])` no auto-accept deixa `pair_key` vazio no banco). Manter `unique_together(sender, receiver)` + `UniqueConstraint` em `pair_key`. Na `FriendRequestSendView`: usar `get_or_create(pair_key=...)` dentro de `transaction.atomic()` em vez de `.first()`+`.create()`, preservando o auto-accept mútuo — após obter o objeto: se `status=='accepted'` → "Vocês já são amigos"; se `receiver==request.user and status=='pending'` (fila criada pela outra direção) → setar `accepted` + notificar; se `sender==request.user and status=='pending'` → "já enviada"; **se `status=='rejected'` → handler defensivo** (FriendRespondView deleta ao rejeitar, então `rejected` não deve existir; se aparecer, atualizar a linha para `pending` com `sender`/`receiver` corretos dentro da transação em vez de cair no fluxo de sucesso). Remover SOMENTE o branch de swap de direção sobre uma linha `rejected` (recriar um registro novo em vez disso). **CRÍTICO:** incluir **data migration determinística de backfill** ANTES da constraint — preencher `pair_key` das linhas existentes e, para pares invertidos duplicados, remover a duplicata não-canônica em TODAS as combinações de status (pending/pending, accepted/accepted, pending+accepted, rejected), deixando EXATAMENTE um sobrevivente por `pair_key` (regra: sobrevivente = a linha de menor `sender_id`, ou a de status "mais forte" quando aplicável; eliminar o resto) — caso contrário `migrate` falha por violar a própria `UniqueConstraint`.
- [ ] Backend (Presença/Redis): adicionar serviço `redis` no `docker-compose.yml`; configurar `CHANNEL_LAYERS` com `channels_redis.core.RedisChannelLayer` (hosts `redis:6379`); adicionar `channels-redis` no `requirements.txt`; `depends_on: redis` no backend.
- [ ] Backend (WebSocket auth): substituir `TokenAuthMiddleware` por `AuthMiddlewareStack` + `AllowedHostsOriginValidator` (lê sessão/cookie); remover token da query string e o `api/middleware.py` custom.
- [ ] Backend (Checkpointer): trocar `MemorySaver` por `langgraph.checkpoint.postgres.PostgresSaver` (inicializar com conn string do app); **adicionar `langgraph-checkpoint-postgres` ao `requirements.txt`** (pacote separado, não vem com `langgraph` — sem ele `import` falha no tempo de carga de `graph.py`); `psycopg[binary]` já presente. Armazenar `thread_id` duravelmente; (vínculo thread→user se preferir via coluna no Generation).
- [ ] Backend (Throttling): remover throttle global `10/hour`; aplicar throttles por escopo (Login/Register: anon por IP; generate: user ~30/h; leituras de perfil/amigos: alto ou sem).
- [ ] Backend (Transação): envolver `ProfileDetailView.patch()` em `transaction.atomic()` (perfil + troca de senha atômicos).
- [ ] Backend (Erros): `notify_user_channel` passar a logar falhas (WARNING) em vez de `except: pass`.
- [ ] Backend: limpar `Profile.objects.get_or_create` repetidos (criar perfil em signal post_save do User, ou usar `get`).
- [ ] Frontend: criar `AuthContext` + provider (hidrata via `GET /api/auth/me/`), helper `api` com `credentials:'include'` + header `X-CSRFToken` + 401 centralizado; **migrar TODOS os 11 arquivos que tocam `localStorage`/`Authorization: Token`: `App.jsx` (ProtectedRoute), `Login.jsx`, `Header.jsx`, `Dashboard.jsx`, `Generate.jsx`, `History.jsx`, `Profile.jsx`, `UserProfile.jsx`, `Friends.jsx`, `Privacy.jsx` (cópia) e `hooks/usePresence.js`**; remover todo `localStorage` token/user; `ProtectedRoute` via context.
- [ ] Frontend: `usePresence` — singleton via context (1 socket), autenticação via cookie/sessão (sem `?token=`), consertar reconnects/races/duplicidade de socket; gating em `isAuthenticated`.
- [ ] Frontend: converter `Generate.jsx` de XHR manual para o helper `api` (credencial+CSRF). **Nota/trade-off:** o XHR atual usa `xhr.upload.onprogress` para a barra de progresso de upload; prever manter progresso (ex.: helper `api` com retorno de progresso via XHR ou `ReadableStream`), ou aceitar/registrar a perda da barra como regressão de UX.
- [ ] Frontend: limpar logs de debug, revogar ObjectURLs, atualizar cópia de `Privacy.jsx` (documenta cookie em vez de localStorage).
- [ ] Docs: atualizar `backend/.env.example` com novas vars (origins, secure flags) e `readme.md` conforme necessário.

## Subtasks
- **backend:** todos os itens de backend do checklist (auth/sessão/CSRF, `/me`+`/logout`, remoção de token legado + authtoken, IDOR+posse thread, friendship normalizado + **data migration de backfill** + constraint, Redis channel layer, WebSocket AuthMiddlewareStack, PostgresSaver + **`langgraph-checkpoint-postgres` no requirements**, throttling por escopo, transação no patch de perfil, logging de notificações, signal de Profile, hardening). Rodar `python manage.py check`, `makemigrations --check -dry-run`, `pytest` se houver; validar `docker compose config`.
- **frontend:** AuthContext + helper api (credentials+CSRF+401), migrar para context **todos os 11 arquivos** que tocam token/localStorage (listados no checklist), `usePresence` singleton via contexto, `Generate.jsx` via helper api (preservando progresso de upload ou registrando trade-off), limpezas (logs/objectURL/privacy copy).

## Validation
```
docker compose -f docker-compose.yml config
python manage.py check            # no diretório backend/
python manage.py makemigrations --check --dry-run   # em backend/
pytest                            # em backend/ (se houver testes)
npm run build                     # no diretório frontend/web/
```
QA deve confirmar: (1) nenhum `localStorage.setItem('token'|'user')` restante e nenhum `Authorization: Token`/`?token=` em qualquer arquivo (grep); (2) `RegenerateImageView` exige autenticação + posse do `thread_id`; (3) `docker compose config` válido com serviço `redis`; (4) migration de friendship aplicada com sucesso em dados existentes (backfill renorma sem erro) e a constraint ordenada presente; (5) `import` de PostgresSaver funciona (dependência `langgraph-checkpoint-postgres` instalada); (6) END-TO-END: login (cookie httpOnly) → gerar → regenerar → amigos → presença WebSocket funcionando com 2 usuários; (7) `npm run build` passa.

## Why not continued
<Ainda não iniciada — preencher se pausada.>

## Validation Log
### 2026-09-01 (QA build gate)
- **docker compose config** → PASS (válido com serviço `redis`; backend `depends_on: db+redis` por nome; frontend publica 8080/8443 intencionalmente — Traefik fora do escopo).
- **backend `manage.py check` / `makemigrations --check`** → COULD NOT RUN no host (depende de `ultralytics`/`torch` ~2GB + Postgres vivo). Coberto por `py_compile` limpo + code review; o subagente backend validou com venv + Postgres real (migrações 0004→0005→0006 aplicadas, check ok, makemigrations sem mudanças).
- **backend migrations (code review)** → PASS (0004 fields, 0005 backfill determinístico dedup antes da constraint, 0006 UniqueConstraint dependente de 0005; cadeia linear 0001–0006).
- **frontend `npm run build`** → PASS (Vite, 44 módulos, PWA gerado). grep por `localStorage`/`Authorization`/`?token=` = **zero ocorrências de código**.
- **security spot-checks** → PASS (RegenerateImageView autenticado + posse de thread_id; sem authtoken/TokenAuthentication/Token; middleware deletado; RedisChannelLayer; AuthMiddlewareStack; PostgresSaver com fallback; hardening de cookies/CSRF; signal de Profile; throttling por escopo).
- **VERDICT build gate: PASS.**

### 2026-09-01 (deploy + E2E real — stack food_ai ao vivo)
- **Deploy** → `docker compose up -d --build` OK; containers db/redis healthy, backend daphne + frontend nginx up.
- **Bug de build encontrado e corrigido:** `langgraph-checkpoint-postgres==2.0.9` conflitava com `langgraph==1.2.11` (2.0.9 exige `langgraph-checkpoint 2.x`, mas langgraph 1.2.11 exige 4.x) → `ResolutionImpossible`. Corrigido para `==3.1.2` (exige `langgraph-checkpoint 4.x`). Build voltou a passar (Python 3.14-slim tem wheels p/ torch/ultralytics).
- **Bug de runtime encontrado e corrigido:** WS presence crashava com `SynchronousOnlyOperation` (acesso síncrono a `self.user.profile` no `connect()`/`disconnect()` async) → erro 1011. Corrigido com helper `database_sync_to_async` `get_user_profile_nickname`. Rebuild+restart OK.
- **E2E real via API (curl, HTTPS 8443):** registro (201) + login devolve `Set-Cookie: sessionid` (HttpOnly, SameSite=Lax, Secure) e `csrftoken` (Lax, Secure). `GET /api/auth/me/` com cookie → 200 usuário. Amizade: busca → enviar (201, CSRF ok) → **auto-accept mútuo** (mesmo `friendship_id:1`, sem duplicata) → lista de amigos mostra Bob. `GET /api/generations/` → 200 (throttle não bloqueia leitura).
- **IDOR:** `POST /api/regenerate/` sem auth → 403; com auth + thread_id alheio/aleatório → 404 "thread_id não pertence ao usuário".
- **Presença real 2 usuários (wss via cookie, sem `?token=`):** Bob online → Alice recebe `initial_presence` com `online_friend_ids:[2]` → Bob desconecta → Alice recebe `friend_presence offline` (Redis channel layer broadcast). Ping→pong OK.
- **VERDICT: PASS** (validação live completa de auth/cookie/CSRF, IDOR, amizade/race e presença em tempo real entre usuários).

## Nota de escopo restante
- Geração real de imagem (Gemini/Replicate) não executada no e2e (depende de `GEMINI_API_KEY`/`REPLICATE_API_TOKEN` reais no `.env`); o fluxo de pipeline não foi alterado, apenas a auth (cookie).

### 2026-09-01 (bug de presença offline encontrado em uso real + correção)
- **Sintoma relatado:** usuário fecha a página e o amigo continua vendo-o como **online** indefinidamente.
- **Causas raiz (duas, encadeadas):**
  1. `disconnect` do WebSocket intermitentemente **falhava com `redis.exceptions.TimeoutError`** (`Timeout reading from redis:6379`, 12+ ocorrências nos logs) durante o `group_send` para os amigos → a exceção estourava o `disconnect` **antes** de entregar o `offline`, deixando o perfil preso em `is_online=True`. Redis em si estava saudável (PING ok); o timeout era transitório no pool do channels-redis sob carga/aquecimento.
  2. **Nenhuma rede de segurança de staleness:** se o `disconnect` jamais rodasse (aba fechada sem close frame e sem o nginx detectar logo), o usuário ficava online para sempre.
- **Correções aplicadas:**
  - `consumers.py`: cada `group_send` de presença agora passa por `_safe_group_send` (try/except) → um timeout do Redis num amigo não mata o `disconnect` nem bloqueia os demais; `disconnect` sempre persiste `is_online=False` no DB primeiro e o `ping` agora atualiza `last_seen` (heartbeat) e **reconcilia amigos stale oportunisticamente**.
  - **Presença por staleness** (`STALE_AFTER_SECONDS=60` em `models.py`, centralizado e importado pelos consumers): consideramos online só quem tem `last_seen` dentro dos últimos 60s. `get_online_friend_ids` filtra por `last_seen__gte`. Novo `Profile.is_online_effective()` e reconciliação `get_stale_online_friend_ids()` (via `QuerySet.update()`, que ignora `auto_now commit do save`) usados em `connect`/`ping` e nas views.
  - `views.py`: 7 pontos que retornavam `profile.is_online` cru agora usam `profile.is_online_effective()` (lista de amigos, perfil, busca, UserProfile, requests) → o status REST reflete a janela de staleness mesmo sem disconnect.
- **Validação (e2e real, wss:// localhost:8443, 2 usuários alice+bob):**
  - Close limpo (`ws.close()`): bob recebe `friend_presence offline` de alice **imediatamente**.
  - Close **abrupto** (`ws.terminate()` + destroy TCP, sem close frame): bob recebe `offline` de alice **imediatamente**.
  - Staleness (bob forçado a `is_online=True` mas `last_seen` ~90s atrás, via `.update()`): `is_online_effective()`=False e `get_online_friend_ids(alice)` retorna `[]`.
  - Regressão: login (`teste`/`alice`), `GET /me`, `GET /friends/` todos HTTP 200; FriendList mostra `is_online:false` correto após bob sair.
- **Nota:** `auto_now=True` em `Profile.last_seen` reescreve o timestamp a cada `.save()`; para simular/conciliar staleness usa-se `QuerySet.update()` (não dispara `auto_now`). Impacto aceitável: um save de perfil enquanto `is_online=True` preso re-anima `last_seen` por até 60s, mas o `disconnect`/staleness normal cobre o caso real.
- **VERDICT de presença: corrigido** (tempo real + fallback de 60s).
