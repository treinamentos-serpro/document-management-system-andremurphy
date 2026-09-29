function getUserId(request) {
  const userId = request.get('X-User-Id');
  if (!userId || !userId.trim()) {
    const error = new Error('O header X-User-Id é obrigatório');
    error.statusCode = 400;
    throw error;
  }
  return userId.trim();
}

function createDocumentController(documentService) {
  return {
    validateUser(request, response, next) {
      try {
        request.userId = getUserId(request);
        next();
      } catch (error) {
        next(error);
      }
    },

    async upload(request, response, next) {
      try {
        if (!request.file || request.file.size === 0) {
          const error = new Error('O campo file é obrigatório e não pode estar vazio');
          error.statusCode = 400;
          throw error;
        }

        const document = await documentService.upload({
          file: request.file,
          owner: request.userId,
        });
        response.status(201).json(documentService.toPublicDocument(document));
      } catch (error) {
        next(error);
      }
    },

    async list(request, response, next) {
      try {
        const documents = await documentService.list(request.userId);
        response.json(documents);
      } catch (error) {
        next(error);
      }
    },

    async download(request, response, next) {
      try {
        const { filePath, document, mimeType } = await documentService.getDownload(
          request.params.id,
          request.userId,
        );

        response.download(filePath, document.originalName, {
          headers: { 'Content-Type': mimeType || 'application/octet-stream' },
        }, (error) => {
          if (error && !response.headersSent) {
            next(error);
          }
        });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = createDocumentController;