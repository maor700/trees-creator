import { FC, useMemo } from 'react';
import { TreeItem } from '../../models/TreeItem';

interface BreadcrumbProps {
  item: TreeItem;
  itemsById: Map<string, TreeItem>;
}

export const Breadcrumb: FC<BreadcrumbProps> = ({ item, itemsById }) => {
  const breadcrumbText = useMemo(() => {
    if (!item.parentPath) {
      return null;
    }

    const ancestorIds = item.parentPath.split('/').filter(Boolean);
    // Skip first ancestor (root node) since items are grouped by tree
    const relevantIds = ancestorIds.slice(1);

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
  }, [item.parentPath, itemsById]);

  const fullPathTooltip = useMemo(() => {
    if (!item.parentPath) {
      return '';
    }

    const ancestorIds = item.parentPath.split('/').filter(Boolean);
    // Skip first ancestor (root node)
    const relevantIds = ancestorIds.slice(1);

    if (relevantIds.length === 0) {
      return '';
    }

    const ancestorNames = relevantIds.map(id => {
      const ancestor = itemsById.get(id);
      return ancestor?.name || '...';
    });

    return ancestorNames.join(' > ');
  }, [item.parentPath, itemsById]);

  if (!breadcrumbText) {
    return null;
  }

  return (
    <div className="card-breadcrumb" title={fullPathTooltip}>
      {breadcrumbText}
    </div>
  );
};
