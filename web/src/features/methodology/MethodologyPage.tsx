import { vi } from '../../i18n/vi';
import { useTitle } from '../../lib/useData';

const t = vi.methodology;

export function MethodologyPage() {
  useTitle(`${t.title} · ${vi.site.name}`);
  return (
    <div class="container page stack-lg narrow">
      <h1>{t.title}</h1>
      <p>{t.intro}</p>
      <p class="card card-quiet small">{t.status}</p>
      <dl class="defs">
        {t.items.map(([name, def]) => (
          <div key={name} class="card stack-sm">
            <dt class="strong">{name}</dt>
            <dd class="muted">{def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
