import toast from 'react-hot-toast';

export type PushResult = {
  okCount?: number;
  sentCount?: number;
  message?: string;
};

export function toastWithPush(saved: string, notification?: PushResult | null) {
  if (!notification?.message) {
    toast.success(saved);
    return;
  }
  if ((notification.okCount || 0) > 0) {
    toast.success(notification.message);
    return;
  }
  toast.success(saved);
  toast.error(notification.message);
}
