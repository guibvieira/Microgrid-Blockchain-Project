import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from '../routes';

export default () => {
  return (
    <Menu style={{ marginTop: '10px' }}>
      <Menu.Item position="left">
      <Link route="/">
        <a className="item">Microgrid</a>
      </Link>
      </Menu.Item>

      <Menu.Item position="right">
        <Link route="/">
          <a className="item">Households</a>
        </Link>

        <Link route="/households/household">
          <a className="item">+</a>
        </Link>
      </Menu.Item>
    </Menu>
  );
};