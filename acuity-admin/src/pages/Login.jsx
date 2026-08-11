import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import styled from 'styled-components';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-deep);
  position: relative;
  overflow: hidden;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-10) var(--spacing-8);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-8);
`;

const Title = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
  letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-6);
`;

const Label = styled.label`
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  color: var(--text-primary);
  background-color: var(--bg-base);
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px var(--primary-glow);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px var(--primary-glow);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(220, 38, 38, 0.1);
  color: var(--danger);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-6);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  border-left: 3px solid var(--danger);
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminData();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.access_token);
        navigate('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard className="animate-float-in">
        <Header>
          <Title>Acuity Admin</Title>
          <Subtitle>Enter your credentials to access the portal</Subtitle>
        </Header>
        
        {error && (
          <ErrorMessage className="animate-shake">
            <FiAlertCircle size={18} />
            <span>{error}</span>
          </ErrorMessage>
        )}
        
        <form onSubmit={handleLogin}>
          <FormGroup>
            <Label>Admin Password</Label>
            <InputWrapper>
              <InputIcon>
                <FiLock size={18} />
              </InputIcon>
              <Input 
                type="password" 
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </InputWrapper>
          </FormGroup>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Spinner />
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight size={18} />
              </>
            )}
          </Button>
        </form>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
