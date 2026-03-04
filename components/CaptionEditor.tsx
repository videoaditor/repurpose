'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export interface CaptionData {
  tiktok: string;
  youtube_title: string;
  youtube_desc: string;
  instagram: string;
  x: string;
  linkedin: string;
}

interface CaptionEditorProps {
  captions: CaptionData;
  onChange: (captions: CaptionData) => void;
  enabledPlatforms?: string[];
}

const platformTabs = [
  {
    key: 'tiktok',
    label: '🎵 TikTok',
    limit: 300,
    fields: [{ key: 'tiktok', label: 'Caption', limit: 300 }],
  },
  {
    key: 'youtube',
    label: '▶ YouTube',
    limit: null,
    fields: [
      { key: 'youtube_title', label: 'Title', limit: 100 },
      { key: 'youtube_desc', label: 'Description', limit: 300 },
    ],
  },
  {
    key: 'instagram',
    label: '◈ Instagram',
    limit: 150,
    fields: [{ key: 'instagram', label: 'Caption', limit: 2200 }],
  },
  {
    key: 'x',
    label: '✕ X',
    limit: 240,
    fields: [{ key: 'x', label: 'Tweet', limit: 240 }],
  },
  {
    key: 'linkedin',
    label: 'in LinkedIn',
    limit: 300,
    fields: [{ key: 'linkedin', label: 'Post', limit: 3000 }],
  },
];

export default function CaptionEditor({ captions, onChange }: CaptionEditorProps) {
  function handleChange(key: keyof CaptionData, value: string) {
    onChange({ ...captions, [key]: value });
  }

  return (
    <Tabs defaultValue="tiktok" className="w-full">
      <TabsList className="w-full bg-[#0d0d10] border border-[#1e1e1e] p-1 rounded-xl h-auto flex-wrap gap-1">
        {platformTabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className="flex-1 text-xs font-medium rounded-lg data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white text-[#555] transition-all"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {platformTabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-3">
          {tab.fields.map((field) => {
            const value = captions[field.key as keyof CaptionData] ?? '';
            const len = value.length;
            const overLimit = field.limit ? len > field.limit : false;

            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#888] font-medium">{field.label}</label>
                  <span
                    className={`text-xs font-mono tabular-nums transition-colors ${
                      overLimit ? 'text-red-400 font-bold' : len > (field.limit ?? Infinity) * 0.85 ? 'text-amber-400' : 'text-[#555]'
                    }`}
                  >
                    {len}{field.limit ? `/${field.limit}` : ''}
                  </span>
                </div>
                <Textarea
                  value={value}
                  onChange={(e) => handleChange(field.key as keyof CaptionData, e.target.value)}
                  className={`min-h-[100px] bg-[#0d0d10] border rounded-xl text-sm text-white placeholder-[#444] resize-none focus:outline-none transition-colors ${
                    overLimit
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-[#1e1e1e] focus:border-indigo-500/50'
                  }`}
                  placeholder={`Write your ${field.label.toLowerCase()}...`}
                />
                {overLimit && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <span>⚠</span>
                    {len - (field.limit ?? 0)} characters over limit
                  </p>
                )}
              </div>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
