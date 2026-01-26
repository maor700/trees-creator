import { FC } from 'react';
import { TreeItemStatus } from '../../models/TreeItemData';

interface StatusSectionProps {
  status: TreeItemStatus;
  onStatusChange: (newStatus: TreeItemStatus) => void;
}

const STATUS_OPTIONS: { value: TreeItemStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
];

export const StatusSection: FC<StatusSectionProps> = ({ status, onStatusChange }) => {
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  return (
    <div className="status-section">
      <label className="section-label">Status</label>
      <div className="status-dropdown">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TreeItemStatus)}
          style={{ borderColor: currentStatus.color }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="status-indicator"
          style={{ backgroundColor: currentStatus.color }}
        />
      </div>
    </div>
  );
};
