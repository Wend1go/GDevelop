// @flow
import * as React from 'react';
import { ListItem } from '../../../UI/List';
import ListIcon from '../../../UI/ListIcon';
import type { GroupWithContext } from '../../../ObjectsList/EnumerateObjects';
import { getObjectOrObjectGroupListItemKey } from './Keys';

type Props = {|
  groupWithContext: GroupWithContext,
  iconSize: number,
  onClick: () => void,
  selectedValue: ?string,
|};

export const renderGroupObjectsListItem = ({
  groupWithContext,
  iconSize,
  onClick,
  selectedValue,
}: Props) => {
  const groupName: string = groupWithContext.group.getName();
  return (
    <ListItem
      key={
        getObjectOrObjectGroupListItemKey(groupName) +
        (groupWithContext.global ? '-global' : '')
      }
      selected={selectedValue === getObjectOrObjectGroupListItemKey(groupName)}
      primaryText={groupName}
      leftIcon={
        <ListIcon
          iconSize={iconSize}
          src="res/ribbon_default/objectsgroups64.png"
        />
      }
      onClick={onClick}
    />
  );
};
