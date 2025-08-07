// @ts-check

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import { levelFactory } from './lib/levels-factory';

import './styles/index.css';

const MuiTheme = () => (
    <App gridColumns={6} gridRows={4} moveLimit={15} level={levelFactory(6 * 4)} />
);

ReactDOM.render(<MuiTheme />, document.getElementById('root'));
