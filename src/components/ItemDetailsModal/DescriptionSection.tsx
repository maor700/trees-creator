import { FC, useState, useEffect } from 'react';
import { MdEdit, MdCheck, MdClose } from 'react-icons/md';
import { RichTextEditor } from '../RichTextEditor';

interface DescriptionSectionProps {
  description: string;
  onSave: (newDescription: string) => void;
}

export const DescriptionSection: FC<DescriptionSectionProps> = ({
  description,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description);

  useEffect(() => {
    setEditValue(description);
  }, [description]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(description);
    setIsEditing(false);
  };

  const hasContent = description && description !== '<p></p>' && description.trim() !== '';

  return (
    <div className="description-section">
      <div className="section-header">
        <label className="section-label">Description</label>
        {!isEditing && (
          <button
            type="button"
            className="edit-btn"
            onClick={() => setIsEditing(true)}
            title="Edit description"
          >
            <MdEdit size={16} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="description-edit">
          <RichTextEditor
            content={editValue}
            onChange={setEditValue}
            placeholder="Add a description..."
          />
          <div className="edit-actions">
            <button type="button" className="btn save-btn" onClick={handleSave} title="Save">
              <MdCheck size={16} />
              <span>Save</span>
            </button>
            <button type="button" className="btn cancel-btn" onClick={handleCancel} title="Cancel">
              <MdClose size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`description-display ${!hasContent ? 'empty' : ''}`}
          onClick={() => setIsEditing(true)}
        >
          {hasContent ? (
            <div
              className="description-content"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <span className="placeholder">Click to add a description...</span>
          )}
        </div>
      )}
    </div>
  );
};
