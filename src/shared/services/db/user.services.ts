import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';


class Userservice{
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }

}


export const userService:Userservice=new Userservice();
