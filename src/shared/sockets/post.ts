import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { IReactionDocument } from '@reactions/interfaces/reaction-interfaces';
import {Server,Socket} from 'socket.io';



export let socketIOPostObject:Server;


export class SocketIoPostHandler{

  private io:Server;

  constructor(io:Server){
    this.io=io;
    socketIOPostObject=io;
  }


  public listen():void{
    this.io.on('connection',(socket:Socket)=>{
      console.log('post soket handler');
      socket.on('reaction',(reaction:IReactionDocument)=>{
        this.io.emit('update like',reaction);
      });

      socket.on('comment',(comment:ICommentDocument)=>{
        this.io.emit('update comment',comment);

      });
    });
  }
}
