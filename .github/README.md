# Frontend CI

## Test command in CI

Use this in workflows — **do not** use `pnpm test --watch=false` (pnpm does not accept `--watch`).

```yaml
- name: Test
  run: pnpm run test:ci
```

If you see `Unknown option: 'watch'`, edit the failing workflow on GitHub and replace the test step with the above.
