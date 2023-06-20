import { ReasonPhrases, StatusCodes } from 'http-status-codes'

import { getRequestData } from './getRequestData.js'
import { IncomingMessage, ServerResponse } from 'http'
import { parseData, readData } from './data/index.js'
import { writeFile } from 'fs/promises'

const DATA_PATH = `${process.cwd()}/data`

/** @type  Object.<string, any>[] */
let users = parseData(await readData(`${DATA_PATH}/users.json`))

/** @type  Object.<string, any>[] */
let posts = parseData(await readData(`${DATA_PATH}/posts.json`))

let usersId = Math.max(...users.map(user => user.id))
let postsId = Math.max(...posts.map(post => post.id))

/**
 * This function manage a HTTP request
 *
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
export const requestHandler = async (request, response) => {
  const { method, url } = request
  const { address, port } = request.socket.server.address()
  const fullEndpoint = `http://${address}:${port}${url}`

  const path = url.split('/')[1]

  switch (path) {
    case 'users': {
      const usersPattern = new URLPattern({ pathname: '/users/:id' })
      const usersEndpoint = usersPattern.exec(fullEndpoint)
      const id = Number(usersEndpoint?.pathname?.groups?.id)

      switch (method) {
        case 'DELETE': {
          const userIndex = users.findIndex(user => user.id === id)

          if (userIndex === -1) {
            response.statusCode = StatusCodes.NOT_FOUND
            response.end()

            return
          }

          // users = users.filter(user => user.id !== id)
          users.splice(userIndex, 1)

          await writeFile(`${DATA_PATH}/users.json`, JSON.stringify(users, null, 2))

          response.statusCode = StatusCodes.NO_CONTENT
          response.end()

          break
        }

        case 'GET':
          response.setHeader('Content-Type', 'application/json')
          response.statusCode = StatusCodes.OK

          if (id) {
            response.write(JSON.stringify(users.find(user => user.id = id)))
            response.end()
          } else {
            response.write(JSON.stringify(users))
            response.end()
          }

          break

        case 'PATCH': {
          const body = await getRequestData(request)
          const user = parseData(body)
          const userIndex = users.findIndex(user => user.id === id)

          if (userIndex == -1) {
            response.statusCode = StatusCodes.NOT_FOUND
            response.end()

            return
          }

          users[userIndex] = { ...users[userIndex], ...user }

          await writeFile(userDataPath, JSON.stringify(users, null, 2), 'utf8')

          response.setHeader('Content-Type', 'application/json')
          response.statusCode = StatusCodes.OK
          response.write(JSON.stringify(users[userIndex]))
          response.end()

          break
        }

        case 'POST': {
          try {
            const body = await getRequestData(request)
            const user = parseData(body)

            if (!user.first_name) {
              response.setHeader('Content-Type', 'application/json')
              response.statusCode = StatusCodes.BAD_REQUEST

              response.write(JSON.stringify({
                first_name: 'This field is mandatory'
              }))

              response.end()
            }

            usersId += 1
            user.id = usersId

            users.push(user)

            await writeFile(userDataPath, JSON.stringify(users, null, 2))

            response.setHeader('Content-Type', 'application/json')
            response.statusCode = StatusCodes.CREATED
            response.write(JSON.stringify(user))
            response.end()
          } catch (error) {
            response.statusCode = StatusCodes.INTERNAL_SERVER_ERROR
            response.end()
          }

          break
        }

        default:
          break
      }

      break
    }

    case 'posts': {
      const body = await getRequestData(request)
      const postsPattern = new URLPattern({ pathname: '/posts/:id' })
      const postsEndpoint = postsPattern.exec(fullEndpoint)
      const id = postsEndpoint?.pathname?.groups?.id

      console.log(`dealing with posts - id: ${postsEndpoint.pathname.groups.id}`)

      break
    }
  }
}