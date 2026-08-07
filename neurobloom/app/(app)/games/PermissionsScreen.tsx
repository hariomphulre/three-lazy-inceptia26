"use client";

import { useState } from 'react';
import { motion } from "framer-motion";
import { Camera, Mic, ArrowRight, CheckCircle2, XCircle, AlertCircle, Settings2, Video, ShieldCheck, Bluetooth } from 'lucide-react';
import { useVideo } from "@/context/VideoContext";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";

interface PermissionsScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function PermissionsScreen({ onComplete, onBack }: PermissionsScreenProps) {
  const { t } = useTranslation();
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [btPermission, setBtPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [requestingBt, setRequestingBt] = useState(false);

  // ✅ NEW: MindWave Mobile toggle state
  const [mindwaveEnabled, setMindwaveEnabled] = useState(false);
  
  const { startRecording } = useVideo();

  const handleProceed = async () => {
    try {
      await startRecording();
      onComplete();
    } catch (e) {
      alert(t("ps_err_hw"));
    }
  };

  const requestCameraPermission = async () => {
    setRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (error) {
      setCameraPermission('denied');
    } finally {
      setRequestingCamera(false);
    }
  };

  const requestMicPermission = async () => {
    setRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
    } catch (error) {
      setMicPermission('denied');
    } finally {
      setRequestingMic(false);
    }
  };

  // ✅ Connect only works when toggle is ON
  const requestBluetoothPermission = () => {
    if (!mindwaveEnabled) return; // Guard: sirf tab chalega jab toggle ON ho
    setRequestingBt(true);
    setTimeout(() => {
      setBtPermission('granted');
      setRequestingBt(false);
    }, 1500);
  };

  // ✅ Toggle OFF karne par permission bhi reset ho jaayegi
  const handleMindwaveToggle = () => {
    const newState = !mindwaveEnabled;
    setMindwaveEnabled(newState);
    if (!newState) {
      setBtPermission('pending');
      setRequestingBt(false);
    }
  };

  // ✅ BT sirf tab required hai jab toggle ON ho
  const canProceed = cameraPermission === 'granted' && micPermission === 'granted' && 
    (!mindwaveEnabled || btPermission === 'granted');

  return (
    <div className="min-h-screen w-full bg-[#5C94FC] flex items-start md:items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto font-sans relative">
      {/* Background Clouds */}
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm pointer-events-none" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md pointer-events-none" />
      
      <div className="fixed bottom-0 left-0 right-0 h-20 sm:h-32 bg-[#43B047] border-t-8 border-black pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl relative z-10 pb-24 pt-4"
      >
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          
          {/* Header */}
          <div className="bg-foreground px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary border-2 border-white rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex-shrink-0">
                <Settings2 className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">{t('ps_calibration')}</h1>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black mt-1">{t('ps_readiness')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <LanguageSwitcher />
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <ShieldCheck size={18} className="text-white" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">{t('ps_secure')}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-10">
            <div className="flex items-center gap-4 px-4 sm:px-6 py-4 bg-muted border-4 border-black mb-8 sm:mb-10 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <AlertCircle size={24} className="text-primary animate-bounce flex-shrink-0" />
              <p className="text-sm text-black font-black uppercase tracking-tight">
                {t('ps_warning')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
              
              {/* Camera */}
              <div className={`p-6 sm:p-8 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                cameraPermission === 'granted' ? 'bg-[#43B047]/10' : 
                cameraPermission === 'denied' ? 'bg-primary/10' : 'bg-white'
              }`}>
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={`w-16 h-16 border-4 border-black flex items-center justify-center transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    cameraPermission === 'granted' ? 'bg-[#43B047]' : 
                    cameraPermission === 'denied' ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <Video size={28} className={cameraPermission === 'pending' ? 'text-black/40' : 'text-white'} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black uppercase italic tracking-tighter">{t('ps_optical')}</h3>
                    <p className="text-[10px] text-black/40 mt-2 font-black uppercase tracking-widest leading-relaxed">{t('ps_optical_desc')}</p>
                  </div>
                  
                  {cameraPermission === 'pending' ? (
                    <button 
                      onClick={requestCameraPermission}
                      disabled={requestingCamera}
                      className="w-full py-3 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-muted active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {requestingCamera ? t('ps_initializing') : t('ps_enable_camera')}
                    </button>
                  ) : (
                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      cameraPermission === 'granted' ? 'text-[#43B047]' : 'text-primary'
                    }`}>
                      {cameraPermission === 'granted' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      {cameraPermission === 'granted' ? t('ps_configured') : t('ps_blocked')}
                    </div>
                  )}
                </div>
              </div>

              {/* Microphone */}
              <div className={`p-6 sm:p-8 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                micPermission === 'granted' ? 'bg-[#43B047]/10' : 
                micPermission === 'denied' ? 'bg-primary/10' : 'bg-white'
              }`}>
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={`w-16 h-16 border-4 border-black flex items-center justify-center transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    micPermission === 'granted' ? 'bg-[#43B047]' : 
                    micPermission === 'denied' ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <Mic size={28} className={micPermission === 'pending' ? 'text-black/40' : 'text-white'} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black uppercase italic tracking-tighter">{t('ps_acoustic')}</h3>
                    <p className="text-[10px] text-black/40 mt-2 font-black uppercase tracking-widest leading-relaxed">{t('ps_acoustic_desc')}</p>
                  </div>

                  {micPermission === 'pending' ? (
                    <button 
                      onClick={requestMicPermission}
                      disabled={requestingMic}
                      className="w-full py-3 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-muted active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {requestingMic ? t('ps_initializing') : t('ps_enable_mic')}
                    </button>
                  ) : (
                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      micPermission === 'granted' ? 'text-[#43B047]' : 'text-primary'
                    }`}>
                      {micPermission === 'granted' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      {micPermission === 'granted' ? t('ps_configured') : t('ps_blocked')}
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Neural Link (MindWave Mobile) — with Toggle */}
              <div className={`p-6 sm:p-8 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                btPermission === 'granted' ? 'bg-[#43B047]/10' : 
                !mindwaveEnabled ? 'bg-white opacity-70' : 'bg-white'
              }`}>
                <div className="flex flex-col items-center text-center space-y-6">

                  {/* Icon */}
                  <div className={`w-16 h-16 border-4 border-black flex items-center justify-center transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    btPermission === 'granted' ? 'bg-[#43B047]' : 
                    mindwaveEnabled ? 'bg-muted' : 'bg-muted/50'
                  }`}>
                    <Bluetooth size={28} className={btPermission === 'granted' ? 'text-white' : mindwaveEnabled ? 'text-black/60' : 'text-black/20'} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-black uppercase italic tracking-tighter">{t('ps_neural')}</h3>
                    <p className="text-[10px] text-black/40 mt-2 font-black uppercase tracking-widest leading-relaxed">{t('ps_neural_desc')}</p>
                  </div>

                  {/* ✅ MindWave Toggle */}
                  <div className="w-full flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">
                      MindWave Mobile
                    </span>
                    <button
                      onClick={handleMindwaveToggle}
                      className={`relative w-14 h-7 border-2 border-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none ${
                        mindwaveEnabled ? 'bg-[#43B047]' : 'bg-black/10'
                      }`}
                      aria-label="Toggle MindWave Mobile"
                    >
                      <motion.div
                        className="absolute top-0.5 w-5 h-5 bg-white border-2 border-black"
                        animate={{ left: mindwaveEnabled ? '28px' : '2px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                      <span className={`absolute inset-0 flex items-center text-[8px] font-black uppercase tracking-widest select-none ${
                        mindwaveEnabled ? 'justify-start pl-1.5 text-white' : 'justify-end pr-1.5 text-black/40'
                      }`}>
                        {mindwaveEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  {/* Connect Button — disabled when toggle is OFF */}
                  {btPermission === 'pending' ? (
                    <button 
                      onClick={requestBluetoothPermission}
                      disabled={requestingBt || !mindwaveEnabled}
                      title={!mindwaveEnabled ? 'MindWave toggle ON karo pehle' : ''}
                      className={`w-full py-3 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all ${
                        mindwaveEnabled
                          ? 'bg-white hover:bg-muted active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer'
                          : 'bg-black/5 text-black/30 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {requestingBt ? t('ps_scanning') : t('ps_pair_device')}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#43B047]">
                      <CheckCircle2 size={18} /> {t('ps_linked')}
                    </div>
                  )}

                </div>
              </div>

            </div>

            <div className="pt-6 sm:pt-8 border-t-4 border-black">
              <Button
                size="lg"
                onClick={handleProceed}
                disabled={!canProceed}
                className="w-full py-8 sm:py-10 text-xl sm:text-2xl uppercase italic shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              >
                {canProceed ? t('ps_launch') : t('ps_hw_setup')}
                {canProceed && <ArrowRight size={28} className="ml-4" />}
              </Button>
              
              <p className="text-center text-[10px] text-black/40 mt-6 leading-relaxed font-black uppercase tracking-[0.2em]">
                {t('ps_validation')}
              </p>
            </div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-8 sm:mt-10 flex justify-center items-center gap-4 sm:gap-8 flex-wrap">
          <Step label={t('sf_step_info')} completed />
          <div className="w-8 sm:w-16 h-1 bg-black/10" />
          <Step label={t('tc_step_consent')} completed />
          <div className="w-8 sm:w-16 h-1 bg-black/10" />
          <Step label={t('ps_step_hw')} active />
        </div>
      </motion.div>
    </div>
  );
}

function Step({ label, active = false, completed = false }: { label: string, active?: boolean, completed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 border-2 border-black rotate-45 transition-all ${
        completed || active ? 'bg-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white/20'
      }`} />
      <span className={`text-xs font-black uppercase tracking-widest ${active || completed ? 'text-white' : 'text-white/40'}`}>
        {label}
      </span>
    </div>
  );
}