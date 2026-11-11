/**
 * Stand-in for `react-markdown` (ESM-only, cannot be required under Jest).
 * Renders the markdown source as text inside a div, so tests can still assert on the content
 * (`screen.getByText(...)`) without rendering real markdown.
 */
const React = require('react')

function ReactMarkdown(props) {
  return React.createElement('div', { 'data-testid': 'react-markdown' }, props.children)
}

module.exports = { __esModule: true, default: ReactMarkdown, ReactMarkdown }
