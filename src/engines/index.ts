// local
import * as mongodb from './mongodb/index.js'
import * as mysql from './mysql/index.js'

// 关系型数据库引擎；默认MySQL
export const RDBs = { mysql }
export const RDB = RDBs[process.env.RDB_ENGINE ?? 'mysql'] // 默认使用MySQL数据库

// 文档型数据库引擎；默认MongoDB
export const DDBs = { mongodb }
export const DDB = typeof process.env.DDB_ENGINE === 'string' ? DDBs[process.env.DDB_ENGINE] : null // 默认使用MongoDB
