import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './styles/ConfirmationModal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning", // warning, danger, info
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="confirmation-icon danger" size={24} />;
      case 'info':
        return <AlertTriangle className="confirmation-icon info" size={24} />;
      default:
        return <AlertTriangle className="confirmation-icon warning" size={24} />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-danger';
      case 'info':
        return 'btn btn-primary';
      default:
        return 'btn btn-warning';
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-modal-content">
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-title">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          <button 
            className="confirmation-modal-close" 
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>
        
        <div className="confirmation-modal-footer">
          <button 
            className="btn btn-outline btn-sm" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`${getButtonClass()} btn-sm`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
