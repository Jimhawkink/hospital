// src/components/ui/Toast.tsx
import React from 'react';
import './Toast.css';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => onRemove(toast.id)}
        >
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close">×</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;