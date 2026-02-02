import { Constructor, Registrar } from './modules/IpcDecorators'
interface ModuleShape {
  default?: Constructor
  [key: string]: unknown
}
export default function (): void {
  const modules = import.meta.glob<ModuleShape>('./controllers/*.controller.ts', { eager: true })
  const controllers = Object.values(modules)
    .map((m) => m.default || Object.values(m)[0])
    .filter((item): item is Constructor => typeof item === 'function')
  Registrar.register(controllers)
}
