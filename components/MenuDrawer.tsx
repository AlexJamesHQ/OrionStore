import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, HelpCircle, ChevronDown, ChevronUp, BookOpen, ShieldCheck, CheckCircle2, Code2, Award, Zap } from 'lucide-react';
import { GitHubUserProfile } from '../types';
import { GitHubIcon, TelegramIcon, FacebookIcon, InstagramIcon, StarIcon } from './Icons';
import { TextType } from './TextType';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GitHubUserProfile;
  onSwitchUser: (username: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];
  sortBy: 'updated' | 'stars' | 'name';
  onSelectSortBy: (sort: 'updated' | 'stars' | 'name') => void;
  totalStarredCount?: number;
  onReloadApps?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const developerProfile = currentUser;

  const faqs = [
    {
      question: 'What is OrionStore?',
      answer: 'OrionStore is an open-source decentralized directory for discovering, syncing, and downloading Android APKs directly from official GitHub releases.'
    },
    {
      question: 'How are apps updated?',
      answer: 'Apps are continuously synced with GitHub repositories. Clicking the SYNC button in the search bar instantly fetches the latest releases, patch notes, and package builds from Official Orion Repositories.'
    },
    {
      question: 'Is it safe to use?',
      answer: 'Yes, 100%! All indexed packages are strictly open-source, compiled from public GitHub repositories, and checked for security before listing.'
    },
    {
      question: 'How do I download an APK?',
      answer: 'Click the "GET APK" button on any app card or inside the detail modal. It triggers a direct package download from official GitHub release mirrors.'
    },
    {
      question: 'How do I save my favorite apps?',
      answer: 'Tap the heart icon on any app card. Bookmarked apps are saved instantly to your local browser storage for easy one-click access.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#FAF6EE] h-full border-l-[3.5px] border-black shadow-[-8px_0px_0px_#000] p-5 sm:p-6 overflow-y-auto brutal-scroll z-10 flex flex-col justify-between transform transition-transform duration-300 ease-out">
        {/* Top Section */}
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#FFE600] border-2 border-black inline-block" />
              <h3 className="font-black text-lg tracking-tight text-black uppercase">
                Guide & Settings
              </h3>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center cursor-pointer transition-all"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Premium Neobrutalist Developer Card */}
          <div className="bg-white border-[2.5px] border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_#000] relative">
            {/* Top Accent Header Bar */}
            <div className="bg-[#FFE600] border-b-2 border-black px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase text-black">
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>Lead Developer</span>
              </div>
              <span className="text-[10px] font-mono font-extrabold bg-black text-[#FFE600] px-2 py-0.5 rounded-md border border-black uppercase shadow-[1px_1px_0px_#000]">
                VERIFIED DEV
              </span>
            </div>

            {/* Profile Content */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <img
                  src={developerProfile.avatar_url}
                  alt={developerProfile.login}
                  className="w-14 h-14 rounded-2xl border-2 border-black object-cover shadow-[2px_2px_0px_#000]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Alex+James&background=FFE600&color=000&bold=true`;
                  }}
                />

                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-lg text-black tracking-tight truncate leading-tight">
                    Alex James
                  </h4>
                  <p className="font-mono text-xs font-bold text-neutral-600 truncate mt-0.5">
                    @AlexJamesHQ
                  </p>
                  <p className="font-mono text-[11px] font-extrabold text-[#6B21A8] flex items-center gap-1 mt-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lead Developer & Architect</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Guide: How to Use OrionStore */}
          <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000]">
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-4 h-4 text-[#FF5E00]" />
              <h4 className="font-black text-xs uppercase tracking-wider text-black">
                How to Use OrionStore
              </h4>
            </div>
            <ul className="space-y-2 font-mono text-xs text-neutral-800 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="font-black text-[#6B21A8]">1.</span>
                <span><strong>Search & Filter:</strong> Use the search bar or category chips to find modded apps and utilities.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-black text-[#6B21A8]">2.</span>
                <span><strong>Download APK:</strong> Click <strong>GET APK</strong> to trigger instant downloads directly from official GitHub releases.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-black text-[#6B21A8]">3.</span>
                <span><strong>Live Sync:</strong> Tap the <strong>SYNC</strong> button inside the search bar to fetch fresh app releases in real time.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-black text-[#6B21A8]">4.</span>
                <span><strong>Bookmark:</strong> Click the heart icon to save favorite apps locally for quick access.</span>
              </li>
            </ul>
          </div>

          {/* Frequently Asked Questions (FAQs) */}
          <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000]">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <h4 className="font-black text-xs uppercase tracking-wider text-black">
                Frequently Asked Questions (FAQs)
              </h4>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border-2 border-black rounded-xl overflow-hidden bg-[#FAF6EE]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-2.5 text-left font-mono text-xs font-bold text-black flex items-center justify-between gap-2 hover:bg-neutral-100 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-2.5 pt-0 font-mono text-[11px] text-neutral-700 border-t border-black/20 bg-white leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Developer Social Profiles */}
          <div className="space-y-2 pt-1">
            <label className="block text-[11px] font-black tracking-wider text-neutral-700 uppercase mb-1">
              Developer Social Profiles:
            </label>

            <a
              href="https://t.me/ALEX_JAMES_DEV"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-2.5 bg-[#FFE600] text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between shadow-[2px_2px_0px_#000] hover:bg-yellow-300 hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TelegramIcon className="w-4 h-4 text-black" />
                <span>Telegram Channel</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://www.facebook.com/share/1J6T4MuGbJ/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-[#FAF6EE] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <FacebookIcon className="w-4 h-4 text-black" />
                <span>Facebook</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>

              <a
                href="https://www.instagram.com/alex.james.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-[#FAF6EE] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <InstagramIcon className="w-4 h-4 text-black" />
                <span>Instagram</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>
            </div>

            <a
              href="https://github.com/AlexJamesHQ"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-2.5 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] hover:bg-neutral-50 hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <GitHubIcon className="w-4 h-4" />
              <span>GitHub Profile</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>
          </div>
        </div>

        {/* Bottom Store Info with Developer Attribution */}
        <div className="pt-4 border-t-2 border-black text-center font-mono text-[11px] text-neutral-700 font-black">
          OrionStore • Developed by Alex James
        </div>
      </div>
    </div>
  );
};

export default MenuDrawer;
