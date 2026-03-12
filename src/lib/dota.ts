import SteamUser from 'steam-user'
import { Dota2User } from 'dota2-user'
import { EDOTAGCMsg } from 'dota2-user/protobufs'
import type { CMsgDOTAProfileCard } from 'dota2-user/protobufs/generated/dota_gcmessages_common'

interface DotaConfig {
  username: string
  password: string
}

function createTimeout(ms: number): { promise: Promise<null>, cancel: () => void } {
  let timer: NodeJS.Timeout
  const promise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms)
  })
  return { promise, cancel: () => clearTimeout(timer) }
}

function createDota(config: DotaConfig) {
  const client = new SteamUser()
  const dota2 = new Dota2User(client)
  let connected = false

  dota2.on('connectedToGC', () => {
    connected = true
    console.log('Connected to Dota 2 Game Coordinator')
  })

  dota2.on('disconnectedFromGC', () => {
    connected = false
    console.log('Disconnected from Dota 2 Game Coordinator')
  })

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      client.on('loggedOn', () => {
        console.log('Steam bot logged in')
        client.gamesPlayed(Dota2User.STEAM_APPID)
      })

      client.on('error', (err: Error) => {
        console.error('Steam bot error:', err.message)
        reject(err)
      })

      dota2.on('connectedToGC', () => {
        resolve()
      })

      client.logOn({
        accountName: config.username,
        password: config.password,
      })
    })
  }

  function fetchMedal(accountId32: string): Promise<number | null> {
    if (!connected) {
      return Promise.resolve(null)
    }

    const timeout = createTimeout(5000)

    const result = new Promise<number | null>((resolve) => {
      dota2.router.once(
        EDOTAGCMsg.k_EMsgClientToGCGetProfileCardResponse,
        (data: CMsgDOTAProfileCard) => {
          timeout.cancel()
          resolve(data.rankTier)
        },
      )

      dota2.send(EDOTAGCMsg.k_EMsgClientToGCGetProfileCard, {
        accountId: Number(accountId32),
      })
    })

    return Promise.race([result, timeout.promise])
  }

  function disconnect(): void {
    connected = false
    client.logOff()
    console.log('Steam bot disconnected')
  }

  function isConnected(): boolean {
    return connected
  }

  return {
    connect,
    fetchMedal,
    disconnect,
    isConnected,
  }
}

export = createDota
