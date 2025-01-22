// src/components/Register.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Import db for Firestore
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

// Styled components
const Container = styled.div`
  background-color: #1a1b2e;
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 9999;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  
  span {
    color: #4169E1;
    font-size: 2rem;
    font-weight: bold;
    margin-left: 1rem;
  }
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  border: 2px solid #4169E1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  div {
    width: 24px;
    height: 24px;
    background-color: #4169E1;
    border-radius: 50%;
  }
`;

const FormContainer = styled.form`
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  color: #4169E1;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #4169E1;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;

  &::placeholder {
    color: rgba(65, 105, 225, 0.7);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(65, 105, 225, 0.3);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #4169E1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover {
    background-color: #3151b0;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

// Register Component
function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill in all fields');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Register user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: formData.username
      });

      // Save user data in Firestore
      await addDoc(collection(db, 'UserInfo'), {
        email: formData.email,
        username: formData.username
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Logo>
        <LogoIcon>
          <div />
        </LogoIcon>
        <span>Silence</span>
      </Logo>

      <FormContainer onSubmit={handleSubmit}>
        <Title>Sign Up</Title>

        <FormGroup>
          <Input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Input
            type="text"
            name="username"
            placeholder="Create Username"
            value={formData.username}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Register'}
        </Button>
      </FormContainer>
    </Container>
  );
}

export default Register;