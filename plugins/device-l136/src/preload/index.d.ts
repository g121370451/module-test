declare interface Window {
  l136: {
    send: (channel: string, data?: string) => void
    onMessage: (callback: (data: string) => void) => void
  }
}
