# Node RAG System

A Retrieval-Augmented Generation (RAG) system built with Node.js, React, and AWS services.

## Features

- Document upload and storage using Amazon S3
- Vector-based document search using Amazon Bedrock Knowledge Base
- User authentication with Amazon Cognito
- React-based frontend for intuitive user interaction
- Express.js backend for API handling

## Prerequisites

- Node.js (v16 or higher)
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- npm or yarn package manager

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:
```env
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
project-root/
├── frontend/          # React application
├── backend/           # Node.js Express server
├── infrastructure/    # Infrastructure as Code (IaC) scripts
├── data/             # Source documents for the knowledge base
└── README.md
```

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:3001`

## Security

- All AWS credentials should be managed through environment variables
- Use AWS Secrets Manager for sensitive information
- Implement proper IAM roles and policies
- Enable encryption at rest and in transit

## License

MIT 