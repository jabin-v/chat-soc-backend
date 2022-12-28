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
    });
  }
}
