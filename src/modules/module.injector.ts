import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { ConfigurationManager } from '../config/configuration.manager';
import { MockMessagingService } from './sms/providers/mock.messaging.service';
import { TwilioMessagingService } from './sms/providers/twilio.messaging.service';
import { FirebaseNotificationService } from './notification/providers/firebase.notification.service';
import { MockNotificationService } from './notification/providers/mock.notification.service';
import { AWSS3FileStorageService } from './storage/providers/aws.s3.file.storage.service';
import { CustomFileStorageService } from './storage/providers/custom.file.storage.service';
import { SendGridEmailService } from './email/providers/sendgrid.email.service';
import { SMTPEmailService } from './email/providers/smtp.email.service';
import { AwsSESEmailService } from './email/providers/aws-ses.email.service';
// import { IFileStorageService } from './storage/interfaces/file.storage.service.interface';
// import { IEmailService } from './email/email.service.interface';

////////////////////////////////////////////////////////////////////////////////

export class ModuleInjector {

    public static registerInjections(container: DependencyContainer) {
        ModuleInjector.injectFileStorageProvider(container);
        ModuleInjector.injectEmailProvider(container);
        ModuleInjector.injectSmsProvider(container);
        ModuleInjector.injectNotificationProvider(container);
    }

    private static injectFileStorageProvider(container: DependencyContainer) {
        const provider = ConfigurationManager.FileStorageProvider();
        if (provider === 'AWS-S3') {
            container.register('IFileStorageService', AWSS3FileStorageService);
        }
        else if (provider === 'Custom') {
            container.register('IFileStorageService', CustomFileStorageService);
        }
    }

    private static injectNotificationProvider(container: DependencyContainer) {
        const notificationProvider = ConfigurationManager.MobileNotificationProvider();
        if (notificationProvider === 'Firebase') {
            container.register('INotificationService', FirebaseNotificationService);
        }
        else if (notificationProvider === 'Mock') {
            container.register('INotificationService', MockNotificationService);
        }
    }

    private static injectSmsProvider(container: DependencyContainer) {
        const smsProvider = ConfigurationManager.SmsProvider();
        if (smsProvider === 'Twilio') {
            container.register('IMessagingService', TwilioMessagingService);
        }
        else if (smsProvider === 'Mock') {
            container.register('IMessagingService', MockMessagingService);
        }
    }

    private static injectEmailProvider(container: DependencyContainer) {
        const emailProvider = ConfigurationManager.EmailProvider();
        if (emailProvider === 'SendGrid') {
            container.register('IEmailService', SendGridEmailService);
        }
        else if (emailProvider === 'SMTP') {
            container.register('IEmailService', SMTPEmailService);
        }
        else if (emailProvider === 'AWS-SES') {
            container.register('IEmailService', AwsSESEmailService);
        }
    }

}
