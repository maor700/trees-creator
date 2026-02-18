import { FC } from 'react';
import { MdToday } from 'react-icons/md';

interface DateSectionProps {
  dueDate: string;
  forToday: boolean;
  onDueDateChange: (date: string) => void;
  onForTodayToggle: () => void;
}

export const DateSection: FC<DateSectionProps> = ({
  dueDate,
  forToday,
  onDueDateChange,
  onForTodayToggle,
}) => {
  return (
    <div className="date-section">
      <div className="date-field">
        <label className="section-label">Due Date</label>
        <input
          type="date"
          className="date-input"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
        />
      </div>
      <div className="for-today-field">
        <label className="section-label">For Today</label>
        <button
          type="button"
          className={`for-today-btn ${forToday ? 'active' : ''}`}
          onClick={onForTodayToggle}
          title={forToday ? 'Remove from For Today' : 'Add to For Today'}
        >
          <MdToday size={16} />
          <span>{forToday ? 'Marked for Today' : 'Mark for Today'}</span>
        </button>
      </div>
    </div>
  );
};
