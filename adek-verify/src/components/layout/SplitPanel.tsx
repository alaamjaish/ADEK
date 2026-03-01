'use client';

import { ReactNode } from 'react';

interface SplitPanelProps {
  left: ReactNode;
  right: ReactNode;
}

export default function SplitPanel({ left, right }: SplitPanelProps) {
  return (
    <div className="max-w-[1600px] mx-auto p-4 flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Right panel (Sender) - appears first in RTL */}
      <div className="w-full lg:w-1/2 order-1 lg:order-none">
        <div className="bg-white rounded-xl shadow-sm border border-adek-border h-full overflow-auto">
          {right}
        </div>
      </div>

      {/* Left panel (Receiver) - appears second in RTL */}
      <div className="w-full lg:w-1/2 order-2 lg:order-none">
        <div className="bg-white rounded-xl shadow-sm border border-adek-border h-full overflow-auto">
          {left}
        </div>
      </div>
    </div>
  );
}
