import { useState } from 'react';

export default function UploadComponent({ userId, onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] || null);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setError('Selecione um documento para enviar.');
      return;
    }

    try {
      setError('');
      await onUpload(selectedFile);
      setSelectedFile(null);
      event.target.reset();
    } catch (uploadError) {
      setError(uploadError.message);
    }
  }

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Novo documento</p>
        <h2>Envie um arquivo para sua biblioteca</h2>
        <p className="muted">O documento ficará disponível para o usuário {userId}.</p>
      </div>
      <label className="file-picker">
        <span>{selectedFile ? selectedFile.name : 'Escolha um arquivo'}</span>
        <input type="file" onChange={handleFileChange} disabled={isUploading} />
      </label>
      <button className="primary-button" type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}