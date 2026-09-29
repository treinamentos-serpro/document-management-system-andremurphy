const { randomUUID } = require('node:crypto');

function createDocumentNotFoundError() {
  const error = new Error('Documento não encontrado');
  error.statusCode = 404;
  return error;
}

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async upload({ file, owner }) {
    const document = {
      id: file.documentId || randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storageName: file.filename,
      mimeType: file.mimetype || 'application/octet-stream',
    };

    try {
      const savedDocument = await this.documentRepository.save(document);
      return this.toPublicDocument(savedDocument);
    } catch (error) {
      await this.documentRepository.removeFile(document).catch(() => {});
      throw error;
    }
  }

  async list(owner) {
    const documents = await this.documentRepository.listByOwner(owner);
    return documents.map((document) => this.toPublicDocument(document));
  }

  async getDownload(id, owner) {
    const document = this.getOwnedDocument(id, owner);
    await this.ensureFileExists(document);

    return {
      document: this.toPublicDocument(document),
      mimeType: document.mimeType,
      filePath: this.documentRepository.getFilePath(document),
    };
  }

  getOwnedDocument(id, owner) {
    const document = this.documentRepository.findById(id);
    if (!document || document.owner !== owner) {
      throw createDocumentNotFoundError();
    }
    return document;
  }

  async ensureFileExists(document) {
    if (!(await this.documentRepository.fileExists(document))) {
      throw createDocumentNotFoundError();
    }
  }

  toPublicDocument(document) {
    const { storageName, mimeType, ...publicDocument } = document;
    return publicDocument;
  }
}

module.exports = DocumentService;