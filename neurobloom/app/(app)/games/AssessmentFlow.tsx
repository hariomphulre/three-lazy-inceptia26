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
  // Start directly at the student form. The old 'dashboard' start step caused a
  // circular trap for parents (their dashboard has no start button of its own).
  const [currentStep, setCurrentStep] = useState<FlowStep>('form');
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
    // 1. Mark the linked student record as completed
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

        // 2. Trigger the Research-Aligned Screening Engine (server-side orchestration)
        //    One call — Flask internally runs Phase1 → Phase2 → Phase2.5 → Phase3
        //    Non-blocking: we fire-and-forget so the UI doesn't stall.
        //    Result will be available via GET /api/clinical_ai?sessionId=xxx
        fetch('/api/clinical_ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
          .then(async (res) => {
            if (res.ok) {
              const report = await res.json();
              // Cache the flags for TestComplete to display
              localStorage.setItem('screening_flags', JSON.stringify(
                report.flags_for_formal_assessment ?? []
              ));
              localStorage.setItem('screening_done', 'true');
            }
          })
          .catch((e) => console.warn('[AssessmentFlow] Screening AI non-fatal error:', e));
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