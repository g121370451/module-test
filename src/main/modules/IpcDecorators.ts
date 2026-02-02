// src/main/framework/decorators.ts
import { ipcMain } from 'electron'
import 'reflect-metadata'
import { log } from './log'
import Result from '../entity/result'

export const CONTROLLER_METADATA = 'ipc:controller'
export const ROUTE_METADATA = 'ipc:route'

interface RouteDefinition {
  channel: string
  methodName: string
  type: 'handle' | 'on' // handle 对应 invoke, on 对应 send
}

// 类装饰器：定义模块前缀
export function IpcController(prefix: string = '') {
  return (target: Constructor) => {
    Reflect.defineMetadata(CONTROLLER_METADATA, prefix, target)
  }
}

// 方法装饰器：定义具体频道
export function IpcHandle(channel: string) {
  return (target: object, propertyKey: string) => {
    const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || []
    routes.push({ channel, methodName: propertyKey, type: 'handle' })
    Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor)
  }
}

// 如果需要支持 ipcMain.on (不返回值的)
export function IpcOn(channel: string) {
  return (target: object, propertyKey: string) => {
    const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA, target.constructor) || []
    routes.push({ channel, methodName: propertyKey, type: 'on' })
    Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor)
  }
}
export type Constructor<T = object> = new () => T
export class Registrar {
  /**
   * 注册所有的 Controller
   * @param controllers 构造函数数组
   */
  static register(controllers: Constructor[]): void {
    controllers.forEach((ControllerClass) => {
      // 实例化类
      const instance = new ControllerClass()

      const prefix = (Reflect.getMetadata(CONTROLLER_METADATA, ControllerClass) as string) || ''

      const routes =
        (Reflect.getMetadata(ROUTE_METADATA, ControllerClass) as RouteDefinition[]) || []

      routes.forEach((route) => {
        const fullChannel = prefix ? `${prefix}${route.channel}` : route.channel
        const handler = instance[route.methodName]
        if (typeof handler !== 'function') return
        const ipcHandler = async (
          event: Electron.IpcMainInvokeEvent,
          ...args: unknown[]
        ): Promise<Result<unknown>> => {
          try {
            const result = await handler.apply(instance, [event, ...args])
            return result
          } catch (error: unknown) {
            if (error instanceof Error) {
              log.error(`[IPC Error] Channel: ${fullChannel}`, error.message)
            } else {
              log.error(`[IPC Error] Channel: ${fullChannel}`, error)
            }
            return Result.success(null)
          }
        }
        if (route.type === 'handle') {
          ipcMain.handle(fullChannel, ipcHandler)
        } else {
          ipcMain.on(fullChannel, ipcHandler)
        }
      })
    })
  }
}
