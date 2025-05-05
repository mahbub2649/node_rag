import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: process.env.REACT_APP_AWS_REGION,
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  },
});

function App({ signOut, user }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post('http://localhost:3000/api/query', { query });
      setResponse(result.data.message);
    } catch (error) {
      console.error('Error querying:', error);
      setResponse('Error processing query');
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const uploadDocument = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post('http://localhost:3000/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RAG System
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Document
          </Typography>
          <input
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="raised-button-file">
            <Button variant="contained" component="span">
              Choose File
            </Button>
          </label>
          {file && (
            <Button
              variant="contained"
              color="primary"
              onClick={uploadDocument}
              sx={{ ml: 2 }}
            >
              Upload
            </Button>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Query Knowledge Base
          </Typography>
          <form onSubmit={handleQuery}>
            <TextField
              fullWidth
              label="Enter your query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Query'}
            </Button>
          </form>

          {response && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Response:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography>{response}</Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default withAuthenticator(App); 