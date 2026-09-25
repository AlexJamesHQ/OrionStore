import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, PlusCircle, Check, Send, Sparkles } from 'lucide-react';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({ isOpen, onClose }) => {
  const [appName, setAppName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [category, setCategory] = useState('Utility');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAppName('');
      setRepoUrl('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0f1118] border border-[#272b3a] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 sm:p-5 bg-[#141722] border-b border-[#242838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#6366f1]">
              <PlusCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Add / Request App</h3>
              <p className="text-[11px] text-[#94a3b8]">Submit an open-source Android app to OrionStore</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1e2230] text-[#94a3b8] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-black text-base text-white">Submission Received!</h4>
            <p className="text-xs text-[#94a3b8] mt-1">Thank you. The app will be indexed into Orion-Data.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-mono font-bold text-[#94a3b8] block mb-1.5 uppercase">
                App Name
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Seal Downloader"
                className="w-full bg-[#141724] border border-[#272b3a] focus:border-[#6366f1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#64748b] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-[#94a3b8] block mb-1.5 uppercase">
                GitHub Repository / APK URL
              </label>
              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full bg-[#141724] border border-[#272b3a] focus:border-[#6366f1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#64748b] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-[#94a3b8] block mb-1.5 uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#141724] border border-[#272b3a] focus:border-[#6366f1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Media">Media & Music</option>
                <option value="Social">Social</option>
                <option value="Utility">Utility & Tools</option>
                <option value="System">System & File Management</option>
                <option value="Privacy">Privacy & Security</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#6366f1] hover:bg-[#5255e0] text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#6366f1]/25 transition-all cursor-pointer mt-4"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Application</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
