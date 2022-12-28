import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { find } from 'lodash';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { IReactionDocument, IReactions } from '@reactions/interfaces/reaction-interfaces';

const log: Logger = config.createLogger('reactionsCache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionsCache');
  };

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ):Promise<void>{
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if(previousReaction){

         //call remove reaction method
         this.removePostReactionFromCache(key, reaction.username, postReactions);

      }



      if(type){

        //New reaction  //pushed to the left side of the list
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));

        //Also update the reaction in  post

        const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
        await this.client.HSET(`posts:${key}`, dataToSave);

      }





    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }





















  }


   //Removing the previous reaction

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      //reaction from cache
      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      const userPreviousReaction: IReactionDocument = this.getPreviousReaction(response, username) as IReactionDocument;

      //removing reaction from the reaction cache
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();

      //removing reaction from the post
      const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
      await this.client.HSET(`posts:${key}`, dataToSave);

      }
      catch(error){
        log.error(error);
        throw new ServerError('Server error. Try again.');



  }









}


public async getReactionsFromCache(postId: string): Promise<[IReactionDocument[], number]> {
  try {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    const reactionsCount: number = await this.client.LLEN(`reactions:${postId}`);
    const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
    const list: IReactionDocument[] = [];
    for (const item of response) {
      list.push(Helpers.parseJson(item));
    }
    return response.length ? [list, reactionsCount] : [[], 0];
  } catch (error) {
    log.error(error);
    throw new ServerError('Server error. Try again.');
  }
}

public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
  try {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
    const list: IReactionDocument[] = [];
    for (const item of response) {
      list.push(Helpers.parseJson(item));
    }
    const result: IReactionDocument = find(list, (listItem: IReactionDocument) => {
      return listItem?.postId === postId && listItem?.username === username;
    }) as IReactionDocument;

    return result ? [result, 1] : [];
  } catch (error) {
    log.error(error);
    throw new ServerError('Server error. Try again.');
  }
}

//get the previous reaction of the user and remove it from the list

private getPreviousReaction(response: string[], username: string): IReactionDocument | undefined {
  const list: IReactionDocument[] = [];
  for (const item of response) {
    list.push(Helpers.parseJson(item) as IReactionDocument);
  }
  return find(list, (listItem: IReactionDocument) => {
    return listItem.username === username;
  });
}

}
