export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Finance Tracker API</h1>
      <p>Backend API is running!</p>
      <ul>
        <li><a href="/api/health">Health Check</a></li>
      </ul>
      <p style={{ marginTop: '2rem', color: '#666' }}>
        See <a href="https://github.com/yourusername/finance-tracker">documentation</a> for API endpoints.
      </p>
    </div>
  );
}
