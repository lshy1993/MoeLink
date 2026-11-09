/* eslint-disable */
declare const __BUILD_VERSION__: string
declare const __BUILD_TIME__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.scss' {
  const content: string
  export default content
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.js' {
  const content: any
  export default content
}

declare module '*.json' {
  const content: any
  export default content
}

// 声明全局属性类型
import { AxiosStatic } from 'axios'
import User from './types/User'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosStatic
    Common: any
    Func: any
    User: User
  }
}
