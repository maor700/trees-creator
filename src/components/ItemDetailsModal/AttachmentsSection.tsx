import { FC, useRef } from 'react';
import { MdAttachFile, MdDelete, MdDownload, MdImage, MdInsertDriveFile, MdPictureAsPdf } from 'react-icons/md';
import { Attachment } from '../../models/TreeItemData';

interface AttachmentsSectionProps {
  attachments: Attachment[];
  onAdd: (attachment: Attachment) => void;
  onRemove: (attachmentId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <MdImage size={20} />;
  if (type === 'application/pdf') return <MdPictureAsPdf size={20} />;
  return <MdInsertDriveFile size={20} />;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for base64 storage

export const AttachmentsSection: FC<AttachmentsSectionProps> = ({
  attachments,
  onAdd,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
        continue;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        onAdd(attachment);
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Failed to read file "${file.name}"`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="attachments-section">
      <div className="section-header">
        <label className="section-label">Attachments</label>
        <button
          type="button"
          className="add-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Add attachment"
        >
          <MdAttachFile size={16} />
          <span>Add</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {attachments.length === 0 ? (
        <div className="empty-state">
          <span>No attachments yet</span>
        </div>
      ) : (
        <div className="attachments-list">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              {isImage(attachment.type) ? (
                <div className="attachment-preview">
                  <img src={attachment.dataUrl} alt={attachment.name} />
                </div>
              ) : (
                <div className="attachment-icon">
                  {getFileIcon(attachment.type)}
                </div>
              )}
              <div className="attachment-info">
                <span className="attachment-name" title={attachment.name}>
                  {attachment.name}
                </span>
                <span className="attachment-size">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <div className="attachment-actions">
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => handleDownload(attachment)}
                  title="Download"
                >
                  <MdDownload size={16} />
                </button>
                <button
                  type="button"
                  className="action-btn delete"
                  onClick={() => onRemove(attachment.id)}
                  title="Remove"
                >
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
