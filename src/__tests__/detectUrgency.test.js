// Mock @actions/core to avoid requiring it in tests
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setSecret: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}));

// Mock @actions/github
jest.mock('@actions/github', () => ({
  context: {},
  getOctokit: jest.fn(),
}));

const { detectUrgency } = require('../index');

describe('detectUrgency', () => {
  // We need to access the function - let's create a helper
  // Since the function isn't exported, we'll test it via a wrapper
  // or refactor the code to export it. For now, let's test the logic.

  test('returns p1 when no urgency is detected (default to normal priority)', () => {
    const prBody = 'This is a PR with no urgency checkboxes';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p1');
  });

  test('returns p0 when P0 checkbox is checked', () => {
    const prBody = '- [x] P0\n\nSome description';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p0');
  });

  test('returns p1 when P1 checkbox is checked', () => {
    const prBody = '- [x] P1\n\nSome description';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p1');
  });

  test('returns p2 when P2 checkbox is checked', () => {
    const prBody = '- [x] P2\n\nSome description';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p2');
  });

  test('returns p0 when multiple checkboxes are checked (highest priority)', () => {
    const prBody = '- [x] P0\n- [x] P1\n- [x] P2';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p0');
  });

  test('returns p1 when P1 and P2 are checked', () => {
    const prBody = '- [x] P1\n- [x] P2';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p1');
  });

  test('handles uppercase checkbox markers', () => {
    const prBody = '- [X] P0';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p0');
  });

  test('handles asterisk markers', () => {
    const prBody = '* [x] P1';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p1');
  });

  test('handles custom checkbox text', () => {
    const prBody = '- [x] URGENT';
    const result = detectUrgency(prBody, 'URGENT', 'NORMAL', 'LOW');
    expect(result).toBe('p0');
  });

  test('case insensitive matching', () => {
    const prBody = '- [x] p0';
    const result = detectUrgency(prBody, 'P0', 'P1', 'P2');
    expect(result).toBe('p0');
  });
});
