# CR Cab Reviewers

A GitHub Action that automatically assigns reviewers to pull requests based on urgency (P0/P1/P2) detected from PR checkboxes. The action fetches available reviewers from the [CR Cab](https://cr-cab.com) API and randomly selects one, excluding the PR author.

## What is CR Cab?

CR Cab is a lightweight tool that makes code review assignment faster and less painful. Engineers set their review availability using Slack slash commands, and this GitHub Action automatically assigns reviewers based on current availability and PR urgency.

Visit [https://cr-cab.com](https://cr-cab.com) to learn more.

## Usage

### Basic Example

Add this workflow to your repository at `.github/workflows/assign-reviewer.yml`:

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
        uses: cr-cab-reviewers/action@v1
        with:
          cr_cab_api_key: ${{ secrets.CR_CAB_API_KEY }}
```

### Required Setup

1. **Get your CR Cab API key** from [https://cr-cab.com](https://cr-cab.com)
2. **Add the API key as a secret** in your repository:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CR_CAB_API_KEY`
   - Value: Your CR Cab API key

### PR Template Setup

For the action to detect urgency, add checkboxes to your PR template. Create or update `.github/pull_request_template.md`:

```markdown
## Urgency

Please select the urgency level for this PR:

- [ ] P0 (Urgent - needs immediate review)
- [ ] P1 (Normal priority)
- [ ] P2 (Low priority - can wait)

## Description

...
```

The action will:
- Detect the checked urgency checkbox
- If multiple are checked, use the highest priority (P0 > P1 > P2)
- If none are checked, default to P2

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `cr_cab_api_key` | Yes | - | API key for CR Cab service |
| `checkbox_p0_text` | No | `P0` | Text to match for P0 urgency checkbox |
| `checkbox_p1_text` | No | `P1` | Text to match for P1 urgency checkbox |
| `checkbox_p2_text` | No | `P2` | Text to match for P2 urgency checkbox |
| `seed` | No | - | Optional seed for stable randomness per PR |

## Permissions

This action requires minimal permissions:

```yaml
permissions:
  pull-requests: write  # To request reviewers
  contents: read        # To read PR body
```

**Security Note:** The action only requests the minimum permissions needed. It never requests broad permissions like `write-all`.

## How It Works

1. **PR Event Triggered**: When a PR is opened or marked ready for review
2. **Urgency Detection**: Parses PR body for checked urgency checkboxes (P0/P1/P2)
3. **API Call**: Fetches available reviewers from CR Cab API for the detected urgency
4. **Reviewer Selection**: Randomly selects one reviewer (excluding PR author)
5. **Assignment**: Requests review via GitHub API

## Security

- **API Key**: Stored in GitHub Secrets, never logged or exposed
- **Minimal Permissions**: Only requests `pull-requests: write` permission
- **No Secrets in Logs**: API key is masked using `core.setSecret()`

## Customization

### Custom Checkbox Text

If your PR template uses different text for urgency levels:

```yaml
- name: Assign reviewer
  uses: cr-cab-reviewers/action@v1
  with:
    cr_cab_api_key: ${{ secrets.CR_CAB_API_KEY }}
    checkbox_p0_text: "URGENT"
    checkbox_p1_text: "NORMAL"
    checkbox_p2_text: "LOW"
```

### Stable Randomness

For deterministic reviewer selection (useful for testing), provide a seed:

```yaml
- name: Assign reviewer
  uses: cr-cab-reviewers/action@v1
  with:
    cr_cab_api_key: ${{ secrets.CR_CAB_API_KEY }}
    seed: "my-stable-seed"
```

## Troubleshooting

### No reviewers assigned

- Check that your PR body contains a checked urgency checkbox (e.g., `- [x] P0`)
- Verify your CR Cab API key is correct and has access
- Ensure there are reviewers available in CR Cab for the detected urgency level
- Check workflow logs for error messages

### API errors

- Verify your API key is valid and not expired
- Check that the CR Cab service is available
- Review the workflow logs for specific error messages

## Development

### Building

This action uses [@vercel/ncc](https://github.com/vercel/ncc) to bundle the code and dependencies into a single file for distribution.

After making changes to `src/index.js`:

1. Install dependencies: `npm install`
2. Build the bundled output: `npm run build`
3. Commit the updated `dist/index.js` file

The `dist/` directory must be committed to the repository so that GitHub Actions can run the action without installing dependencies. A CI workflow verifies that `dist/` is up to date on pull requests.

## License

MIT

## Support

Visit [https://cr-cab.com](https://cr-cab.com) for support and documentation.
