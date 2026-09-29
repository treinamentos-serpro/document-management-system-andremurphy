# Especificação - Document Management System

Versão: 1.0  
Status: pronta para implementação do MVP

## 1. Objetivo

Entregar uma aplicação web para que usuários enviem, consultem e baixem seus documentos usando armazenamento local e uma API HTTP simples.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos pertencentes ao usuário informado na requisição.
- Download de um documento pelo identificador.
- Identificação simples do usuário por `X-User-Id`, sem autenticação nesta fase.
- Interface React para upload, listagem, estados de carregamento e download.
- API Node.js com Express e separação em routes, controllers, services e repositories.
- Gravação dos arquivos no filesystem local em `backend/storage` usando `multer` com `diskStorage`.
- Manutenção dos metadados em memória durante a execução do processo.

### Fora do escopo

- Login, sessões, tokens, autenticação ou autorização de produção.
- Banco de dados ou persistência dos metadados entre reinícios.
- Reconstrução automática de metadados a partir do diretório de armazenamento.
- Armazenamento externo, nuvem, CDN ou serviço de upload de terceiros.
- Versionamento, edição, exclusão, compartilhamento ou restauração de documentos.
- Busca, filtros, paginação e ordenação configurável.
- Limite funcional de tamanho ou lista de MIME types permitidos nesta primeira versão.
- Processamento, conversão, antivírus ou pré-visualização do conteúdo.

## 3. Atores e premissas

### Usuário da aplicação

O usuário pode enviar, listar e baixar documentos. Nesta versão, sua identidade é recebida pelo header `X-User-Id`. Esse mecanismo identifica o dono no domínio, mas não prova a identidade do chamador e não deve ser tratado como autenticação segura.

### Premissas operacionais

- A aplicação roda em um único processo Node.js.
- O diretório `backend/storage` existe ou é criado antes do primeiro upload.
- Os arquivos persistem no disco enquanto não forem removidos manualmente, mas os metadados são perdidos quando o processo reinicia.
- Um arquivo sem metadado correspondente não pode ser listado nem baixado pela API.
- O frontend acessa a API usando o prefixo `/api`; o proxy do Vite encaminha as requisições ao backend e remove esse prefixo.

## 4. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar um arquivo no campo multipart `file`. | Uma requisição válida cria um arquivo físico e retorna seus metadados. |
| RF-02 | O upload deve exigir `X-User-Id` não vazio. | Requisições sem usuário recebem erro `400` e não criam documento. |
| RF-03 | O upload deve rejeitar requisições sem arquivo ou com arquivo vazio. | A API retorna `400` e nenhum metadado fica registrado. |
| RF-04 | O sistema deve gerar um identificador único para cada documento. | O identificador retornado é estável durante a execução e não depende do nome original. |
| RF-05 | O sistema deve registrar nome original, tamanho, data de upload e dono. | A resposta do upload contém exatamente os metadados públicos definidos no modelo. |
| RF-06 | O arquivo físico deve ter um nome seguro derivado do identificador. | O nome original nunca é usado diretamente para compor um caminho de filesystem. |
| RF-07 | O sistema deve listar somente documentos do usuário informado. | Nenhum documento de outro `X-User-Id` aparece na resposta. |
| RF-08 | A listagem deve ser ordenada do upload mais recente para o mais antigo. | A ordenação usa `uploadedAt` em ordem decrescente. |
| RF-09 | O sistema deve permitir baixar um documento pelo `id`. | Usuário proprietário recebe o conteúdo binário do arquivo. |
| RF-10 | O sistema deve impedir download por usuário diferente do proprietário. | O recurso é tratado como inexistente e retorna `404`, sem revelar sua existência. |
| RF-11 | O download deve preservar o nome original na resposta. | A resposta inclui `Content-Disposition: attachment` com nome sanitizado ou codificado corretamente. |
| RF-12 | O sistema deve tratar metadados ausentes ou arquivo físico inexistente. | A API retorna `404` e não expõe caminho interno ou stack trace. |
| RF-13 | O frontend deve atualizar a listagem após upload bem-sucedido. | O documento novo aparece sem exigir recarregamento manual da página. |
| RF-14 | O frontend deve indicar carregamento e falha nas operações. | Controles relevantes ficam indisponíveis durante a operação e mensagens compreensíveis são exibidas. |
| RF-15 | A API deve expor uma verificação de saúde. | `GET /health` retorna status `200` e `{ "status": "ok" }`. |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e CommonJS, sem TypeScript nesta fase. |
| RNF-02 | O frontend deve usar React, Vite, componentes funcionais e React Hooks. |
| RNF-03 | O backend deve seguir a dependência `routes -> controllers -> services -> repositories`. |
| RNF-04 | As rotas devem delegar; regras de negócio não devem ficar em handlers Express. |
| RNF-05 | Os arquivos devem ser gravados localmente com `multer` configurado por `diskStorage`. Não usar `memoryStorage` nem provedor externo. |
| RNF-06 | Os metadados devem ficar em memória, preferencialmente indexados por `id`, e não devem ser persistidos em banco ou arquivo. |
| RNF-07 | Configurações operacionais, como `PORT` e caminho de armazenamento, devem ser obtidas por variáveis de ambiente com valores padrão documentados. |
| RNF-08 | A API deve retornar erros JSON consistentes e nunca expor caminhos locais, credenciais ou stack traces. |
| RNF-09 | Entradas do cliente devem ser validadas nas bordas HTTP e nomes de arquivos devem ser tratados contra path traversal. |
| RNF-10 | Operações com filesystem devem ser assíncronas quando suportadas pela API utilizada e devem tratar falhas de leitura, escrita e remoção. |
| RNF-11 | O código deve usar funções pequenas, nomes descritivos em inglês e mensagens ao usuário em português. |
| RNF-12 | O backend deve ter testes com o runner nativo `node:test`, cobrindo os fluxos de sucesso e erro dos endpoints. |
| RNF-13 | A aplicação deve funcionar em desenvolvimento com backend em `http://localhost:3000` e frontend em `http://localhost:5173`. |

## 6. Regras de negócio

1. `X-User-Id` é obrigatório para upload, listagem e download. Espaços em branco não constituem um identificador válido.
2. O usuário do documento é definido pelo header da requisição de upload; o cliente não pode sobrescrever `owner` por um campo multipart.
3. O identificador deve ser gerado no servidor, preferencialmente como UUID v4.
4. `originalName` é apenas informação de apresentação. O caminho físico usa um nome interno baseado no `id` e, opcionalmente, uma extensão validada.
5. O upload só deve registrar metadados depois que o arquivo for gravado com sucesso.
6. Se o arquivo for gravado, mas o registro do metadado falhar, o arquivo recém-criado deve ser removido quando possível.
7. Se a leitura do arquivo falhar durante o download, o serviço deve retornar erro de recurso indisponível ou inexistente sem expor detalhes do filesystem.
8. Ao reiniciar, a coleção de metadados começa vazia. A especificação não exige varredura ou reconstrução de `backend/storage`.
9. A listagem sem documentos deve retornar `200` com uma lista vazia, nunca `404`.

## 7. Modelo de dados

### 7.1 Metadados públicos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pelo servidor. Formato recomendado: UUID v4. |
| `originalName` | string | Sim | Nome original informado pelo cliente, usado somente para apresentação e download. |
| `size` | number | Sim | Tamanho do arquivo em bytes, sempre inteiro não negativo. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Sim | Valor normalizado de `X-User-Id` associado ao documento. |

Exemplo:

```json
{
  "id": "2f1e8b2e-5c11-4a6f-9e49-9e5af9a5e21d",
  "originalName": "relatorio.pdf",
  "size": 48231,
  "uploadedAt": "2026-09-29T14:30:00.000Z",
  "owner": "user-123"
}
```

### 7.2 Dados internos do repositório

O repositório pode manter um campo interno, como `storageName` ou `storagePath`, para localizar o arquivo. Esse campo não deve ser retornado pela API. O caminho deve ser resolvido dentro de `backend/storage`, sem aceitar caminhos fornecidos pelo cliente.

### 7.3 Coleção em memória

O repositório deve manter os metadados em uma estrutura indexada por `id`, como `Map`. A operação de listagem deve filtrar por `owner` e ordenar uma cópia dos resultados, sem expor a estrutura mutável interna.

## 8. Contratos de API

### 8.1 Formato de erro

Falhas HTTP devem usar `application/json`:

```json
{
  "error": "Mensagem explicando o problema"
}
```

O campo `error` é obrigatório. Detalhes técnicos, caminhos físicos e stack traces não devem ser enviados ao cliente.

### 8.2 `GET /health`

Verifica se a aplicação está disponível.

**Entrada**

- Sem headers de negócio.

**Sucesso: `200 OK`**

```json
{
  "status": "ok"
}
```

### 8.3 `POST /upload`

Cria um documento para o usuário informado.

**Headers**

- `X-User-Id: string` obrigatório.
- `Content-Type: multipart/form-data; boundary=...` obrigatório.

**Campos multipart**

- `file`: arquivo obrigatório.
- Campos adicionais não fazem parte do contrato e devem ser ignorados ou rejeitados de forma consistente.

**Sucesso: `201 Created`**

```json
{
  "id": "2f1e8b2e-5c11-4a6f-9e49-9e5af9a5e21d",
  "originalName": "relatorio.pdf",
  "size": 48231,
  "uploadedAt": "2026-09-29T14:30:00.000Z",
  "owner": "user-123"
}
```

**Erros**

| Status | Situação |
| --- | --- |
| `400 Bad Request` | `X-User-Id` ausente/vazio, campo `file` ausente ou arquivo inválido. |
| `413 Payload Too Large` | Reservado para um limite de tamanho futuro, caso seja configurado no multer. |
| `500 Internal Server Error` | Falha ao criar diretório, gravar arquivo ou registrar metadados. |

### 8.4 `GET /documents`

Lista os documentos do usuário.

**Headers**

- `X-User-Id: string` obrigatório.

**Sucesso: `200 OK`**

```json
[
  {
    "id": "2f1e8b2e-5c11-4a6f-9e49-9e5af9a5e21d",
    "originalName": "relatorio.pdf",
    "size": 48231,
    "uploadedAt": "2026-09-29T14:30:00.000Z",
    "owner": "user-123"
  }
]
```

Sem documentos, a resposta é `200 OK` com `[]`. A ordem deve ser decrescente por `uploadedAt`. Não há query parameters de paginação, busca ou filtro no MVP.

**Erros**

- `400 Bad Request` se `X-User-Id` estiver ausente ou vazio.
- `500 Internal Server Error` se a leitura da coleção em memória falhar.

### 8.5 `GET /documents/:id/download`

Baixa o conteúdo binário do documento do usuário.

**Headers**

- `X-User-Id: string` obrigatório.

**Sucesso: `200 OK`**

- Corpo binário idêntico ao arquivo armazenado.
- `Content-Type` compatível com o MIME registrado pelo upload ou `application/octet-stream` quando não houver informação confiável.
- `Content-Length` com o tamanho do arquivo quando disponível.
- `Content-Disposition: attachment; filename="nome-original"`, com codificação segura para nomes especiais.

**Erros**

| Status | Situação |
| --- | --- |
| `400 Bad Request` | `id` ausente ou malformado, ou `X-User-Id` ausente/vazio. |
| `404 Not Found` | Documento inexistente, pertencente a outro usuário ou arquivo físico ausente. |
| `500 Internal Server Error` | Falha inesperada ao ler o arquivo. |

O serviço deve verificar a propriedade antes de abrir o arquivo. Respostas `404` para documento de outro usuário evitam revelar que o recurso existe.

## 9. Arquitetura

### 9.1 Backend

```text
backend/src/
  app.js
  routes/
  controllers/
  services/
  repositories/
```

- `routes/`: registra métodos e caminhos HTTP, conecta middleware do multer e delega para controllers.
- `controllers/`: lê headers, parâmetros e arquivos, executa validações básicas e converte resultados em respostas HTTP.
- `services/`: aplica as regras de negócio, isolamento por usuário, ordenação, criação de metadados e coordenação entre multer/repositório.
- `repositories/`: encapsula a coleção de metadados em memória e as operações de filesystem local.
- `app.js`: configura Express, middlewares globais, rotas e tratamento final de erros; não deve concentrar regras de negócio.

As camadas internas não devem importar Express, acessar `req`/`res` diretamente ou conhecer componentes React. O service deve receber dados simples e devolver resultados ou erros de domínio.

### 9.2 Frontend

```text
frontend/src/
  components/
  pages/
  services/
```

- `services/`: cliente `fetch` para `/api/upload`, `/api/documents` e `/api/documents/:id/download`.
- `components/`: seletor/formulário de upload, listagem de documentos e ação de download.
- `pages/`: composição da tela principal e estados de carregamento/erro.
- `App.jsx`: composição da aplicação sem duplicar regras de comunicação HTTP.

## 10. Configuração e operação

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_PATH` | `backend/storage` | Diretório local dos arquivos, resolvido a partir do projeto. |

O uso de `STORAGE_PATH` não permite trocar o mecanismo de armazenamento: o backend continua usando filesystem local e `diskStorage`. A configuração deve ser validada na inicialização e os diretórios necessários devem ser criados de forma segura.

## 11. Plano de execução em etapas

Este plano orienta uma implementação futura. Ele não faz parte da execução desta especificação.

### Etapa 1 - Configuração e contratos internos

- Definir leitura de `PORT` e `STORAGE_PATH`.
- Definir tipos conceituais de metadados, erros de domínio e interfaces dos repositórios.
- Critério de aceite: configurações têm defaults documentados e nenhum código de domínio depende de Express.

### Etapa 2 - Repositório local

- Implementar armazenamento de metadados em `Map`.
- Implementar gravação, localização e leitura de arquivos dentro de `backend/storage`.
- Usar `multer.diskStorage` para o upload.
- Critério de aceite: o repositório não expõe caminhos internos e consegue criar, listar por dono e recuperar um documento.

### Etapa 3 - Serviços de negócio

- Implementar upload, listagem e download.
- Validar usuário, arquivo, propriedade e limpeza após falhas parciais.
- Critério de aceite: os serviços funcionam com dependências injetadas e podem ser testados sem Express.

### Etapa 4 - Controllers e rotas

- Registrar `/health`, `/upload`, `/documents` e `/documents/:id/download`.
- Aplicar validações HTTP e middleware de erro JSON.
- Critério de aceite: cada endpoint respeita os contratos desta especificação e não expõe detalhes internos.

### Etapa 5 - Testes do backend

- Cobrir sucesso, validação, isolamento por usuário, ordenação, arquivo ausente e limpeza após falha.
- Usar `node:test` e filesystem temporário quando necessário.
- Critério de aceite: `npm test` passa e os testes verificam os códigos HTTP e corpos de resposta.

### Etapa 6 - Cliente frontend

- Criar funções de `fetch` em `frontend/src/services`.
- Implementar formulário de upload, listagem e download.
- Critério de aceite: o frontend usa somente o prefixo `/api`, mostra estados de carregamento e traduz erros para mensagens úteis.

### Etapa 7 - Integração da tela

- Compor os componentes na página principal.
- Atualizar a lista após upload e desabilitar ações durante requisições.
- Critério de aceite: um usuário consegue enviar, visualizar e baixar um documento a partir da interface.

### Etapa 8 - Validação final

- Executar testes backend, build do frontend e verificação manual dos fluxos.
- Conferir que nenhum arquivo é gravado fora de `STORAGE_PATH` e que os metadados públicos não expõem `storagePath`.
- Critério de aceite: os comandos de validação passam e o comportamento permanece alinhado ao escopo do MVP.

## 12. Critérios de aceite do MVP

- `GET /health` responde corretamente.
- Usuário com `X-User-Id` consegue enviar um arquivo usando o campo `file`.
- Upload retorna `201` e os cinco campos públicos do documento.
- Listagem retorna somente os documentos do usuário, em ordem decrescente de upload.
- Download retorna o conteúdo correto e o nome original no header de disposição.
- Usuário diferente não consegue listar nem baixar documentos de outro usuário.
- Falhas de validação não deixam metadados registrados nem arquivos parciais conhecidos.
- Arquivos ficam exclusivamente no filesystem local configurado.
- Backend e frontend mantêm as responsabilidades definidas pela arquitetura.
- O plano não exige implementação de persistência, autenticação ou funcionalidades fora do escopo.