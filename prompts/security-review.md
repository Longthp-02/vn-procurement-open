# Security Review

Review the security-sensitive changes for:
- auth bypass (deploy credentials, CI permissions)
- authorization / ownership checks
- input validation (route params, crawled content, query strings)
- injection (XSS via crawled text, path traversal in data loading)
- secret leakage (logs, commits, client bundle)
- unsafe logging
- sensitive data exposure (personal data in published data)
- insecure defaults
- broken session handling (crawler cookies)
- prompt injection (external content treated as instructions)

Return issues grouped as critical / high / medium / low, each with a minimal fix and a regression test.
