// Error handling utility for FarmBot application
// Provides centralized error logging and handling

export interface ErrorContext {
    component?: string;
    operation?: string;
    userId?: string;
    metadata?: Record<string, any>;
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    
    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * Handle API errors with context
     */
    public handleAPIError(error: any, context: ErrorContext): void {
        const errorMessage = this.formatErrorMessage('API_ERROR', error, context);
        console.error(errorMessage);
        
        // In production, you might want to send this to an error tracking service
        if (process.env.NODE_ENV === 'production') {
            this.sendToErrorTracking(errorMessage, error, context);
        }
    }

    /**
     * Handle network errors
     */
    public handleNetworkError(error: any, context: ErrorContext): void {
        const errorMessage = this.formatErrorMessage('NETWORK_ERROR', error, context);
        console.error(errorMessage);
        
        if (process.env.NODE_ENV === 'production') {
            this.sendToErrorTracking(errorMessage, error, context);
        }
    }

    /**
     * Handle general application errors
     */
    public handleGeneralError(error: any, context: ErrorContext): void {
        const errorMessage = this.formatErrorMessage('GENERAL_ERROR', error, context);
        console.error(errorMessage);
        
        if (process.env.NODE_ENV === 'production') {
            this.sendToErrorTracking(errorMessage, error, context);
        }
    }

    /**
     * Log warning messages
     */
    public logWarning(message: string, context?: ErrorContext): void {
        const warningMessage = this.formatMessage('WARNING', message, context);
        console.warn(warningMessage);
    }

    /**
     * Log info messages
     */
    public logInfo(message: string, context?: ErrorContext): void {
        const infoMessage = this.formatMessage('INFO', message, context);
        console.log(infoMessage);
    }

    private formatErrorMessage(type: string, error: any, context: ErrorContext): string {
        const timestamp = new Date().toISOString();
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        
        return `[${timestamp}] ${type}: ${errorMsg} | Context: ${JSON.stringify(context)}`;
    }

    private formatMessage(type: string, message: string, context?: ErrorContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
        
        return `[${timestamp}] ${type}: ${message}${contextStr}`;
    }

    private sendToErrorTracking(message: string, error: any, context: ErrorContext): void {
        // Implement error tracking service integration here
        // For example: Sentry, LogRocket, or custom analytics
        console.log('ERROR_TRACKING: Would send to error service -', message);
    }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();