import * as admin from 'firebase-admin';
import { logger } from '../../../logger/logger';
import { INotificationService } from '../notification.service.interface';
import fs from 'fs';

///////////////////////////////////////////////////////////////////////////////////

export class FirebaseNotificationService implements INotificationService {

    init = () => {
        try {
            const accountCreds = fs.readFileSync(process.env.FCM_GOOGLE_APPLICATION_CREDENTIALS).toString();
            const serviceAccount = JSON.parse(accountCreds);
            admin.initializeApp({
                credential : admin.credential.cert(serviceAccount),
            });
        } catch (error) {
            logger.info(error.message);
            return false;
        }
        return true;
    };

    sendNotificationToDevice = async (deviceToken: string, message: any): Promise<string> => {
        try {
            message.token = deviceToken;
            if (deviceToken == null) {
                logger.info('Invalid device token!');
                return;
            }
            logger.info(`Sending notification to token: ${deviceToken}.`);
            var response = await admin.messaging().send(message);
            logger.info(`Successfully sent notification to token:  ${deviceToken}.`);
            return response;
        } catch (error) {
            var errorMessage = `Error sending notification to token: ${deviceToken}. ${error.message}`;
            logger.error(errorMessage);
        }
    };

    sendNotificationToMultipleDevice = async (
        deviceTokens: string[],
        message: any): Promise<any> => {

        try {
            message.tokens = deviceTokens;
            logger.info(`Sending notification to tokens: ${deviceTokens}.`);
            var response = await admin.messaging().sendEachForMulticast(message);
            logger.info(`Successfully sent notification to token: ${deviceTokens}.`);
            return response;
        } catch (error) {
            var errorMessage = `Error sending notification to token: ${deviceTokens}. ${error.message}`;
            logger.error(errorMessage);
        }
    };

    sendMessageToTopic = async (topic: string, message: any): Promise<string> => {
        try {
            message.topic = topic;
            logger.info(`Sending notification to topic: ${topic}.`);
            var response = await admin.messaging().send(message);
            logger.info(`Successfully sent notification to topic: ${topic}.`);
            return response;
        } catch (error) {
            var errorMessage = 'Error sending notification to topic: ' + topic;
            logger.error(errorMessage);
            throw new  logger.error(errorMessage);
        }
    };

    formatNotificationMessage = (notificationType: string = 'General', title: string, body: any, url = null, topic?: null): any => {
        var message = {
            data : {
                type         : notificationType,
                title        : title,
                body         : body,
                click_action : "FLUTTER_NOTIFICATION_CLICK",
            },
            notification : {
                title : title,
                body  : body,
            },
            android : {
                ttl          : 3600 * 1000, // 1 hour in milliseconds
                priority     : 'normal',
                notification : {
                    title : title,
                    body  : body,
                    color : '#f45342',
                },
            },
            apns : {
                headers : {
                    'apns-priority' : '10',
                },
                payload : {
                    aps : {
                        alert : {
                            title : title,
                            body  : body,
                        },
                        //badge   : 2,
                        message : {
                            type  : notificationType,
                            title : title,
                            body  : body,
                        },
                    },
                },
            },
        };

        if (url) {
            message.data["url"] = url;
        }
        if (topic) {
            message["topic"] = topic;
        }

        logger.info(`Notification Payload: ${JSON.stringify(message)}`);
        return message;
    };

    formatNotificationMessageWithData = (notificationType: string, title: string, body: any, customData: any): any => {
        var message = {
            data : {
                type       : notificationType,
                customData : customData,
            },
            notification : {
                title : title,
                body  : body,
            },
            android : {
                ttl          : 3600 * 1000, // 1 hour in milliseconds
                priority     : 'normal',
                notification : {
                    title : title,
                    body  : body,

                    //'customData': 'customData'
                },
            },
            apns : {
                headers : {
                    'apns-priority' : '10',
                },
                payload : {
                    aps : {
                        alert : {
                            title : title,
                            body  : body,
                        },
                        badge   : 2,
                        message : {
                            type : notificationType,

                            //'customData': 'customData'
                        },
                    },
                },
            },
        };
        return message;
    };

}
