// External
import http from 'node:http'
import cors from '@koa/cors'
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { koaMiddleware } from "@as-integrations/koa";
import 'dotenv/config' // 载入.env环境配置文件
import depthLimit from 'graphql-depth-limit'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser' // 处理json和x-www-form-urlencoded
import KoaRouter from '@koa/router'

// Local
// import appRouter from './routes.js' // RESTful路由（若有）
import { initDB, consoleInit, consoleStart, briefLog } from './utils.js'

// 输出程序初始化信息
// console.log('process.env: ', process.env)
consoleInit()

const isDev = process.env.NODE_ENV !== 'production'

// 创建Koa.js实例
const app = new Koa()

// 挂载数据库引擎（若有）
process.env.RDB_ENGINE && (app.context.db = await initDB('RDB'))

// 处理跨域请求
app.use(cors())

// 简易日志
app.use(briefLog)

// 兜底错误处理
app.on('error', (error, ctx): void => {
  console.error('server error: ', error)

  ctx.status = error.code ?? 501
  ctx.body = { content: error.message, figureURL: `https://http.cat/${error.code}` }
})

// 解析入栈请求的body部分
app.use(bodyParser({ jsonLimit: '4mb' }))

// 路由
const appRouter = new KoaRouter()
/**
* RESTful
*/
app.use(appRouter.routes()).use(appRouter.allowedMethods())

/**
 * GraphQL
 */
/**
 * 配置并启动GraphQL服务
 *
 * @returns {void}
 */
const startApolloServer = async (typeDefs: any, resolvers: any): Promise<void> => {
  // 生成并启动GraphQL服务
  const httpServer = http.createServer(app.callback())
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    validationRules: [
      depthLimit(3) // 最大嵌套查询层数
    ]
  })
  await server.start()

  // 绑定GraphQL路由到Koa实例
  const koaGraphQLMiddleware = koaMiddleware(server, {
    context: async ({ ctx }) => ({
      db: ctx.db,
    })
  })
  appRouter.post(graphqlPath, koaGraphQLMiddleware)

  // 启动服务
  await new Promise<void>(resolve => httpServer.listen({ port: serverPort }, resolve))
}

// 实际启动含GraphQL的全局服务
const serverPort = process.env.PORT ?? 3000
const graphqlPath = '/graphql'
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }
`;
const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];
// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    books: () => books,
  },
};
await startApolloServer(typeDefs, resolvers)

// 兜底路由
app.use(async ctx => {
  ctx.status = 200
  ctx.body = { data: 'Nice try, but this is a catch-all, you might wanna double check your request.', figureURL: 'https://http.cat/200' }
})

// 输出业务启动信息
consoleStart(graphqlPath)
