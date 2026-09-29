const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const DocumentRepository = require('../repositories/documentRepository');
const DocumentService = require('../services/documentService');
const createDocumentController = require('../controllers/documentController');

function createDocumentRoutes({ storagePath = path.resolve(__dirname, '../../storage') } = {}) {
  fs.mkdirSync(storagePath, { recursive: true });

  const repository = new DocumentRepository(storagePath);
  const service = new DocumentService(repository);
  const controller = createDocumentController(service);
  const upload = multer({
    storage: multer.diskStorage({
      destination: storagePath,
      filename(request, file, callback) {
        const documentId = randomUUID();
        const extension = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
        file.documentId = documentId;
        callback(null, `${documentId}${extension}`);
      },
    }),
  });

  return {
    controller,
    upload,
  };
}

module.exports = createDocumentRoutes;