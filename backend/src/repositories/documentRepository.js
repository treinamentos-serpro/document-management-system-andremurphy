const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storagePath) {
    this.storagePath = path.resolve(storagePath);
    this.documents = new Map();
  }

  async save(document) {
    this.documents.set(document.id, { ...document });
    return { ...document };
  }

  findById(id) {
    const document = this.documents.get(id);
    return document ? { ...document } : null;
  }

  async listByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
      .map((document) => ({ ...document }));
  }

  getFilePath(document) {
    const filePath = path.resolve(this.storagePath, document.storageName);
    if (path.dirname(filePath) !== this.storagePath) {
      throw new Error('Caminho de armazenamento inválido');
    }
    return filePath;
  }

  async removeFile(document) {
    await fs.rm(this.getFilePath(document), { force: true });
  }

  async fileExists(document) {
    try {
      await fs.access(this.getFilePath(document));
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = DocumentRepository;