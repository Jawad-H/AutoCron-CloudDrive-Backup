# AutoCron-CloudDrive-Backup

AutoCron CloudDrive Backup is a robust, automated backup solution that securely transfers local files to Google Drive on a scheduled basis. This Node.js application utilizes cron-like scheduling to perform daily backups of specified directories and weekly backups of KeyCloak data.

## Key Features:

- Automated daily backups of specified local directories to Google Drive
- Weekly backups of KeyCloak data
- Secure authentication with Google Drive API
- Configurable backup schedules using node-schedule
- Express server with health check endpoint for easy monitoring
- Environment variable configuration for enhanced security and flexibility

## Technology Stack:

- Node.js
- Express.js
- Google Drive API
- node-schedule for cron-like job scheduling
- dotenv for environment variable management

## Usage:

This application is designed to run as a background service, automatically performing backups at scheduled times. It requires proper configuration of Google Drive API credentials and specification of local directories to backup.

## Setup:

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up a `.env` file with necessary credentials and configurations
4. Run the application with `node app.js`

For detailed setup instructions and configuration options, please refer to the documentation.
