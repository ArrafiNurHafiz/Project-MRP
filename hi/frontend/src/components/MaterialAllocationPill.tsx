'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, ShoppingBag, ArrowUpRight } from 'lucide-react';

export type AllocationStatus = 'IN_STOCK' | 'EXPECTED' | 'SHORTAGE' | 'NOT_APPLICABLE';

interface MaterialAllocationPillProps {
  status: AllocationStatus | string;
  allocatedQty?: number;
  requiredQty?: number;
  shortageQty?: number;
  expectedPOQty?: number;
  onAutoAllocate?: () => void;
  onCreateShortagePO?: () => void;
  isAllocating?: boolean;
  isCreatingPO?: boolean;
  compact?: boolean;
}

export function MaterialAllocationPill({
  status,
  allocatedQty,
  requiredQty,
  shortageQty = 0,
  expectedPOQty = 0,
  onAutoAllocate,
  onCreateShortagePO,
  isAllocating = false,
  isCreatingPO = false,
  compact = false,
}: MaterialAllocationPillProps) {
  const normStatus = (status || '').toUpperCase();

  // Determine variant
  let badgeConfig = {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
    label: 'In Stock / Allocated',
    subtext: 'Bahan Baku Siap 100%',
  };

  if (normStatus === 'SHORTAGE' || shortageQty > 0) {
    badgeConfig = {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle,
      label: 'Shortage (Defisit)',
      subtext: shortageQty > 0 ? `Defisit ${shortageQty} unit` : 'Bahan Belum Lengkap',
    };
  } else if (normStatus === 'EXPECTED' || expectedPOQty > 0) {
    badgeConfig = {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'Expected (Menunggu PO)',
      subtext: expectedPOQty > 0 ? `PO ${expectedPOQty} unit otw` : 'Dalam Pengiriman PO',
    };
  } else if (normStatus === 'PARTIAL') {
    badgeConfig = {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      dot: 'bg-orange-500',
      icon: AlertTriangle,
      label: 'Sebagian Teralokasi',
      subtext: `${allocatedQty || 0}/${requiredQty || 0} unit`,
    };
  }

  const Icon = badgeConfig.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeConfig.bg} shadow-2xs`}
        title={badgeConfig.subtext}
      >
        <span className={`w-2 h-2 rounded-full ${badgeConfig.dot}`} />
        <Icon className="w-3.5 h-3.5" />
        <span>{badgeConfig.label}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${badgeConfig.bg} shadow-2xs`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${badgeConfig.dot} animate-pulse`} />
        <Icon className="w-4 h-4 shrink-0" />
        <div className="flex flex-col text-left">
          <span>{badgeConfig.label}</span>
          <span className="text-[10px] font-normal opacity-85">{badgeConfig.subtext}</span>
        </div>
      </div>

      {/* Quick Actions (Katana MRP 1-Click) */}
      <div className="flex items-center gap-1.5">
        {onAutoAllocate && (normStatus === 'SHORTAGE' || normStatus === 'PARTIAL' || normStatus === 'NOT_APPLICABLE' || normStatus === 'EXPECTED') && (
          <button
            type="button"
            onClick={onAutoAllocate}
            disabled={isAllocating}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Alokasikan batch material FIFO otomatis"
          >
            <Sparkles className="w-3 h-3" />
            {isAllocating ? 'Mengalokasi...' : 'Auto-Allocate'}
          </button>
        )}

        {onCreateShortagePO && (normStatus === 'SHORTAGE' || shortageQty > 0) && (
          <button
            type="button"
            onClick={onCreateShortagePO}
            disabled={isCreatingPO}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Terbitkan draft Purchase Order untuk defisit material"
          >
            <ShoppingBag className="w-3 h-3" />
            {isCreatingPO ? 'Buat PO...' : 'Terbitkan PO Defisit'}
          </button>
        )}
      </div>
    </div>
  );
}
