import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { SystemStatus } from '../../types';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus | null;
  locationName: string;
  severity: string;
  temperature: number;
  htsi: number;
  riskScore: number;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  locationName,
  severity,
  temperature,
  htsi,
  riskScore
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('public_warning');
  const [activeChannel, setActiveChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [recipient, setRecipient] = useState<string>('');
  const emailSubject = `[${severity.toUpperCase()} HEAT ADVISORY] ${locationName}`;
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const changeChannel = (channel: 'sms' | 'whatsapp' | 'email') => {
    setActiveChannel(channel);
    setRecipient('');
    setSendResult(null);
  };

  const handleClose = () => {
    setRecipient('');
    setSendResult(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch preview on parameter change
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchPreview = async () => {
      try {
        const res = await api.previewAlert({
          template_key: selectedTemplate,
          location: locationName,
          severity: severity,
          temperature: temperature,
          htsi: htsi,
          risk_score: riskScore,
          peak_time: '1:00 PM – 4:30 PM',
          wbgt: 32.2
        });
        if (!cancelled) setPreviewData(res);
      } catch (e) {
        if (!cancelled) console.error('Error fetching preview:', e);
      }
    };
    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedTemplate, locationName, severity, temperature, htsi, riskScore]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = activeChannel === 'email' 
      ? `${previewData?.email_preview?.subject}\n\n${previewData?.email_preview?.body}`
      : (activeChannel === 'whatsapp' ? previewData?.whatsapp_preview : previewData?.sms_preview);
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!isChannelConfigured()) {
      setSendResult({ success: false, status: 'unconfigured', message: 'This delivery channel is not configured.' });
      return;
    }
    if (!isRecipientValid) {
      setSendResult({
        success: false,
        status: 'invalid',
        message: activeChannel === 'email'
          ? 'Enter a valid recipient email address.'
          : 'Enter a valid phone number in international format, for example +919876543210.'
      });
      return;
    }
    if (!selectedMessage) {
      setSendResult({ success: false, status: 'error', message: 'The alert preview is not ready yet.' });
      return;
    }

    setSending(true);
    setSendResult(null);
    try {
      const res = await api.sendNotification(activeChannel, normalizedRecipient, selectedMessage, emailSubject);
      setSendResult(res);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg).filter(Boolean).join('; ')
        : detail;
      setSendResult({
        success: false,
        message: message || e?.message || 'Notification transmission failed'
      });
    } finally {
      setSending(false);
    }
  };

  const isChannelConfigured = () => {
    if (activeChannel === 'sms') return Boolean(systemStatus?.notifications?.sms?.configured);
    if (activeChannel === 'whatsapp') return Boolean(systemStatus?.notifications?.whatsapp?.configured);
    if (activeChannel === 'email') return Boolean(systemStatus?.notifications?.email?.configured);
    return false;
  };

  const normalizedRecipient = recipient.trim().replace(/[\s()-]/g, '');
  const isRecipientValid = activeChannel === 'email'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipient)
    : /^\+[1-9]\d{7,14}$/.test(normalizedRecipient);
  const selectedMessage = activeChannel === 'whatsapp'
    ? previewData?.whatsapp_preview
    : activeChannel === 'email'
      ? previewData?.email_preview?.body
      : previewData?.sms_preview;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Multi-channel emergency alert dispatcher" className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Multi-Channel Emergency Alert Dispatcher
              </h3>
              <p className="text-xs text-slate-400">
                Targeted civic warning broadcast for {locationName}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            aria-label="Close dispatcher"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Warning Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="public_warning">🚨 Public Heat Warning (Residents & Seniors)</option>
              <option value="municipal_warning">⚠️ Municipal Operational Directive (City Officials)</option>
              <option value="hospital_warning">🏥 Hospital Preparedness Alert (EMS & Wards)</option>
              <option value="outdoor_worker_warning">👷 Labor & Outdoor Worker Advisory (Occupational)</option>
              <option value="cooling_center_alert">❄️ Cooling Facility Activation Order (Shelter Staff)</option>
              <option value="extreme_emergency">⛔ Extreme Heat Emergency Broadcast (Red Alert)</option>
            </select>
          </div>

          {/* Delivery Channel Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Delivery Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => changeChannel('sms')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  activeChannel === 'sms'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Twilio SMS</span>
              </button>
              <button
                type="button"
                onClick={() => changeChannel('whatsapp')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  activeChannel === 'whatsapp'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Twilio WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => changeChannel('email')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  activeChannel === 'email'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>SMTP Email</span>
              </button>
            </div>
          </div>

          {/* Recipient Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {activeChannel === 'email' ? 'Recipient Email Address' : 'Recipient Phone Number'}
            </label>
            <input
              type={activeChannel === 'email' ? 'email' : 'tel'}
              inputMode={activeChannel === 'email' ? 'email' : 'tel'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              autoComplete={activeChannel === 'email' ? 'email' : 'tel'}
              placeholder={activeChannel === 'email' ? 'officer@gov.in' : '+91 98765 43210'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {recipient && !isRecipientValid && (
              <p className="mt-1 text-[11px] text-amber-300">
                {activeChannel === 'email' ? 'Enter a valid email address.' : 'Use an international number, such as +919876543210.'}
              </p>
            )}
          </div>

          {/* Formatted Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Live Message Preview
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {activeChannel.toUpperCase()} Output
              </span>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-line relative">
              {activeChannel === 'email' ? (
                <div>
                  <div className="pb-2 mb-2 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <strong>Subject:</strong> {previewData?.email_preview?.subject}
                  </div>
                  <div>{previewData?.email_preview?.body}</div>
                </div>
              ) : activeChannel === 'whatsapp' ? (
                previewData?.whatsapp_preview
              ) : (
                previewData?.sms_preview
              )}
            </div>
          </div>

          {/* Integration Status Notice */}
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            isChannelConfigured()
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {isChannelConfigured() ? (
                <span>
                  <strong>Provider configured</strong>: Dispatch sends a real message to the destination entered above.
                </span>
              ) : (
                <span>
                  <strong>Channel unavailable</strong>: This provider is not configured, so dispatch is disabled. Previews can still be copied.
                  {activeChannel === 'whatsapp' && ' Configure TWILIO_WHATSAPP_FROM with a WhatsApp-enabled Twilio sender.'}
                </span>
              )}
            </div>
          </div>

          {/* Send Result Message */}
          {sendResult && (
            <div className={`p-3 rounded-xl border text-xs ${
              sendResult.success
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/40 border-red-800/60 text-red-200'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {sendResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                Status: {(sendResult.status || (sendResult.success ? 'sent' : 'failed')).toUpperCase()}
              </div>
              <div className="mt-1">{sendResult.message}</div>
              {sendResult.sid && (
                <div className="font-mono text-[10px] text-slate-400 mt-1">
                  Message SID: {sendResult.sid}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Preview'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !isChannelConfigured() || !isRecipientValid || !selectedMessage}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-lg shadow-orange-950/50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching...' : 'Dispatch Alert'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
