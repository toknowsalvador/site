# Checklist de lançamento — plan.toknowsalvador.com

Atualizado em 2026-10-08. `[x]` = feito e conferido · `[ ]` = falta · ⏳ = depende de algo que ainda não aconteceu.

**Status geral:** medição completa e no ar. Falta criar a campanha, o teste final com clique de anúncio e ativar — **até ~31/10** para cumprir a oferta de crédito (gastar R$ 1.200 até 06/12/2026).

## 1. Planilha de leads ✅
- [x] Google Sheet "TKS Leads" criada (conta `toknowsalvador@gmail.com`).
- [x] Apps Script com `integrations/apps-script/Code.gs`, fuso **(GMT-03:00) Bahia**.
- [x] Implantado como App da Web (Executar como: Eu · Qualquer pessoa). URL `/exec` no `config.mjs` (`leadEndpoint`).
- [x] Teste direto no endpoint → `ok` e linha criada na aba "Leads" (apagada).
- [x] Teste pelo site real → linha completa com UTM e `gclid` (apagada).
- [x] `installImportTrigger` executado → acionador `refreshAdsImport` a cada hora (a aba "Google Ads import" aparece com a primeira venda).
- [x] `setupLeadsSheet` executado → lista em `status`, data em `data_venda`, R$ em `valor`/`lucro`, cabeçalho congelado.
- Se o `Code.gs` mudar: colar o novo código e, só se o `doPost` mudar, **Implantar → Gerenciar implantações → editar → Nova versão** (mantém a mesma URL).

## 2. Google Analytics 4 ✅
- [x] Propriedade **TKS Plan**, fluxo Web `plan.toknowsalvador.com`, ID **`G-2RZLNYF4ZG`** no `config.mjs`.
- [x] Medição otimizada ativa, com **"Interações com formulários" desligada** (evita `form_start` em dobro).
- [x] `generate_lead` criado como **evento principal** (sem valor padrão, uma vez por sessão).
- [x] Tempo real recebendo visitas e o `generate_lead` (lead de teste do celular).
- [x] **Coleta de dados fornecidos pelo usuário** ativada.

## 3. Google Ads
- [x] Conta criada sem campanha: Brasil · (GMT-03:00) Bahia · **BRL**. ID da conta `472-265-1874`.
- [x] Propriedade GA4 TKS Plan vinculada (métricas e públicos).
- [x] Conversão **"TKS Lead"** = evento GA4 `generate_lead` (Enviar formulário de lead, sem valor, contagem Uma, 90 dias). `adsId`/`adsConversion` **vazios** no `config.mjs` (senão o lead conta em dobro).
- [x] Termos de dados do cliente aceitos; **conversões otimizadas para leads** e **conversões otimizadas (Web)** ativas pela tag do Google.
- [x] **Codificação automática** ativada.
- [ ] ⏳ "TKS Lead" sair de **"Requer atenção"** (até 24–48 h após o primeiro `generate_lead`).
- [ ] Declaração do anunciante / **verificação do anunciante** (nome do anunciante): resolver antes de veicular para não pausar anúncios.
- [ ] Decidir sobre a **oferta R$ 1.200 → R$ 2.400** (exige forma de pagamento; prazo 06/12/2026).
- [ ] **Criar a campanha** seguindo `marketing/ads/campaign-plan.md` (v2, 4 grupos de anúncios) com **data de início futura**. Metas da campanha: **só "Envios de formulários de lead"** — nunca "Compras".

### Vendas de volta para o Google Ads
- [x] Conversão **"TKS Sale"** criada (Compra, valores diferentes, R$ 0 padrão, contagem Uma, 90 dias, atribuição Google Ads). O Google bloqueou a opção "secundária": ela fica fora dos lances **enquanto a campanha não usar a meta "Compras"**.
- [ ] ⏳ **Depois da primeira venda** (`status` = fechou + `valor` + `data_venda` + `lucro`): a aba "Google Ads import" aparece em até 1 h → TKS Sale → **Fonte de dados → Google Sheets → conexão direta → "TKS Leads" / aba "Google Ads import"**, agendamento diário. Não usar API Data Manager / Google Ads API / Zapier.
- [ ] ⏳ Antes de agendar: comparar os nomes das colunas com o modelo do Google (`Google Click ID`, `Phone Number`, `Conversion Name`, `Conversion Time`, `Conversion Value`, `Conversion Currency`); se mudaram, ajustar `buildImportRows` em `Code.gs`.
- [ ] ⏳ Depois da primeira venda importada: TKS Sale → **Diagnóstico** (venda apareceu? taxa de correspondência?).

## 3b. Microsoft Clarity
- [x] Projeto **TKS Plan**, ID **`yu9wxyk3yy`** no `config.mjs`; envio de dados conferido no site real.
- [x] Gravações aparecendo.
- [ ] Confirmar **Settings → Masking → Strict** (esconde nome e WhatsApp nas gravações).
- [ ] Confirmar **Settings → Cookies → consentimento obrigatório**.
- [ ] ⏳ Mapa de calor: aparece com mais visitas (horas de processamento; útil depois de algumas dezenas de sessões).

## 4. Deploy (Cloudflare Pages + DNS na Hostinger) ✅
- [x] Cloudflare Pages `toknowsalvador-plan` ligado ao GitHub (`main`, saída `plan`, sem build).
- [x] Domínio `plan.toknowsalvador.com` ativo com HTTPS; CNAME `plan` → `toknowsalvador-plan.pages.dev` na Hostinger (nameservers `dns-parking.com`). Registros do site principal intactos.
- [x] Cada push no `main` atualiza os dois sites sozinhos.

## 4b. Site principal depois do merge ✅
- [x] `toknowsalvador.com/plan/`, `/marketing/brief.md`, `/docs/…`, `/CLAUDE.md` → **404** (o `_config.yml` funcionou).
- [x] `toknowsalvador.com/` e `/pt/` → 200, sem mudanças.

## 5. Teste final em produção
- [x] Formulário no site real → planilha, GA4 e WhatsApp com `Ref` (celular).
- [x] Validação de telefone (libphonenumber) testada no ar, inclusive no motor WebKit/Safari simulando iPhone.
- [ ] Com a campanha criada: clicar no **próprio anúncio** pela visualização de anúncios (ou abrir `https://plan.toknowsalvador.com/?utm_source=test&gclid=TEST123`), enviar o formulário e conferir `gclid` na planilha.
- [ ] Apagar as linhas de teste e **ativar a campanha** (ou deixar a data de início chegar).

## 6. WhatsApp
- [ ] WhatsApp Business → Ferramentas comerciais → **Mensagem de saudação** ativada, ex.: "Hi! Thanks for reaching out to To Know Salvador. We got your trip details and will send your quote within 24 hours."

## 7. Decisões pendentes (não bloqueiam o lançamento)
- [ ] Escopo do consentimento de cookies (recomendado: manter o regional e ajustar o texto do banner e da privacidade).
- [ ] Depoimentos de viagens completas (não só do walking tour).
- [ ] Preço e lucro por pessoa de um **pacote típico**; repasse ao guia com **6+ pessoas**; taxa real do **PayPal** por venda.
- [ ] Seção "Who we are" (provisória: Adriano, Facundo, David).

## 8. Rotina (depois de ativar)
- Lead na planilha sem mensagem no WhatsApp depois de 1 hora (status `novo`): **vocês escrevem primeiro** para o número da planilha, citando o `Ref`.
- Toda conversa no WhatsApp: atualizar `status` pelo `Ref`. Ao fechar: `status` = fechou, `valor` em R$ (o que o cliente pagou), `data_venda` e `lucro` em R$ (o que ficou com vocês). A venda vai sozinha para o Google Ads.
- Semanas 1–3: revisar termos de busca a cada 2–3 dias (negativas). Depois, toda segunda-feira: exportar CSVs (skill `campaign-analyst`) e rodar a revisão com o `growth-orchestrator`.
