import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(uploadedAt) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(uploadedAt));
}

export default function DocumentList({ documents, isLoading, onDownload }) {
  return (
    <section className="documents-panel" aria-labelledby="documents-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sua biblioteca</p>
          <h2 id="documents-title">Documentos recentes</h2>
        </div>
        <span className="count-badge">{documents.length}</span>
      </div>

      {isLoading && <p className="muted">Carregando documentos...</p>}
      {!isLoading && documents.length === 0 && (
        <div className="empty-state">
          <strong>Nenhum documento por aqui.</strong>
          <span>Envie seu primeiro arquivo para começar.</span>
        </div>
      )}
      {!isLoading && documents.length > 0 && (
        <div className="document-list">
          {documents.map((document) => (
            <article className="document-row" key={document.id}>
              <div className="document-mark">DOC</div>
              <div className="document-details">
                <strong title={document.originalName}>{document.originalName}</strong>
                <span>{formatFileSize(document.size)} · {formatDate(document.uploadedAt)}</span>
              </div>
              <DownloadButton document={document} onDownload={onDownload} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}