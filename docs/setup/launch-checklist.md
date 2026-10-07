# Checklist de lançamento — plan.toknowsalvador.com

## 1. Planilha de leads
1. Criar Google Sheet "TKS Leads".
2. Extensões → Apps Script → colar `integrations/apps-script/Code.gs` → Salvar.
3. Implantar → Nova implantação → Tipo: App da Web → Executar como: Eu → Quem pode acessar: Qualquer pessoa → Implantar → autorizar.
4. Copiar a URL `/exec` → colar em `plan/js/config.mjs` → `leadEndpoint`.
5. Teste: `curl -L -H 'Content-Type: text/plain' -d '{"lead_id":"TKS-TEST","name":"Teste"}' '<URL>'` → resposta `ok` e linha na aba "Leads". Apagar a linha de teste.
6. Na coluna `status`, criar validação de dados (lista): novo, respondeu, orçamento enviado, fechou, perdido.
7. Na coluna `data_venda`, formato Data (dd/mm/aaaa).
8. Apps Script → Configurações do projeto → Fuso horário: **(GMT-03:00) Bahia**.
9. Apps Script → selecionar a função `installImportTrigger` → Executar (uma vez) → autorizar. Ela cria a aba **"Google Ads import"** e a atualiza a cada hora com as vendas fechadas.

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

### Vendas de volta para o Google Ads (conversões offline + enhanced conversions)
6. Metas → Conversões → "TKS Lead" → Configurações → **Enhanced conversions for leads** → ativar, método **Google tag**. A página já envia o WhatsApp do lead criptografado no envio do formulário.
7. Metas → Conversões → Nova → **Importação** → "CRMs, arquivos ou outras fontes" → "Rastrear conversões de cliques". Nome **"TKS Sale"**, categoria Compra, valor "usar valores diferentes", contagem "uma", janela de 90 dias. Deixe como **secundária** por enquanto: com poucas vendas por mês, o lance continua otimizando por lead, e a venda serve para medir custo por venda por palavra-chave.
8. Metas → Uploads → **Agendamentos** → fonte **Google Sheets** → a planilha "TKS Leads", aba **"Google Ads import"** → frequência diária.
9. Antes de agendar, baixe o modelo de importação que o Google Ads oferece na mesma tela e compare os nomes das colunas com a aba gerada (`Google Click ID`, `Phone Number`, `Conversion Name`, `Conversion Time`, `Conversion Value`, `Conversion Currency`). Se o Google tiver mudado algum nome, ajuste `buildImportRows` em `Code.gs`.
10. Depois da primeira venda importada: Metas → Conversões → "TKS Sale" → Diagnóstico. Confira se a venda apareceu e a taxa de correspondência.

## 3b. Microsoft Clarity (gravações e mapa de calor, grátis)
1. clarity.microsoft.com → New project → site `https://plan.toknowsalvador.com`.
2. Settings → Setup → copiar o Project ID → `config.mjs` → `clarityId`.
3. Settings → Cookies → ativar "Cookie consent required" (o Clarity grava sem cookies até o visitante clicar em Accept).
4. Settings → Masking → modo "Strict" (esconde nome e telefone digitados nas gravações).

## 4. Deploy (Cloudflare Pages)
1. dash.cloudflare.com → Workers & Pages → Criar → Pages → Conectar ao Git → este repositório.
2. Branch de produção: `main`. Comando de build: (vazio). Diretório de saída: `plan`.
3. Custom domains → `plan.toknowsalvador.com` → seguir instrução de DNS (CNAME `plan` → `<projeto>.pages.dev` no provedor de DNS atual).
4. Commitar `config.mjs` preenchido → push → conferir deploy.

## 4b. Depois do merge no `main` (site principal)
1. Aguarde o deploy do GitHub Pages (aba Actions → "pages build and deployment" verde).
2. Abra `https://toknowsalvador.com/plan/` e `https://toknowsalvador.com/marketing/brief.md` → os dois devem dar **404**. Se abrirem, o `_config.yml` não foi aplicado (verifique em Settings → Pages se o modo é "Deploy from a branch").
3. Abra `https://toknowsalvador.com/` e `/pt/` → o site principal continua igual.

## 5. Teste final em produção
1. Abrir `https://plan.toknowsalvador.com/?utm_source=test&gclid=TEST123` no celular.
2. Aceitar cookies, preencher o formulário, enviar.
3. Conferir: WhatsApp abre com `Ref: TKS-…`; linha na planilha com `gclid=TEST123`; GA4 → Tempo real mostra `generate_lead`; Google Ads → conversão "não verificada" passa a "registrando conversões" em até 24h.
4. Apagar a linha de teste. Ativar a campanha.

## 6. Antes de ativar: WhatsApp
1. No WhatsApp Business: Ferramentas comerciais → Mensagem de saudação → ativar, com algo como: "Hi! Thanks for reaching out to To Know Salvador. We got your trip details and will send your quote within 24 hours."

## 7. Rotina
- Lead na planilha sem mensagem no WhatsApp depois de 1 hora (status `novo`): **vocês escrevem primeiro** para o número da planilha, citando o `Ref`.
- Toda conversa no WhatsApp: atualizar `status` do lead pelo `Ref`. Ao fechar: `status` = fechou, `valor` em R$ e `data_venda`. A venda vai sozinha para o Google Ads no dia seguinte.
- Toda segunda-feira: exportar CSVs (ver skill `campaign-analyst`) e rodar a revisão com o `growth-orchestrator`.
