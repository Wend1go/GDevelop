// @flow
import * as React from 'react';
import Typography from '@material-ui/core/Typography';

type Props = {|
  children: ?React.Node,
  size?: 'body' | 'title',
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify',
  noShrink?: boolean,
  style?: {|
    // Margins
    marginLeft?: number,
    marginRight?: number,
    marginTop?: number,
    marginBottom?: number,

    // Allow to expand the text
    flex?: 1,

    // Allow to show the text inline
    display?: 'inline-block',
  |},
|};

// A Text to be displayed in the app. Prefer using this
// than a `<p>`/`<span>` or `<div>` as this will help to maintain
// consistency of text in the whole app.
export default ({ children, style, size, align, noShrink }: Props) => (
  <Typography
    variant={size === 'title' ? 'h5' : 'body1'}
    style={{
      ...style,
      flexShrink: noShrink ? 0 : undefined,
      marginTop: 6 + ((style && style.marginTop) || 0),
      marginBottom: 6 + ((style && style.marginBottom) || 0),
    }}
    align={align || 'inherit'}
  >
    {children}
  </Typography>
);
