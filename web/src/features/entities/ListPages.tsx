import { Link } from 'wouter-preact';
import { vi } from '../../i18n/vi';
import { formatCount, formatPercent, formatVnd } from '../../lib/format';
import { Loaded } from '../../lib/ui';
import { useData, useTitle } from '../../lib/useData';

export function ContractorsPage() {
  useTitle(`${vi.contractor.listTitle} · ${vi.site.name}`);
  const result = useData((ds) => ds.contractors(), 'contractors');
  return (
    <div class="container page stack-lg">
      <h1 id="ds-nha-thau">{vi.contractor.listTitle}</h1>
      <p class="muted">{vi.contractor.listIntro}</p>
      <Loaded result={result}>
        {(rows) => (
          <div class="table-wrap">
            <table aria-labelledby="ds-nha-thau">
              <thead>
                <tr>
                  <th>{vi.cols.name}</th>
                  <th>{vi.cols.tax}</th>
                  <th class="r">{vi.cols.wins}</th>
                  <th class="r">{vi.cols.value}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/contractor/${c.id}`}>{c.name}</Link>
                    </td>
                    <td class="num">{c.tax_code}</td>
                    <td class="r num">
                      {formatCount(c.wins)}/{formatCount(c.bids)}
                    </td>
                    <td class="r num">{formatVnd(c.award_value_vnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Loaded>
    </div>
  );
}

export function BuyersPage() {
  useTitle(`${vi.buyer.listTitle} · ${vi.site.name}`);
  const result = useData((ds) => Promise.all([ds.buyers(), ds.provinces()]), 'buyers');
  return (
    <div class="container page stack-lg">
      <h1 id="ds-ben-moi-thau">{vi.buyer.listTitle}</h1>
      <p class="muted">{vi.buyer.listIntro}</p>
      <Loaded result={result}>
        {([rows, provinces]) => {
          const names = new Map(provinces.map((p) => [p.id, p.name]));
          return (
            <div class="table-wrap">
              <table aria-labelledby="ds-ben-moi-thau">
                <thead>
                  <tr>
                    <th>{vi.cols.name}</th>
                    <th>{vi.cols.province}</th>
                    <th class="r">{vi.cols.tenders}</th>
                    <th class="r">{vi.cols.value}</th>
                    <th class="r">{vi.cols.docs}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link href={`/buyer/${b.id}`}>{b.name}</Link>
                      </td>
                      <td class="muted">{names.get(b.province) ?? b.province}</td>
                      <td class="r num">{formatCount(b.tenders)}</td>
                      <td class="r num">{formatVnd(b.award_value_vnd)}</td>
                      <td class="r num">{formatPercent(b.disclosure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </Loaded>
    </div>
  );
}
