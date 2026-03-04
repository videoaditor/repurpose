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

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function extractYouTubeVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function PostPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [step, setStep] = useState<Step>(1);

  const [accountId, setAccountId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
  const [title, setTitle] = useState('');
  const [baseDescription, setBaseDescription] = useState('');
  const [captions, setCaptions] = useState<CaptionData>(EMPTY_CAPTIONS);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

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
  const isYouTube = isYouTubeUrl(videoUrl);

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

    // Extract YouTube video ID if available for context
    const ytVideoId = youtubeChannelUrl ? extractYouTubeVideoId(youtubeChannelUrl) : null;

    try {
      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: baseDescription,
          isYouTube: isYouTube || !!youtubeChannelUrl,
          youtubeVideoId: ytVideoId,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // If YouTube channel URL was provided and no title set, use generated title
      if (data.youtube_title && !title) setTitle(data.youtube_title);

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
    setYoutubeChannelUrl('');
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

  const inputStyle = {
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#eaeaee',
    width: '100%',
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-bold tracking-tight" style={{ color: '#eaeaee' }}>
          New Post
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#5c5c6a' }}>
          Distribute your content across platforms
        </p>
      </div>

      {/* Step indicator */}
      {!done && (
        <div className="flex items-center gap-1.5 mb-8">
          {([1, 2, 3, 4, 5] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200"
                style={
                  step === s
                    ? { background: '#2dd4bf', color: '#fff', boxShadow: '0 0 12px rgba(45,212,191,0.3)' }
                    : step > s
                    ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                    : { background: '#16161e', color: '#444450', border: '1px solid #1e1e1e' }
                }
              >
                {step > s ? '✓' : s}
              </div>
              {i < 4 && (
                <div
                  className="h-px"
                  style={{
                    width: '20px',
                    background: step > s ? 'rgba(52,211,153,0.25)' : '#1e1e1e',
                  }}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs" style={{ color: '#444450' }}>{stepLabels[step]}</span>
        </div>
      )}

      {error && (
        <div
          className="mb-4 text-xs rounded-[10px] px-4 py-3"
          style={{ color: '#f43f5e', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Select account */}
      {step === 1 && (
        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div
              className="rounded-[14px] p-8 text-center"
              style={{ background: '#111111', border: '1px dashed #1e1e1e' }}
            >
              <p className="text-sm mb-2" style={{ color: '#444450' }}>No accounts connected yet.</p>
              <a href="/accounts" className="text-sm transition-colors" style={{ color: '#2dd4bf' }}>
                Add an account →
              </a>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: '#5c5c6a' }}>Choose which account to post from:</p>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setAccountId(account.id);
                      setSelectedPlatforms(account.platforms as string[]);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-[14px] text-left transition-all duration-150"
                    style={{
                      background: accountId === account.id ? 'rgba(45,212,191,0.05)' : '#111111',
                      border: `1px solid ${accountId === account.id ? 'rgba(45,212,191,0.2)' : '#1e1e1e'}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
                      style={{ backgroundColor: account.color, boxShadow: `0 4px 12px ${account.color}30` }}
                    >
                      {account.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: '#eaeaee' }}>{account.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(account.platforms as string[]).map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                      </div>
                    </div>
                    {accountId === account.id && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#2dd4bf' }}
                      >
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
                className="w-full py-2.5 text-sm font-medium rounded-[10px] transition-all duration-150"
                style={{
                  background: accountId ? 'rgba(45,212,191,0.12)' : '#141414',
                  color: accountId ? '#2dd4bf' : '#333',
                  border: `1px solid ${accountId ? 'rgba(45,212,191,0.2)' : '#1e1e1e'}`,
                  cursor: accountId ? 'pointer' : 'not-allowed',
                }}
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
          <div
            className="rounded-[14px] p-5 space-y-4"
            style={{ background: '#111111', border: '1px solid #1e1e1e' }}
          >
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#5c5c6a' }}>Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#1e1e1e'; }}
              />
            </div>

            {/* YouTube Channel URL — optional */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#5c5c6a' }}>
                YouTube Channel / Video URL{' '}
                <span className="font-normal" style={{ color: '#444450' }}>(optional — improves AI captions)</span>
              </label>
              <input
                type="url"
                value={youtubeChannelUrl}
                onChange={(e) => setYoutubeChannelUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or channel URL"
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#1e1e1e'; }}
              />
              {youtubeChannelUrl && (
                <p className="text-[11px] mt-1.5" style={{ color: '#34d399' }}>
                  ✓ YouTube context detected — AI will generate YouTube-optimized captions
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#5c5c6a' }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My amazing video"
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#1e1e1e'; }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#5c5c6a' }}>
                Base Description{' '}
                <span className="font-normal" style={{ color: '#444450' }}>(optional)</span>
              </label>
              <textarea
                value={baseDescription}
                onChange={(e) => setBaseDescription(e.target.value)}
                placeholder="What's this video about?"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(45,212,191,0.4)'; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#1e1e1e'; }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 text-sm font-medium rounded-[10px] transition-all"
              style={{ border: '1px solid #1e1e1e', color: '#5c5c6a', background: 'transparent' }}
            >
              ← Back
            </button>
            <button
              onClick={handleGenerateCaptions}
              disabled={!videoUrl || !title || generatingCaptions}
              className="flex-1 py-2.5 text-sm font-medium rounded-[10px] transition-all flex items-center justify-center gap-2"
              style={{
                background: (!videoUrl || !title || generatingCaptions) ? '#141414' : 'rgba(45,212,191,0.12)',
                color: (!videoUrl || !title || generatingCaptions) ? '#333' : '#2dd4bf',
                border: `1px solid ${(!videoUrl || !title || generatingCaptions) ? '#1e1e1e' : 'rgba(45,212,191,0.2)'}`,
                cursor: (!videoUrl || !title || generatingCaptions) ? 'not-allowed' : 'pointer',
              }}
            >
              {generatingCaptions ? (
                <>
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#2dd4bf', borderTopColor: 'transparent' }}
                  />
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
          <p className="text-sm" style={{ color: '#5c5c6a' }}>Review and edit AI-generated captions:</p>
          <CaptionEditor captions={captions} onChange={setCaptions} />
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 text-sm font-medium rounded-[10px] transition-all"
              style={{ border: '1px solid #1e1e1e', color: '#5c5c6a', background: 'transparent' }}
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-2.5 text-sm font-medium rounded-[10px] transition-all"
              style={{ background: 'rgba(45,212,191,0.12)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}
            >
              Choose Platforms →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Platform selection */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#5c5c6a' }}>Choose which platforms to post to:</p>

          <div
            className="rounded-[14px] p-4 space-y-2"
            style={{ background: '#111111', border: '1px solid #1e1e1e' }}
          >
            {(selectedAccount?.platforms ?? ALL_PLATFORMS).map((platform) => {
              const checked = selectedPlatforms.includes(platform);
              return (
                <label
                  key={platform}
                  className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all duration-150"
                  style={{
                    border: `1px solid ${checked ? 'rgba(45,212,191,0.2)' : '#16161e'}`,
                    background: checked ? 'rgba(45,212,191,0.04)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlatform(platform)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      background: checked ? '#2dd4bf' : 'transparent',
                      border: `1px solid ${checked ? '#2dd4bf' : '#252530'}`,
                    }}
                  >
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <PlatformBadge platform={platform} />
                </label>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 text-sm font-medium rounded-[10px] transition-all"
              style={{ border: '1px solid #1e1e1e', color: '#5c5c6a', background: 'transparent' }}
            >
              ← Back
            </button>
            <button
              onClick={handlePost}
              disabled={selectedPlatforms.length === 0 || posting}
              className="flex-1 py-2.5 text-sm font-medium rounded-[10px] transition-all"
              style={{
                background: (selectedPlatforms.length === 0 || posting) ? '#141414' : 'rgba(45,212,191,0.12)',
                color: (selectedPlatforms.length === 0 || posting) ? '#333' : '#2dd4bf',
                border: `1px solid ${(selectedPlatforms.length === 0 || posting) ? '#1e1e1e' : 'rgba(45,212,191,0.2)'}`,
                cursor: (selectedPlatforms.length === 0 || posting) ? 'not-allowed' : 'pointer',
              }}
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
            <div
              className="rounded-[14px] p-6 text-center"
              style={{ background: '#111111', border: '1px solid #1e1e1e' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.15)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9l4 4 7-7" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-sm mb-1" style={{ color: '#eaeaee' }}>
                Posted successfully
              </h3>
              <p className="text-xs mb-4" style={{ color: '#444450' }}>Your content has been distributed.</p>
              <div className="flex gap-3 justify-center">
                <a
                  href="/history"
                  className="px-4 py-2 text-sm rounded-[10px] transition-all"
                  style={{ border: '1px solid #1e1e1e', color: '#5c5c6a' }}
                >
                  View History
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm rounded-[10px] transition-all"
                  style={{ background: 'rgba(45,212,191,0.12)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}
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
