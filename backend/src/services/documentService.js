const { randomUUID } = require('node:crypto');

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
      return await this.documentRepository.save(document);
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
    const document = this.documentRepository.findById(id);
    if (!document || document.owner !== owner) {
      const error = new Error('Documento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (!(await this.documentRepository.fileExists(document))) {
      const error = new Error('Documento não encontrado');
      error.statusCode = 404;
      throw error;
    }

    return {
      document: this.toPublicDocument(document),
      mimeType: document.mimeType,
      filePath: this.documentRepository.getFilePath(document),
    };
  }

  toPublicDocument(document) {
    const { storageName, mimeType, ...publicDocument } = document;
    return publicDocument;
  }
}

module.exports = DocumentService;