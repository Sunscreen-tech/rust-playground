import React, { Fragment, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import MenuGroup from './MenuGroup';
import SelectOne from './SelectOne';

import * as actions from './actions';
import State from './state';
import { Example } from './types';

interface ExampleMenuProps {
  close: () => void;
}

const ExampleMenu: React.SFC<ExampleMenuProps> = props => {
  const example = useSelector((state: State) => state.configuration.example);
  const dispatch = useDispatch();
  const changeExample = useCallback((example) => {
    dispatch(actions.changeExample(example));
    props.close();
  }, [dispatch, props]
  );

  return (
    <Fragment>
      <MenuGroup title="Example &mdash; Choose example code to explore">
        <SelectOne
          name="Private Information Retrieval"
          currentValue={example}
          thisValue={Example.Pir}
          changeValue={changeExample}
        >
          Explore privately querying a database with our FHE compiler.
        </SelectOne>
        <SelectOne
          name="Sudoku"
          currentValue={example}
          thisValue={Example.Sudoku}
          changeValue={changeExample}
        >
          Use our ZKP compiler to prove that you have a valid Sudoku solution, without revealing the solution itself.
        </SelectOne>
      </MenuGroup>
    </Fragment>
  );
};

export default ExampleMenu;
