# MinePanel — Painel de Administração para PaperMC

**MinePanel** é um sistema completo para administrar servidores PaperMC (Minecraft Java 1.21.x) via painel web seguro, composto por:

| Componente | Stack | Função |
|---|---|---|
| **MinePanelBridge** | Java / Gradle / Paper API | Plugin que expõe API HTTP local |
| **Backend** | Node.js / Express / TypeScript / Prisma / SQLite | Autenticação, RBAC, auditoria, proxy |
| **Web Panel** | Next.js / React / TypeScript / Tailwind / shadcn/ui | Interface web para staff |

## Arquitetura

```
Browser  ──►  Web Panel (Next.js :3000)
                  │
                  ▼
            Backend (Express :4000)
                  │  X-Panel-Secret + X-Panel-Actor
                  ▼
            Plugin (Paper HTTP :8765)  ← bind 127.0.0.1
```

- O plugin **nunca** é acessado diretamente de fora.
- O backend é o **único** que conhece o `sharedSecret`.
- O frontend conversa **somente** com o backend.

---

## ⚠️ Segurança

- **NÃO exponha** o plugin HTTP (porta 8765) para a internet.
- O bind padrão é `127.0.0.1` (apenas localhost).
- Acesse o painel via **VPN** (Tailscale, WireGuard) ou **reverse proxy com HTTPS** (nginx, Caddy).
- Troque a senha padrão do admin imediatamente.
- Use `.env` para secrets e nunca os commite no Git.

---

## 1. Plugin Paper — MinePanelBridge

### Build

```bash
cd minepanel/paper-plugin
./gradlew shadowJar
```

O jar será gerado em `paper-plugin/build/libs/MinePanelBridge-1.0.0-all.jar`.

### Instalação

1. Copie o jar para a pasta `plugins/` do servidor Paper 1.21.x.
2. Inicie o servidor uma vez para gerar `plugins/MinePanelBridge/config.yml`.
3. Edite `config.yml`:

```yaml
bindAddress: "127.0.0.1"
port: 8765
sharedSecret: "TROQUE-POR-UM-SECRET-FORTE-AQUI"
allowedCommands:
  - "say"
  - "kick"
  - "ban"
  - "tempban"
  - "whitelist add"
  - "whitelist remove"
enableInventoryView: true
enableEnderChestView: true
logFile: "panel-audit.log"
```

4. Reinicie o servidor.

---

## 2. Backend

### Setup

```bash
cd minepanel/backend
npm install
cp .env.example .env
# Edite .env com seus valores
npx prisma migrate dev --name init
npm run seed      # Cria usuário admin (admin / admin123)
npm run dev       # Inicia em http://localhost:4000
```

### .env

```env
PORT=4000
JWT_SECRET=troque-por-um-secret-jwt-forte
REFRESH_SECRET=troque-por-um-secret-refresh-forte
PLUGIN_BASE_URL=http://127.0.0.1:8765
PLUGIN_SHARED_SECRET=MESMO-SECRET-DO-CONFIG-YML
DATABASE_URL=file:./minepanel.db
CORS_ORIGIN=http://localhost:3000
```

### RBAC

| Role | Permissões |
|---|---|
| VIEWER | Ver health, players, whitelist (leitura) |
| MOD | VIEWER + comandos moderados, whitelist add/remove |
| ADMIN | Tudo + gerenciar usuários, ver logs de auditoria |

---

## 3. Web Panel

### Setup

```bash
cd minepanel/web
npm install
cp .env.example .env.local
npm run dev       # Inicia em http://localhost:3000
```

### .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 4. Docker Compose (Opcional)

```bash
cd minepanel
docker-compose up --build
```

> O plugin Paper roda **fora** do Docker (dentro do servidor Minecraft).

---

## Reverse Proxy (Recomendado)

### Caddy (exemplo)

```
panel.seudominio.com {
    reverse_proxy localhost:3000
}

api.seudominio.com {
    reverse_proxy localhost:4000
}
```

### Nginx (exemplo)

```nginx
server {
    listen 443 ssl;
    server_name panel.seudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.seudominio.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Tailscale / VPN

A forma **mais segura** de acessar o painel é via VPN:

1. Instale [Tailscale](https://tailscale.com/) no servidor e na máquina do admin.
2. Acesse via IP do Tailscale (ex: `http://100.x.x.x:3000`).
3. Nenhuma porta precisa ser aberta para a internet.

---

## Licença

MIT — use por sua conta e risco.
