import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { Update } from '@notification/controller/update-notification';
import { Delete } from '@notification/controller/delete-notification';
import { Get } from '@notification/controller/get-notification';

class NotificationRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/notifications', authMiddleware.checkAuthentication, Get.prototype.notifications);
    this.router.put('/notification/:notificationId', authMiddleware.checkAuthentication, Update.prototype.notification);
    this.router.delete('/notification/:notificationId', authMiddleware.checkAuthentication, Delete.prototype.notification);

    return this.router;
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes();
