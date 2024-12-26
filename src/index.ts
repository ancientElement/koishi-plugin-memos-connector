import { Context, Schema } from 'koishi'

export const name = 'qq-memos'

export interface Config {
    memos_sverver?: string
    token?: string
}

export const Config: Schema<Config> = Schema.object({
    memos_sverver: Schema.string().description('memos服务器地址').default(""),
    token: Schema.string().description('memos用户令牌').role('secret'),
})

export function apply(ctx: Context, config: Config) {
    // write your plugin here
    ctx.on('message', (session) => {
        console.log(session.content + ' qq-memos plugin loaded')
        ctx.http.post(`${config.memos_sverver}/api/v1/memos`,JSON.stringify({
            content: session.content,
            visibility: 'VISIBILITY_UNSPECIFIED',
            resources: [],
            relations: []
          }),{
            headers: {
                'Authorization': config.token
            },
        }).then((v)=>{
            console.log(v)
        })
      })
}
