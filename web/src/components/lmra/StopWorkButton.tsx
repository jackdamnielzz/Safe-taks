/**
 * StopWorkButton Component
 * Emergency stop-work button with multi-step confirmation dialog
 * W1.6: Stop-Work Authority Implementation
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  getStopWorkService, 
  getStopWorkSeverityLabel, 
  getStopWorkCategoryLabel 
} from '@/lib/stopWorkService';
import { CreateStopWorkRequest, StopWorkAlert } from '@/lib/types/lmra';
import SignaturePad from './SignaturePad';
import PhotoCapture from './PhotoCapture';

interface StopWorkButtonProps {
  lmraId: string;
  onStopWork?: (alert: StopWorkAlert) => void;
  disabled?: boolean;
  className?: string;
}

type DialogStep = 'confirm' | 'details' | 'signature' | 'success';

export function StopWorkButton({ 
  lmraId, 
  onStopWork, 
  disabled = false,
  className = '' 
}: StopWorkButtonProps) {
  // Get auth context
  const { user, userProfile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DialogStep>('confirm');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [severity, setSeverity] = useState<'moderate' | 'high' | 'critical'>('high');
  const [category, setCategory] = useState<'weather' | 'equipment' | 'personnel' | 'hazard' | 'other'>('hazard');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentStep('confirm');
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    // Reset form
    setSeverity('high');
    setCategory('hazard');
    setReason('');
    setDescription('');
    setPhotoIds([]);
    setSignature(null);
    setCurrentStep('confirm');
    setError(null);
  };

  const handleConfirm = () => {
    setCurrentStep('details');
  };

  const handleDetailsNext = () => {
    if (!reason.trim()) {
      setError('Reden is verplicht');
      return;
    }
    if (!description.trim()) {
      setError('Beschrijving is verplicht');
      return;
    }
    setError(null);
    setCurrentStep('signature');
  };

  const handleDetailsBack = () => {
    setCurrentStep('confirm');
  };

  const handleSignatureBack = () => {
    setCurrentStep('details');
  };

  const handleSubmit = async () => {
    if (!signature) {
      setError('Handtekening is verplicht');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const stopWorkService = getStopWorkService();
      
      // Get user info from auth context
      const userId = user?.uid || 'unknown-user';
      const userName = userProfile 
        ? `${userProfile.firstName} ${userProfile.lastName}`.trim() 
        : user?.email || 'Unknown User';

      const request: CreateStopWorkRequest = {
        lmraId,
        triggeredBy: userId,
        triggeredByName: userName,
        reason,
        severity,
        category,
        description,
        photoIds,
        signature: {
          signerId: userId,
          signerName: userName,
          signatureData: signature,
        },
      };

      const alert = await stopWorkService.createStopWorkAlert(request);
      
      setCurrentStep('success');
      
      if (onStopWork) {
        onStopWork(alert);
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Failed to create stop-work alert:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = (photoId: string) => {
    setPhotoIds(prev => [...prev, photoId]);
  };

  return (
    <>
      {/* Stop Work Button */}
      <button
        onClick={handleOpen}
        disabled={disabled}
        className={`stop-work-button ${className}`}
        aria-label="Stop werk"
      >
        <span className="stop-icon">🛑</span>
        <span className="stop-text">STOP WERK</span>
      </button>

      {/* Dialog */}
      {isOpen && (
        <div className="stop-work-dialog-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) {
            handleClose();
          }
        }}>
          <div className="stop-work-dialog">
            {/* Step 1: Confirm Intent */}
            {currentStep === 'confirm' && (
              <div className="dialog-content">
                <div className="dialog-header">
                  <h2 className="dialog-title">⚠️ STOP WERK BEVESTIGING</h2>
                </div>
                
                <div className="dialog-body">
                  <p className="warning-text">
                    Weet u zeker dat u het werk wilt stopzetten? Dit zal onmiddellijk 
                    supervisors waarschuwen en alle activiteiten stilleggen.
                  </p>
                  
                  <div className="warning-box">
                    <strong>Let op:</strong> Gebruik deze functie alleen bij ernstige 
                    veiligheidssituaties die onmiddellijke actie vereisen.
                  </div>
                </div>

                <div className="dialog-footer">
                  <button
                    onClick={handleClose}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="btn-danger"
                    disabled={isSubmitting}
                  >
                    Doorgaan
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Capture Details */}
            {currentStep === 'details' && (
              <div className="dialog-content">
                <div className="dialog-header">
                  <h2 className="dialog-title">🛑 STOP WERK DETAILS</h2>
                </div>

                <div className="dialog-body">
                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="severity">Ernst *</label>
                    <select
                      id="severity"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="moderate">{getStopWorkSeverityLabel('moderate')}</option>
                      <option value="high">{getStopWorkSeverityLabel('high')}</option>
                      <option value="critical">{getStopWorkSeverityLabel('critical')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Categorie *</label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="weather">{getStopWorkCategoryLabel('weather')}</option>
                      <option value="equipment">{getStopWorkCategoryLabel('equipment')}</option>
                      <option value="personnel">{getStopWorkCategoryLabel('personnel')}</option>
                      <option value="hazard">{getStopWorkCategoryLabel('hazard')}</option>
                      <option value="other">{getStopWorkCategoryLabel('other')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reason">Reden (kort) *</label>
                    <input
                      id="reason"
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Bijv: Onveilige steigers gedetecteerd"
                      className="form-input"
                      maxLength={100}
                    />
                    <small className="form-hint">{reason.length}/100 tekens</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Beschrijving (gedetailleerd) *</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beschrijf de situatie in detail..."
                      className="form-textarea"
                      rows={4}
                      maxLength={500}
                    />
                    <small className="form-hint">{description.length}/500 tekens</small>
                  </div>

                  <div className="form-group">
                    <label>Foto's (optioneel)</label>
                    <button
                      type="button"
                      onClick={() => {/* TODO: Open photo capture modal */}}
                      className="btn-secondary"
                    >
                      📷 Foto toevoegen ({photoIds.length}/3)
                    </button>
                    {photoIds.length > 0 && (
                      <small className="form-hint">{photoIds.length} foto('s) toegevoegd</small>
                    )}
                  </div>
                </div>

                <div className="dialog-footer">
                  <button
                    onClick={handleDetailsBack}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Terug
                  </button>
                  <button
                    onClick={handleDetailsNext}
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    Volgende
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Digital Signature */}
            {currentStep === 'signature' && (
              <div className="dialog-content">
                <div className="dialog-header">
                  <h2 className="dialog-title">✍️ HANDTEKENING VEREIST</h2>
                </div>

                <div className="dialog-body">
                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <p className="info-text">
                    Door te tekenen bevestigt u dat u de situatie heeft beoordeeld 
                    en heeft bepaald dat het werk moet worden stopgezet.
                  </p>

                  {!signature ? (
                    <SignaturePad
                      onSave={(signatureData) => setSignature(signatureData)}
                      onCancel={() => setCurrentStep('details')}
                      signerName={userProfile 
                        ? `${userProfile.firstName} ${userProfile.lastName}`.trim() 
                        : user?.email || 'Unknown User'}
                      role={userProfile?.role || 'field_worker'}
                    />
                  ) : (
                    <div className="signature-preview">
                      <img src={signature} alt="Signature" className="signature-image" />
                      <button
                        type="button"
                        onClick={() => setSignature(null)}
                        className="btn-secondary"
                      >
                        Opnieuw tekenen
                      </button>
                    </div>
                  )}
                </div>

                <div className="dialog-footer">
                  <button
                    onClick={handleSignatureBack}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Terug
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="btn-danger"
                    disabled={isSubmitting || !signature}
                  >
                    {isSubmitting ? 'Bezig...' : 'Stop Werk Bevestigen'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 'success' && (
              <div className="dialog-content">
                <div className="dialog-header">
                  <h2 className="dialog-title">✅ STOP WERK GEACTIVEERD</h2>
                </div>

                <div className="dialog-body">
                  <div className="success-message">
                    <div className="success-icon">✓</div>
                    <p className="success-text">
                      Stop-werk melding is succesvol aangemaakt.
                      {navigator.onLine 
                        ? ' Supervisors zijn gewaarschuwd.' 
                        : ' Melding wordt verzonden zodra u online bent.'}
                    </p>
                  </div>
                </div>

                <div className="dialog-footer">
                  <button
                    onClick={handleClose}
                    className="btn-primary"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .stop-work-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
          color: white;
          border: 2px solid #7F1D1D;
          border-radius: 0.5rem;
          font-weight: 700;
          font-size: 1.125rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
        }

        .stop-work-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4);
        }

        .stop-work-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .stop-work-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stop-icon {
          font-size: 1.5rem;
        }

        .stop-work-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .stop-work-dialog {
          background: white;
          border-radius: 0.75rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .dialog-content {
          display: flex;
          flex-direction: column;
          min-height: 400px;
        }

        .dialog-header {
          padding: 1.5rem;
          border-bottom: 2px solid #E5E7EB;
        }

        .dialog-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .dialog-body {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .dialog-footer {
          padding: 1.5rem;
          border-top: 2px solid #E5E7EB;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .warning-text {
          font-size: 1.125rem;
          line-height: 1.75;
          color: #374151;
          margin-bottom: 1.5rem;
        }

        .warning-box {
          padding: 1rem;
          background: #FEF3C7;
          border-left: 4px solid #F59E0B;
          border-radius: 0.375rem;
          color: #92400E;
        }

        .info-text {
          font-size: 1rem;
          line-height: 1.5;
          color: #6B7280;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-select,
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #D1D5DB;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-select:focus,
        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3B82F6;
        }

        .form-hint {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #6B7280;
        }

        .error-message {
          padding: 0.75rem;
          background: #FEE2E2;
          border-left: 4px solid #EF4444;
          border-radius: 0.375rem;
          color: #991B1B;
          margin-bottom: 1rem;
        }

        .success-message {
          text-align: center;
          padding: 2rem;
        }

        .success-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem;
          background: #10B981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
        }

        .success-text {
          font-size: 1.125rem;
          color: #374151;
          line-height: 1.75;
        }

        .btn-primary,
        .btn-secondary,
        .btn-danger {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3B82F6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563EB;
        }

        .btn-secondary {
          background: #E5E7EB;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #D1D5DB;
        }

        .btn-danger {
          background: #DC2626;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #991B1B;
        }

        .btn-primary:disabled,
        .btn-secondary:disabled,
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .signature-preview {
          text-align: center;
          padding: 1rem;
          border: 2px solid #D1D5DB;
          border-radius: 0.5rem;
          background: #F9FAFB;
        }

        .signature-image {
          max-width: 100%;
          height: auto;
          border: 1px solid #E5E7EB;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          background: white;
        }

        @media (max-width: 640px) {
          .stop-work-dialog {
            max-height: 100vh;
            border-radius: 0;
          }

          .dialog-footer {
            flex-direction: column-reverse;
          }

          .dialog-footer button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
