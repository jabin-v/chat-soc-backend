import { Request, Response } from 'express';
import { config } from '@root/config';
import JWT from 'jsonwebtoken';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import HTTP_STATUS from 'http-status-codes';
import { authservice } from '@service/db/auth.services';
import { loginSchema } from '@auth/schemes/signin';
import { IAuthDocument } from '@auth/interfaces/auth.interfaces';
import { BadRequestError } from '@global/helpers/error-handler';
import { userService } from '@service/db/user.services';
import { IUserDocument } from '@user/interfaces/user.interface';
export class signIn{
  @joiValidation(loginSchema)
  public async read(req:Request,res:Response):Promise<void>{

    const {username,password} =req.body;

    const existingUser:IAuthDocument=await authservice.getAuthUserByUsername(username);

    if(!existingUser){
      throw new BadRequestError('Invalid credentials');
    };

    const passwordsMatch: boolean = await existingUser.comparePassword(password);

    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);

    console.log(user);

    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    req.session = { jwt: userJwt };

    //created a new object to send back to client after login

    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument;

    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: userDocument, token: userJwt });



  }
}
