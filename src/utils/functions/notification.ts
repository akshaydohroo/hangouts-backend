import { UUID, randomUUID } from "crypto";
import { Transaction } from "sequelize";
import Notification, {
  NotificationCause,
  NotificationType,
} from "../../models/Notification";
// export async function createNotification(
//   userId: string,
//   senderId: string,
//   notificationType: NotificationType,
//   cause: NotificationCause,
//   causeId: string,
//   transaction: Transaction
// ): Promise<UUID> {
//   const notification = await Notification.create(
//     {
//       notificationId: randomUUID(),
//       userId,
//       senderId,
//       notificationType,
//       cause,
//       causeId,
//     },
//     { transaction }
//   );
//   return notification.notificationId;
// }