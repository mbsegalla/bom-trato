export const WORK_ORDER_PHOTO_STAGES = ['BEFORE', 'DURING', 'AFTER'] as const;

export const WORK_ORDER_PHOTO_STAGE_LABELS: Record<(typeof WORK_ORDER_PHOTO_STAGES)[number], string> = {
  BEFORE: 'Antes',
  DURING: 'Durante',
  AFTER: 'Depois',
};

export const WORK_ORDER_PHOTO_LIMIT = 20;
export const WORK_ORDER_PHOTO_MAX_SIZE = 10 * 1024 * 1024;
export const WORK_ORDER_PHOTO_CAPTION_LIMIT = 240;
export const WORK_ORDER_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
