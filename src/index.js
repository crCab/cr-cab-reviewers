const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Mask API key to prevent logging
    const apiKey = core.getInput('cr_cab_api_key', { required: true });
    core.setSecret(apiKey);

    const checkboxP0 = core.getInput('checkbox_p0_text') || 'P0';
    const checkboxP1 = core.getInput('checkbox_p1_text') || 'P1';
    const checkboxP2 = core.getInput('checkbox_p2_text') || 'P2';
    const seed = core.getInput('seed');

    // Get PR context
    const context = github.context;
    if (context.eventName !== 'pull_request') {
      core.setFailed('This action only works on pull_request events');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const prBody = context.payload.pull_request.body || '';
    const prAuthor = context.payload.pull_request.user.login;

    core.info(`Processing PR #${prNumber} by @${prAuthor}`);

    // Detect urgency from PR body
    const urgency = detectUrgency(prBody, checkboxP0, checkboxP1, checkboxP2);
    core.info(`Detected urgency: ${urgency}`);

    // Fetch available reviewers from CR Cab API
    const availableReviewers = await fetchReviewers(apiKey, urgency);
    if (!availableReviewers || availableReviewers.length === 0) {
      core.warning(`No reviewers available for ${urgency}`);
      return;
    }

    core.info(`Found ${availableReviewers.length} available reviewers`);

    // Filter out PR author
    const eligibleReviewers = availableReviewers.filter(
      reviewer => reviewer.toLowerCase() !== prAuthor.toLowerCase()
    );

    if (eligibleReviewers.length === 0) {
      core.warning('No eligible reviewers (all are the PR author)');
      return;
    }

    // Select random reviewer
    const selectedReviewer = selectRandomReviewer(eligibleReviewers, seed, prNumber);
    core.info(`Selected reviewer: @${selectedReviewer}`);

    // Request reviewer via GitHub API
    const token = core.getInput('token') || process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed('GitHub token is required');
      return;
    }

    const octokit = github.getOctokit(token);
    await octokit.rest.pulls.requestReviewers({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
      reviewers: [selectedReviewer],
    });

    core.info(`Successfully requested review from @${selectedReviewer}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

function detectUrgency(prBody, checkboxP0, checkboxP1, checkboxP2) {
  const lines = prBody.split('\n');
  let foundP0 = false;
  let foundP1 = false;
  let foundP2 = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Match checkbox patterns: - [x] P0, - [X] P0, * [x] P0, etc.
    if (/[-*]\s*\[[xX]\].*/.test(trimmed)) {
      const lowerLine = trimmed.toLowerCase();
      const lowerP0 = checkboxP0.toLowerCase();
      const lowerP1 = checkboxP1.toLowerCase();
      const lowerP2 = checkboxP2.toLowerCase();

      if (lowerLine.includes(lowerP0)) {
        foundP0 = true;
      } else if (lowerLine.includes(lowerP1)) {
        foundP1 = true;
      } else if (lowerLine.includes(lowerP2)) {
        foundP2 = true;
      }
    }
  }

  // Priority: P0 > P1 > P2
  if (foundP0) return 'p0';
  if (foundP1) return 'p1';
  if (foundP2) return 'p2';

  // Default to P2 if none checked
  return 'p2';
}

async function fetchReviewers(apiKey, urgency) {
  const apiUrl = `https://cr-cab.com/api/reviewers/available?severity=${urgency}`;
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CR Cab API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Support both { reviewers: [] } and [] formats
  if (Array.isArray(data)) {
    return data;
  }
  if (data.reviewers && Array.isArray(data.reviewers)) {
    return data.reviewers;
  }

  throw new Error('Invalid API response format');
}

function selectRandomReviewer(reviewers, seed, prNumber) {
  if (reviewers.length === 0) {
    throw new Error('No reviewers provided');
  }
  if (reviewers.length === 1) {
    return reviewers[0];
  }

  // Use seed if provided, otherwise use PR number for stable randomness
  const randomSeed = seed ? parseInt(seed, 10) : prNumber;
  
  // Simple seeded random (not cryptographically secure, but stable per PR)
  let hash = 0;
  const seedStr = String(randomSeed);
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % reviewers.length;
  return reviewers[index];
}

run();
