import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type NotificationType =
  | "badge_earned"
  | "contest_starting"
  | "contest_ended"
  | "streak_milestone"
  | "rank_change"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  href?: string;
  read: boolean;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export async function addNotification(
  userId: string,
  notification: Omit<AppNotification, "id" | "read" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "users", userId, "notifications"), {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId, "notifications", notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, "users", userId, "notifications"), where("read", "==", false))
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => {
      const notifications = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppNotification[];
      callback(notifications);
    },
    (err) => {
      // Listener errors are non-fatal — log and leave the bell empty.
      console.warn("[notifications] snapshot error:", err.code);
      callback([]);
    }
  );
}
