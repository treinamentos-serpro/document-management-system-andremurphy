import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/api.js';
import './styles.css';

export default function App() {
  const [userId, setUserId] = useState('demo-user');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      if (!userId.trim()) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        const result = await listDocuments(userId.trim());
        if (isCurrent) setDocuments(result);
      } catch (loadError) {
        if (isCurrent) setError(loadError.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  async function handleUpload(file) {
    setIsUploading(true);
    setError('');
    try {
      const document = await uploadDocument(file, userId.trim());
      setDocuments((currentDocuments) => [document, ...currentDocuments]);
    } catch (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(documentData) {
    const blob = await downloadDocument(documentData.id, userId.trim());
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = documentData.originalName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DMS · espaço pessoal</p>
          <h1>Document Management System</h1>
          <p className="header-copy">Um lugar simples para guardar e recuperar seus arquivos.</p>
        </div>
        <label className="user-field">
          <span>Usuário</span>
          <input value={userId} onChange={(event) => setUserId(event.target.value)} />
        </label>
      </header>

      {error && <p className="global-error" role="alert">{error}</p>}
      <div className="content-grid">
        <UploadComponent userId={userId.trim() || 'usuário atual'} onUpload={handleUpload} isUploading={isUploading} />
        <DocumentList documents={documents} isLoading={isLoading} onDownload={handleDownload} />
      </div>
    </main>
  );
}
