# Domain Context

## Business Rules (owner-approved)
- Present numbers neutrally. Never label a tender, buyer or contractor as risky, suspicious or corrupt.
- Organizations and companies only. No personal names, ID numbers or contact details of individuals.
- Every number links to its source document and states the collection date.
- Methodology for every indicator is public.
- The project is independent and must say so; source data belongs to the National E-Procurement System.

## Proposed Rules (TODO: verify — owner sign-off needed)
- Indicator definitions in `docs/data-contract.md` (single-bidder share, savings, processing time, disclosure out of 7 document types, top-5 concentration, unit cost).
- Unknown inputs are excluded from an indicator, never counted as zero.
- "Same sector" comparison uses the procurement sector field (`construction`, `goods`, …).

## Vocabulary
| English (code) | Vietnamese (UI) | Meaning |
|---|---|---|
| tender / package | gói thầu | One procurement package |
| notice (TBMT) | thông báo mời thầu | Invitation to bid; its ID identifies the tender |
| buyer / procuring entity | bên mời thầu | Organization running the procurement |
| investor | chủ đầu tư | Owner of the project (may differ from buyer) |
| contractor / bidder | nhà thầu | Company submitting a bid |
| estimate | giá gói thầu | Approved package price |
| award | giá trúng thầu | Winning price |
| bid opening minutes | biên bản mở thầu | Lists bidders and bid prices |
| selection method | hình thức lựa chọn nhà thầu | Open, limited, direct appointment, quotation… |
| tax code (MST) | mã số thuế | Company identifier used to link records |

## Decisions AI Must Not Invent
- New indicators or changes to indicator formulas
- Any wording that implies wrongdoing
- Which entities or topics to feature
- Legal interpretations of procurement law

## Open Questions
- Does muasamcong publish all bidders for every method (e.g. direct appointment)? TODO: verify via spike
- How are joint ventures (liên danh) identified — one tax code or several? TODO: verify
- Terms of use for automated collection. TODO: verify
