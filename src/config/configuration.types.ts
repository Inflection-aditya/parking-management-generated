export type FileStorageProvider = 'AWS-S3' | 'GCP-FileStore' | 'Custom';
export type SmsProvider = 'Twilio' | 'Mock';
export type EmailProvider = 'SendGrid' | 'SMTP' | 'Mock' | 'AWS-SES';
export type MobileNotificationProvider = 'Firebase' | 'Mock';
export type AuthProvider = 'Custom' | 'JWT' | 'OAuth';
export type AuthorizationProvider = 'Custom' | 'RBAC' | 'ABAC';
export type MessageBrokerProvider = 'Kafka' | 'RabbitMQ' | 'SQS' | 'InMemory' | 'GcpPubSub' | 'AzureServiceBus';
///////////////////////////////////////////////////////////////////////////////////////////
export interface Configurations {
    SystemIdentifier: string;
    BaseUrl: string;
    FileStorage: {
        Provider: FileStorageProvider;
    };
    Email: {
        Provider: EmailProvider;
    };
    Sms: {
        Provider: SmsProvider;
    };
    MobileNotification: {
        Provider: MobileNotificationProvider;
    };
    Authentication: {
        Provider: AuthProvider;
    };
    Authorization: {
        Provider: AuthorizationProvider;
    };
    MessageBroker: {
        Provider: MessageBrokerProvider;
    };
    TemporaryFolders: {
        UploadFolder: string;
        DownloadFolder: string;
        LogFolder: string;
        CleanupEveryMinutes: number;
    };
    MaxUploadFileSize: number;
    Telemetry: boolean;
}
