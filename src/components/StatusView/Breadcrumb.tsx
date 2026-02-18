import { FC, useMemo } from 'react';
import { TreeItem } from '../../models/TreeItem';

interface BreadcrumbProps {
  item: TreeItem;
  itemsById: Map<string, TreeItem>;
  showRoot?: boolean;
}

export const Breadcrumb: FC<BreadcrumbProps> = ({ item, itemsById, showRoot }) => {
  const breadcrumbText = useMemo(() => {
    if (!item.parentPath) {
      return null;
    }

    const ancestorIds = item.parentPath.split('/').filter(Boolean);
    const relevantIds = showRoot ? ancestorIds : ancestorIds.slice(1);

    if (relevantIds.length === 0) {
      return null;
    }

    const ancestorNames = relevantIds.map(id => {
      const ancestor = itemsById.get(id);
      return ancestor?.name || '...';
    });

    // If path is too long, show ellipsis
    if (ancestorNames.length > 2) {
      return `${ancestorNames[0]} > ... > ${ancestorNames[ancestorNames.length - 1]}`;
    }

    return ancestorNames.join(' > ');
  }, [item.parentPath, itemsById, showRoot]);

  const fullPathTooltip = useMemo(() => {
    if (!item.parentPath) {
      return '';
    }

    const ancestorIds = item.parentPath.split('/').filter(Boolean);
    const relevantIds = showRoot ? ancestorIds : ancestorIds.slice(1);

    if (relevantIds.length === 0) {
      return '';
    }

    const ancestorNames = relevantIds.map(id => {
      const ancestor = itemsById.get(id);
      return ancestor?.name || '...';
    });

    return ancestorNames.join(' > ');
  }, [item.parentPath, itemsById, showRoot]);

  if (!breadcrumbText) {
    return null;
  }

  return (
    <div className="card-breadcrumb" title={fullPathTooltip}>
      {breadcrumbText}
    </div>
  );
};
