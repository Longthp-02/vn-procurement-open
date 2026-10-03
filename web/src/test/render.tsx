import { render } from '@testing-library/preact';
import { memoryLocation } from 'wouter-preact/memory-location';
import { App } from '../app';
import type { DataSource } from '../lib/data';
import { fakeDataSource } from './fixtures';

/** Render the whole app at a URL with an in-memory router (its search hook is inherited) and a fake DataSource. */
export function renderAt(path: string, ds: DataSource = fakeDataSource()) {
  const location = memoryLocation({ path, record: true });
  const utils = render(<App ds={ds} hook={location.hook} />);
  return { ...utils, location };
}
