import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 64px);
  margin-top: 64px;
  background-color: #000000;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
`;

const ContentWrapper = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  color: #ffffff;
  margin-bottom: 2rem;
  text-align: center;
`;

const UploadContainer = styled.div`
  width: 300px;
  height: 300px;
  border: 2px dashed #ffffff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: #808080;
    transform: scale(1.02);
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const UploadText = styled.div`
  color: #ffffff;
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 0.8rem 1.2rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  max-width: 300px;
  width: 100%;
`;

const FileName = styled.span`
  color: #ffffff;
  word-break: break-all;
  flex: 1;
  font-size: 0.9rem;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ClassifyButton = styled.button`
  background-color: #ffffff;
  color: #000000;
  border: none;
  padding: 1rem 3rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;

  &:hover {
    background-color: #808080;
    color: #ffffff;
  }
`;

const ResultModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #000000;
  padding: 2rem;
  border-radius: 10px;
  color: white;
  min-width: 400px;
  border: 1px solid #ffffff;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
`;

const ResultTitle = styled.h3`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #ffffff;
`;

const ResultList = styled.div`
  margin-bottom: 2rem;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #333;
`;

const BackButton = styled.button`
  background-color: #ffffff;
  color: #000000;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-weight: bold;
  transition: all 0.3s ease;

  &:hover {
    background-color: #808080;
    color: #ffffff;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  
  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 4px solid white;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function Classification() {
  const [file, setFile] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'audio/wav') {
      setFile(uploadedFile);
    } else {
      alert('Please upload a .wav file');
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleClassification = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    setIsClassifying(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8090/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Classification failed');
      }

      const data = await response.json();
      
      const formattedResults = {};
      data.predictions.forEach(pred => {
        formattedResults[pred.class] = `${pred.probability.toFixed(2)}%`;
      });

      setResults(formattedResults);
    } catch (error) {
      console.error('Error:', error);
      alert('Classification failed. Please try again.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setFile(null);
  };

  return (
    <Container>
      <ContentWrapper>
        <Title>Classification</Title>
        
        {!isClassifying && !results && (
          <>
            <UploadContainer onClick={() => document.getElementById('fileInput').click()}>
              <UploadIcon>☁️</UploadIcon>
              <UploadText>
                {file ? 'Change file' : 'Upload file'}
              </UploadText>
              <input
                id="fileInput"
                type="file"
                accept=".wav"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </UploadContainer>

            {file && (
              <FileInfo>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <FileName>{file.name}</FileName>
                <RemoveFileButton 
                  onClick={handleRemoveFile}
                  title="Remove file"
                >
                  ✕
                </RemoveFileButton>
              </FileInfo>
            )}

            <ClassifyButton 
              onClick={handleClassification}
              style={{ marginTop: file ? '2rem' : '0' }}
            >
              Classification
            </ClassifyButton>
          </>
        )}

        {isClassifying && (
          <LoadingSpinner>
            <div className="spinner" />
            <div>Classifying</div>
          </LoadingSpinner>
        )}

        {results && (
          <ResultModal>
            <ResultTitle>Classification result</ResultTitle>
            <ResultList>
              {Object.entries(results).map(([key, value]) => (
                <ResultItem key={key}>
                  <span>{key}:</span>
                  <span>{value}</span>
                </ResultItem>
              ))}
            </ResultList>
            <BackButton onClick={handleReset}>Back</BackButton>
          </ResultModal>
        )}
      </ContentWrapper>
    </Container>
  );
}

export default Classification;