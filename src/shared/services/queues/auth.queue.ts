import {BaseQueue} from '@service/queues/base.queue';
import { IAuthJob } from '@auth/interfaces/auth.interfaces';
import { authWorker } from '@worker/auth.worker';

class AuthQueue extends BaseQueue{
  constructor(){
    super('auth');
    this.processJob('addAuthUserToDB', 5, authWorker.addAuthUserToDB);

  }

  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }

}

export const authQueue:AuthQueue=new AuthQueue();
