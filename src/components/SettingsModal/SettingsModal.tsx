import { FC } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MdClose } from 'react-icons/md';
import { BsTextLeft, BsTextRight } from 'react-icons/bs';
import { treesDB } from '../../models/treesDb';
import './SettingsModal.scss';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({ onClose }) => {
  const isRtl = useLiveQuery<boolean>(() => treesDB.getAppPropVal('isRtl'), [], false);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h3>Settings</h3>
          <button type="button" className="close-btn" onClick={onClose} title="Close">
            <MdClose size={20} />
          </button>
        </div>
        <div className="settings-body">
          <div className="setting-item">
            <div className="setting-label">
              <span>Text Direction</span>
              <span className="setting-description">Change the layout direction</span>
            </div>
            <div className="setting-control">
              <button
                type="button"
                className={`direction-btn ${!isRtl ? 'active' : ''}`}
                onClick={() => treesDB.setAppPropVal('isRtl', false)}
                title="Left to Right"
              >
                <BsTextLeft size={18} />
                <span>LTR</span>
              </button>
              <button
                type="button"
                className={`direction-btn ${isRtl ? 'active' : ''}`}
                onClick={() => treesDB.setAppPropVal('isRtl', true)}
                title="Right to Left"
              >
                <BsTextRight size={18} />
                <span>RTL</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
