// @flow
import { Trans } from '@lingui/macro';

import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import Info from '@material-ui/icons/Info';
import Warning from '@material-ui/icons/Warning';
import { Line } from './Grid';
import FlatButton from './FlatButton';
import Text from './Text';

const styles = {
  icon: { width: 28, height: 28, marginRight: 10, marginLeft: 10 },
  content: { flex: 1 },
};

type Props = {|
  kind: 'info' | 'warning',
  children: React.Node,
  onHide?: () => void,
|};

/**
 * Show an hint, warning or other message. If you want to allow the user
 * to permanently hide the hint/alert/message, see DismissableAlertMessage.
 */
const AlertMessage = ({ kind, children, onHide }: Props) => (
  <Paper>
    <Line noMargin alignItems="center">
      {kind === 'info' && <Info style={styles.icon} />}
      {kind === 'warning' && <Warning style={styles.icon} />}
      <Text style={styles.content}>{children}</Text>
      {onHide && (
        <FlatButton label={<Trans>Hide</Trans>} onClick={() => onHide()} />
      )}
    </Line>
  </Paper>
);

export default AlertMessage;
