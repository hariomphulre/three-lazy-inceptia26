"use client";

import { useState } from 'react';
import { motion } from "framer-motion";
import { Upload, Check, Loader2 } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { saveWritingImage } from "@/lib/offline/session";

interface Level3Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  phase?: number;
}

// CSS-only spinner — no framer-motion on every frame
function ButtonSpinner() {
  return (
    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
  );
}

export function Level3WritingWizard({ onComplete, onProgress, phase = 0 }: Level3Props) {
  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      // Stored locally then uploaded to Cloudinary (immediately if online,
      // otherwise on the next sync). Works offline.
      await saveWritingImage(file);
    } catch (error) {
      console.error("Error saving image:", error);
      alert(t('game_w1_error'));
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    onProgress(1);

    setTimeout(() => {
      onComplete();
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="text-center max-w-2xl mx-auto px-4 py-8 h-full overflow-y-auto flex flex-col items-center">
      <h2 className="text-4xl font-black text-black mb-4 uppercase tracking-tight">
        {t('game_w1_title')}
      </h2>

      {/* Static emoji — infinite framer-motion loops cause layout jank */}
      <div className="text-8xl mb-6 drop-shadow-lg select-none animate-bounce">
        🍄
      </div>

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <div className="bg-muted border-2 border-black p-6 mb-6 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <p className="text-2xl text-black leading-tight font-black italic whitespace-pre-line text-left">
            {t('game_w1_text')}
          </p>
        </div>
        <p className="text-xl text-primary font-black uppercase tracking-widest">
          {t('game_w1_instr')}
        </p>
      </div>

      {!uploadedImage ? (
        <div className="relative">
          <label
            htmlFor="file-upload"
            className={`cursor-pointer inline-block ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95, y: 0 }}
              className="bg-accent border-4 border-black text-black px-12 py-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              <div className="flex items-center gap-4">
                {isUploading ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <Upload className="w-10 h-10" />
                )}
                <span className="text-2xl font-black uppercase">
                  {isUploading ? t('game_w1_btn_uploading') : t('game_w1_btn_upload')}
                </span>
              </div>
            </motion.div>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <p className="text-black/40 mt-6 text-sm font-black uppercase tracking-tighter">
            {t('game_w1_upload_hint')}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Check className="w-8 h-8 text-secondary" />
              <p className="text-xl font-black text-black uppercase">{t('game_w1_ready')}</p>
            </div>
            <div className="border-4 border-black inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={uploadedImage}
                alt="Uploaded preview"
                className="max-h-60 mx-auto"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center items-center">
            <motion.button
              whileHover={!isSubmitting ? { scale: 1.05, y: -4 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95, y: 0 } : {}}
              onClick={handleSubmit}
              disabled={isUploading || isSubmitting}
              className={`relative bg-primary border-4 border-black text-white text-3xl font-black px-16 py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none uppercase transition-opacity ${
                isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {isSubmitting ? <ButtonSpinner /> : <span>{t('game_w1_btn_submit')}</span>}
              </div>
            </motion.button>

            {!isSubmitting && (
              <>
                <label htmlFor="file-upload-replace" className="cursor-pointer">
                  <span className="text-black/40 text-sm font-black uppercase underline hover:text-black transition-colors">
                    {t('game_w1_try_again')}
                  </span>
                </label>
                <input
                  id="file-upload-replace"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}