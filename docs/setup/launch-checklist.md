# Checklist de lançamento — plan.toknowsalvador.com

## 1. Planilha de leads
1. Criar Google Sheet "TKS Leads".
2. Extensões → Apps Script → colar `integrations/apps-script/Code.gs` → Salvar.
3. Implantar → Nova implantação → Tipo: App da Web → Executar como: Eu → Quem pode acessar: Qualquer pessoa → Implantar → autorizar.
4. Copiar a URL `/exec` → colar em `plan/js/config.mjs` → `leadEndpoint`.
5. Teste: `curl -L -H 'Content-Type: text/plain' -d '{"lead_id":"TKS-TEST","name":"Teste"}' '<URL>'` → resposta `ok` e linha na aba "Leads". Apagar a linha de teste.
6. Na coluna `status`, criar validação de dados (lista): novo, respondeu, orçamento enviado, fechou, perdido.

## 2. Google Analytics 4
1. analytics.google.com → Admin → Criar propriedade "TKS Plan" → Fluxo Web `https://plan.toknowsalvador.com`.
2. Copiar o ID `G-...` → `config.mjs` → `ga4Id`.
3. Admin → Eventos → marcar `generate_lead` como evento-chave.

## 3. Google Ads
1. Criar conta (modo especialista, sem criar campanha ainda).
2. Metas → Conversões → Nova → Site → `plan.toknowsalvador.com` → criar manualmente: nome **"TKS Lead"**, categoria "Enviar formulário de lead", valor: não usar, contagem: uma. Esta é a única conversão primária: **não** importe o evento `generate_lead` do GA4 como primária (contaria cada lead duas vezes).
3. Em "Configuração da tag" → "Instalar você mesmo" → copiar `AW-XXXXXXX` → `adsId` e `AW-XXXXXXX/YYYY` → `adsConversion`.
4. Vincular GA4 ↔ Google Ads (Admin GA4 → Vinculações de produtos).
5. Criar a campanha seguindo `marketing/ads/campaign-plan.md` → deixar **pausada**.

## 4. Deploy (Cloudflare Pages)
1. dash.cloudflare.com → Workers & Pages → Criar → Pages → Conectar ao Git → este repositório.
2. Branch de produção: `main`. Comando de build: (vazio). Diretório de saída: `plan`.
3. Custom domains → `plan.toknowsalvador.com` → seguir instrução de DNS (CNAME `plan` → `<projeto>.pages.dev` no provedor de DNS atual).
4. Commitar `config.mjs` preenchido → push → conferir deploy.

## 5. Teste final em produção
1. Abrir `https://plan.toknowsalvador.com/?utm_source=test&gclid=TEST123` no celular.
2. Aceitar cookies, preencher o formulário, enviar.
3. Conferir: WhatsApp abre com `Ref: TKS-…`; linha na planilha com `gclid=TEST123`; GA4 → Tempo real mostra `generate_lead`; Google Ads → conversão "não verificada" passa a "registrando conversões" em até 24h.
4. Apagar a linha de teste. Ativar a campanha.

## 6. Antes de ativar: WhatsApp
1. No WhatsApp Business: Ferramentas comerciais → Mensagem de saudação → ativar, com algo como: "Hi! Thanks for reaching out to To Know Salvador. We got your trip details and will send your quote within 24 hours."

## 7. Rotina
- Toda conversa no WhatsApp: atualizar `status` e `valor` do lead pelo `Ref`.
- Toda segunda-feira: exportar CSVs (ver skill `campaign-analyst`) e rodar a revisão com o `growth-orchestrator`.
