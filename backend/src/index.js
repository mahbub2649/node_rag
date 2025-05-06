require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// AWS Clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Document upload endpoint
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const key = `documents/${Date.now()}-${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // TODO: Trigger Bedrock Knowledge Base sync
    // This would typically involve calling Bedrock's API to process the new document

    res.json({ 
      message: 'Document uploaded successfully',
      key: key
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

async function queryKnowledgeBase(query) {
  const { BedrockAgentRuntimeClient, RetrieveCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
  const bedrockAgentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });

  console.log('Querying Knowledge Base with:', {
    knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
    query: query
  });

  try {
    const command = new RetrieveCommand({
      knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
      retrievalQuery: {
        text: query,
        maxResults: 5  // Retrieve up to 5 relevant passages
      }
    });

    const response = await bedrockAgentClient.send(command);
    
    console.log('Raw Knowledge Base Response:', JSON.stringify(response, null, 2));

    if (!response.retrievalResults || response.retrievalResults.length === 0) {
      console.warn('No results found in Knowledge Base');
      return 'No relevant information found in the knowledge base.';
    }

    // Extract and format the context from results
    const formattedResults = response.retrievalResults.map((result, index) => {
      // Extract text from the nested content object
      const text = result.content?.text || 'No content available';
      return `[Source ${index + 1}]: ${text}`;
    }).join('\n\n');

    console.log('Formatted Knowledge Base Results:', formattedResults);
    return formattedResults;
  } catch (error) {
    console.error('Error querying Knowledge Base:', error);
    if (error.message.includes('not authorized')) {
      throw new Error('Not authorized to access Knowledge Base. Check IAM permissions.');
    }
    if (error.message.includes('NotFoundException')) {
      throw new Error('Knowledge Base not found. Check if ID is correct and Knowledge Base exists.');
    }
    throw error;
  }
}

// Modify the query endpoint to handle Knowledge Base errors
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('Processing query:', query);

    // Check if Knowledge Base ID is configured
    if (!process.env.BEDROCK_KNOWLEDGE_BASE_ID) {
      return res.status(500).json({ 
        error: 'Knowledge Base ID not configured. Check BEDROCK_KNOWLEDGE_BASE_ID in .env file.' 
      });
    }

    // Retrieve relevant context from the Knowledge Base
    let context;
    try {
      context = await queryKnowledgeBase(query);
    } catch (kbError) {
      console.error('Knowledge Base Error:', kbError);
      return res.status(500).json({ 
        error: `Knowledge Base Error: ${kbError.message}`,
        details: kbError.stack
      });
    }

    // Prepare the prompt for Bedrock, including the retrieved context
    const prompt = {
      prompt: `\n\nHuman: Based on the following context from the knowledge base:\n${context}\n\nNow, answer the following question: ${query}\n\nAssistant:`,
      max_tokens_to_sample: 500,
      temperature: 0.7,
    };

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-v2',
      body: JSON.stringify(prompt),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    res.json({ 
      message: responseBody.completion,
      sources: responseBody.sources || [],
      context: context  // Include the retrieved context in the response
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error.message 
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    res.json({
      message: 'Login successful',
      tokens: response.AuthenticationResult,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    });

    await cognitoClient.send(command);
    res.json({ message: 'Registration successful. Please check your email for verification.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 