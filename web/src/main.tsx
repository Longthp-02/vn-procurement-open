import { render } from 'preact';
import { App } from './app';
import { createStaticDataSource } from './lib/data';
import './styles.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
render(<App ds={createStaticDataSource(import.meta.env.BASE_URL)} base={base} />, document.getElementById('app')!);
