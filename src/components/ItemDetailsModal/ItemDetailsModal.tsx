import { FC, useEffect, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { TreeItem } from '../../models/TreeItem';
import { TreeItemData, TreeItemStatus, Attachment, YouTubeEmbed } from '../../models/TreeItemData';
import { treesDB } from '../../models/treesDb';
import { TitleSection } from './TitleSection';
import { StatusSection } from './StatusSection';
import { DescriptionSection } from './DescriptionSection';
import { AttachmentsSection } from './AttachmentsSection';
import { YouTubeSection } from './YouTubeSection';
import './ItemDetailsModal.scss';

interface ItemDetailsModalProps {
  treeItem: TreeItem<TreeItemData>;
  onClose: () => void;
}

export const ItemDetailsModal: FC<ItemDetailsModalProps> = ({ treeItem, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [itemData, setItemData] = useState<TreeItemData>(() => treeItem.data || {});

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Save data to database
  const saveData = useCallback(async (newData: TreeItemData) => {
    setSaving(true);
    try {
      await treesDB.editNode(treeItem.id, {
        data: {
          ...newData,
          lastModified: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error saving item data:', error);
    } finally {
      setSaving(false);
    }
  }, [treeItem.id]);

  // Handle title change
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setSaving(true);
    try {
      await treesDB.editNode(treeItem.id, { name: newTitle });
    } catch (error) {
      console.error('Error saving title:', error);
    } finally {
      setSaving(false);
    }
  }, [treeItem.id]);

  // Handle status change
  const handleStatusChange = useCallback((newStatus: TreeItemStatus) => {
    const newData = { ...itemData, status: newStatus };
    setItemData(newData);
    saveData(newData);
  }, [itemData, saveData]);

  // Handle description save
  const handleDescriptionSave = useCallback((newDescription: string) => {
    const newData = { ...itemData, description: newDescription };
    setItemData(newData);
    saveData(newData);
  }, [itemData, saveData]);

  // Handle attachment add
  const handleAttachmentAdd = useCallback((attachment: Attachment) => {
    const newAttachments = [...(itemData.attachments || []), attachment];
    const newData = { ...itemData, attachments: newAttachments };
    setItemData(newData);
    saveData(newData);
  }, [itemData, saveData]);

  // Handle attachment remove
  const handleAttachmentRemove = useCallback((attachmentId: string) => {
    const newAttachments = (itemData.attachments || []).filter(a => a.id !== attachmentId);
    const newData = { ...itemData, attachments: newAttachments };
    setItemData(newData);
    saveData(newData);
  }, [itemData, saveData]);

  // Handle YouTube embed add
  const handleYouTubeAdd = useCallback((embed: YouTubeEmbed) => {
    const newEmbeds = [...(itemData.youtubeEmbeds || []), embed];
    const newData = { ...itemData, youtubeEmbeds: newEmbeds };
    setItemData(newData);
    saveData(newData);
  }, [itemData, saveData]);

  // Handle YouTube embed remove
  const handleYouTubeRemove = useCallback((embedId: string) => {
    const newEmbeds = (itemData.youtubeEmbeds || []).filter(e => e.id !== embedId);
    const newData = { ...itemData, youtubeEmbeds: newEmbeds };
    setItemData(newData);
    saveData(newData);
  }, [itemData, saveData]);

  // Prevent click propagation
  const handleModalClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
  };

  return (
    <div className="item-details-overlay" onClick={onClose}>
      <div className="item-details-modal" onClick={handleModalClick}>
        <div className="modal-header">
          <TitleSection title={treeItem.name} onTitleChange={handleTitleChange} />
          <button type="button" className="close-btn" onClick={onClose} title="Close (Esc)">
            <MdClose size={24} />
          </button>
        </div>

        <div className="modal-body">
          <StatusSection
            status={itemData.status || 'not_started'}
            onStatusChange={handleStatusChange}
          />

          <DescriptionSection
            description={itemData.description || ''}
            onSave={handleDescriptionSave}
          />

          <AttachmentsSection
            attachments={itemData.attachments || []}
            onAdd={handleAttachmentAdd}
            onRemove={handleAttachmentRemove}
          />

          <YouTubeSection
            embeds={itemData.youtubeEmbeds || []}
            onAdd={handleYouTubeAdd}
            onRemove={handleYouTubeRemove}
          />
        </div>

        <div className="modal-footer">
          {saving && <span className="saving-indicator">Saving...</span>}
          {itemData.lastModified && !saving && (
            <span className="last-modified">
              Last modified: {new Date(itemData.lastModified).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
