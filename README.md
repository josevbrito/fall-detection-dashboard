# fall-detection-dashboard

Dashboard web (Next.js) que consome a **API REST do ThingsBoard** e mostra a
operação do sistema de detecção de quedas: total de devices, quedas detectadas
ao vivo e gráfico de magnitude da aceleração por device.

É mais um componente da arquitetura distribuída - um **cliente de visualização**
que fala com o middleware (ThingsBoard) via HTTP, separado dos sensores.

```
navegador ──▶ Next.js (este app) ──▶ ThingsBoard REST API ──▶ Postgres
            (renderiza)            (autentica + consulta)     (telemetria)
```

## Por que via API REST (e não Postgres direto)
O ThingsBoard guarda séries temporais numa tabela `ts_kv` com dicionário de
chaves e IDs de entidade - consultar no SQL cru é frágil. A API REST entrega os
mesmos dados em JSON limpo, com filtro por device e por tempo. O JWT é obtido e
cacheado **no servidor Next** (rotas `app/api/*`), nunca exposto ao navegador.

## O que mostra
- **Cards:** devices registrados, quantos estão "em queda agora".
- **Gráfico:** magnitude da aceleração (últimos 30 min) do device selecionado,
  com linha de referência do limiar de queda (~2g).
- **Tabela:** quedas detectadas (device, horário, impacto).
- Atualiza automaticamente a cada 5s.

## Pré-requisitos
- Node.js 18+
- ThingsBoard no ar (repo `fall-detection-cloud`) com devices/telemetria.

## Rodar
```bash
npm install
cp .env.example .env.local
# edite .env.local: TB_URL e as credenciais do tenant

npm run dev      # desenvolvimento
# ou
npm run build && npm run start   # produção
```
Acesse **http://localhost:3001**.

## Configuração (`.env.local`)
| Variável | Descrição |
|---|---|
| `TB_URL` | URL do ThingsBoard. `http://localhost:8090` (mesmo host) ou `http://192.168.100.86:8090` (LAN) |
| `TB_TENANT_EMAIL` | E-mail do tenant admin (mesmo do `provision_devices.py`) |
| `TB_TENANT_PASSWORD` | Senha do tenant admin |

## API interna (rotas Next)
| Rota | Fonte no ThingsBoard |
|---|---|
| `GET /api/devices` | `GET /api/tenant/devices` |
| `GET /api/falls` | `POST /api/entitiesQuery/find` (filtro `fall_detected = true`) |
| `GET /api/telemetry?deviceId=&minutes=` | `GET /api/plugins/telemetry/DEVICE/{id}/values/timeseries` |

## Observação
Roda **localmente na LAN** porque o ThingsBoard está na rede local. Para hospedar
publicamente (ex: Vercel), o ThingsBoard precisaria estar acessível pela internet.
