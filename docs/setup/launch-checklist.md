# Checklist de lançamento — plan.toknowsalvador.com

Atualizado em 2026-10-08. `[x]` = feito e conferido · `[ ]` = falta · ⏳ = depende de algo que ainda não aconteceu.

**Status geral:** campanha criada e agendada para **11/10/2026**; teste final aprovado. A R$ 33/dia, os R$ 1.200 da oferta de crédito são gastos por volta de meados de novembro (prazo 06/12/2026).

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
- [x] **Oferta R$ 1.200 → R$ 2.400** aceita: forma de pagamento cadastrada. Meta: gastar R$ 1.200 até 06/12/2026.
- [ ] ⏳ Acompanhar o gasto da oferta: a R$ 33/dia, ativar **até 29/10** dá folga (~R$ 1.250 até 06/12). Se o gasto diário ficar abaixo de R$ 33 (limite de CPC R$ 6 segurando), liberar o grupo "Tours & transfers" antes de mexer no CPC.
- [x] **Campanha criada** (`TKS – Search – EN – v1`, início **11/10/2026**): meta só "Envios de formulários de lead", só Rede de Pesquisa, Brasil com "Presença ou interesse", inglês, Maximizar cliques (CPC máx. R$ 6), R$ 33/dia, IA Max desligada, sufixo de URL na campanha (Family com `&audience=family`), 4 grupos (Tours & transfers pausado), lista `TKS negatives` aplicada, sitelinks/frases/snippet, recurso de ligação da conta removido, aplicação automática desligada.

### Vendas de volta para o Google Ads
- [x] Conversão **"TKS Sale"** criada (Compra, valores diferentes, R$ 0 padrão, contagem Uma, 90 dias, atribuição Google Ads). O Google bloqueou a opção "secundária": ela fica fora dos lances **enquanto a campanha não usar a meta "Compras"**.
- [ ] ⏳ **Depois da primeira venda** (`status` = fechou + `valor` + `data_venda` + `lucro`): a aba "Google Ads import" aparece em até 1 h → TKS Sale → **Fonte de dados → Google Sheets → conexão direta → "TKS Leads" / aba "Google Ads import"**, agendamento diário. Não usar API Data Manager / Google Ads API / Zapier.
- [ ] ⏳ Antes de agendar: comparar os nomes das colunas com o modelo do Google (`Google Click ID`, `Phone Number`, `Conversion Name`, `Conversion Time`, `Conversion Value`, `Conversion Currency`); se mudaram, ajustar `buildImportRows` em `Code.gs`.
- [ ] ⏳ Depois da primeira venda importada: TKS Sale → **Diagnóstico** (venda apareceu? taxa de correspondência?).

## 3b. Microsoft Clarity
- [x] Projeto **TKS Plan**, ID **`yu9wxyk3yy`** no `config.mjs`; envio de dados conferido no site real.
- [x] Gravações aparecendo.
- [x] Masking **Equilibrado** confere: nome e WhatsApp aparecem como asteriscos nas gravações (checado 08/10).
- [x] **Settings → Setup → Cookies desligado**: o Clarity roda sem cookies até o visitante aceitar o banner (a página chama `clarity('consent')`).
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
- [x] Teste final (08/10): URL com UTMs + `gclid=TEST123` → linha completa na planilha (apagada); `&audience=family` mostra a frase para famílias.
- [ ] ⏳ **11/10:** campanha começa sozinha. Conferir anúncios "Qualificado" (não "Reprovado") e palavras-chave sem "Página de destino não funciona" ou "Abaixo do lance da primeira página".

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
