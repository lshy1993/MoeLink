import { md5 } from '../utils';

// 定义用户信息接口
interface UserInfo {
  uid: number;
  nickname: string;
  email: string;
  group: number;
  regtime: string;
  logintime: string;
  topicnum: number;
  replynum: number;
}

// 定义用户初始化数据接口（可能包含部分字段）
interface UserInitData extends Partial<UserInfo> {
  [key: string]: any;
}

/**
 * 用户类
 * 管理用户登录状态、用户信息和相关操作
 */
class User {
  public info: UserInfo;
  public logined: boolean;

  constructor() {
    this.info = {
      uid: -1,
      nickname: "",
      email: "example@adress.com",
      group: -1,
      regtime: "",
      logintime: "",
      topicnum: 0,
      replynum: 0,
    };
    this.logined = false;
    console.log('user init');
  }

  /**
   * 初始化用户数据
   * @param data 用户数据
   */
  Init(data: UserInitData): void {
    for (const key in data) {
      if (key in this.info && data[key] !== undefined) {
        // 类型安全的属性赋值
        (this.info as any)[key] = data[key];
      }
    }
    this.logined = true;
  }

  /**
   * 用户登出
   * 重置用户信息和登录状态
   */
  Logout(): void {
    this.info = {
      uid: -1,
      nickname: "",
      email: "",
      group: -1,
      regtime: "",
      logintime: "",
      topicnum: 0,
      replynum: 0,
    };
    this.logined = false;
  }

  /**
   * 检查用户是否为管理员
   * @returns 是否为管理员
   */
  isAdmin(): boolean {
    return this.info.group >= 100;
  }

  /**
   * 获取用户头像URL
   * 使用Gravatar服务生成头像
   * @returns 头像URL
   */
  avatarUrl(): string {
    if (!this.logined) {
      return "";
    }

    if (!this.info.email) {
      return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
    }

    const hash = md5(this.info.email);
    return `https://www.gravatar.com/avatar/${hash}`;
  }
}

export default User;

// 导出类型
export type { UserInfo, UserInitData };
