import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ADMIN_EMAILS } from '../config/adminConfig';
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Container = styled.div`
  background: #0A0A0A;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const RegisterCard = styled.div`
  background: rgba(22, 22, 22, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Logo = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #4169E1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 50%;
  }
`;

const BrandName = styled.h1`
  color: white;
  font-size: 24px;
  margin: 0;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4169E1;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #666;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  font-size: 20px;
`;

const RegisterButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #4169E1;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin: 24px 0 16px;
  transition: background 0.3s ease;

  &:hover {
    background: #3151b0;
  }
`;

const LoginPrompt = styled.div`
  text-align: center;
  color: #666;
  font-size: 14px;

  a {
    color: #4169E1;
    text-decoration: none;
    margin-left: 8px;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 14px;
  margin-top: 8px;
`;

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.username
      });

      const isAdmin = ADMIN_EMAILS.includes(formData.email.toLowerCase());
      
      await setDoc(doc(db, 'UserInfo', userCredential.user.uid), {
        email: formData.email,
        username: formData.username,
        role: isAdmin ? 'admin' : 'user'
      });

      navigate(isAdmin ? '/dashboard' : '/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container>
      <RegisterCard>
        <LogoContainer>
          <Logo />
          <BrandName>Soundwave</BrandName>
        </LogoContainer>

        <form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <FiMail />
            </InputIcon>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FiUser />
            </InputIcon>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FiLock />
            </InputIcon>
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <FiLock />
            </InputIcon>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </PasswordToggle>
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <RegisterButton type="submit">
            Sign up
          </RegisterButton>

          <LoginPrompt>
            Already have an account?
            <a href="/login">Sign in</a>
          </LoginPrompt>
        </form>
      </RegisterCard>
    </Container>
  );
}

export default Register;