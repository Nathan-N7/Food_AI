# Fix: Segurança (tokens), Concorrência de dados e Conexão entre usuários

- **Status:** Implementing
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
- **E2E real (login→gerar→amigos→presença, 2 usuários)** → SKIPPED/COULD NOT RUN: nenhuma instância do app rodando no host. **Pendência:** validar em ambiente de deploy (oferecido ao usuário).
- **VERDICT: PASS** (com e2e real pendente por ambiente).

## TODO após deploy (se aprovado)
- Rodar E2E real com 2 usuários: login (cookie httpOnly) → gerar → regenerar → amigos → presença WebSocket; confirmar que CSRF header está sendo enviado nas mutations e que o WebSocket conecta sem `?token=`.
