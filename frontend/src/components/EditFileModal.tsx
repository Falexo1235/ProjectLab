import React, { useState, useEffect } from 'react';
import { updateFileMetadata } from '../api/filesApi';
import './EditFileModal.css';

interface EditFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    description?: string;
  };
  onFileUpdated: (updatedFile: any) => void;
}

export const EditFileModal: React.FC<EditFileModalProps> = ({
  isOpen,
  onClose,
  file,
  onFileUpdated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const splitFileName = (fullName: string) => {
    const lastDotIndex = fullName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return { name: fullName, extension: '' };
    }
    return {
      name: fullName.substring(0, lastDotIndex),
      extension: fullName.substring(lastDotIndex)
    };
  };

  // Функция для объединения имени и расширения
  const combineFileName = (name: string, extension: string) => {
    return name + extension;
  };

  useEffect(() => {
    if (isOpen && file) {
      const { name: fileName, extension } = splitFileName(file.name);
      setName(fileName);
      setDescription(file.description || '');
      setError('');
    }
  }, [isOpen, file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Название файла не может быть пустым');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { extension } = splitFileName(file.name);
      const fullFileName = combineFileName(name.trim(), extension);
      const updatedFile = await updateFileMetadata(file.id, fullFileName, description.trim() || undefined);
      onFileUpdated(updatedFile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при обновлении файла');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const { name: fileName } = splitFileName(file.name);
    setName(fileName);
    setDescription(file.description || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const { extension } = splitFileName(file.name);

  return (
    <div className="edit-file-modal-overlay">
      <div className="edit-file-modal">
        <div className="edit-file-modal-header">
          <h2>Редактировать файл</h2>
          <button 
            className="edit-file-modal-close" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-file-modal-form">
          <div className="edit-file-modal-field">
            <label htmlFor="fileName">Название файла *</label>
            <div className="edit-file-name-container">
              <input
                id="fileName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название файла"
                disabled={isLoading}
                required
                className="edit-file-name-input"
              />
              {extension && (
                <div className="edit-file-extension">
                  {extension}
                </div>
              )}
            </div>
          </div>

          <div className="edit-file-modal-field">
            <label htmlFor="fileDescription">Описание</label>
            <textarea
              id="fileDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите описание файла (необязательно)"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {error && (
            <div className="edit-file-modal-error">
              {error}
            </div>
          )}

          <div className="edit-file-modal-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="edit-file-modal-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="edit-file-modal-save"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 