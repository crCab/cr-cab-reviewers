# Prompt for New Agent

Copy and paste the following prompt to a new agent:

---

**TASK: Complete GitHub Action Repository Setup and Push to GitHub**

I have a partially completed GitHub Action repository that needs to be finished and pushed to GitHub as a new public repository.

## Repository Location
`C:\Users\liorf\code\cr-cab-reviewers`

## What's Already Done
- Core files created: `action.yml`, `src/index.js`, `package.json`, `README.md`, `LICENSE`
- Git repository initialized

## What Needs to Be Done

### 1. Create Missing Files

**Create `.gitignore` in the repository root:**
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

**Create `.github/workflows/example.yml` (ensure `.github/workflows/` directory exists):**
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

### 2. Complete Git Operations

Execute these commands in the repository directory:
```bash
cd C:\Users\liorf\code\cr-cab-reviewers
git add .
git commit -m "Initial commit: CR Cab Reviewers GitHub Action"
```

### 3. Create Public GitHub Repository and Push

Create a new public GitHub repository named `cr-cab-reviewers` and push all files.

**Option A: Using GitHub CLI (if available):**
```bash
gh repo create cr-cab-reviewers --public --source=. --remote=origin --push
```

**Option B: Manual setup:**
1. Create repository on GitHub.com named `cr-cab-reviewers` (public, no README/gitignore/license)
2. Then run:
```bash
git remote add origin https://github.com/<username>/cr-cab-reviewers.git
git branch -M main
git push -u origin main
```

## Success Criteria
- ✅ All files exist in the repository
- ✅ Git commit completed
- ✅ Public GitHub repository `cr-cab-reviewers` created
- ✅ All code pushed to GitHub

## Important Notes
- Repository is a GitHub Action that assigns reviewers based on PR urgency
- Links to https://cr-cab.com
- Uses minimal permissions for security
- API key must never be logged

**Please complete these steps and confirm when the repository is live on GitHub.**
