import { LogListener, LogEntry, LogLevel } from '@pnp/logging';
import { AppInsights } from 'applicationinsights-js';

export class ApplicationInsightsLogListener implements LogListener {
  /**
   * Constructor
   */
  constructor() {
    AppInsights.downloadAndSetup({ instrumentationKey: '3dcad20d-b2f7-4855-9421-cb128509c352' });
  }

  /**
   * Log
   * 
   * @param {LogEntry} entry Entry
   */
  public log(entry: LogEntry) {
    AppInsights.trackTrace(entry.message, {}, this._getAiSeverityLevel(entry));
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