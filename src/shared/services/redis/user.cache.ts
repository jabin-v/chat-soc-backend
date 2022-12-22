import { ServerError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import Logger from 'bunyan';


const log: Logger = config.createLogger('userCache');

export class UserCache extends BaseCache{

  constructor(){
    super('userChache');


  }

  public async saveUserToChache(key:string ,userId:string ,createdUser:IUserDocument):Promise<void>{

    const createdAt=new Date();

    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;


    //there is no reason for breaking the arryay in to 3 parts
    //just my style

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ];

    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ];

    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`
    ];


    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];




    //saving to redis

    try {

      if (!this.client.isOpen) {
        await this.client.connect();
      }
      //to add a new user ;
      //here user is the key and using the score we are identifying each set
      await this.client.ZADD('user', { score: parseInt(userId, 10), value: `${key}` });

      for(let i =0 ; i<dataToSave.length ;i += 2){
        await this.client.HSET(`users:${key}`, dataToSave[i],dataToSave[i+1]);

      }

    } catch (error) {

      log.error(error);
      throw new ServerError('Server error in redis. Try again.');

    }





  }


}
