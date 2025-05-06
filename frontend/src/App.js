import React, { useState } from 'react';
import axios from 'axios';
import { DocumentPlusIcon, CommandLineIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
      setFile(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-cyan-500/20 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="sci-fi-heading text-2xl">RAG System</h1>
          <button
            onClick={signOut}
            className="sci-fi-button"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Upload Section */}
        <section className="sci-fi-card p-6">
          <h2 className="sci-fi-heading text-xl mb-4 flex items-center gap-2">
            <DocumentPlusIcon className="w-6 h-6" />
            Upload Document
          </h2>
          <div className="flex items-center gap-4">
            <label className="sci-fi-button cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt"
              />
              Choose File
            </label>
            {file && (
              <>
                <span className="text-gray-400">{file.name}</span>
                <button
                  onClick={uploadDocument}
                  className="sci-fi-button"
                >
                  Upload
                </button>
              </>
            )}
          </div>
        </section>

        {/* Query Section */}
        <section className="sci-fi-card p-6">
          <h2 className="sci-fi-heading text-xl mb-4 flex items-center gap-2">
            <CommandLineIcon className="w-6 h-6" />
            Query Knowledge Base
          </h2>
          <form onSubmit={handleQuery} className="space-y-4">
            <div>
              <input
                type="text"
                className="sci-fi-input w-full"
                placeholder="Enter your query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="sci-fi-button w-full flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Query'
              )}
            </button>
          </form>
        </section>

        {/* Response Section */}
        {response && (
          <section className="sci-fi-card p-6">
            <h2 className="sci-fi-heading text-xl mb-4">Response</h2>
            <div className="bg-gray-800/30 rounded-lg p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap">{response}</pre>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App; 