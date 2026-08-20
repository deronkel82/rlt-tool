import type { ReactNode } from 'react'

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconMenu = () => <Svg><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
export const IconClose = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const IconUndo = () => <Svg><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></Svg>
export const IconRedo = () => <Svg><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></Svg>
export const IconPlus = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>
export const IconMinus = () => <Svg><path d="M5 12h14" /></Svg>
export const IconFit = () => <Svg><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" /></Svg>
export const IconTable = () => <Svg><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></Svg>
export const IconDownload = () => <Svg><path d="M12 4v11M8 11l4 4 4-4" /><path d="M4 19h16" /></Svg>
export const IconTrash = () => <Svg><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Svg>
export const IconCopy = () => <Svg><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Svg>
export const IconRotate = () => <Svg><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v4h-4" /></Svg>
export const IconFlip = () => <Svg><path d="M12 3v18" /><path d="M9 7L4 12l5 5V7Z" /><path d="M15 7l5 5-5 5V7Z" /></Svg>
export const IconPointer = () => <Svg><path d="M6 3l12 8-5 1 3 6-2.5 1.2-3-6L6 17V3Z" /></Svg>
export const IconLasso = () => <Svg><path d="M4 10a8 5 0 1 0 16 0 8 5 0 1 0-16 0" /><path d="M7 14.5V18a2 2 0 0 0 2 2" /></Svg>
export const IconLink = () => <Svg><path d="M10 13a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7L11.3 6" /><path d="M14 11a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7L12.7 18" /></Svg>
export const IconGrid = () => <Svg><path d="M4 9h16M4 15h16M9 4v16M15 4v16" /></Svg>
export const IconMagnet = () => <Svg><path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4H6Z" /></Svg>
export const IconSun = () => <Svg><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
export const IconMoon = () => <Svg><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></Svg>
export const IconPalette = () => <Svg><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="4" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>
export const IconSliders = () => <Svg><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>
export const IconFolder = () => <Svg><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></Svg>
export const IconEye = () => <Svg size={17}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.6" /></Svg>
export const IconEyeOff = () => <Svg size={17}><path d="M4 4l16 16" /><path d="M9.9 5.3A9.6 9.6 0 0 1 12 5c6.5 0 10 6 10 6a17 17 0 0 1-3 3.6M6.5 7.4A16.6 16.6 0 0 0 2 11s3.5 6 10 6a9.7 9.7 0 0 0 3.7-.7" /></Svg>
export const IconSearch = () => <Svg size={17}><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></Svg>
export const IconUpload = () => <Svg><path d="M12 19V8M8 12l4-4 4 4" /><path d="M4 19h16" /></Svg>
export const IconEdit = () => <Svg size={18}><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="M14 6l4 4" /></Svg>
export const IconCheck = () => <Svg><path d="M5 13l4 4L19 7" /></Svg>
export const IconInfo = () => <Svg size={17}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
