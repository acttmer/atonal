import { RequestDecorator } from './interface'

export const defineDecorator = <T>(decorator: RequestDecorator<T>) => decorator
