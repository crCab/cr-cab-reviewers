# CR Cab Reviewers Action - Setup Status

## Completed Work

### Files Created ✅
- `action.yml` - Action definition with inputs (cr_cab_api_key, checkbox texts, seed)
- `src/index.js` - Main action logic (PR body parsing, API calls, reviewer selection)
- `package.json` - Dependencies (@actions/core, @actions/github) and scripts
- `README.md` - Comprehensive documentation with usage examples
- `LICENSE` - MIT License
- Git repository initialized (`.git` directory exists)

### Files Still Needed ❌
- `.gitignore` - Git ignore patterns
- `.github/workflows/example.yml` - Sample workflow file

## Required Changes

### 1. Create Missing Files

#### `.gitignore`
```
node_modules/
.DS_Store
*.log
.env
.idea/
.vscode/
*.swp
*.swo
*~
```

#### `.github/workflows/example.yml`
```yaml
name: Assign Reviewer

on:
  pull_request:
    types: [opened, ready_for_review]

permissions:
  pull-requests: write
  contents: read

jobs:
  assign-reviewer:
    runs-on: ubuntu-latest
    steps:
      - name: Assign reviewer from CR Cab
        uses: ./
        with:
          cr_cab_api_key: ${{ secrets.CR_CAB_API_KEY }}
```

### 2. Git Operations
```bash
cd C:\Users\liorf\code\cr-cab-reviewers
git add .
git commit -m "Initial commit: CR Cab Reviewers GitHub Action"
```

### 3. Create GitHub Repository
- Repository name: `cr-cab-reviewers`
- Description: "GitHub Action to automatically assign reviewers based on PR urgency via CR Cab API"
- Visibility: Public
- Initialize: No README, .gitignore, or license (we already have them)

### 4. Push to GitHub
```bash
gh repo create cr-cab-reviewers --public --source=. --remote=origin --push
```
OR manually:
```bash
git remote add origin https://github.com/<username>/cr-cab-reviewers.git
git branch -M main
git push -u origin main
```

## Action Specifications

### Purpose
When a PR is opened or marked ready for review:
1. Detects PR urgency (P0/P1/P2) from checkboxes in PR body
2. Calls CR Cab API: `GET https://cr-cab.com/api/reviewers/available?severity={p0|p1|p2}`
3. Selects one random reviewer (excluding PR author)
4. Assigns reviewer via GitHub API

### Inputs
- `cr_cab_api_key` (required): API key for CR Cab service
- `checkbox_p0_text` (optional, default: "P0"): Text to match for P0 checkbox
- `checkbox_p1_text` (optional, default: "P1"): Text to match for P1 checkbox
- `checkbox_p2_text` (optional, default: "P2"): Text to match for P2 checkbox
- `seed` (optional): Seed for stable randomness per PR

### Security
- API key masked with `core.setSecret()`
- Minimal permissions: `pull-requests: write`, `contents: read`
- Never logs API key

## File Locations
- Repository: `C:\Users\liorf\code\cr-cab-reviewers`
- Main action: `src/index.js`
- Action definition: `action.yml`
- Documentation: `README.md`
