import { vi } from '../i18n/vi';

/** Topic name/description by id. Uses an own-property check because ids come from URLs ("constructor" etc.). */
export function topicInfo(id: string): { name: string; desc: string } {
  return Object.hasOwn(vi.topic, id) ? vi.topic[id] : { name: id, desc: '' };
}
