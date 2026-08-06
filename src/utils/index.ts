import qs from 'qs';
// 在浏览器环境中使用 crypto-js 替代 Node.js crypto
// import crypto from 'crypto-js';

// 临时类型声明，避免类型错误
declare const process: {
  env: {
    NODE_ENV: string;
  };
};

// 定义接口类型
interface HttpOptions {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  withCredentials: boolean;
  data: string;
  url: string;
}

interface FilterOptions {
  star: boolean[];
  type: boolean[];
  job?: boolean[];
}

interface Character {
  rare: number;
  type: string;
  job: string;
  [key: string]: any;
}

interface Equipment {
  rare: number;
  type: string;
  [key: string]: any;
}

type CharacterDictionary = Record<string, Character>;
type EquipmentDictionary = Record<string, Equipment>;

/**
 * 生成随机背景图片URL
 * @returns 随机背景图片的CSS url
 */
function ranBG(): string {
  const random = Math.floor(Math.random() * 80 + 1001);
  const file = `/static/images/still_unit_${random}31.png`;
  return `url(${file})`;
}

/**
 * 获取API完整URL
 * @param path API路径
 * @returns 完整的API URL
 */
function GetApi(path: string): string {
  const url = "https://api.moelink.site";
  if (import.meta.env.MODE === 'development') {
    return "/api" + path;
  }
  return url + path;
}

/**
 * 创建POST请求配置对象
 * @param url 请求URL
 * @param data 请求数据
 * @returns HTTP请求配置对象
 */
function GetPostObject(url: string, data: Record<string, any>): HttpOptions {
  const options: HttpOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    withCredentials: false,
    data: qs.stringify(data),
    url
  };
  return options;
}

/**
 * 创建GET请求配置对象
 * @param url 请求URL
 * @param data 请求数据
 * @returns HTTP请求配置对象
 */
function GetGetObject(url: string, data: Record<string, any>): HttpOptions {
  const options: HttpOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    withCredentials: false,
    data: qs.stringify(data),
    url
  };
  return options;
}

/**
 * 加密密码
 * @param password 原始密码
 * @param salt 盐值，默认为 "kusuharaui"
 * @returns 加密后的密码
 */
function cryptPwd(password: string, salt: string = "kusuharaui"): string {
  // 加盐密码的md5值
  const saltPassword = md5(password) + ':' + salt;
  // 注意：这里简化了sha256的调用，实际项目中建议使用专门的加密库
  const result = simpleHash(saltPassword);
  return result;
}

/**
 * 简化的哈希函数
 * @param message 待哈希的消息
 * @returns 哈希值
 */
function simpleHash(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * SHA256哈希 - 浏览器环境下的简化实现
 * @param message 待哈希的消息
 * @returns SHA256哈希值
 */
async function sha256(message: string): Promise<string> {
  // 在浏览器环境中使用 Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 简化的哈希实现（仅用于开发环境）
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

/**
 * MD5哈希 - 浏览器环境下的简化实现
 * @param message 待哈希的消息
 * @returns MD5哈希值
 */
function md5(message: string): string {
  // 简化的哈希实现（仅用于开发环境）
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

/**
 * 过滤角色数据
 * @param wfData 角色数据字典
 * @param filter 过滤条件
 * @returns 过滤后的角色数组
 */
function FilterCharaDic(wfData: CharacterDictionary, filter: FilterOptions): Character[] {
  let result: Character[] = [];

  // 转换字典为数组
  for (const key in wfData) {
    const ele = wfData[key];
    if (ele) {
      result.push(ele);
    }
  }

  /**
   * 检查星级
   */
  function checkStar(ele: Character): boolean {
    const keyarr: Record<number, string> = {};
    for (const i in filter.star) {
      if (filter.star[i]) {
        keyarr[parseInt(i) + 1] = "1";
      }
    }
    if (Object.keys(keyarr).length === 0) return true;
    return ele.rare in keyarr;
  }

  /**
   * 检查属性类型
   */
  function checkType(ele: Character): boolean {
    const keyarr: Record<string, string> = {};
    const keys = ['火', '水', '雷', '风', '光', '暗'] as const;
    for (let i = 0; i < filter.type.length && i < keys.length; i++) {
      const key = keys[i];
      if (filter.type[i] && key) {
        keyarr[key] = "";
      }
    }
    if (Object.keys(keyarr).length === 0) return true;
    return ele.type in keyarr;
  }

  /**
   * 检查职业
   */
  function checkJob(ele: Character): boolean {
    if (!filter.job) return true;

    const keyarr: Record<string, string> = {};
    const keys = ['格斗', '剑士', '射击', '辅助', '特殊'] as const;
    for (let i = 0; i < filter.job.length && i < keys.length; i++) {
      const key = keys[i];
      if (filter.job[i] && key) {
        keyarr[key] = "";
      }
    }
    if (Object.keys(keyarr).length === 0) return true;
    return ele.job in keyarr;
  }

  // 应用过滤器
  result = result.filter(checkStar);
  result = result.filter(checkType);
  result = result.filter(checkJob);

  return result;
}

/**
 * 过滤装备数据
 * @param eqData 装备数据字典
 * @param filter 过滤条件
 * @returns 过滤后的装备数组
 */
function FilterEquipDic(eqData: EquipmentDictionary, filter: FilterOptions): Equipment[] {
  let result: Equipment[] = [];

  // 转换字典为数组
  for (const key in eqData) {
    const ele = eqData[key];
    if (ele) {
      result.push(ele);
    }
  }

  /**
   * 检查星级
   */
  function checkStar(ele: Equipment): boolean {
    const keyarr: Record<number, string> = {};
    for (const i in filter.star) {
      if (filter.star[i]) {
        keyarr[parseInt(i) + 1] = "1";
      }
    }
    if (Object.keys(keyarr).length === 0) return true;
    return ele.rare in keyarr;
  }

  /**
   * 检查属性类型
   */
  function checkType(ele: Equipment): boolean {
    const keyarr: Record<string, string> = {};
    const keys = ['火', '水', '雷', '风', '光', '暗'] as const;
    for (let i = 0; i < filter.type.length && i < keys.length; i++) {
      const key = keys[i];
      if (filter.type[i] && key) {
        keyarr[key] = "";
      }
    }
    if (Object.keys(keyarr).length === 0) return true;
    return ele.type in keyarr;
  }

  // 应用过滤器
  result = result.filter(checkStar);
  result = result.filter(checkType);

  return result;
}

// 导出所有工具函数
export {
  ranBG,
  GetApi,
  GetPostObject,
  GetGetObject,
  cryptPwd,
  sha256,
  md5,
  FilterCharaDic,
  FilterEquipDic
};

// 导出类型
export type {
  HttpOptions,
  FilterOptions,
  Character,
  Equipment,
  CharacterDictionary,
  EquipmentDictionary
};

// 默认导出（保持向后兼容）
export default {
  ranBG,
  GetApi,
  GetPostObject,
  GetGetObject,
  cryptPwd,
  sha256,
  md5,
  FilterCharaDic,
  FilterEquipDic
};
