import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Container = styled.div`
  background: #0A0A0A;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Logo = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, #4169E1, #6495ED);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const BrandName = styled.h1`
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.5px;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6495ED;
  font-size: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4169E1;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 0 4px rgba(65, 105, 225, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6495ED;
  cursor: pointer;
  padding: 0;
  font-size: 20px;
  transition: color 0.3s ease;

  &:hover {
    color: #4169E1;
  }
`;

const ForgotPassword = styled.a`
  display: block;
  color: #6495ED;
  text-decoration: none;
  font-size: 14px;
  text-align: right;
  margin: -12px 0 32px;
  transition: color 0.3s ease;

  &:hover {
    color: #4169E1;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(45deg, #4169E1, #6495ED);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(65, 105, 225, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const RegisterPrompt = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;

  a {
    color: #6495ED;
    text-decoration: none;
    font-weight: 500;
    margin-left: 8px;
    transition: color 0.3s ease;

    &:hover {
      color: #4169E1;
    }
  }
`;

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const userDoc = await getDoc(doc(db, 'UserInfo', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  return (
    <Container>
      <LoginCard>
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
              type="text"
              name="email"
              placeholder="Email or username"
              value={formData.email}
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

          <ForgotPassword href="/forgot-password">
            Forgot password?
          </ForgotPassword>

          <LoginButton type="submit">
            Sign in
          </LoginButton>

          <RegisterPrompt>
            Don't have an account?
            <a href="/register">Sign up</a>
          </RegisterPrompt>
        </form>
      </LoginCard>
    </Container>
  );
}

export default Login;