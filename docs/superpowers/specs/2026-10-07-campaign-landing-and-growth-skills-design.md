# Landing Page de Campanha + Sistema de Skills de Crescimento — Design

**Data:** 2026-10-07
**Status:** Aprovado em conversa, aguardando revisão da spec escrita

## 1. Objetivo

Criar (a) uma landing page de vendas, acessível apenas via campanha, para um serviço de **planejamento + concierge de viagem a Salvador para estrangeiros**, e (b) um sistema de skills do Claude Code que opere e melhore continuamente essa operação (copy, página, anúncios, análise, orquestração).

**Oferta:** o turista conta sua viagem, a To Know Salvador faz a análise de planejamento, envia orçamento pelo WhatsApp, cobra uma taxa e deixa tudo pronto via rede de parceiros (tours, transporte, hotel/Airbnb, restaurantes, shows culturais). O turista só aproveita.

**Sucesso:** custo por lead e custo por venda baixos, medidos de ponta a ponta (clique → lead → orçamento → venda).

## 2. Restrições e decisões

| Decisão | Valor | Motivo |
|---|---|---|
| Conversão principal | Formulário de qualificação → registro do lead → WhatsApp com mensagem pré-preenchida | Venda acontece no WhatsApp (orçamento antes de cobrar); formulário gera evento `Lead` confiável e filtra leads ruins |
| Idioma | Somente inglês | Validar oferta antes de multiplicar custo |
| Canal de mídia | Somente Google Search | Orçamento ≤ R$ 1.000/mês (~R$ 33/dia); captura intenção alta |
| Registro de leads | Google Sheets via Google Apps Script | Grátis, funciona em site estático, base para análise |
| Hospedagem | Pasta `plan/` neste repo, deploy via Cloudflare Pages em `plan.toknowsalvador.com` | GitHub Pages aceita um domínio por repo; mantém página, skills e histórico juntos |
| Indexação | `noindex, nofollow`, fora do sitemap, sem links do site principal | Página exclusiva de campanha |

**Implicação do orçamento:** ~100–300 cliques/mês e ~5–25 leads/mês esperados. Testes A/B com significância estatística não são viáveis; a análise usa regras práticas, mineração de termos de busca e qualidade de lead.

## 3. Arquitetura

Hub-and-spoke com memória de marketing compartilhada.

```
.claude/skills/
  growth-orchestrator/     ponto de entrada; diagnostica fase, delega, detecta lacunas
  offer-copywriter/        oferta + copy da página + textos de anúncio
  sales-page-builder/      CRO + design (via /frontend-design) + implementação + tracking
  google-ads-strategist/   estrutura de campanha Search para orçamento baixo
  campaign-analyst/        análise de funil completo e próximas ações

marketing/                 fonte única da verdade, lida e atualizada pelas skills
  brief.md                 oferta, preço, ICP, parceiros, provas sociais, tom de voz, restrições
  experiments.md           hipótese → mudança → período → métricas → veredito
  decisions.md             decisões datadas com motivo
  skill-backlog.md         lacunas detectadas com gatilho de criação
  copy/                    landing-v{n}.md, ads-v{n}.md
  ads/                     campaign-plan.md
  data/                    exports CSV (Google Ads, leads) — não versionar dados pessoais

plan/                      landing page (HTML estático)
```

**Fluxo:** `brief.md` → offer-copywriter → (sales-page-builder, google-ads-strategist) → campanha no ar → dados → campaign-analyst → `experiments.md`/`decisions.md` → próxima iteração. O growth-orchestrator lê tudo e decide o próximo passo.

**Regra de verdade:** nenhuma skill inventa preço, depoimento, parceiro ou número. Informação ausente é perguntada ao usuário e gravada em `brief.md`.

## 4. Skills

### 4.1 growth-orchestrator
- **Ativa quando:** "o que fazer agora?", início de sessão de marketing, revisão semanal, pedido que não pertence claramente a uma skill.
- **Faz:**
  1. Lê `marketing/*` e identifica a fase: *Setup* (brief incompleto) → *Build* (sem página) → *Launch* (sem campanha/tracking) → *Optimize* (rodando, com dados).
  2. Na fase Setup, entrevista o usuário para completar `brief.md`.
  3. Delega à skill certa, na ordem certa.
  4. Roda checklist de lacunas do funil inteiro: anúncio → página → formulário → WhatsApp → orçamento → pagamento → experiência → review. Etapa sem dono vira entrada em `skill-backlog.md` com gatilho.
  5. Propõe criar skill nova só quando o gatilho é atingido, usando `superpowers:writing-skills`.
- **Backlog inicial:** script de resposta/follow-up no WhatsApp (gatilho: >20% dos leads sem resposta); coleta de depoimentos (5 clientes atendidos); Meta Ads (orçamento > R$ 3k/mês); multi-idioma (CPL estável por 2 meses em inglês); importação de conversões offline via gclid (≥10 vendas registradas).
- **Guardrails:** decide e delega, não executa trabalho das especialistas. Termina sempre com 1–3 próximas ações concretas.

### 4.2 offer-copywriter
- **Ativa quando:** criar/revisar copy da página, headlines, anúncios, mensagem pré-preenchida do WhatsApp.
- **Faz:** lê `brief.md` + `experiments.md`; constrói a oferta antes da copy (resultado desejado, redução de risco, especificidade); escreve com frameworks de resposta direta (PAS no hero, objeções → FAQ, prova próxima ao CTA); gera variações por intenção de busca para casar com grupos de anúncio.
- **Saída:** `marketing/copy/landing-v{n}.md` (copy por seção com hipótese de cada escolha) e `marketing/copy/ads-v{n}.md` (headlines ≤ 30 caracteres, descrições ≤ 90, validadas).
- **Guardrails:** inglês nativo; nada de prova inventada (sinaliza lacuna); nada de superlativos sem comprovação ("best", "#1") por política do Google Ads.

### 4.3 sales-page-builder
- **Ativa quando:** construir/alterar a landing page, implementar tracking, aplicar experimento na página.
- **Faz:** consome copy aprovada (não reescreve; sinaliza problemas à offer-copywriter); aplica checklist de CRO; invoca `/frontend-design` para direção visual coerente com a marca (DM Sans + Playfair Display, tom escuro); implementa tracking conforme §5.4; verifica com Lighthouse e capturas mobile/desktop.
- **Checklist de CRO:** CTA acima da dobra no mobile; sem navegação de saída; formulário curto e progressivo; prova social perto dos CTAs; mensagem do anúncio refletida no hero; LCP < 2,5 s; CTA fixo no mobile.
- **Saída:** arquivos em `plan/` + entrada em `experiments.md` quando a mudança é teste.
- **Guardrails:** único dono do HTML; uma mudança relevante por vez.

### 4.4 google-ads-strategist
- **Ativa quando:** montar/ajustar campanha, keywords, negativas, anúncios, lances, orçamento.
- **Faz:** 1 campanha Search; 2–3 grupos de anúncio temáticos; somente phrase/exact match; lista ampla de negativas (free, jobs, cheap flights, map, weather…); Maximize Clicks com teto de CPC até ~15–30 conversões, depois Maximize Conversions; segmentação por interesse em Salvador/Brasil (EUA, UK, CA, AU etc.) + presença no Brasil, idioma inglês.
- **Saída:** `marketing/ads/campaign-plan.md` pronto para aplicar manualmente, com passo a passo de configuração e importação de conversão.
- **Guardrails:** sem criação via API nesta fase; anúncios sempre referenciam a copy aprovada (message match).

### 4.5 campaign-analyst
- **Ativa quando:** "como está a campanha?", revisão semanal, após exportar dados.
- **Entradas:** CSVs do Google Ads (campanha, termos de busca, keywords) e da planilha de leads em `marketing/data/`, incluindo colunas preenchidas pelo usuário: `status` (`novo`, `respondeu`, `orçamento enviado`, `fechou`, `perdido`) e `valor`.
- **Faz:** funil completo (impressão → clique → visita → lead → orçamento → venda); CPL e custo por venda; mineração de termos de busca (novas negativas e keywords); qualidade de lead por keyword; regras práticas para baixo volume (ex.: keyword com > R$ 60 gastos e 0 leads → pausar).
- **Saída:** relatório curto com 1–3 ações priorizadas, registro em `experiments.md`, encaminhamento à skill dona.
- **Guardrails:** nunca declara vencedor com amostra pequena; separa sinal de ruído explicitamente.

## 5. Landing page

### 5.1 Hospedagem
- Código em `plan/` neste repo; Cloudflare Pages com diretório de build `plan/`, sem comando de build; domínio `plan.toknowsalvador.com` (CNAME no DNS).
- `<meta name="robots" content="noindex, nofollow">`; não incluir no `sitemap.xml`.

### 5.2 Estrutura (mobile-first, sem menu)
1. Hero — headline casada com a busca, sub-headline de resultado, CTA para o formulário, prova rápida.
2. Problema — idioma, segurança, golpes, logística, horas de pesquisa.
3. Como funciona — 3 passos: conte sua viagem → receba plano + orçamento no WhatsApp → chegue e aproveite.
4. O que fica pronto — tours, transfer, hospedagem, restaurantes, shows.
5. Quem somos — equipe local, Afro Tour como credencial.
6. Prova social — depoimentos/vídeos existentes em `public/` (somente reais).
7. Oferta + redução de risco — orçamento grátis, paga só se aprovar.
8. FAQ — objeções.
9. Formulário + CTA fixo no mobile.

A copy final vem da offer-copywriter; os títulos acima são estrutura, não texto final.

### 5.3 Formulário (2 passos)
- **Passo 1:** datas (ou "not sure yet"), nº de pessoas, interesses (checkboxes: tours, transfer, accommodation, restaurants, cultural shows, other).
- **Passo 2:** nome, WhatsApp com seletor de código de país, faixa de orçamento (opcional).
- Validação no cliente; campos obrigatórios: nº de pessoas, nome, WhatsApp.

### 5.4 Envio, registro e tracking
1. Gerar `lead_id` curto (ex.: `TKS-7F3A`).
2. Enviar dados + `utm_*` + `gclid` + timestamp + `lead_id` ao endpoint do Google Apps Script via `navigator.sendBeacon` (fallback `fetch` com `keepalive`). O script grava uma linha na planilha com colunas `status` (default `novo`) e `valor` vazias.
3. Disparar `generate_lead` (GA4) e conversão do Google Ads.
4. Redirecionar para `https://wa.me/5571993719791?text=...` com mensagem pré-preenchida contendo nome, nº de pessoas, datas, interesses e `Ref: {lead_id}`.

- `utm_*` e `gclid` são capturados da URL na chegada e guardados em `sessionStorage` (try/catch).
- **Eventos GA4:** `form_start`, `form_step_2`, `generate_lead`, `whatsapp_click`.
- **Consent Mode v2** com banner simples (obrigatório para UK/UE). Padrão `denied` para ads/analytics storage até aceite.
- **Falha do Apps Script:** não bloqueia; o redirecionamento ao WhatsApp acontece sempre e a mensagem carrega os dados, logo o lead não se perde.
- IDs (GA4 measurement ID, Google Ads conversion ID/label, URL do Apps Script) ficam em um único bloco de configuração no topo do JS.

## 6. Verificação
- Lighthouse mobile: performance ≥ 90, acessibilidade ≥ 90.
- Teste de ponta a ponta: preencher formulário → linha na planilha → evento no GA4 DebugView → WhatsApp abre com texto correto e `lead_id`.
- Teste com Apps Script indisponível → WhatsApp ainda abre.
- Capturas mobile (390px) e desktop (1440px).
- Validação dos limites de caracteres dos anúncios.

## 7. Fora do escopo
Multi-idioma, Meta Ads, CRM, pagamento online, automação de follow-up, importação de conversões offline. Registrados em `skill-backlog.md` com gatilhos (§4.1).

## 8. Dependências do usuário
- Preencher `brief.md` (via entrevista do orquestrador): preço da taxa, o que inclui, garantia, parceiros, depoimentos autorizados.
- Criar conta GA4, conta Google Ads + ação de conversão, planilha Google e implantar o Apps Script (passo a passo fornecido).
- Configurar Cloudflare Pages e o registro DNS do subdomínio.
