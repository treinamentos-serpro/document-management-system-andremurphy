import { useState } from 'react';

export default function DownloadButton({ document, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    try {
      setIsDownloading(true);
      setError('');
      await onDownload(document);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span className="download-action">
      <button className="secondary-button" type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span className="inline-error" role="alert">{error}</span>}
    </span>
  );
}