'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <head>
        <title>Something went wrong!</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f9fafb',
        color: '#1f2937',
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '28rem',
          textAlign: 'center',
        }}>
          <div style={{
            margin: '0 auto 1.5rem',
            display: 'flex',
            height: '5rem',
            width: '5rem',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
          }}>
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="#dc2626"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 style={{
            marginBottom: '1rem',
            fontSize: '1.875rem',
            fontWeight: 700,
            color: '#1f2937',
          }}>
            Application Error
          </h1>

          <p style={{
            marginBottom: '1.5rem',
            color: '#6b7280',
          }}>
            We're sorry, but something went wrong with the application.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={reset}
              style={{
                width: '100%',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#2563eb',
                color: 'white',
                marginBottom: '0.75rem',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                width: '100%',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontWeight: 500,
                border: '1px solid #d1d5db',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#374151',
              }}
            >
              Go to Home
            </button>
          </div>

          {error.digest && (
            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: '#6b7280',
            }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
