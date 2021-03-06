import { Trans } from '@lingui/macro';
import React, { Component } from 'react';
import RaisedButton from '../../UI/RaisedButton';
import Text from '../../UI/Text';
import { Column, Line } from '../../UI/Grid';
import Window from '../../Utils/Window';

export default class BrowserExport extends Component {
  openWebsite = () => {
    Window.openExternalURL('http://gdevelop-app.com');
  };

  render() {
    return (
      <div style={{ height: 200 }}>
        <Column>
          <Line>
            <Text>
              <Trans>
                Export is not yet available in GDevelop online version. Instead,
                download the full GDevelop desktop version to export and publish
                your game!
              </Trans>
            </Text>
          </Line>
          <Line justifyContent="center">
            <RaisedButton
              onClick={this.openWebsite}
              primary
              label={<Trans>Download GDevelop</Trans>}
            />
          </Line>
        </Column>
      </div>
    );
  }
}
