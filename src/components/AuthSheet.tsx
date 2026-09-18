import React, { useState } from "react";
import { UserProfile } from "../types";
import { signInWithGoogle, parseAuthError } from "../utils/auth";
import { X, AlertCircle } from "lucide-react";

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  title?: string;
}

export function AuthSheet({
  isOpen,
  onClose,
  onSuccess,
  title = "Sign in",
}: AuthSheetProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const userProfile = await signInWithGoogle();
      setLoading(false);
      onSuccess(userProfile);
    } catch (err: any) {
      console.error("Firebase Google Auth error:", err);
      const parsed = parseAuthError(err);
      setErrorMessage(parsed.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click backdrop to dismiss */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-[420px] bg-[#FDFBF7] rounded-t-[32px] sm:rounded-b-[24px] p-6 pb-10 sm:pb-8 sm:mb-6 shadow-2xl border-t sm:border border-[#EBE3D5] animate-in slide-in-from-bottom duration-300 z-10"
        role="dialog"
        aria-modal="true"
      >
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-[#DED6C7] rounded-full mx-auto mb-5" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="auth-sheet-title" className="text-[24px] font-serif font-bold text-[#1A1A1A] leading-tight">
              {title}
            </h3>
          </div>
          <button
            id="auth-sheet-close-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 -mr-2 -mt-1 rounded-full flex items-center justify-center text-[#8C857D] hover:text-[#1A1A1A] hover:bg-[#F3EFE7] active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2 space-y-4">
          {/* Inline Error Notice */}
          {errorMessage && (
            <div
              id="auth-error-banner"
              className="p-3.5 bg-[#FEF2F2] border border-[#F87171]/40 rounded-[14px] flex items-start gap-2.5 text-[#B91C1C] text-[13px] leading-snug animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Continue with Google button */}
          <button
            id="auth-google-btn"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full h-[54px] px-4 rounded-[16px] bg-white border border-[#EBE3D5] hover:border-[#D1654B]/40 hover:bg-[#FAF0ED]/30 text-[#1A1A1A] font-bold text-[15px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#D1654B] border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Local testing option */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EBE3D5]"></div>
            <span className="flex-shrink mx-3 text-[12px] text-[#8C857D] font-medium">or local testing</span>
            <div className="flex-grow border-t border-[#EBE3D5]"></div>
          </div>

          <button
            id="auth-local-btn"
            type="button"
            onClick={() => {
              onSuccess({
                id: "local-user",
                name: "Local User",
                email: "local@kyabanau.app",
                avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Local+User&backgroundColor=D1654B&textColor=ffffff",
              });
            }}
            className="w-full h-[46px] px-4 rounded-[16px] bg-[#FAF0ED] hover:bg-[#F5E5E0] text-[#D1654B] font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            Continue as Local User
          </button>
        </div>
      </div>
    </div>
  );
}
