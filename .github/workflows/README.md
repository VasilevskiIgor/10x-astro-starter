# GitHub Actions Workflows

This directory contains CI/CD workflows for the Travel App Planner project.

## Available Workflows

### 1. Pull Request CI ([pull-request.yml](./pull-request.yml))

**Trigger:** Pull requests to `main` branch

**Purpose:** Quality checks before merging code

**Jobs:**
- **Lint Code**: ESLint validation
- **Unit Tests**: Vitest with coverage report
- **E2E Tests**: Playwright browser testing
- **Status Comment**: Posts PR comment with results

**Environment Variables:** Uses `integration` environment with Supabase and OpenAI keys for E2E tests

**Artifacts:**
- Unit test coverage (7 days retention)
- Playwright test report (7 days retention)
- E2E coverage (7 days retention)

---

### 2. Production Deployment ([master.yml](./master.yml))

**Trigger:** Push to `main` branch

**Purpose:** Deploy to Vercel production environment

**Jobs:**
- **Lint Code**: ESLint validation
- **Unit Tests**: Vitest with coverage report
- **Deploy to Vercel**: Build and deploy to production

**Environment:** `production` (requires GitHub environment setup)

**Concurrency:**
```yaml
group: production-deployment
cancel-in-progress: false
```
Only one production deployment runs at a time (no cancellation for safety).

**Deployment Process:**
1. Install Vercel CLI
2. Pull Vercel environment configuration
3. Build project with `vercel build --prod`
4. Deploy prebuilt artifacts with `vercel deploy --prebuilt --prod`
5. Post deployment status as commit comment

**Artifacts:**
- Unit test coverage (30 days retention)

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- Application secrets (OpenAI, Supabase)

---

## Workflow Comparison

| Feature | pull-request.yml | master.yml |
|---------|------------------|------------|
| **Trigger** | Pull Request to main | Push to main |
| **Lint** | ✅ | ✅ |
| **Unit Tests** | ✅ (7d retention) | ✅ (30d retention) |
| **E2E Tests** | ✅ Playwright | ❌ |
| **Deployment** | ❌ | ✅ Vercel Production |
| **Environment** | integration | production |
| **Concurrency Control** | ❌ | ✅ |
| **Comment Target** | PR comment | Commit comment |
| **Success Message** | CI checks passed | Deployment URL |
| **Failure Handling** | Test results uploaded | Failure comment posted |

---

## Setup Instructions

### For Pull Request CI

No additional setup required. Workflow runs automatically on PR creation.

**Optional:** Configure `integration` environment in GitHub:
1. Go to **Settings → Environments**
2. Create `integration` environment
3. Add integration-specific secrets if different from production

### For Production Deployment

**Required Setup:**

1. **Create production environment:**
   ```
   Settings → Environments → New environment
   Name: production
   ```

2. **Add GitHub Secrets:**
   ```
   Settings → Secrets and variables → Actions
   ```

   Required secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `OPENAI_API_KEY`
   - `OPENROUTER_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

3. **Link project with Vercel:**
   ```bash
   cd 10x-astro-starter
   vercel link
   cat .vercel/project.json  # Get orgId and projectId
   ```

4. **Generate Vercel Token:**
   - Visit [Vercel Account → Tokens](https://vercel.com/account/tokens)
   - Create token with Full Account scope
   - No expiration (for CI/CD)

**Full Instructions:** See [VERCEL_QUICKSTART.md](../../VERCEL_QUICKSTART.md)

---

## Monitoring Workflows

### View Workflow Runs

**GitHub UI:**
```
Repository → Actions → Select workflow
```

### Check Workflow Status

**Via Badge (optional):**
```markdown
![Pull Request CI](https://github.com/USERNAME/REPO/workflows/Pull%20Request%20CI/badge.svg)
![Production Deployment](https://github.com/USERNAME/REPO/workflows/Production%20Deployment/badge.svg)
```

### Debugging Failed Workflows

1. **Click on failed workflow run**
2. **Expand failed job**
3. **Review step logs**
4. **Common issues:**
   - Missing or incorrect secrets
   - Node version mismatch
   - Dependency installation failures
   - Build errors
   - Test failures

---

## Best Practices

### 1. Always Run PR CI Before Merge
Never bypass PR checks. E2E tests catch integration issues.

### 2. Monitor Production Deployments
Check commit comments for deployment URLs and status.

### 3. Use Branch Protection Rules
```
Settings → Branches → Add rule for main
✅ Require status checks before merging
✅ Require pull request reviews
✅ Require conversation resolution
```

### 4. Keep Secrets Updated
Rotate API keys regularly and update in GitHub Secrets.

### 5. Review Workflow Runs
Regularly check Actions tab for patterns in failures.

---

## Troubleshooting

### Workflow doesn't trigger

**Cause:** Branch protection or workflow file syntax error

**Solution:**
```bash
# Validate YAML syntax
yamllint .github/workflows/*.yml

# Check workflow is enabled
Repository → Actions → Enable workflows
```

### Secrets not accessible

**Cause:** Environment not configured or secrets not added

**Solution:**
1. Verify environment exists: Settings → Environments
2. Verify secrets exist: Settings → Secrets → Actions
3. Check secret names match workflow file (case-sensitive)

### Build fails on CI but works locally

**Cause:** Environment differences or missing dependencies

**Solution:**
```bash
# Check Node version matches .nvmrc
node -v

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run build
npm run build
```

### Vercel deployment fails

**Cause:** Invalid token or missing project configuration

**Solution:**
1. Regenerate `VERCEL_TOKEN`
2. Re-run `vercel link` and update `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`
3. Check Vercel Dashboard for project status

---

## Related Documentation

- [Vercel Quick Start](../../VERCEL_QUICKSTART.md)
- [Vercel Deployment Guide](../../VERCEL_DEPLOYMENT.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

## Maintenance

### Updating Workflows

1. **Test changes locally:**
   ```bash
   # Use act (GitHub Actions local runner)
   act -l  # List workflows
   act pull_request  # Run PR workflow
   ```

2. **Create PR with workflow changes**
3. **Monitor first run carefully**
4. **Update documentation if needed**

### Updating Actions Versions

Regularly update action versions for security and features:

```yaml
# Current versions (as of 2025)
- uses: actions/checkout@v5
- uses: actions/setup-node@v6
- uses: actions/upload-artifact@v5
- uses: actions/github-script@v8
```

Check for updates: [GitHub Marketplace](https://github.com/marketplace?type=actions)

---

**Last Updated:** 2025-01-03
