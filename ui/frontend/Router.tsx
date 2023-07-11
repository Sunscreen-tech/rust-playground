import React from 'react';

import { createBrowserHistory as createHistory } from 'history';
import { createRouter } from './uss-router';
import UssRouter from './uss-router/Router';

import qs from 'qs';
import Route from 'route-parser';

import * as actions from './actions';

const homeRoute = new Route('/');
const helpRoute = new Route('/help');

const stateSelector = ({ page, configuration: { channel, mode, edition, example } }) => ({
  page,
  configuration: {
    channel,
    mode,
    edition,
    example
  },
});

const stateToLocation = ({ page, configuration }) => {
  switch (page) {
    case 'help': {
      return {
        pathname: '/help',
      };
    }

    default: {
      const query = {
        version: configuration.channel,
        mode: configuration.mode,
        edition: configuration.edition,
        example: configuration.example,
      };
      return {
        pathname: `/?${qs.stringify(query)}`,
      };
    }
  }
};

const locationToAction = (location, initialPageLoad: boolean) => {
  const matchedHelp = helpRoute.match(location.pathname);

  if (matchedHelp) {
    return actions.helpPageLoad();
  }

  const matched = homeRoute.match(location.pathname);

  if (matched) {
    let query = qs.parse(location.search.slice(1));
    query.initialPageLoad = initialPageLoad;
    return actions.indexPageLoad(query);
  }

  return null;
};

export default class Router extends React.Component<RouterProps> {
  private router: any;

  public constructor(props) {
    super(props);

    const history = createHistory();

    const { store, reducer } = props;

    this.router = createRouter({
      store, reducer,
      history, stateSelector, locationToAction, stateToLocation,
    });
  }

  public render() {
    return <UssRouter router={this.router}>{this.props.children}</UssRouter>;
  }
}

interface RouterProps {
  store: any;
  reducer: any;
}
