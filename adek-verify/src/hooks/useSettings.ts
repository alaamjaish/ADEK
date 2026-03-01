'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '@/lib/data/types';
import { loadSettings, saveSettings, getDefaultSettings } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
    saveSettings(defaults);
  }, []);

  return { settings, updateSettings, resetToDefaults };
}
