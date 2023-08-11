import React from 'react'

export const ErrorBoundaryFallback = ({ error, resetErrorBoundary }) => {
  // eslint-disable-next-line no-console
  console.log(error)
  return (
    <div role='alert'>
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}
