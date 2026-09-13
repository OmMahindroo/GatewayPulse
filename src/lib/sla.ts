export type SlaTier = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'RESOLVED';

export interface SlaInfo {
  tier: SlaTier;
  label: string;
  daysElapsed: number;
  hoursElapsed: number;
  isBreached: boolean;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
}

export function calculateSla(
  createdAt: Date | string,
  status: string,
  proposedAt?: Date | string | null,
  resolvedAt?: Date | string | null
): SlaInfo {
  const createdTime = new Date(createdAt).getTime();

  // If issue has a proposed resolution or is resolved, calculate elapsed time up to that point
  let endTime = Date.now();
  if (status === 'RESOLVED' && resolvedAt) {
    endTime = new Date(resolvedAt).getTime();
  } else if (status === 'AUTO_CLOSED' && proposedAt) {
    endTime = new Date(proposedAt).getTime();
  } else if (status === 'PROPOSED_RESOLUTION' && proposedAt) {
    endTime = new Date(proposedAt).getTime();
  }

  const elapsedMs = Math.max(0, endTime - createdTime);
  const hoursElapsed = Math.floor(elapsedMs / (1000 * 60 * 60));
  const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

  if (status === 'RESOLVED' || status === 'AUTO_CLOSED') {
    return {
      tier: 'RESOLVED',
      label: status === 'AUTO_CLOSED' ? 'Auto-closed' : 'Resolved',
      daysElapsed,
      hoursElapsed,
      isBreached: false,
      colorClass: {
        bg: 'bg-neutral-100',
        text: 'text-neutral-700',
        border: 'border-neutral-300',
        dot: 'bg-neutral-500',
      },
    };
  }

  if (daysElapsed <= 2) {
    return {
      tier: 'GREEN',
      label: hoursElapsed < 24 ? `${hoursElapsed}h active` : `${daysElapsed}d active`,
      daysElapsed,
      hoursElapsed,
      isBreached: false,
      colorClass: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        dot: 'bg-emerald-600',
      },
    };
  }

  if (daysElapsed <= 4) {
    return {
      tier: 'YELLOW',
      label: `${daysElapsed}d pending`,
      daysElapsed,
      hoursElapsed,
      isBreached: false,
      colorClass: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
      },
    };
  }

  if (daysElapsed <= 7) {
    return {
      tier: 'ORANGE',
      label: `${daysElapsed}d delayed`,
      daysElapsed,
      hoursElapsed,
      isBreached: false,
      colorClass: {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-300',
        dot: 'bg-orange-500',
      },
    };
  }

  return {
    tier: 'RED',
    label: `${daysElapsed}d SLA breached`,
    daysElapsed,
    hoursElapsed,
    isBreached: true,
    colorClass: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-300',
      dot: 'bg-red-600',
    },
  };
}
