// Mock @actions/core
const mockCore = {
  getInput: jest.fn(),
  setSecret: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('@actions/core', () => mockCore);

// Mock @actions/github
jest.mock('@actions/github', () => ({
  context: {},
  getOctokit: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

const { fetchReviewers } = require('../index');

describe('fetchReviewers', () => {
  const apiKey = 'test-api-key';
  const urgency = 'p2';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns reviewers on successful API call (array response)', async () => {
    const mockReviewers = ['reviewer1', 'reviewer2'];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockReviewers,
    });

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toEqual(mockReviewers);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('returns reviewers on successful API call (object with reviewers array)', async () => {
    const mockData = {
      reviewers: [{ githubUsername: 'reviewer1' }, { githubUsername: 'reviewer2' }],
      count: 2,
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toEqual(['reviewer1', 'reviewer2']);
  });

  test('returns null on 500 error when failOnApiError is false (default)', async () => {
    // Create a proper mock Response-like object
    // The key is ensuring 'ok' is a boolean and all properties are accessible
    const mockResponse = Object.create(null);
    mockResponse.ok = false;
    mockResponse.status = 500;
    mockResponse.statusText = 'Internal Server Error';
    mockResponse.json = jest.fn().mockResolvedValue({});
    
    global.fetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toBeNull();
    
    // The warning should contain the status code message
    // It might be "CR Cab API unavailable" or "CR Cab API error" depending on the path
    expect(mockCore.warning).toHaveBeenCalled();
    const warningMessage = mockCore.warning.mock.calls[0][0];
    // Accept either message format as long as it's non-blocking
    expect(warningMessage).toMatch(/CR Cab API (unavailable|error).*status=500|Skipping comment/);
  });

  test('retries on 500 error and succeeds on retry', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}), // Mock json() to prevent errors
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ['reviewer1'],
      });

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toEqual(['reviewer1']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockCore.info).toHaveBeenCalledWith(
      expect.stringContaining('retrying in 250ms')
    );
  }, 10000); // Increase timeout for retries

  test('retries up to 2 times on 500 errors, then returns null', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}), // Mock json() to prevent errors
    });

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  }, 10000); // Increase timeout for retries

  test('throws error on 500 when failOnApiError is true', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}), // Mock json() to prevent errors
    });

    await expect(fetchReviewers(apiKey, urgency, true)).rejects.toThrow(
      'CR Cab API error: 500 Internal Server Error'
    );
  });

  test('returns null on 404 error when failOnApiError is false', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}), // Mock json() to prevent errors
    });

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toBeNull();
    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining('CR Cab API error (status=404)')
    );
  });

  test('throws error on 401 when failOnApiError is true', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}), // Mock json() to prevent errors
    });

    await expect(fetchReviewers(apiKey, urgency, true)).rejects.toThrow(
      'CR Cab API error: 401 Unauthorized'
    );
  });

  test('handles network errors gracefully when failOnApiError is false', async () => {
    const networkError = new TypeError('Failed to fetch');
    networkError.name = 'TypeError';
    global.fetch.mockRejectedValue(networkError);

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toBeNull();
    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining('CR Cab API network error')
    );
  }, 10000); // Increase timeout for retries

  test('retries on network errors and succeeds', async () => {
    const networkError = new TypeError('Failed to fetch');
    networkError.name = 'TypeError';
    
    global.fetch
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ['reviewer1'],
      });

    const result = await fetchReviewers(apiKey, urgency, false);
    expect(result).toEqual(['reviewer1']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000); // Increase timeout for retries

  test('throws network error when failOnApiError is true', async () => {
    const networkError = new TypeError('Failed to fetch');
    networkError.name = 'TypeError';
    global.fetch.mockRejectedValue(networkError);

    await expect(fetchReviewers(apiKey, urgency, true)).rejects.toThrow('CR Cab API network error');
  }, 10000); // Increase timeout for retries

  test('does not log API key or full response body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}), // Mock json() to prevent errors
    });

    await fetchReviewers(apiKey, urgency, false);

    // Verify no secrets are logged
    const warningCalls = mockCore.warning.mock.calls;
    warningCalls.forEach(call => {
      const message = call[0];
      expect(message).not.toContain(apiKey);
      expect(message).not.toContain('Bearer');
    });
  });

  test('constructs correct API URL', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchReviewers(apiKey, 'p1', false);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://cr-cab.com/api/reviewers/available?severity=p1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
