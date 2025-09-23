import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Toast from './Toast';

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
};

export default Layout;