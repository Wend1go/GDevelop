import { Trans } from '@lingui/macro';
import React, { Component } from 'react';
import Dialog from '../UI/Dialog';
import FlatButton from '../UI/FlatButton';
import RaisedButton from '../UI/RaisedButton';
import { Column, Line } from '../UI/Grid';
import Window from '../Utils/Window';
import { serializeToJSObject } from '../Utils/Serializer';
import { showErrorBox } from '../UI/Messages/MessageBox';
import Text from '../UI/Text';

export default class BrowserSaveDialog extends Component {
  _download = () => {
    let content = '';
    try {
      content = JSON.stringify(serializeToJSObject(this.props.project));
    } catch (err) {
      showErrorBox('Unable to save your project', err);
      return;
    }
    var uri = 'data:application/json;charset=utf-8,' + content;

    var downloadLink = document.createElement('a');
    downloadLink.href = uri;
    downloadLink.download = 'game.json';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  render() {
    const { open, onClose, project } = this.props;
    if (!open || !project) return null;

    const actions = [
      <FlatButton
        key="download"
        label={<Trans>Download GDevelop desktop version</Trans>}
        primary={false}
        onClick={() => Window.openExternalURL('http://gdevelop-app.com')}
      />,
      <FlatButton
        key="close"
        label={<Trans>Close</Trans>}
        primary={false}
        onClick={onClose}
      />,
    ];

    return (
      <Dialog actions={actions} open={open} onRequestClose={onClose}>
        <Column noMargin>
          <Line>
            <Text>
              <Trans>
                You can download the file of your game to continue working on it
                using the full GDevelop version:
              </Trans>
            </Text>
          </Line>
          <Line>
            <Column expand>
              <RaisedButton
                label={<Trans>Download game file</Trans>}
                fullWidth
                primary
                onClick={this._download}
              />
            </Column>
          </Line>
        </Column>
      </Dialog>
    );
  }
}
