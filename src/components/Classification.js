// src/components/Classification.js
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background-color: #1a1b2e;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
`;

const Title = styled.h2`
  color: #4169E1;
  margin-bottom: 2rem;
`;

const UploadContainer = styled.div`
  width: 200px;
  height: 200px;
  border: 2px dashed #4169E1;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 2rem;

  &:hover {
    border-color: #6c8cff;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const UploadText = styled.div`
  color: #8892b0;
`;

const ClassifyButton = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;

  &:hover {
    background-color: #3558c0;
  }
`;

const ResultModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  color: black;
  min-width: 300px;
`;

const ResultTitle = styled.h3`
  text-align: center;
  margin-bottom: 1rem;
`;

const ResultList = styled.div`
  margin-bottom: 1.5rem;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const BackButton = styled.button`
  background-color: #4169E1;
  color: white;
  border: none;
  padding: 0.5rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
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

  const handleClassification = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    setIsClassifying(true);
    
    // Simulate API call
    setTimeout(() => {
      setResults({
        'Engine': '0.00%',
        'Car Horn': '0.00%',
        'Chainsaw': '0.10%',
        'Drilling': '0.00%',
        'Handsaw': '0.00%',
        'Jackhammer': '99.90%',
        'Street Music': '0.00%',
        'Others': '0.00%'
      });
      setIsClassifying(false);
    }, 2000);
  };

  const handleReset = () => {
    setResults(null);
    setFile(null);
  };

  return (
    <Container>
      <Title>Classification</Title>
      
      {!isClassifying && !results && (
        <>
          <UploadContainer onClick={() => document.getElementById('fileInput').click()}>
            <UploadIcon>☁️</UploadIcon>
            <UploadText>Upload file</UploadText>
            <input
              id="fileInput"
              type="file"
              accept=".wav"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </UploadContainer>
          <ClassifyButton onClick={handleClassification}>
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
    </Container>
  );
}

export default Classification;