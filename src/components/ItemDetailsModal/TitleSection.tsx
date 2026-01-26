import { FC, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MdEdit, MdCheck, MdClose } from 'react-icons/md';

interface TitleSectionProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
}

export const TitleSection: FC<TitleSectionProps> = ({ title, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleSave = () => {
    if (editValue.trim()) {
      onTitleChange(editValue.trim());
    } else {
      setEditValue(title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') {
      handleSave();
    } else if (ev.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="title-section">
      {isEditing ? (
        <div className="title-edit">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="title-input"
          />
          <button type="button" onClick={handleSave} className="btn save-btn" title="Save">
            <MdCheck />
          </button>
          <button type="button" onClick={handleCancel} className="btn cancel-btn" title="Cancel">
            <MdClose />
          </button>
        </div>
      ) : (
        <div className="title-display" onClick={() => setIsEditing(true)}>
          <h2 className="title-text">{title}</h2>
          <button type="button" className="edit-btn" title="Edit title">
            <MdEdit />
          </button>
        </div>
      )}
    </div>
  );
};
