const API_PREFIX = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Mantém a mensagem padrão quando o backend não retorna JSON.
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments(userId) {
  const response = await request('/documents', {
    headers: { 'X-User-Id': userId },
  });
  return response.json();
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(documentId, userId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`, {
    headers: { 'X-User-Id': userId },
  });
  return response.blob();
}