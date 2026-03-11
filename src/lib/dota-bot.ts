import SteamUser from 'steam-user'
import { Dota2User } from 'dota2-user'
import { EDOTAGCMsg } from 'dota2-user/protobufs'
import type { CMsgDOTAProfileCard } from 'dota2-user/protobufs'
import type { ServerConfig } from '../types/config'

export interface ProfileCardResult {
  rank_tier: number
  mmr: number
  leaderboard_rank: number
}

export interface DotaBot {
  fetchProfileCard(accountId: string): Promise<ProfileCardResult | null>
  isConnected(): boolean
  disconnect(): void
}

interface QueueItem {
  accountId: string
  resolve: (result: ProfileCardResult | null) => void
}

function createDotaBot(config: ServerConfig): DotaBot | null {
  if (!config.steam_bot_user || !config.steam_bot_pass) {
    console.log('Dota bot: STEAM_BOT_USER/STEAM_BOT_PASS not configured, bot disabled')
    return null
  }

  const steam = new SteamUser()
  const dota2 = new Dota2User(steam)
  let connected = false
  const queue: QueueItem[] = []
  let processing = false

  steam.logOn({
    accountName: config.steam_bot_user,
    password: config.steam_bot_pass,
  })

  steam.on('loggedOn', () => {
    console.log('Dota bot: logged into Steam')
    steam.gamesPlayed(Dota2User.STEAM_APPID)
  })

  steam.on('error', (err: Error) => {
    console.error('Dota bot: Steam error:', err.message)
    connected = false
  })

  dota2.on('connectedToGC', () => {
    console.log('Dota bot: connected to Dota 2 Game Coordinator')
    connected = true
    processQueue()
  })

  dota2.on('disconnectedFromGC', () => {
    console.log('Dota bot: disconnected from GC')
    connected = false
  })

  async function processQueue(): Promise<void> {
    if (processing || queue.length === 0 || !connected) return
    processing = true

    while (queue.length > 0 && connected) {
      const item = queue.shift()!
      try {
        const result = await requestProfileCard(item.accountId)
        item.resolve(result)
      } catch {
        item.resolve(null)
      }
      // Rate limit: wait 1.5s between requests to avoid GC throttling
      if (queue.length > 0) {
        await new Promise(r => setTimeout(r, 1500))
      }
    }

    processing = false
  }

  function requestProfileCard(accountId: string): Promise<ProfileCardResult | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null)
      }, 10000)

      const handler = (data: CMsgDOTAProfileCard) => {
        if (String(data.accountId) === accountId) {
          clearTimeout(timeout)
          dota2.router.removeListener(
            EDOTAGCMsg.k_EMsgClientToGCGetProfileCardResponse,
            handler
          )
          resolve({
            rank_tier: data.rankTier || 0,
            mmr: data.rankTierScore || 0,
            leaderboard_rank: data.leaderboardRank || 0,
          })
        }
      }

      dota2.router.on(
        EDOTAGCMsg.k_EMsgClientToGCGetProfileCardResponse,
        handler
      )

      dota2.send(EDOTAGCMsg.k_EMsgClientToGCGetProfileCard, {
        accountId: Number(accountId),
      })
    })
  }

  function fetchProfileCard(accountId: string): Promise<ProfileCardResult | null> {
    if (!connected) return Promise.resolve(null)
    return new Promise((resolve) => {
      queue.push({ accountId, resolve })
      processQueue()
    })
  }

  function disconnect(): void {
    connected = false
    queue.length = 0
    steam.logOff()
    console.log('Dota bot: logged off')
  }

  return {
    fetchProfileCard,
    isConnected: () => connected,
    disconnect,
  }
}

export default createDotaBot
