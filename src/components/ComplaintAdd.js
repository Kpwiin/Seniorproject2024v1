import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #4169E1;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  max-width: 800px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: white;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background-color: white;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  height: 10rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

const Button = styled.button`
  background-color: #4169E1;
  color: white;
  padding: 0.5rem 2rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #3151b0;
  }
`;

function ComplaintAdd() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const [complaint, setComplaint] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically submit the data to your backend
    console.log({ topic, location, complaint });
    navigate('/complaints');
  };

  return (
    <Container>
      <Title>Add complaint</Title>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Topic</Label>
          <Input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Type your topic here"
          />
        </FormGroup>

        <FormGroup>
          <Label>Location</Label>
          <Select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Pick a location</option>
            <option value="ICT Mahidol">ICT Mahidol</option>
            <option value="7-11">7-11</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Complaint</Label>
          <TextArea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Type your complaint here"
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="button" onClick={() => navigate('/complaints')}>
            Back
          </Button>
          <Button type="submit">
            Publish
          </Button>
        </ButtonGroup>
      </Form>
    </Container>
  );
}

export default ComplaintAdd;