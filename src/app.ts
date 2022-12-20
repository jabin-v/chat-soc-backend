import express,{Express} from 'express';
import { chattyServer } from './setupServer';
import databaseConnection from './setupDatabase';
import {config} from './config';


class Application{
    public initialize():void {
        this.loadConfig();
        this.initialize;
        databaseConnection();
        const app:Express=express();
        const server:chattyServer=new chattyServer(app);
        server.start();
    }

    private loadConfig():void{
        config.validateConfig();


    }
}

const application:Application=new Application();

application.initialize();
