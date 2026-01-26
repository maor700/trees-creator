import { FC, useState } from 'react';
import { MdAdd, MdDelete, MdPlayCircle } from 'react-icons/md';
import { YouTubeEmbed } from '../../models/TreeItemData';

interface YouTubeSectionProps {
  embeds: YouTubeEmbed[];
  onAdd: (embed: YouTubeEmbed) => void;
  onRemove: (embedId: string) => void;
}

// Extract YouTube video ID from various URL formats
const extractVideoId = (input: string): string | null => {
  // Already a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }

  // Various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
};

export const YouTubeSection: FC<YouTubeSectionProps> = ({
  embeds,
  onAdd,
  onRemove,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const videoId = extractVideoId(inputValue);

    if (!videoId) {
      setError('Invalid YouTube URL or video ID');
      return;
    }

    // Check for duplicates
    if (embeds.some(e => e.videoId === videoId)) {
      setError('This video is already added');
      return;
    }

    const embed: YouTubeEmbed = {
      id: crypto.randomUUID(),
      videoId,
      createdAt: new Date().toISOString(),
    };

    onAdd(embed);
    setInputValue('');
    setError('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setInputValue('');
    setError('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="youtube-section">
      <div className="section-header">
        <label className="section-label">YouTube Videos</label>
        {!isAdding && (
          <button
            type="button"
            className="add-btn"
            onClick={() => setIsAdding(true)}
            title="Add YouTube video"
          >
            <MdAdd size={16} />
            <span>Add</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="youtube-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube URL or video ID..."
            className="youtube-input"
            autoFocus
          />
          <div className="input-actions">
            <button type="button" className="btn save-btn" onClick={handleAdd}>
              Add
            </button>
            <button type="button" className="btn cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          {error && <span className="error-message">{error}</span>}
        </div>
      )}

      {embeds.length === 0 && !isAdding ? (
        <div className="empty-state">
          <span>No videos yet</span>
        </div>
      ) : (
        <div className="youtube-list">
          {embeds.map((embed) => (
            <div key={embed.id} className="youtube-item">
              <div className="youtube-thumbnail">
                <img
                  src={`https://img.youtube.com/vi/${embed.videoId}/mqdefault.jpg`}
                  alt="Video thumbnail"
                />
                <a
                  href={`https://www.youtube.com/watch?v=${embed.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="play-overlay"
                  title="Watch on YouTube"
                >
                  <MdPlayCircle size={40} />
                </a>
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemove(embed.id)}
                title="Remove"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
