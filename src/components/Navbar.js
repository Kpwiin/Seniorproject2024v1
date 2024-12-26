// src/components/Navbar.js
import React from 'react';
import { styled } from 'styled-components';

const Nav = styled.nav`
  background-color: #1a1b2e;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  img {
    width: 40px;
    height: 40px;
  }
  
  span {
    color: #4169E1;
    font-size: 1.5rem;
    font-weight: bold;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  a {
    color: white;
    text-decoration: none;
    &:hover {
      color: #4169E1;
    }
  }
`;

function Navbar() {
  return (
    <Nav>
      <Logo>
        <img src="/logo.png" alt="Silence Logo" />
        <span>Silence</span>
      </Logo>
      <NavLinks>
        <a href="/">Home</a>
        <a href="/complaints">Complaint</a>
        <a href="classification">Manual Classification</a>
        <a href="/settings">Setting</a>
      </NavLinks>
    </Nav>
  );
}

export default Navbar;