import winston from "winston";
import 'winston-daily-rotate-file'
import {ElasticsearchTransport} from 'winston-elasticsearch'
import * as expressWinston from 'express-winston'
const logLevel = 'http';
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};
const rotateTransportHttp = new winston.transports.DailyRotateFile({
    level: logLevel,
    filename: './logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '10k',
    maxFiles: '2',
    handleExceptions: true,
})
rotateTransportHttp.on('error', (error)=> {
    console.log(error)
})
const elasticsearchTransport = new ElasticsearchTransport({
    clientOpts: {
        node: 'http://localhost:9200',
    },
    level: 'info',
    indexPrefix: 'express-app-log',
    ensureMappingTemplate: false
})
elasticsearchTransport.on('error', (error) => {
    console.log(error)
})
const logger = winston.createLogger({
    level: 'http',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        rotateTransportHttp,
        elasticsearchTransport,
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.simple() 
            )
        })
    ],
});
const expressLogger = expressWinston.logger({
    winstonInstance: logger,
    statusLevels: true,
    expressFormat: true,
    colorize:false,
    // level: (res, req) => {
    //     const statusCode = res.statusCode;
    //     if (statusCode < 300) return "info";
    //     if (statusCode < 400) return "http";
    //     if (statusCode < 500) return "warn";
    //     return "error";
    // },
    dynamicMeta: (req, res) => {
        return {
            url: req.url,
            statusCode: res.statusCode,
            method: req.method,
        }
    }
})
export default expressLogger;
