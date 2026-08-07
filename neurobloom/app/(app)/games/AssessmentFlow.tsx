"use client";

import { useState } from 'react';
import Dashboard from "@/components/Dashboard";
import { StudentForm, StudentData } from './StudentForm';
import { TermsAndConditions } from './TermsAndConditions';
import { PermissionsScreen } from './PermissionsScreen';
import { ContinuousAssessment } from './ContinuousAssessment';
import { TestComplete } from './TestComplete';

type FlowStep = 'dashboard' | 'form' | 'terms' | 'permissions' | 'assessment' | 'complete';

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
    setCurrentStep('assessment');
  };

  const handleAssessmentComplete = () => {
    setCurrentStep('complete');
  };

  const handleReturnHome = () => {
    setCurrentStep('dashboard');
    setStudentData(null);
  };

  return (
    <>
      {currentStep === 'dashboard' && (
        <Dashboard onStartTest={handleStartTest} />
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