'use client';

import { useState, useEffect } from 'react';
import CaptionEditor, { type CaptionData } from '@/components/CaptionEditor';
import PostStatus, { type PlatformStatus } from '@/components/PostStatus';
import PlatformBadge from '@/components/PlatformBadge';

interface Account {
  id: number;
  name: string;
  username: string;
  color: string;
  platforms: string[];
}

const ALL_PLATFORMS = ['tiktok', 'youtube', 'instagram', 'x', 'linkedin'];

const EMPTY_CAPTIONS: CaptionData = {
  tiktok: '',
  youtube_title: '',
  youtube_desc: '',
  instagram: '',
  x: '',
  linkedin: '',
};

type Step = 1 | 2 | 3 | 4 | 5;

export default function PostPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [accountId, setAccountId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [baseDescription, setBaseDescription] = useState('');
  const [captions, setCaptions] = useState<CaptionData>(EMPTY_CAPTIONS);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // UI state
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postStatuses, setPostStatuses] = useState<PlatformStatus[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then(setAccounts)
      .catch(() => setError('Failed to load accounts'));
  }, []);

  const selectedAccount = accounts.find((a) => a.id === accountId);

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleGenerateCaptions() {
    if (!title) {
      setError('Enter a title first');
      return;
    }
    setError('');
    setGeneratingCaptions(true);
    try {
      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: baseDescription }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCaptions(data);
      setStep(3);
    } catch {
      setError('Failed to generate captions. Check your OpenAI API key.');
    } finally {
      setGeneratingCaptions(false);
    }
  }

  async function handlePost() {
    if (!accountId || selectedPlatforms.length === 0) {
      setError('Select account and at least one platform');
      return;
    }
    if (!videoUrl) {
      setError('Video URL is required');
      return;
    }

    setError('');
    setPosting(true);
    setDone(false);

    // Show pending statuses
    const initialStatuses: PlatformStatus[] = selectedPlatforms.map((p) => ({
      platform: p,
      status: 'posting',
    }));
    setPostStatuses(initialStatuses);
    setStep(5);

    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          platforms: selectedPlatforms,
          videoUrl,
          title,
          captionData: captions,
          baseCaption: baseDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Failed to post');

      setPostStatuses(
        selectedPlatforms.map((p) => ({
          platform: p,
          status: data.status === 'posted' ? 'success' : 'error',
          message: data.status !== 'posted' ? 'Upload failed' : undefined,
        }))
      );
      setDone(true);
    } catch (err) {
      setPostStatuses(
        selectedPlatforms.map((p) => ({
          platform: p,
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed',
        }))
      );
    } finally {
      setPosting(false);
    }
  }

  function reset() {
    setStep(1);
    setAccountId(null);
    setVideoUrl('');
    setTitle('');
    setBaseDescription('');
    setCaptions(EMPTY_CAPTIONS);
    setSelectedPlatforms([]);
    setPostStatuses([]);
    setDone(false);
    setError('');
  }

  const stepLabels: Record<Step, string> = {
    1: 'Select Account',
    2: 'Video Details',
    3: 'Edit Captions',
    4: 'Choose Platforms',
    5: 'Publishing',
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">New Post</h1>
        <p className="text-sm text-[#555] mt-0.5">Distribute your content across platforms</p>
      </div>

      {/* Step indicator */}
      {!done && (
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3, 4, 5] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200 ${
                  step === s
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : step > s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#1a1a1a] text-[#555] border border-[#1e1e1e]'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {i < 4 && <div className={`flex-1 h-px ${step > s ? 'bg-emerald-500/30' : 'bg-[#1e1e1e]'}`} style={{ width: '24px' }} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-[#555]">{stepLabels[step]}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Step 1: Select account */}
      {step === 1 && (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-xl p-8 text-center">
              <p className="text-[#555] text-sm mb-2">No accounts connected yet.</p>
              <a href="/accounts" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
                Add an account →
              </a>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#888]">Choose which account to post from:</p>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setAccountId(account.id);
                      setSelectedPlatforms(account.platforms as string[]);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                      accountId === account.id
                        ? 'border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/5'
                        : 'border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a]'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
                      style={{ backgroundColor: account.color, boxShadow: `0 4px 14px ${account.color}30` }}
                    >
                      {account.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{account.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(account.platforms as string[]).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                      </div>
                    </div>
                    {accountId === account.id && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => accountId && setStep(2)}
                disabled={!accountId}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                Continue →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2: Video details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs text-[#888] mb-1.5 font-medium">Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My amazing video"
                className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1.5 font-medium">
                Base Description{' '}
                <span className="text-[#555] font-normal">(optional, helps AI generate better captions)</span>
              </label>
              <textarea
                value={baseDescription}
                onChange={(e) => setBaseDescription(e.target.value)}
                placeholder="What's this video about?"
                rows={3}
                className="w-full bg-[#0f0f0f] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 border border-[#1e1e1e] text-[#888] text-sm font-medium rounded-xl hover:border-[#2a2a2a] hover:text-white transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleGenerateCaptions}
              disabled={!videoUrl || !title || generatingCaptions}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {generatingCaptions ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating with AI...
                </>
              ) : (
                '✦ Generate Captions'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Edit captions */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-[#888]">Review and edit your AI-generated captions:</p>
          <CaptionEditor captions={captions} onChange={setCaptions} />
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 border border-[#1e1e1e] text-[#888] text-sm font-medium rounded-xl hover:border-[#2a2a2a] hover:text-white transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Choose Platforms →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Platform selection */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-[#888]">Choose which platforms to post to:</p>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <div className="space-y-2">
              {(selectedAccount?.platforms ?? ALL_PLATFORMS).map((platform) => {
                const checked = selectedPlatforms.includes(platform);
                return (
                  <label
                    key={platform}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      checked
                        ? 'border-indigo-500/30 bg-indigo-500/5'
                        : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlatform(platform)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        checked ? 'bg-indigo-500 border-indigo-500' : 'border-[#333]'
                      }`}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <PlatformBadge platform={platform} />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 border border-[#1e1e1e] text-[#888] text-sm font-medium rounded-xl hover:border-[#2a2a2a] hover:text-white transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handlePost}
              disabled={selectedPlatforms.length === 0 || posting}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              Post to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Status */}
      {step === 5 && (
        <div className="space-y-4">
          <PostStatus statuses={postStatuses} />

          {done && (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9l4 4 7-7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-white text-sm mb-1">
                Posted successfully
              </h3>
              <p className="text-xs text-[#555] mb-4">Your content has been distributed.</p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/history"
                  className="px-4 py-2 border border-[#1e1e1e] text-[#888] text-sm rounded-xl hover:text-white hover:border-[#2a2a2a] transition-all"
                >
                  View History
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm rounded-xl transition-colors"
                >
                  New Post
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
