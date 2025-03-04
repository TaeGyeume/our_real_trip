import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {ReviewProvider} from './contexts/ReviewContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ReviewProvider>
    <App />
  </ReviewProvider>
);
// CI/CD테스트
