import React, { useState } from 'react';
import { Smartphone, Download, Share, QrCode, X, Check, Copy } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  appUrl?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  appUrl,
}) => {
  const devUrl = 'https://ais-dev-f4udp7l7hxpeoqjteeovrz-836321563806.asia-southeast1.run.app';
  const preUrl = 'https://ais-pre-f4udp7l7hxpeoqjteeovrz-836321563806.asia-southeast1.run.app';
  const effectiveUrl = appUrl || devUrl;

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [copiedDev, setCopiedDev] = useState<boolean>(false);
  const [copiedPre, setCopiedPre] = useState<boolean>(false);

  // If already running as installed standalone app on mobile, don't show install button
  if (isInstalled) {
    return null;
  }

  const handleCopy = (url: string, isDev: boolean) => {
    navigator.clipboard.writeText(url);
    if (isDev) {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2000);
    } else {
      setCopiedPre(true);
      setTimeout(() => setCopiedPre(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowModal(true);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    effectiveUrl
  )}&bgcolor=ffffff&color=0f172a&margin=10`;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold border border-amber-500/30 transition-all shadow-sm"
        title="Install WareForge on your phone or tablet"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install on Mobile</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Guided Mobile Install & QR Code Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Open & Install on Mobile</h3>
                <p className="text-xs text-slate-400">Run as a full-screen standalone mobile app</p>
              </div>
            </div>

            {/* QR Code for Instant Mobile Camera Scan */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center mb-4">
              <div className="bg-white p-2 rounded-lg shadow-md mb-2">
                <img
                  src={qrCodeUrl}
                  alt="Scan QR code with phone"
                  className="w-40 h-40 object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Scan with your phone's camera to open instantly
              </p>
            </div>

            {/* Direct Link Copy */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-semibold">1. Direct App URL (Your Account):</span>
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={devUrl}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono select-all truncate"
                  />
                  <button
                    onClick={() => handleCopy(devUrl, true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copiedDev ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedDev ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Note: In your phone browser, ensure you are signed into your Google account (<strong>NaviMumbai7@gmail.com</strong>) to access the private dev environment.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-semibold">2. Public Shareable Link (Anyone):</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={preUrl}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono select-all truncate"
                  />
                  <button
                    onClick={() => handleCopy(preUrl, false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copiedPre ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPre ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-amber-400/90 mt-1">
                  * To activate this public link: Click the <strong>"Share"</strong> or <strong>"Publish"</strong> button at the top-right of your AI Studio screen.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
