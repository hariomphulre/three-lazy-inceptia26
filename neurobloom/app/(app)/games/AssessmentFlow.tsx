"use client";

import { useState } from 'react';
import LegacyDashboard from '@/components/LegacyDashboard';
import { StudentForm, StudentData } from './StudentForm';
import { TermsAndConditions } from './TermsAndConditions';
import { PermissionsScreen } from './PermissionsScreen';
import { FaceCaptureScreen } from './FaceCaptureScreen';
import { ContinuousAssessment } from './ContinuousAssessment';
import { TestComplete } from './TestComplete';

type FlowStep = 'dashboard' | 'form' | 'terms' | 'permissions' | 'face-capture' | 'assessment' | 'complete';

export function AssessmentFlow() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('dashboard');
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  const handleStartTest = () => {
    setCurrentStep('form');
  };

  const handleFormSubmit = (data: StudentData) => {
    setStudentData(data);
    setCurrentStep('terms');
  };

  const handleTermsAccept = () => {
    setCurrentStep('permissions');
  };

  const handlePermissionsComplete = () => {
    // FIX 1: Route to face-capture after permissions are granted
    setCurrentStep('face-capture');
  };

  const handleFaceCaptureComplete = () => {
    // This correctly routes to the assessment after face is captured
    setCurrentStep('assessment'); 
  };

  const handleAssessmentComplete = async () => {
    // Mark the linked student record as completed
    try {
      const sessionId = typeof window !== 'undefined'
        ? localStorage.getItem('sessionId')
        : null;
      if (sessionId) {
        await fetch('/api/session/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch (e) {
      console.warn('Could not update assessment status:', e);
    }
    
    // FIX 2: Route to complete screen when test is done
    setCurrentStep('complete');
  };

  const handleReturnHome = () => {
    setCurrentStep('dashboard');
    setStudentData(null);
  };

  return (
    <>
      {currentStep === 'dashboard' && (
        <LegacyDashboard onStartTest={handleStartTest} />
      )}

      {currentStep === 'form' && (
        <StudentForm 
          onNext={handleFormSubmit}
          onBack={() => setCurrentStep('dashboard')}
        />
      )}

      {currentStep === 'terms' && (
        <TermsAndConditions
          onAccept={handleTermsAccept}
          onBack={() => setCurrentStep('form')}
        />
      )}

      {currentStep === 'permissions' && (
        <PermissionsScreen
          onComplete={handlePermissionsComplete}
          onBack={() => setCurrentStep('terms')}
        />
      )}

      {currentStep === 'face-capture' && (
        <FaceCaptureScreen
          onComplete={handleFaceCaptureComplete}
          onBack={() => setCurrentStep('permissions')}
        />
      )}

      {currentStep === 'assessment' && studentData && (
        <ContinuousAssessment
          studentData={studentData}
          onComplete={handleAssessmentComplete}
        />
      )}

      {currentStep === 'complete' && studentData && (
        <TestComplete
          studentData={studentData}
          onReturnHome={handleReturnHome}
        />
      )}
    </>
  );
}