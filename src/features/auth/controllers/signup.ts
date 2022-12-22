import { ObjectId } from 'mongodb';
import {Request,Response} from 'express';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { signupSchema } from '@auth/schemes/signup';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interfaces';
import { authservice } from '@service/db/auth.services';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import HTTP_STATUS from 'http-status-codes';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { IUserDocument } from '@user/interfaces/user.interface';
import { omit, Omit } from 'lodash';

import { UserCache } from '@service/redis/user.cache';
import { authQueue } from '@service/queues/auth.queue';
import { userQueue } from '@service/queues/user.queus';

import JWT from 'jsonwebtoken';
import { config } from '@root/config';

const userCache: UserCache = new UserCache();


export class SignUp{
  @joiValidation(signupSchema)
  public async create(req:Request,res:Response):Promise<void>{



    const { username, email, password, avatarColor, avatarImage } = req.body;

    //check for the user
    const checkIfUserExist:IAuthDocument=await authservice.getUserByUsernameOrEmail(username,email);

    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials');
    };
    //creating our own object id
    const authObjectId:ObjectId=new ObjectId();
    const userObjectId:ObjectId=new ObjectId();
    const uId=`${Helpers.generateRandomIntegers(12)}`;

    const authData: IAuthDocument = SignUp.prototype.signupdata({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    });

    //uploading to cloudinary

    const result:UploadApiResponse=(await uploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again.');
    };

    //add to redis cache

    const userDataForCache:IUserDocument=SignUp.prototype.userData(authData, userObjectId);

    userDataForCache.profilePicture = `https://res.cloudinary.com/dgxqks1qh/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToChache(`${userObjectId}`, uId, userDataForCache);


    //add to database

    // omit(userDataForCache,['uid','username','avatarColor','password']);

    authQueue.addAuthUserJob('addAuthUserToDB',{value:userDataForCache} );

    userQueue.addUserJob('addUserToDB',{value:userDataForCache});

    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);

    req.session = { jwt: userJwt };












 res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully', user: userDataForCache, token: userJwt });




  };

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private signupdata(data:ISignUpData):IAuthDocument{
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  };

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }


}
