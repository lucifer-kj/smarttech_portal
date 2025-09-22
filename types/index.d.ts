declare module 'web-push' {
  interface VapidKeys {
    publicKey: string
    privateKey: string
  }
  interface PushSubscription {
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

// Ensure this file is treated as a module
export {}

