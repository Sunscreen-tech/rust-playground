import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import AdvancedOptionsMenu from './AdvancedOptionsMenu';
import BuildMenu from './BuildMenu';
import ChannelMenu from './ChannelMenu';
import ConfigMenu from './ConfigMenu';
import HeaderButton from './HeaderButton';
import { BuildIcon, ConfigIcon, HelpIcon, MoreOptionsActiveIcon, MoreOptionsIcon } from './Icon';
import ModeMenu from './ModeMenu';
import PopButton from './PopButton';
import { SegmentedButton, SegmentedButtonSet, SegmentedLink } from './SegmentedButton';

import * as actions from './actions';
import * as selectors from './selectors';

import styles from './Header.module.css';
import ExampleMenu from './ExampleMenu';
import State from './state';

const Header: React.SFC = () => (
  <div data-test-id="header" className={styles.container}>
    <HeaderSet id="build">
      <SegmentedButtonSet>
        <ExecuteButton />
        <ExampleMenuButton />
        <BuildMenuButton />
      </SegmentedButtonSet>
    </HeaderSet>
    <HeaderSet id="channel-mode">
      <SegmentedButtonSet>
        <ModeMenuButton />
        <ChannelMenuButton />
        <AdvancedOptionsMenuButton />
      </SegmentedButtonSet>
    </HeaderSet>
    <HeaderSet id="code">
      <SegmentedButtonSet>
        <GithubButton />
      </SegmentedButtonSet>
    </HeaderSet>
    <HeaderSet id="share">
      <SegmentedButtonSet>
        <ShareButton />
      </SegmentedButtonSet>
    </HeaderSet>
    <HeaderSet id="config">
      <SegmentedButtonSet>
        <ConfigMenuButton />
      </SegmentedButtonSet>
    </HeaderSet>
    <HeaderSet id="help">
      <SegmentedButtonSet>
        <HelpButton />
      </SegmentedButtonSet>
    </HeaderSet>
  </div>
);

interface HeaderSetProps {
  id: string;
}

const HeaderSet: React.SFC<HeaderSetProps> = ({ id, children }) => (
  <div className={id == 'channel-mode' ? styles.setChannelMode : styles.set}>{children}</div>
);

const ExecuteButton: React.SFC = () => {
  const executionLabel = useSelector(selectors.getExecutionLabel);

  const dispatch = useDispatch();
  const execute = useCallback(() => dispatch(actions.performPrimaryAction()), [dispatch]);

  return (
    <SegmentedButton isBuild onClick={execute}>
      <HeaderButton bold rightIcon={<BuildIcon />}>
        {executionLabel}
      </HeaderButton>
    </SegmentedButton>
  );
};

const BuildMenuButton: React.SFC = () => {
  const Button = React.forwardRef<HTMLButtonElement, { toggle: () => void }>(({ toggle }, ref) => (
    <SegmentedButton title="Select what to build" ref={ref} onClick={toggle}>
      <HeaderButton icon={<MoreOptionsIcon />} />
    </SegmentedButton>
  ));
  Button.displayName = 'BuildMenuButton.Button';

  return <PopButton Button={Button} Menu={BuildMenu} />;
};

const ExampleMenuButton: React.SFC = () => {
  // For now just use enum key as label
  const label = useSelector((state: State) => `example - ${state.configuration.example}`);

  const Button = React.forwardRef<HTMLButtonElement, { toggle: () => void }>(({ toggle }, ref) => (
    <SegmentedButton title="Example &mdash; Choose the example code" ref={ref} onClick={toggle}>
      <HeaderButton isExpandable>{label}</HeaderButton>
    </SegmentedButton>
  ));
  Button.displayName = 'ExampleMenuButton.Button';

  return <PopButton Button={Button} Menu={ExampleMenu} />;
};

const ModeMenuButton: React.SFC = () => {
  const label = useSelector(selectors.getModeLabel);

  const Button = React.forwardRef<HTMLButtonElement, { toggle: () => void }>(({ toggle }, ref) => (
    <SegmentedButton title="Mode &mdash; Choose the optimization level" ref={ref} onClick={toggle}>
      <HeaderButton isExpandable>{label}</HeaderButton>
    </SegmentedButton>
  ));
  Button.displayName = 'ModeMenuButton.Button';

  return <PopButton Button={Button} Menu={ModeMenu} />;
};

const ChannelMenuButton: React.SFC = () => {
  const label = useSelector(selectors.getChannelLabel);

  const Button = React.forwardRef<HTMLButtonElement, { toggle: () => void }>(({ toggle }, ref) => (
    <SegmentedButton title="Channel &mdash; Choose the Rust version" ref={ref} onClick={toggle}>
      <HeaderButton isExpandable>{label}</HeaderButton>
    </SegmentedButton>
  ));
  Button.displayName = 'ChannelMenuButton.Button';

  return <PopButton Button={Button} Menu={ChannelMenu} />;
}

const AdvancedOptionsMenuButton: React.SFC = () => {
  const advancedOptionsSet = useSelector(selectors.getAdvancedOptionsSet);

  const Button = React.forwardRef<HTMLButtonElement, { toggle: () => void }>(({ toggle }, ref) => (
    <SegmentedButton title="Advanced compilation flags" ref={ref} onClick={toggle}>
      <HeaderButton icon={advancedOptionsSet ? <MoreOptionsActiveIcon /> : <MoreOptionsIcon />} />
    </SegmentedButton>
  ));
  Button.displayName = 'AdvancedOptionsMenuButton.Button';

  return <PopButton Button={Button} Menu={AdvancedOptionsMenu} />;
}

const GithubButton: React.SFC = () => {
  const onClick = () => {
    window.open("https://github.com/Sunscreen-tech/Sunscreen");
  };

  return (
    <SegmentedButton title="Visit the Sunscreen repository on Github" onClick={onClick}>
      <HeaderButton>Sunscreen repo</HeaderButton>
    </SegmentedButton>
  );
};

const ShareButton: React.SFC = () => {
  const dispatch = useDispatch();
  const gistSave = useCallback(() => dispatch(actions.performGistSave()), [dispatch]);

  return (
    <SegmentedButton title="Create shareable links to this code" onClick={gistSave}>
      <HeaderButton>Share</HeaderButton>
    </SegmentedButton>
  );
};

const ConfigMenuButton: React.SFC = () => {
  const Button = React.forwardRef<HTMLButtonElement, { toggle: () => void }>(({ toggle }, ref) => (
    <SegmentedButton title="Show the configuration options" ref={ref} onClick={toggle}>
      <HeaderButton icon={<ConfigIcon />} isExpandable>Config</HeaderButton>
    </SegmentedButton>
  ));
  Button.displayName = 'ConfigMenuButton.Button';

  return <PopButton Button={Button} Menu={ConfigMenu} />;
};

const HelpButton: React.SFC = () => (
  <SegmentedLink title="View help" action={actions.navigateToHelp}>
    <HeaderButton icon={<HelpIcon />} />
  </SegmentedLink>
);

export default Header;
