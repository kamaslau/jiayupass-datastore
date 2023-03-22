/**
 * MongoDB
 *
 * https://docs.mongodb.com/
 * https://docs.mongodb.com/drivers/node/current/quick-start/
 * https://www.mongodb.com/docs/drivers/node/current/quick-reference/
 */
import { MongoClient } from 'mongodb'

const url = process.env.DDB_URL ?? 'mongodb://localhost:27017'
const defaultDB = 'godbms'

let dbClient

// 建立连接
const connect = async (): Promise<any> => {
  try {
    dbClient = new MongoClient(url)
    await dbClient.connect()

    process.env.NODE_ENV === 'development' && await trial() // dev only: test drive
  } catch (error) {
    console.error(error)
    dbClient = null
  }

  // console.log('mongodb engine initiated')
  return dbClient
}

// 测试
const trial = async (): Promise<any> => {
  console.log('trial: ')
  const database = dbClient.db(defaultDB)
  const movies = database.collection('movies') // new collection would be auto created if not exists

  // Query for a movie that has the title 'Back to the Future'
  const query = { title: 'Back to the Future' }

  const result = await movies.findOne(query)
  console.log('result:', result)
}

// 断开连接
const disconnect = async (): Promise<void> => {
  try {
    await dbClient.close()
  } catch (error) {
    console.error(error)
  }
}

/**
 * 基础模型类
 */

/**
 * 默认分页参数
 */
const defaultLimit = 30
const defaultOffset = 0

class BasicModel {
  constructor (
    modelName,
    ctx,
    limit = defaultLimit,
    offset = defaultOffset
  ) {
    this.modelName = modelName
    this.ctx = ctx
    this.limit = limit
    this.offset = offset
  }

  modelName: string = ''
  ctx: any = null
  limit: number
  offset: number

  /**
 * Get Count
 */
  count = async (filter = undefined): Promise<number> => {
    console.log('BasicModel.count: ', filter)

    let result = 0

    result = await this.ctx.ddb.db(defaultDB).collection(this.modelName).countDocuments(filter)

    console.log('count result: ', result)
    return result
  }

  /**
 * Get List
 *
 * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#find
 */
  findMany = async (
    filter: object | undefined = undefined,
    sorter: object | undefined = undefined,
    skip: number = this.offset,
    take: number = this.limit
  ): Promise<object[]> => {
    console.log('BasicModel.findMany: ', filter, sorter, skip, take)

    let result = []

    result = await this.ctx.ddb.db(defaultDB).collection(this.modelName).find(filter).sort(sorter).skip(skip).limit(take).toArray()

    console.log('findMany result: ', result)
    return result
  }

  /**
 * Get Sole - Pick First Matched
 *
 * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#findOne
 */
  findFirst = async (filter: object): Promise<null | object> => {
    console.log('BasicModel.findFirst: ', filter)

    let result = null

    result = await this.ctx.ddb.db(defaultDB).collection(this.modelName).findOne(filter)

    console.log('findFirst result: ', result)
    return result
  }

  /**
 * Create One
 *
 * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#insertOne
 */
  create = async (data: object): Promise<null | object> => {
    console.log('BasicModel.create: ', data)

    let result = null

    try {
      result = await this.ctx.ddb.db(defaultDB).collection(this.modelName).insertOne(data)
    } catch (error) {
      console.error(error)
    }

    console.log('create result: ', result)
    return result
  }

  /**
 * TODO Create Many
 *
 * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#insertMany
 */
  // createMany = async (): Promise<{ count: number }> => {
  //   console.log('BasicModel.createMany: ')

  // }

  /**
 * Update one
 *
 * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#findOneAndReplace
 */
  update = async (filter: object, data: object): Promise<null | object> => {
    console.log('BasicModel.update: ', filter, data)

    let result = null

    try {
      result = await this.ctx.ddb.db(defaultDB).collection(this.modelName).findOneAndReplace(
        filter,
        data
      )
    } catch (error) {
      console.error(error)
    }

    console.log('update result: ', result)
    return result
  }

  /**
 * TODO Update Many
 *
 * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#updateMany
 */
  // updateMany = async (): Promise<{ count: number }> => {
  //   console.log('BasicModel.updateMany: ')

  // }

  /**
   * Delete Many
   *
   * 删除行为仅标记数据项为已删除状态，不进行逻辑/物理删除
   *
   * https://mongodb.github.io/node-mongodb-native/4.5/classes/Collection.html#deleteMany
   */
  deleteMany = async (filter: object): Promise<null | { count: number }> => {
    console.log('BasicModel.deleteMany: ', filter)

    let result = null

    try {
      result = await this.ctx.ddb.db(defaultDB).collection(this.modelName).deleteMany(filter)
    } catch (error) {
      console.error(error)
    }

    console.log('delete result: ', result)
    return result
  }
}

export {
  connect,
  disconnect,
  defaultLimit,
  defaultOffset,
  BasicModel
}
