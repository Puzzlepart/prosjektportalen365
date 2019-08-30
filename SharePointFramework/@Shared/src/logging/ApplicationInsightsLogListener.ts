import { LogListener, LogEntry, LogLevel } from '@pnp/logging';
import { AppInsights } from 'applicationinsights-js';
import { PageContext } from '@microsoft/sp-page-context';

export class ApplicationInsightsLogListener implements LogListener {
  /**
   * Constructor
   * 
   * @param {PageContext} pageContext Page context
   */
  constructor(public pageContext: PageContext) {
    // AppInsights.downloadAndSetup({ instrumentationKey: null });
    // AppInsights.trackPageView();
  }

  /**
   * Log an entry
   * 
   * @param {LogEntry} _entry Entry
   */
  public log(_entry: LogEntry) {
    // AppInsights.trackTrace(entry.message, {}, this._getAiSeverityLevel(entry));
  }

  /**
   * Get AI severity level
   * 
   * @param {LogEntry} entry Entry
   */
  private _getAiSeverityLevel(entry: LogEntry): AI.SeverityLevel {
    switch (entry.level) {
      case LogLevel.Error: return 3;
      case LogLevel.Info: return 1;
      case LogLevel.Verbose: return 0;
      case LogLevel.Warning: return 2;
      default: return 0;
    }
  }
}