declare module 'web-push' {
  export interface VapidKeys {
    publicKey: string
    privateKey: string
  }
  export interface PushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  const webpush: {
    setVapidDetails(mailto: string, publicKey: string, privateKey: string): void
    generateVAPIDKeys(): VapidKeys
    sendNotification(subscription: PushSubscription, payload: string): Promise<{ statusCode: number }>
  }
  export default webpush
}

