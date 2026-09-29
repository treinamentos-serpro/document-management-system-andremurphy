// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const path = require('node:path');
const multer = require('multer');
const createDocumentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const storagePath = process.env.STORAGE_PATH
  ? path.resolve(process.env.STORAGE_PATH)
  : path.resolve(__dirname, '../storage');
const { controller, upload } = createDocumentRoutes({ storagePath });

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/upload', controller.validateUser, upload.single('file'), controller.upload);
app.get('/documents', controller.validateUser, controller.list);
app.get('/documents/:id/download', controller.validateUser, controller.download);

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError) {
    return response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: 'Não foi possível processar o upload',
    });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error(error);
  }
  return response.status(statusCode).json({
    error: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
